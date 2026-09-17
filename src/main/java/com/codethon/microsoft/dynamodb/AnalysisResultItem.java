package com.codethon.microsoft.dynamodb;

import lombok.*;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;
@DynamoDbBean
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalysisResultItem {

    private String resultId;
    private String documentId;
    private String documentTitle;
    private String userId;
    private Double overallScore;
    private Double semanticScore;
    private Double paraphraseScore;
    private Double exactMatchScore;
    private String riskLevel;
    private String summary;
    private String explanation;
    private String status;
    private String analyzedAt;
    private String completedAt;

    @DynamoDbPartitionKey
    @DynamoDbAttribute("resultId")
    public String getResultId() { return resultId; }

    @DynamoDbSortKey
    @DynamoDbAttribute("documentId")
    public String getDocumentId() { return documentId; }
}
