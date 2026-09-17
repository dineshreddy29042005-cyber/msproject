package com.codethon.microsoft.dynamodb;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.*;
import software.amazon.awssdk.enhanced.dynamodb.model.*;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.*;

/**
 * Thin DynamoDB data-access layer.
 * Used alongside JPA — mirrors all writes to DynamoDB
 * and provides query methods backed by DynamoDB.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class DynamoDbRepository {

    private final DynamoDbEnhancedClient enhancedClient;

    @Value("${dynamodb.tables.users}")
    private String usersTable;

    @Value("${dynamodb.tables.documents}")
    private String documentsTable;

    @Value("${dynamodb.tables.analysis}")
    private String analysisTable;

    @Value("${dynamodb.tables.matches}")
    private String matchesTable;

    /* ── User ops ─────────────────────────────────────────── */

    public void saveUser(UserItem item) {
        try {
            table(UserItem.class, usersTable).putItem(item);
            log.debug("DynamoDB: saved user {}", item.getUserId());
        } catch (Exception e) {
            log.warn("DynamoDB saveUser failed: {}", e.getMessage());
        }
    }

    public Optional<UserItem> findUserById(String userId) {
        try {
            UserItem item = table(UserItem.class, usersTable)
                    .getItem(Key.builder().partitionValue(userId).build());
            return Optional.ofNullable(item);
        } catch (Exception e) {
            log.warn("DynamoDB findUserById failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<UserItem> findUserByUsername(String username) {
        try {
            ScanEnhancedRequest req = ScanEnhancedRequest.builder()
                    .filterExpression(Expression.builder()
                            .expression("username = :u")
                            .expressionValues(Map.of(":u", AttributeValue.fromS(username)))
                            .build())
                    .build();
            return table(UserItem.class, usersTable).scan(req)
                    .items().stream().findFirst();
        } catch (Exception e) {
            log.warn("DynamoDB findUserByUsername failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /* ── Document ops ─────────────────────────────────────── */

    public void saveDocument(DocumentItem item) {
        try {
            table(DocumentItem.class, documentsTable).putItem(item);
            log.debug("DynamoDB: saved document {}", item.getDocumentId());
        } catch (Exception e) {
            log.warn("DynamoDB saveDocument failed: {}", e.getMessage());
        }
    }

    public List<DocumentItem> findDocumentsByUserId(String userId) {
        try {
            ScanEnhancedRequest req = ScanEnhancedRequest.builder()
                    .filterExpression(Expression.builder()
                            .expression("userId = :u")
                            .expressionValues(Map.of(":u", AttributeValue.fromS(userId)))
                            .build())
                    .build();
            List<DocumentItem> items = new ArrayList<>();
            table(DocumentItem.class, documentsTable).scan(req).items().forEach(items::add);
            return items;
        } catch (Exception e) {
            log.warn("DynamoDB findDocumentsByUserId failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public Optional<DocumentItem> findDocumentById(String documentId) {
        try {
            // Scan for PK only (SK=userId unknown at lookup time)
            ScanEnhancedRequest req = ScanEnhancedRequest.builder()
                    .filterExpression(Expression.builder()
                            .expression("documentId = :d")
                            .expressionValues(Map.of(":d", AttributeValue.fromS(documentId)))
                            .build())
                    .build();
            return table(DocumentItem.class, documentsTable).scan(req)
                    .items().stream().findFirst();
        } catch (Exception e) {
            log.warn("DynamoDB findDocumentById failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /* ── Analysis Result ops ──────────────────────────────── */

    public void saveAnalysisResult(AnalysisResultItem item) {
        try {
            table(AnalysisResultItem.class, analysisTable).putItem(item);
            log.debug("DynamoDB: saved analysis result {}", item.getResultId());
        } catch (Exception e) {
            log.warn("DynamoDB saveAnalysisResult failed: {}", e.getMessage());
        }
    }

    public Optional<AnalysisResultItem> findAnalysisByDocumentId(String documentId) {
        try {
            ScanEnhancedRequest req = ScanEnhancedRequest.builder()
                    .filterExpression(Expression.builder()
                            .expression("documentId = :d")
                            .expressionValues(Map.of(":d", AttributeValue.fromS(documentId)))
                            .build())
                    .build();
            return table(AnalysisResultItem.class, analysisTable).scan(req)
                    .items().stream().findFirst();
        } catch (Exception e) {
            log.warn("DynamoDB findAnalysisByDocumentId failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public List<AnalysisResultItem> findAnalysisByUserId(String userId) {
        try {
            ScanEnhancedRequest req = ScanEnhancedRequest.builder()
                    .filterExpression(Expression.builder()
                            .expression("userId = :u")
                            .expressionValues(Map.of(":u", AttributeValue.fromS(userId)))
                            .build())
                    .build();
            List<AnalysisResultItem> items = new ArrayList<>();
            table(AnalysisResultItem.class, analysisTable).scan(req).items().forEach(items::add);
            return items;
        } catch (Exception e) {
            log.warn("DynamoDB findAnalysisByUserId failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /* ── Plagiarism Match ops ─────────────────────────────── */

    public void saveMatch(PlagiarismMatchItem item) {
        try {
            table(PlagiarismMatchItem.class, matchesTable).putItem(item);
        } catch (Exception e) {
            log.warn("DynamoDB saveMatch failed: {}", e.getMessage());
        }
    }

    public List<PlagiarismMatchItem> findMatchesByResultId(String resultId) {
        try {
            ScanEnhancedRequest req = ScanEnhancedRequest.builder()
                    .filterExpression(Expression.builder()
                            .expression("resultId = :r")
                            .expressionValues(Map.of(":r", AttributeValue.fromS(resultId)))
                            .build())
                    .build();
            List<PlagiarismMatchItem> items = new ArrayList<>();
            table(PlagiarismMatchItem.class, matchesTable).scan(req).items().forEach(items::add);
            return items;
        } catch (Exception e) {
            log.warn("DynamoDB findMatchesByResultId failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /* ── Helper ───────────────────────────────────────────── */
    private <T> DynamoDbTable<T> table(Class<T> clazz, String name) {
        return enhancedClient.table(name, TableSchema.fromBean(clazz));
    }
}
