package com.sqstools.service;

import tools.jackson.databind.ObjectMapper;
import com.sqstools.aws.SQSClientFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QueueServiceTest {

    @Mock
    private SQSClientFactory clientFactory;

    @Mock
    private SqsClient sqsClient;

    private QueueService queueService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        queueService = new QueueService(clientFactory, objectMapper);
        lenient().when(clientFactory.getClient(anyString())).thenReturn(sqsClient);
    }

    @Test
    void shouldResolveQueueNameToUrl() {
        // Given
        String queueName = "my-queue";
        String expectedUrl = "https://sqs.us-east-1.amazonaws.com/123456789/my-queue";
        
        when(sqsClient.getQueueUrl(any(GetQueueUrlRequest.class)))
                .thenReturn(GetQueueUrlResponse.builder()
                        .queueUrl(expectedUrl)
                        .build());

        // When
        String actualUrl = queueService.resolveQueueUrl(queueName, "us-east-1");

        // Then
        assertThat(actualUrl).isEqualTo(expectedUrl);
        verify(sqsClient).getQueueUrl(any(GetQueueUrlRequest.class));
    }

    @Test
    void shouldReturnUrlDirectlyWhenProvidedAsIdentifier() {
        // Given
        String queueUrl = "https://sqs.us-east-1.amazonaws.com/123456789/my-queue";

        // When
        String actualUrl = queueService.resolveQueueUrl(queueUrl, "us-east-1");

        // Then
        assertThat(actualUrl).isEqualTo(queueUrl);
        verifyNoInteractions(sqsClient);
    }

    @Test
    void shouldThrowExceptionWhenQueueNotFound() {
        // Given
        when(sqsClient.getQueueUrl(any(GetQueueUrlRequest.class)))
                .thenThrow(QueueDoesNotExistException.builder().message("Queue not found").build());

        // When/Then
        assertThatThrownBy(() -> queueService.resolveQueueUrl("nonexistent", "us-east-1"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Queue not found");
    }

    @Test
    void shouldGetQueueAttributes() {
        // Given
        String queueUrl = "https://sqs.us-east-1.amazonaws.com/123456789/my-queue";
        Map<String, String> expectedAttributes = new HashMap<>();
        expectedAttributes.put("ApproximateNumberOfMessages", "5");
        expectedAttributes.put("VisibilityTimeout", "30");
        
        when(sqsClient.getQueueAttributes(any(GetQueueAttributesRequest.class)))
                .thenReturn(GetQueueAttributesResponse.builder()
                        .attributesWithStrings(expectedAttributes)
                        .build());

        // When
        Map<String, String> actualAttributes = queueService.getQueueAttributes(queueUrl, "us-east-1");

        // Then
        assertThat(actualAttributes).isEqualTo(expectedAttributes);
    }

    @Test
    void shouldExtractDlqFromRedrivePolicy() {
        // Given
        Map<String, String> attributes = new HashMap<>();
        attributes.put("RedrivePolicy", 
                "{\"deadLetterTargetArn\":\"arn:aws:sqs:us-east-1:123456789:my-dlq\",\"maxReceiveCount\":3}");

        // When
        Optional<String> dlqUrl = queueService.extractDlqFromAttributes(attributes);

        // Then
        assertThat(dlqUrl).isPresent();
        assertThat(dlqUrl.get()).isEqualTo("https://sqs.us-east-1.amazonaws.com/123456789/my-dlq");
    }

    @Test
    void shouldReturnEmptyWhenNoDlqConfigured() {
        // Given
        Map<String, String> attributes = new HashMap<>();

        // When
        Optional<String> dlqUrl = queueService.extractDlqFromAttributes(attributes);

        // Then
        assertThat(dlqUrl).isEmpty();
    }

    @Test
    void shouldExtractQueueNameFromUrl() {
        // Given
        String queueUrl = "https://sqs.us-east-1.amazonaws.com/123456789/my-queue";

        // When
        String queueName = queueService.extractQueueName(queueUrl);

        // Then
        assertThat(queueName).isEqualTo("my-queue");
    }
}
