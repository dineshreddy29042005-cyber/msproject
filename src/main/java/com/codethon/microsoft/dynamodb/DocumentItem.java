package com.codethon.microsoft.dynamodb;

import lombok.*;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for documents table (pc_documents).
 * PK: documentId (String UUID)
 * SK: userId
 */
@DynamoDbBean
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentItem {

    private String documentId;
    private String userId;
    private String title;
    private String originalFilename;
    private String storedFilename;
    private String filePath;
    private Long   fileSize;
    private String fileType;
    private String status;
    private String uploadedAt;

    @DynamoDbPartitionKey
    @DynamoDbAttribute("documentId")
    public String getDocumentId() { return documentId; }

    @DynamoDbSortKey
    @DynamoDbAttribute("userId")
    public String getUserId() { return userId; }
}
