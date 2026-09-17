package com.codethon.microsoft.dynamodb;

import lombok.*;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for plagiarism matches table (pc_plagiarism_matches).
 * PK: matchId  (String UUID)
 * SK: resultId
 */
@DynamoDbBean
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlagiarismMatchItem {

    private String matchId;
    private String resultId;
    private String sourceTitle;
    private String sourceUrl;
    private String matchedText;
    private String sourceText;
    private Double similarityScore;
    private String matchType;
    private Integer startPosition;
    private Integer endPosition;
    private String sectionName;

    @DynamoDbPartitionKey
    @DynamoDbAttribute("matchId")
    public String getMatchId() { return matchId; }

    @DynamoDbSortKey
    @DynamoDbAttribute("resultId")
    public String getResultId() { return resultId; }
}
