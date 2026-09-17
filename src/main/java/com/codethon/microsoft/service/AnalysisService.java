package com.codethon.microsoft.service;

import com.codethon.microsoft.dynamodb.DynamoDbSyncService;
import com.codethon.microsoft.dto.AnalysisResultDto;
import com.codethon.microsoft.dto.DashboardStatsDto;
import com.codethon.microsoft.dto.PlagiarismMatchDto;
import com.codethon.microsoft.entity.*;
import com.codethon.microsoft.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalysisService {

    private final AnalysisResultRepository analysisResultRepository;
    private final DocumentRepository documentRepository;
    private final PlagiarismMatchRepository plagiarismMatchRepository;
    private final UserRepository userRepository;
    private final DynamoDbSyncService dynamoDbSyncService;

    @Async
    public void analyzeDocumentAsync(Long documentId) {
        try {
            Document document = documentRepository.findById(documentId)
                    .orElseThrow(() -> new IllegalArgumentException("Document not found"));

            document.setStatus(Document.DocumentStatus.PROCESSING);
            documentRepository.save(document);

            AnalysisResult result = AnalysisResult.builder()
                    .document(document)
                    .status(AnalysisResult.AnalysisStatus.PROCESSING)
                    .build();
            result = analysisResultRepository.save(result);

            // Simulate NLP/AI analysis (replace with real Python service call)
            Thread.sleep(2000);
            result = performMockAnalysis(result, document);

            document.setStatus(Document.DocumentStatus.COMPLETED);
            documentRepository.save(document);
            dynamoDbSyncService.syncDocument(document);

            log.info("Analysis completed for document: {}", documentId);
        } catch (Exception e) {
            log.error("Analysis failed for document {}: {}", documentId, e.getMessage());
            documentRepository.findById(documentId).ifPresent(doc -> {
                doc.setStatus(Document.DocumentStatus.FAILED);
                documentRepository.save(doc);
            });
        }
    }

    private AnalysisResult performMockAnalysis(AnalysisResult result, Document document) {
        Random random = new Random();

        double exactScore     = 5  + random.nextDouble() * 30;
        double semanticScore  = 10 + random.nextDouble() * 40;
        double paraphraseScore= 5  + random.nextDouble() * 25;
        double overallScore   = (exactScore * 0.4 + semanticScore * 0.35 + paraphraseScore * 0.25);

        AnalysisResult.RiskLevel riskLevel;
        if (overallScore >= 70)      riskLevel = AnalysisResult.RiskLevel.CRITICAL;
        else if (overallScore >= 50) riskLevel = AnalysisResult.RiskLevel.HIGH;
        else if (overallScore >= 25) riskLevel = AnalysisResult.RiskLevel.MEDIUM;
        else                         riskLevel = AnalysisResult.RiskLevel.LOW;

        result.setOverallScore(Math.round(overallScore * 100.0) / 100.0);
        result.setSemanticScore(Math.round(semanticScore * 100.0) / 100.0);
        result.setParaphraseScore(Math.round(paraphraseScore * 100.0) / 100.0);
        result.setExactMatchScore(Math.round(exactScore * 100.0) / 100.0);
        result.setRiskLevel(riskLevel);
        result.setSummary(buildSummary(overallScore, riskLevel));
        result.setExplanation(buildExplanation(exactScore, semanticScore, paraphraseScore));
        result.setStatus(AnalysisResult.AnalysisStatus.COMPLETED);
        result.setCompletedAt(LocalDateTime.now());

        result = analysisResultRepository.save(result);

        // Generate mock matches
        List<PlagiarismMatch> matches = buildMockMatches(result);
        plagiarismMatchRepository.saveAll(matches);
        result.setMatches(matches);

        // Mirror result + matches to DynamoDB
        dynamoDbSyncService.syncAnalysisResult(result);
        final String resultId = result.getId().toString();
        matches.forEach(m -> dynamoDbSyncService.syncMatch(m, resultId));

        return result;
    }

    private String buildSummary(double score, AnalysisResult.RiskLevel risk) {
        return String.format(
            "Overall plagiarism score: %.1f%%. Risk level: %s. " +
            "The document was analyzed using semantic, paraphrase, and exact-match detection engines.",
            score, risk.name()
        );
    }

    private String buildExplanation(double exact, double semantic, double paraphrase) {
        return String.format(
            "Exact match detection found %.1f%% verbatim overlap with known sources. " +
            "Semantic similarity analysis identified %.1f%% conceptual overlap. " +
            "Paraphrase detection flagged %.1f%% of content as potentially reworded from external sources.",
            exact, semantic, paraphrase
        );
    }

    private List<PlagiarismMatch> buildMockMatches(AnalysisResult result) {
        List<PlagiarismMatch> matches = new ArrayList<>();
        String[] sources = {
            "Wikipedia – Academic Integrity",
            "ResearchGate – Machine Learning Overview",
            "ArXiv – NLP Survey 2023",
            "IEEE Xplore – Deep Learning Applications",
            "Coursera – Introduction to AI"
        };
        String[] urls = {
            "https://en.wikipedia.org/wiki/Academic_integrity",
            "https://www.researchgate.net/ml-overview",
            "https://arxiv.org/abs/2301.00001",
            "https://ieeexplore.ieee.org/document/12345",
            "https://coursera.org/ai-intro"
        };
        PlagiarismMatch.MatchType[] types = PlagiarismMatch.MatchType.values();

        Random random = new Random();
        int count = 2 + random.nextInt(3);
        for (int i = 0; i < count; i++) {
            int idx = random.nextInt(sources.length);
            matches.add(PlagiarismMatch.builder()
                    .analysisResult(result)
                    .sourceTitle(sources[idx])
                    .sourceUrl(urls[idx])
                    .matchedText("This section of the submitted document closely resembles content from the source.")
                    .sourceText("Original content from the referenced source document.")
                    .similarityScore(Math.round((30 + random.nextDouble() * 60) * 100.0) / 100.0)
                    .matchType(types[random.nextInt(types.length)])
                    .startPosition(100 * i)
                    .endPosition(100 * i + 80)
                    .sectionName("Section " + (i + 1))
                    .build());
        }
        return matches;
    }

    public AnalysisResultDto getResultByDocumentId(Long documentId) {
        AnalysisResult result = analysisResultRepository.findByDocumentId(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Analysis result not found for document " + documentId));
        return mapToDto(result);
    }

    public AnalysisResultDto getResultById(Long resultId) {
        AnalysisResult result = analysisResultRepository.findById(resultId)
                .orElseThrow(() -> new IllegalArgumentException("Analysis result not found: " + resultId));
        return mapToDto(result);
    }

    public List<AnalysisResultDto> getMyResults() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        return analysisResultRepository.findByDocumentUserIdOrderByAnalyzedAtDesc(user.getId())
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public DashboardStatsDto getDashboardStats() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        long total      = documentRepository.countByUserId(user.getId());
        long completed  = documentRepository.findByUserIdAndStatus(user.getId(), Document.DocumentStatus.COMPLETED).size();
        long pending    = documentRepository.findByUserIdAndStatus(user.getId(), Document.DocumentStatus.PENDING).size()
                        + documentRepository.findByUserIdAndStatus(user.getId(), Document.DocumentStatus.PROCESSING).size();
        Double avgScore = analysisResultRepository.avgScoreByUserId(user.getId());

        return DashboardStatsDto.builder()
                .totalDocuments(total)
                .analyzedDocuments(completed)
                .pendingDocuments(pending)
                .averagePlagiarismScore(avgScore != null ? Math.round(avgScore * 100.0) / 100.0 : 0.0)
                .highRiskCount(analysisResultRepository.countByUserIdAndRiskLevel(user.getId(), AnalysisResult.RiskLevel.HIGH))
                .mediumRiskCount(analysisResultRepository.countByUserIdAndRiskLevel(user.getId(), AnalysisResult.RiskLevel.MEDIUM))
                .lowRiskCount(analysisResultRepository.countByUserIdAndRiskLevel(user.getId(), AnalysisResult.RiskLevel.LOW))
                .criticalRiskCount(analysisResultRepository.countByUserIdAndRiskLevel(user.getId(), AnalysisResult.RiskLevel.CRITICAL))
                .build();
    }

    private AnalysisResultDto mapToDto(AnalysisResult r) {
        List<PlagiarismMatchDto> matchDtos = plagiarismMatchRepository
                .findByAnalysisResultIdOrderBySimilarityScoreDesc(r.getId())
                .stream().map(m -> PlagiarismMatchDto.builder()
                        .id(m.getId())
                        .sourceTitle(m.getSourceTitle())
                        .sourceUrl(m.getSourceUrl())
                        .matchedText(m.getMatchedText())
                        .sourceText(m.getSourceText())
                        .similarityScore(m.getSimilarityScore())
                        .matchType(m.getMatchType() != null ? m.getMatchType().name() : null)
                        .startPosition(m.getStartPosition())
                        .endPosition(m.getEndPosition())
                        .sectionName(m.getSectionName())
                        .build())
                .collect(Collectors.toList());

        return AnalysisResultDto.builder()
                .id(r.getId())
                .documentId(r.getDocument().getId())
                .documentTitle(r.getDocument().getTitle())
                .overallScore(r.getOverallScore())
                .semanticScore(r.getSemanticScore())
                .paraphraseScore(r.getParaphraseScore())
                .exactMatchScore(r.getExactMatchScore())
                .riskLevel(r.getRiskLevel() != null ? r.getRiskLevel().name() : null)
                .summary(r.getSummary())
                .explanation(r.getExplanation())
                .status(r.getStatus().name())
                .analyzedAt(r.getAnalyzedAt())
                .completedAt(r.getCompletedAt())
                .matches(matchDtos)
                .build();
    }
}
