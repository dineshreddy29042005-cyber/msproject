package com.codethon.microsoft.config;

import lombok.extern.slf4j.Slf4j;import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@Configuration
@Slf4j
public class DynamoDbConfig {

    @Value("${dynamodb.endpoint}")
    private String endpoint;

    @Value("${dynamodb.region}")
    private String region;

    @Value("${dynamodb.access-key}")
    private String accessKey;

    @Value("${dynamodb.secret-key}")
    private String secretKey;

    @Value("${dynamodb.tables.users}")
    private String usersTable;

    @Value("${dynamodb.tables.documents}")
    private String documentsTable;

    @Value("${dynamodb.tables.analysis}")
    private String analysisTable;

    @Value("${dynamodb.tables.matches}")
    private String matchesTable;

    @Bean
    public DynamoDbClient dynamoDbClient() {
        return DynamoDbClient.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(
                    StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)
                    )
                )
                .build();
    }

    @Bean
    public DynamoDbEnhancedClient dynamoDbEnhancedClient(DynamoDbClient client) {
        return DynamoDbEnhancedClient.builder()
                .dynamoDbClient(client)
                .build();
    }

    /**
     * Auto-create all DynamoDB tables on startup if they don't exist.
     * Injected DynamoDbClient avoids circular reference.
     */
    @Bean
    public Boolean dynamoDbTablesInitializer(DynamoDbClient client) {
        try {
            List<String> existing = client.listTables().tableNames();
            log.info("Existing DynamoDB tables: {}", existing);

            createTableIfAbsent(client, existing, usersTable,
                "userId", ScalarAttributeType.S, null, null);

            createTableIfAbsent(client, existing, documentsTable,
                "documentId", ScalarAttributeType.S, "userId", ScalarAttributeType.S);

            createTableIfAbsent(client, existing, analysisTable,
                "resultId", ScalarAttributeType.S, "documentId", ScalarAttributeType.S);

            createTableIfAbsent(client, existing, matchesTable,
                "matchId", ScalarAttributeType.S, "resultId", ScalarAttributeType.S);

            log.info("DynamoDB tables verified/created successfully.");

        } catch (Exception e) {
            log.warn("DynamoDB not available or table creation failed: {}. " +
                     "App will continue using H2 for primary storage.", e.getMessage());
        }
        return Boolean.TRUE;
    }

    private void createTableIfAbsent(DynamoDbClient client,
                                     List<String> existing,
                                     String tableName,
                                     String pkName, ScalarAttributeType pkType,
                                     String skName, ScalarAttributeType skType) {
        if (existing.contains(tableName)) {
            log.info("Table already exists: {}", tableName);
            return;
        }

        try {
            CreateTableRequest.Builder builder = CreateTableRequest.builder()
                .tableName(tableName)
                .billingMode(BillingMode.PAY_PER_REQUEST);

            if (skName != null) {
                // Composite key: PK + SK
                builder
                    .keySchema(
                        KeySchemaElement.builder().attributeName(pkName).keyType(KeyType.HASH).build(),
                        KeySchemaElement.builder().attributeName(skName).keyType(KeyType.RANGE).build()
                    )
                    .attributeDefinitions(
                        AttributeDefinition.builder().attributeName(pkName).attributeType(pkType).build(),
                        AttributeDefinition.builder().attributeName(skName).attributeType(skType).build()
                    );
            } else {
                // Simple PK only
                builder
                    .keySchema(
                        KeySchemaElement.builder().attributeName(pkName).keyType(KeyType.HASH).build()
                    )
                    .attributeDefinitions(
                        AttributeDefinition.builder().attributeName(pkName).attributeType(pkType).build()
                    );
            }

            client.createTable(builder.build());
            // Wait until table is active
            client.waiter().waitUntilTableExists(r -> r.tableName(tableName));
            log.info("Created DynamoDB table: {}", tableName);

        } catch (ResourceInUseException e) {
            log.info("Table already exists (race condition): {}", tableName);
        } catch (Exception e) {
            log.error("Failed to create table {}: {}", tableName, e.getMessage());
        }
    }
}
