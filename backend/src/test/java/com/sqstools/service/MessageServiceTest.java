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

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock
    private SQSClientFactory clientFactory;

    @Mock
    private SqsClient sqsClient;

    private MessageService messageService;

    @BeforeEach
    void setUp() {
        messageService = new MessageService(clientFactory, new ObjectMapper());
        lenient().when(clientFactory.getClient(anyString())).thenReturn(sqsClient);
    }

    @Test
    void shouldReceiveMessages() {
        // Given
        Message message = Message.builder()
                .messageId("msg-123")
                .body("test body")
                .receiptHandle("receipt-123")
                .build();
        
        when(sqsClient.receiveMessage(any(ReceiveMessageRequest.class)))
                .thenReturn(ReceiveMessageResponse.builder()
                        .messages(message)
                        .build());

        // When
        List<Message> messages = messageService.receiveMessages(
                "https://sqs.us-east-1.amazonaws.com/123/queue", 
                "us-east-1", 
                10, 
                30, 
                0
        );

        // Then
        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).messageId()).isEqualTo("msg-123");
    }

    @Test
    void shouldSendMessage() {
        // Given
        when(sqsClient.sendMessage(any(SendMessageRequest.class)))
                .thenReturn(SendMessageResponse.builder()
                        .messageId("msg-456")
                        .build());

        // When
        String messageId = messageService.sendMessage(
                "https://sqs.us-east-1.amazonaws.com/123/queue",
                "us-east-1",
                "test message",
                null,
                null
        );

        // Then
        assertThat(messageId).isEqualTo("msg-456");
        verify(sqsClient).sendMessage(any(SendMessageRequest.class));
    }

    @Test
    void shouldDeleteMessage() {
        // Given
        String receiptHandle = "receipt-123";

        // When
        messageService.deleteMessage(
                "https://sqs.us-east-1.amazonaws.com/123/queue",
                "us-east-1",
                receiptHandle
        );

        // Then
        verify(sqsClient).deleteMessage(any(DeleteMessageRequest.class));
    }

    @Test
    void shouldChangeMessageVisibility() {
        // When
        messageService.changeMessageVisibility(
                "https://sqs.us-east-1.amazonaws.com/123/queue",
                "us-east-1",
                "receipt-123",
                300
        );

        // Then
        verify(sqsClient).changeMessageVisibility(any(ChangeMessageVisibilityRequest.class));
    }

    @Test
    void shouldRejectInvalidVisibilityTimeout() {
        // When/Then
        assertThatThrownBy(() -> messageService.changeMessageVisibility(
                "https://sqs.us-east-1.amazonaws.com/123/queue",
                "us-east-1",
                "receipt-123",
                50000
        )).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("between 0 and 43200");
    }

    @Test
    void shouldPurgeQueue() {
        // When
        messageService.purgeQueue(
                "https://sqs.us-east-1.amazonaws.com/123/queue",
                "us-east-1"
        );

        // Then
        verify(sqsClient).purgeQueue(any(PurgeQueueRequest.class));
    }

    @Test
    void shouldHandlePurgeInProgress() {
        // Given
        when(sqsClient.purgeQueue(any(PurgeQueueRequest.class)))
                .thenThrow(PurgeQueueInProgressException.builder()
                        .message("Purge in progress")
                        .build());

        // When/Then
        assertThatThrownBy(() -> messageService.purgeQueue(
                "https://sqs.us-east-1.amazonaws.com/123/queue",
                "us-east-1"
        )).isInstanceOf(RuntimeException.class)
          .hasMessageContaining("60 seconds");
    }

    @Test
    void shouldPrettyPrintValidJson() {
        // Given
        String json = "{\"key\":\"value\"}";

        // When
        String formatted = messageService.prettyPrintJson(json);

        // Then
        assertThat(formatted).contains("\"key\"");
        assertThat(formatted).contains("\"value\"");
        assertThat(formatted).contains("\n");
    }

    @Test
    void shouldReturnOriginalForInvalidJson() {
        // Given
        String notJson = "plain text";

        // When
        String result = messageService.prettyPrintJson(notJson);

        // Then
        assertThat(result).isEqualTo(notJson);
    }

    @Test
    void shouldValidateJson() {
        // When/Then
        assertThat(messageService.isValidJson("{\"key\":\"value\"}")).isTrue();
        assertThat(messageService.isValidJson("plain text")).isFalse();
    }
}
