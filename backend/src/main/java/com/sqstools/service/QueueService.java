package com.sqstools.service;

import tools.jackson.databind.ObjectMapper;
import com.sqstools.aws.SQSClientFactory;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class QueueService {

    private final SQSClientFactory clientFactory;
    private final ObjectMapper objectMapper;

    public QueueService(SQSClientFactory clientFactory, ObjectMapper objectMapper) {
        this.clientFactory = clientFactory;
        this.objectMapper = objectMapper;
    }

    public String resolveQueueUrl(String identifier, String region) {
        // If it's already a URL, return it
        if (identifier.startsWith("https://")) {
            return identifier;
        }
        
        // Otherwise, resolve queue name to URL
        SqsClient client = clientFactory.getClient(region);
        try {
            GetQueueUrlResponse response = client.getQueueUrl(
                    GetQueueUrlRequest.builder()
                            .queueName(identifier)
                            .build()
            );
            return response.queueUrl();
        } catch (QueueDoesNotExistException e) {
            throw new RuntimeException("Queue not found: " + identifier, e);
        } catch (SqsException e) {
            throw new RuntimeException("Failed to resolve queue URL: " + e.getMessage(), e);
        }
    }

    public Map<String, String> getQueueAttributes(String queueUrl, String region) {
        SqsClient client = clientFactory.getClient(region);
        try {
            GetQueueAttributesResponse response = client.getQueueAttributes(
                    GetQueueAttributesRequest.builder()
                            .queueUrl(queueUrl)
                            .attributeNamesWithStrings("All")
                            .build()
            );
            return response.attributesAsStrings();
        } catch (QueueDoesNotExistException e) {
            throw new RuntimeException("Queue not found: " + queueUrl, e);
        } catch (SqsException e) {
            throw new RuntimeException("Failed to get queue attributes: " + e.getMessage(), e);
        }
    }

    public Optional<String> extractDlqFromAttributes(Map<String, String> attributes) {
        String redrivePolicy = attributes.get("RedrivePolicy");
        if (redrivePolicy == null || redrivePolicy.isEmpty()) {
            return Optional.empty();
        }
        
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> policy = objectMapper.readValue(redrivePolicy, Map.class);
            String dlqArn = (String) policy.get("deadLetterTargetArn");
            
            if (dlqArn != null) {
                // Convert ARN to URL
                String[] arnParts = dlqArn.split(":");
                String region = arnParts[3];
                String accountId = arnParts[4];
                String queueName = arnParts[5];
                
                return Optional.of(String.format("https://sqs.%s.amazonaws.com/%s/%s", 
                        region, accountId, queueName));
            }
        } catch (Exception e) {
            // If parsing fails, return empty
        }
        
        return Optional.empty();
    }

    public String extractQueueName(String queueUrl) {
        String[] parts = queueUrl.split("/");
        return parts[parts.length - 1];
    }
}
