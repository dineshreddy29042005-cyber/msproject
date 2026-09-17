package com.codethon.microsoft.dynamodb;

import lombok.*;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for users table (pc_users).
 * PK: userId (String UUID)
 */
@DynamoDbBean
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserItem {

    private String userId;
    private String username;
    private String email;
    private String password;
    private String role;
    private String createdAt;
    private String updatedAt;

    @DynamoDbPartitionKey
    @DynamoDbAttribute("userId")
    public String getUserId() { return userId; }

    @DynamoDbSecondaryPartitionKey(indexNames = "username-index")
    @DynamoDbAttribute("username")
    public String getUsername() { return username; }
}
