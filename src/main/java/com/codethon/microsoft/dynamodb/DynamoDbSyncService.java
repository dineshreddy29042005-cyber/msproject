package com.codethon.microsoft.dynamodb;

import com.codethon.microsoft.entity.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Mirrors every JPA write to DynamoDB asynchronously.
 * If DynamoDB is unavailable the app keeps working via H2.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DynamoDbSyncService {

    private final DynamoDbRepository dynamoDbRepository;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /* ── User ─────────────────────────────────────────────── */
    @Async
    public void syncUser(User user) {
        try {
            UserItem item = UserItem.builder()
                    .userId(user.getId() != null ? user.getId().toString() : UUID.randomUUID().toString())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .password(user.getPassword())
                    .role(user.getRole() != null ? user.getRole().name() : "STUDENT")
                    .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().format(FMT) : "")
                    .updatedAt(user.getUpdatedAt() != null ? user.getUpdatedAt().format(FMT) : "")
                    .build();
            dynamoDbRepository.saveUser(item);
            log.debug("Synced user {} to DynamoDB", user.getUsername());
        } catch (Exception e) {
            log.warn("Failed to sync user to DynamoDB: {}", e.getMessage());
        }
    }

    /* ── Document ─────────────────────────────────────────── */
    @Async
    public void syncDocument(Document doc) {
        try {
            DocumentItem item = DocumentItem.builder()
                    .documentId(doc.getId() != null ? doc.getId().toString() : UUID.randomUUID().toString())
                    .userId(doc.getUser() != null && doc.getUser().getId() != null
                            ? doc.getUser().getId().toString() : "unknown")
                    .title(doc.getTitle())
                    .originalFilename(doc.getOriginalFilename())
                    .storedFilename(doc.getStoredFilename())
                    .filePath(doc.getFilePath())
                    .fileSize(doc.getFileSize())
                    .fileType(doc.getFileType())
                    .status(doc.getStatus() != null ? doc.getStatus().name() : "PENDING")
                    .uploadedAt(doc.getUploadedAt() != null ? doc.getUploadedAt().format(FMT) : "")
                    .build();
            dynamoDbRepository.saveDocument(item);
            log.debug("Synced document {} to DynamoDB", doc.getId());
        } catch (Exception e) {
            log.warn("Failed to sync document to DynamoDB: {}", e.getMessage());
        }
    }

    /* ── Analysis Result ──────────────────────────────────── */
    @Async
    public void syncAnalysisResult(AnalysisResult result) {
        try {
            String resultId = result.getId() != null
                    ? result.getId().toString() : UUID.randomUUID().toString();
            String documentId = result.getDocument() != null && result.getDocument().getId() != null
                    ? result.getDocument().getId().toString() : "unknown";
            String userId = result.getDocument() != null
                    && result.getDocument().getUser() != null
                    && result.getDocument().getUser().getId() != null
                    ? result.getDocument().getUser().getId().toString() : "unknown";

            AnalysisResultItem item = AnalysisResultItem.builder()
                    .resultId(resultId)
                    .documentId(documentId)
                    .documentTitle(result.getDocument() != null ? result.getDocument().getTitle() : "")
                    .userId(userId)
                    .overallScore(result.getOverallScore())
                    .semanticScore(result.getSemanticScore())
                    .paraphraseScore(result.getParaphraseScore())
                    .exactMatchScore(result.getExactMatchScore())
                    .riskLevel(result.getRiskLevel() != null ? result.getRiskLevel().name() : null)
                    .summary(result.getSummary())
                    .explanation(result.getExplanation())
                    .status(result.getStatus() != null ? result.getStatus().name() : "PENDING")
                    .analyzedAt(result.getAnalyzedAt() != null ? result.getAnalyzedAt().format(FMT) : "")
                    .completedAt(result.getCompletedAt() != null ? result.getCompletedAt().format(FMT) : "")
                    .build();
            dynamoDbRepository.saveAnalysisResult(item);
            log.debug("Synced analysis result {} to DynamoDB", resultId);
        } catch (Exception e) {
            log.warn("Failed to sync analysis result to DynamoDB: {}", e.getMessage());
        }
    }

    /* ── Plagiarism Match ─────────────────────────────────── */
    @Async
    public void syncMatch(PlagiarismMatch match, String resultId) {
        try {
            PlagiarismMatchItem item = PlagiarismMatchItem.builder()
                    .matchId(match.getId() != null
                            ? match.getId().toString() : UUID.randomUUID().toString())
                    .resultId(resultId)
                    .sourceTitle(match.getSourceTitle())
                    .sourceUrl(match.getSourceUrl())
                    .matchedText(match.getMatchedText())
                    .sourceText(match.getSourceText())
                    .similarityScore(match.getSimilarityScore())
                    .matchType(match.getMatchType() != null ? match.getMatchType().name() : null)
                    .startPosition(match.getStartPosition())
                    .endPosition(match.getEndPosition())
                    .sectionName(match.getSectionName())
                    .build();
            dynamoDbRepository.saveMatch(item);
            log.debug("Synced match {} to DynamoDB", item.getMatchId());
        } catch (Exception e) {
            log.warn("Failed to sync match to DynamoDB: {}", e.getMessage());
        }
    }
}
