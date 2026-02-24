package com.sqstools.service;

import tools.jackson.databind.ObjectMapper;
import com.sqstools.aws.SQSClientFactory;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MessageService {

    private final SQSClientFactory clientFactory;
    private final ObjectMapper objectMapper;

    public MessageService(SQSClientFactory clientFactory, ObjectMapper objectMapper) {
        this.clientFactory = clientFactory;
        this.objectMapper = objectMapper;
    }

    public List<Message> receiveMessages(String queueUrl, String region,
            Integer maxMessages, Integer visibilityTimeout,
            Integer waitTimeSeconds) {
        return receiveMessages(queueUrl, region, maxMessages, visibilityTimeout, waitTimeSeconds, false);
    }

    public List<Message> receiveMessages(String queueUrl, String region,
            Integer maxMessages, Integer visibilityTimeout,
            Integer waitTimeSeconds, boolean shouldResetVisibility) {
        SqsClient client = clientFactory.getClient(region);

        ReceiveMessageRequest.Builder requestBuilder = ReceiveMessageRequest.builder()
                .queueUrl(queueUrl)
                .maxNumberOfMessages(maxMessages != null ? maxMessages : 10)
                .attributeNamesWithStrings("All")
                .messageAttributeNames("All");

        if (visibilityTimeout != null) {
            requestBuilder.visibilityTimeout(visibilityTimeout);
        }

        if (waitTimeSeconds != null) {
            requestBuilder.waitTimeSeconds(waitTimeSeconds);
        }

        ReceiveMessageResponse response = client.receiveMessage(requestBuilder.build());
        List<Message> messages = response.messages();

        if (shouldResetVisibility && !messages.isEmpty()) {
            for (Message message : messages) {
                try {
                    changeMessageVisibility(queueUrl, region, message.receiptHandle(), 0);
                } catch (Exception e) {
                    // Log error but continue with other messages
                    System.err.println(
                            "Failed to reset visibility for message " + message.messageId() + ": " + e.getMessage());
                }
            }
        }

        return messages;
    }

    public String sendMessage(String queueUrl, String region, String body,
            Map<String, MessageAttributeValue> attributes, Integer delaySeconds) {
        SqsClient client = clientFactory.getClient(region);

        SendMessageRequest.Builder requestBuilder = SendMessageRequest.builder()
                .queueUrl(queueUrl)
                .messageBody(body);

        if (attributes != null && !attributes.isEmpty()) {
            requestBuilder.messageAttributes(attributes);
        }

        if (delaySeconds != null) {
            requestBuilder.delaySeconds(delaySeconds);
        }

        SendMessageResponse response = client.sendMessage(requestBuilder.build());
        return response.messageId();
    }

    public void deleteMessage(String queueUrl, String region, String receiptHandle) {
        SqsClient client = clientFactory.getClient(region);
        client.deleteMessage(DeleteMessageRequest.builder()
                .queueUrl(queueUrl)
                .receiptHandle(receiptHandle)
                .build());
    }

    public void changeMessageVisibility(String queueUrl, String region,
            String receiptHandle, Integer visibilityTimeout) {
        if (visibilityTimeout < 0 || visibilityTimeout > 43200) {
            throw new IllegalArgumentException("Visibility timeout must be between 0 and 43200 seconds");
        }

        SqsClient client = clientFactory.getClient(region);
        client.changeMessageVisibility(ChangeMessageVisibilityRequest.builder()
                .queueUrl(queueUrl)
                .receiptHandle(receiptHandle)
                .visibilityTimeout(visibilityTimeout)
                .build());
    }

    public void purgeQueue(String queueUrl, String region) {
        SqsClient client = clientFactory.getClient(region);
        try {
            client.purgeQueue(PurgeQueueRequest.builder()
                    .queueUrl(queueUrl)
                    .build());
        } catch (PurgeQueueInProgressException e) {
            throw new RuntimeException("Queue was recently purged. AWS allows purge operations once every 60 seconds.",
                    e);
        }
    }

    public String prettyPrintJson(String body) {
        try {
            Object json = objectMapper.readValue(body, Object.class);
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(json);
        } catch (Exception e) {
            // Not valid JSON, return as-is
            return body;
        }
    }

    public boolean isValidJson(String body) {
        try {
            objectMapper.readValue(body, Object.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
