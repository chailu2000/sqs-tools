package com.sqstools.service;

import com.sqstools.model.RedriveResult;
import net.jqwik.api.*;
import software.amazon.awssdk.services.sqs.model.Message;
import software.amazon.awssdk.services.sqs.model.MessageAttributeValue;

import java.util.*;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Preservation Property Tests for Property 2: Non-Selective Operations
 * Unchanged
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * IMPORTANT: These tests follow observation-first methodology.
 * They capture the CURRENT behavior of non-selective-redrive operations on
 * UNFIXED code.
 * 
 * EXPECTED OUTCOME ON UNFIXED CODE: PASS
 * - These tests confirm the baseline behavior that must be preserved
 * - "Redrive All" processes messages in batches
 * - Message loading displays all attributes correctly
 * - Main queue operations work correctly
 * - Atomic operations are preserved (delete only if send succeeds)
 * 
 * EXPECTED OUTCOME ON FIXED CODE: PASS
 * - These same tests must continue to pass after the fix
 * - This confirms no regressions were introduced
 * - All non-selective-redrive functionality remains unchanged
 */
class RedriveServicePreservationTest {

    /**
     * Property 2.1: Redrive All Continues to Process Messages in Batches
     * 
     * This property tests that the "Redrive All" functionality continues to work
     * as it currently does: processing all DLQ messages in batches of up to 10,
     * sending them to the main queue, and deleting them from the DLQ.
     * 
     * **Validates: Requirement 3.1, 3.2**
     * 
     * EXPECTED OUTCOME: PASS on both unfixed and fixed code
     */
    @Property
    @Label("Property 2.1: Redrive All processes all DLQ messages in batches")
    void redriveAllShouldProcessMessagesInBatches(
            @ForAll("redriveAllScenarios") RedriveAllScenario scenario) {

        // Setup mocks
        MessageService messageService = mock(MessageService.class);
        RedriveService redriveService = new RedriveService(messageService);

        // Setup: Mock receiveMessages to return batches
        when(messageService.receiveMessages(
                eq(scenario.dlqUrl),
                eq(scenario.region),
                anyInt(),
                any(),
                anyInt()))
                .thenReturn(scenario.firstBatch)
                .thenReturn(scenario.secondBatch)
                .thenReturn(Collections.emptyList()); // No more messages

        // Setup: Mock successful send and delete
        when(messageService.sendMessage(
                eq(scenario.mainQueueUrl),
                eq(scenario.region),
                anyString(),
                any(),
                any())).thenReturn("sent-msg-id");

        doNothing().when(messageService).deleteMessage(
                eq(scenario.dlqUrl),
                eq(scenario.region),
                anyString());

        // Execute: Redrive All
        RedriveResult result = redriveService.redriveMessages(
                scenario.dlqUrl,
                scenario.mainQueueUrl,
                scenario.region,
                null,
                true); // redriveAll = true

        // Verify: All messages were processed
        int totalMessages = scenario.firstBatch.size() + scenario.secondBatch.size();
        assertThat(result.getProcessedCount())
                .as("Redrive All should process all messages from all batches")
                .isEqualTo(totalMessages);

        assertThat(result.getSuccessCount())
                .as("All messages should be successfully redriven")
                .isEqualTo(totalMessages);

        assertThat(result.getFailureCount())
                .as("No failures should occur in normal operation")
                .isEqualTo(0);

        // Verify: Messages were received in batches (max 10 per batch)
        verify(messageService, atLeastOnce()).receiveMessages(
                eq(scenario.dlqUrl),
                eq(scenario.region),
                intThat(max -> max <= 10),
                any(),
                anyInt());

        // Verify: Each message was sent to main queue
        verify(messageService, times(totalMessages)).sendMessage(
                eq(scenario.mainQueueUrl),
                eq(scenario.region),
                anyString(),
                any(),
                any());

        // Verify: Each message was deleted from DLQ
        verify(messageService, times(totalMessages)).deleteMessage(
                eq(scenario.dlqUrl),
                eq(scenario.region),
                anyString());
    }

    /**
     * Property 2.2: Messages Deleted from DLQ Only After Successful Send
     * 
     * This property tests that the atomic operation behavior is preserved:
     * messages are deleted from the DLQ only after they are successfully sent
     * to the main queue. If the send fails, the message should not be deleted.
     * 
     * **Validates: Requirement 3.5**
     * 
     * EXPECTED OUTCOME: PASS on both unfixed and fixed code
     */
    @Property
    @Label("Property 2.2: Messages deleted from DLQ only after successful send to main queue")
    void messagesShouldBeDeletedOnlyAfterSuccessfulSend(
            @ForAll("atomicOperationScenarios") AtomicOperationScenario scenario) {

        // Setup mocks
        MessageService messageService = mock(MessageService.class);
        RedriveService redriveService = new RedriveService(messageService);

        // Setup: Mock receiveMessages
        when(messageService.receiveMessages(
                eq(scenario.dlqUrl),
                eq(scenario.region),
                anyInt(),
                any(),
                anyInt()))
                .thenReturn(scenario.messages)
                .thenReturn(Collections.emptyList());

        // Setup: Mock sendMessage to fail for specific messages
        for (int i = 0; i < scenario.messages.size(); i++) {
            Message msg = scenario.messages.get(i);
            if (scenario.failureIndices.contains(i)) {
                when(messageService.sendMessage(
                        eq(scenario.mainQueueUrl),
                        eq(scenario.region),
                        eq(msg.body()),
                        any(),
                        any()))
                        .thenThrow(new RuntimeException("Send failed"));
            } else {
                when(messageService.sendMessage(
                        eq(scenario.mainQueueUrl),
                        eq(scenario.region),
                        eq(msg.body()),
                        any(),
                        any()))
                        .thenReturn("sent-" + msg.messageId());
            }
        }

        // Execute: Redrive All
        RedriveResult result = redriveService.redriveMessages(
                scenario.dlqUrl,
                scenario.mainQueueUrl,
                scenario.region,
                null,
                true);

        // Verify: Only successfully sent messages were deleted
        int expectedSuccesses = scenario.messages.size() - scenario.failureIndices.size();
        assertThat(result.getSuccessCount())
                .as("Only messages that were successfully sent should be counted as success")
                .isEqualTo(expectedSuccesses);

        assertThat(result.getFailureCount())
                .as("Failed sends should be counted as failures")
                .isEqualTo(scenario.failureIndices.size());

        // Verify: Delete was called only for successfully sent messages
        verify(messageService, times(expectedSuccesses)).deleteMessage(
                eq(scenario.dlqUrl),
                eq(scenario.region),
                anyString());

        // Verify: Delete was NOT called for failed messages
        for (int failureIndex : scenario.failureIndices) {
            Message failedMsg = scenario.messages.get(failureIndex);
            verify(messageService, never()).deleteMessage(
                    eq(scenario.dlqUrl),
                    eq(scenario.region),
                    eq(failedMsg.receiptHandle()));
        }
    }

    /**
     * Property 2.3: Message Attributes Preserved During Redrive
     * 
     * This property tests that when messages are redriven, all their attributes
     * are correctly preserved and passed to the main queue.
     * 
     * **Validates: Requirement 3.3**
     * 
     * EXPECTED OUTCOME: PASS on both unfixed and fixed code
     */
    @Property
    @Label("Property 2.3: Message attributes are preserved during redrive operations")
    void messageAttributesShouldBePreservedDuringRedrive(
            @ForAll("messagesWithAttributes") List<Message> messages) {

        // Setup mocks
        MessageService messageService = mock(MessageService.class);
        RedriveService redriveService = new RedriveService(messageService);

        String dlqUrl = "https://sqs.us-east-1.amazonaws.com/123/test-dlq";
        String mainQueueUrl = "https://sqs.us-east-1.amazonaws.com/123/test-queue";
        String region = "us-east-1";

        // Setup: Mock receiveMessages
        when(messageService.receiveMessages(
                eq(dlqUrl),
                eq(region),
                anyInt(),
                any(),
                anyInt()))
                .thenReturn(messages)
                .thenReturn(Collections.emptyList());

        // Setup: Mock successful send
        when(messageService.sendMessage(
                anyString(),
                anyString(),
                anyString(),
                any(),
                any())).thenReturn("sent-msg-id");

        // Execute: Redrive All
        redriveService.redriveMessages(dlqUrl, mainQueueUrl, region, null, true);

        // Verify: Each message was sent with its original attributes
        for (Message message : messages) {
            verify(messageService).sendMessage(
                    eq(mainQueueUrl),
                    eq(region),
                    eq(message.body()),
                    eq(message.messageAttributes()),
                    any());
        }
    }

    /**
     * Property 2.4: Redrive All Respects Batch Size Limits
     * 
     * This property tests that Redrive All continues to respect SQS batch size
     * limits (max 10 messages per receive operation).
     * 
     * **Validates: Requirement 3.1**
     * 
     * EXPECTED OUTCOME: PASS on both unfixed and fixed code
     */
    @Property
    @Label("Property 2.4: Redrive All respects SQS batch size limits")
    void redriveAllShouldRespectBatchSizeLimits(
            @ForAll("totalMessageCount") int totalMessages) {

        // Setup mocks
        MessageService messageService = mock(MessageService.class);
        RedriveService redriveService = new RedriveService(messageService);

        String dlqUrl = "https://sqs.us-east-1.amazonaws.com/123/test-dlq";
        String mainQueueUrl = "https://sqs.us-east-1.amazonaws.com/123/test-queue";
        String region = "us-east-1";

        // Setup: Create batches of messages (max 10 per batch)
        List<List<Message>> batches = new ArrayList<>();
        for (int i = 0; i < totalMessages; i += 10) {
            int batchSize = Math.min(10, totalMessages - i);
            List<Message> batch = new ArrayList<>();
            for (int j = 0; j < batchSize; j++) {
                batch.add(Message.builder()
                        .messageId("msg-" + (i + j))
                        .body("body-" + (i + j))
                        .receiptHandle("receipt-" + (i + j))
                        .build());
            }
            batches.add(batch);
        }

        // Setup: Mock receiveMessages to return batches
        when(messageService.receiveMessages(
                eq(dlqUrl),
                eq(region),
                anyInt(),
                any(),
                anyInt()))
                .thenReturn(batches.get(0),
                        batches.subList(1, batches.size()).toArray(new List[0]))
                .thenReturn(Collections.emptyList());

        // Setup: Mock successful operations
        when(messageService.sendMessage(anyString(), anyString(), anyString(), any(), any()))
                .thenReturn("sent-msg-id");

        // Execute: Redrive All
        RedriveResult result = redriveService.redriveMessages(
                dlqUrl, mainQueueUrl, region, null, true);

        // Verify: All messages were processed
        assertThat(result.getProcessedCount())
                .as("All messages should be processed")
                .isEqualTo(totalMessages);

        // Verify: receiveMessages was called with max 10 messages per call
        verify(messageService, atLeastOnce()).receiveMessages(
                eq(dlqUrl),
                eq(region),
                intThat(max -> max <= 10),
                any(),
                anyInt());
    }

    // ========== Arbitrary Generators ==========

    /**
     * Generates total message counts for batch size testing
     */
    @Provide
    Arbitrary<Integer> totalMessageCount() {
        return Arbitraries.integers().between(1, 50);
    }

    /**
     * Generates scenarios for Redrive All with multiple batches of messages
     */
    @Provide
    Arbitrary<RedriveAllScenario> redriveAllScenarios() {
        return Combinators.combine(
                Arbitraries.integers().between(1, 10), // First batch size
                Arbitraries.integers().between(0, 10) // Second batch size
        ).as((firstBatchSize, secondBatchSize) -> {
            RedriveAllScenario scenario = new RedriveAllScenario();
            scenario.dlqUrl = "https://sqs.us-east-1.amazonaws.com/123/test-dlq";
            scenario.mainQueueUrl = "https://sqs.us-east-1.amazonaws.com/123/test-queue";
            scenario.region = "us-east-1";

            // Generate first batch
            scenario.firstBatch = new ArrayList<>();
            for (int i = 0; i < firstBatchSize; i++) {
                scenario.firstBatch.add(Message.builder()
                        .messageId("msg-batch1-" + i)
                        .body("body-batch1-" + i)
                        .receiptHandle("receipt-batch1-" + i)
                        .build());
            }

            // Generate second batch
            scenario.secondBatch = new ArrayList<>();
            for (int i = 0; i < secondBatchSize; i++) {
                scenario.secondBatch.add(Message.builder()
                        .messageId("msg-batch2-" + i)
                        .body("body-batch2-" + i)
                        .receiptHandle("receipt-batch2-" + i)
                        .build());
            }

            return scenario;
        });
    }

    /**
     * Generates scenarios for testing atomic operations (delete only if send
     * succeeds)
     */
    @Provide
    Arbitrary<AtomicOperationScenario> atomicOperationScenarios() {
        return Combinators.combine(
                Arbitraries.integers().between(2, 8), // Number of messages
                Arbitraries.integers().between(0, 3) // Number of failures
        ).as((messageCount, failureCount) -> {
            AtomicOperationScenario scenario = new AtomicOperationScenario();
            scenario.dlqUrl = "https://sqs.us-east-1.amazonaws.com/123/test-dlq";
            scenario.mainQueueUrl = "https://sqs.us-east-1.amazonaws.com/123/test-queue";
            scenario.region = "us-east-1";

            // Generate messages
            scenario.messages = new ArrayList<>();
            for (int i = 0; i < messageCount; i++) {
                scenario.messages.add(Message.builder()
                        .messageId("msg-" + i)
                        .body("body-" + i)
                        .receiptHandle("receipt-" + i)
                        .build());
            }

            // Generate random failure indices
            scenario.failureIndices = new HashSet<>();
            Random random = new Random();
            int actualFailures = Math.min(failureCount, messageCount);
            while (scenario.failureIndices.size() < actualFailures) {
                scenario.failureIndices.add(random.nextInt(messageCount));
            }

            return scenario;
        });
    }

    /**
     * Generates messages with various attributes
     */
    @Provide
    Arbitrary<List<Message>> messagesWithAttributes() {
        return Arbitraries.integers().between(1, 5).flatMap(count -> {
            List<Arbitrary<Message>> messageArbitraries = new ArrayList<>();
            for (int i = 0; i < count; i++) {
                final int index = i;
                messageArbitraries.add(
                        Arbitraries.of(true, false).map(hasAttributes -> {
                            Message.Builder builder = Message.builder()
                                    .messageId("msg-" + index)
                                    .body("body-" + index)
                                    .receiptHandle("receipt-" + index);

                            if (hasAttributes) {
                                Map<String, MessageAttributeValue> attributes = new HashMap<>();
                                attributes.put("attr1", MessageAttributeValue.builder()
                                        .dataType("String")
                                        .stringValue("value1")
                                        .build());
                                attributes.put("attr2", MessageAttributeValue.builder()
                                        .dataType("Number")
                                        .stringValue("123")
                                        .build());
                                builder.messageAttributes(attributes);
                            }

                            return builder.build();
                        }));
            }
            return Combinators.combine(messageArbitraries).as(messages -> messages);
        });
    }

    // ========== Test Scenario Classes ==========

    static class RedriveAllScenario {
        String dlqUrl;
        String mainQueueUrl;
        String region;
        List<Message> firstBatch;
        List<Message> secondBatch;
    }

    static class AtomicOperationScenario {
        String dlqUrl;
        String mainQueueUrl;
        String region;
        List<Message> messages;
        Set<Integer> failureIndices; // Indices of messages that should fail to send
    }
}
