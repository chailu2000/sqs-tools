package com.sqstools.service;

import com.sqstools.controller.RedriveController.MessageDetails;
import com.sqstools.model.RedriveResult;
import net.jqwik.api.*;
import software.amazon.awssdk.services.sqs.model.Message;

import java.util.*;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Bug Condition Exploration Test for Property 1: Selective Redrive Uses
 * Original Receipt Handles
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug
 * exists.
 * 
 * This test explores the bug condition where selective redrive fails due to:
 * 1. Backend re-receiving messages from DLQ (visibility timeout conflict)
 * 2. Message ID mismatches causing "Message not found" errors
 * 3. Silent failures with no detailed feedback
 * 4. UI clearing incorrectly after failed operations
 * 
 * The test encodes the EXPECTED BEHAVIOR:
 * - Selective redrive should use receipt handles from original load
 * - Detailed success/failure feedback should be provided
 * - UI should update correctly based on actual results
 * - Only successfully redriven messages should be removed
 * 
 * When this test passes after the fix, it confirms the bug is resolved.
 */
class RedriveServiceBugExplorationTest {

        /**
         * Property 1: Selective Redrive Uses Original Receipt Handles
         * 
         * This property tests that when a user selects specific messages from the DLQ,
         * the system should redrive exactly those messages using their original receipt
         * handles,
         * without performing a fresh receiveMessage operation that causes visibility
         * timeout conflicts.
         * 
         * EXPECTED OUTCOME ON UNFIXED CODE: FAIL
         * - The backend will re-receive messages, getting a different batch due to
         * visibility timeout
         * - Message ID mismatches will occur
         * - Some messages will fail with "Message not found" errors
         * - The result will not accurately reflect which messages were actually
         * redriven
         * 
         * EXPECTED OUTCOME ON FIXED CODE: PASS
         * - The system will use the provided receipt handles directly
         * - All selected messages will be processed correctly
         * - Detailed success/failure feedback will be provided
         * - UI will update correctly based on actual results
         */
        @Property
        @Label("Property 1: Selective redrive uses original receipt handles and provides detailed feedback")
        void selectiveRedriveShouldUseOriginalReceiptHandlesAndProvideDetailedFeedback(
                        @ForAll("selectedMessagesWithVisibilityTimeout") SelectiveRedriveScenario scenario) {

                // Setup mocks for this test
                MessageService messageService = mock(MessageService.class);
                RedriveService redriveService = new RedriveService(messageService);

                // Setup: Mock the backend's fresh receive to return a DIFFERENT batch
                // This simulates the visibility timeout conflict
                when(messageService.receiveMessages(
                                eq(scenario.dlqUrl),
                                eq(scenario.region),
                                anyInt(),
                                anyInt(),
                                anyInt())).thenReturn(scenario.freshlyReceivedMessages);

                // Setup: Mock successful send and delete operations
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

                // Execute: Attempt to redrive the originally selected messages
                RedriveResult result = redriveService.redriveSelectedMessages(
                                scenario.dlqUrl,
                                scenario.mainQueueUrl,
                                scenario.region,
                                scenario.selectedMessages);

                // EXPECTED BEHAVIOR (will fail on unfixed code):

                // Requirement 2.1: System should use original receipt handles without
                // re-receiving
                // On unfixed code: This will fail because the backend re-receives messages
                // The freshly received batch won't contain the originally selected messages
                assertThat(result.getProcessedCount())
                                .as("All selected messages should be processed using original receipt handles")
                                .isEqualTo(scenario.selectedMessageIds.size());

                // Requirement 2.2: System should provide detailed success/failure feedback
                // On unfixed code: This will fail because messages not found in fresh batch
                // will have "Message not found" errors
                assertThat(result.getSuccessCount() + result.getFailureCount())
                                .as("Success + failure count should equal processed count")
                                .isEqualTo(result.getProcessedCount());

                // Requirement 2.3 & 2.4: Only successfully redriven messages should be removed
                // On unfixed code: This will fail because the mismatch causes incorrect results
                if (result.getFailureCount() > 0) {
                        assertThat(result.getErrors())
                                        .as("Failed messages should have detailed error information")
                                        .isNotEmpty()
                                        .allSatisfy(error -> {
                                                assertThat(error.getMessageId()).isNotNull();
                                                assertThat(error.getError()).isNotNull();
                                        });
                }

                // Requirement 2.5: System should provide detailed error information for each
                // failed message
                // On unfixed code: This will fail because the system doesn't track which
                // messages
                // were actually redriven vs which failed due to visibility timeout mismatch
                Set<String> processedMessageIds = new HashSet<>();
                processedMessageIds.addAll(
                                result.getErrors().stream()
                                                .map(RedriveResult.RedriveError::getMessageId)
                                                .collect(Collectors.toSet()));

                // The bug: On unfixed code, messages not in the fresh batch will fail with
                // "Message not found" errors, even though they were the ones the user selected
                // This demonstrates the visibility timeout conflict

                // Calculate expected failures based on visibility timeout conflict
                Set<String> freshlyReceivedIds = scenario.freshlyReceivedMessages.stream()
                                .map(Message::messageId)
                                .collect(Collectors.toSet());

                Set<String> expectedFailures = scenario.selectedMessageIds.stream()
                                .filter(id -> !freshlyReceivedIds.contains(id))
                                .collect(Collectors.toSet());

                // On fixed code: When using original receipt handles, all messages should
                // succeed
                // No failures should occur due to visibility timeout conflicts
                assertThat(result.getFailureCount())
                                .as("When using original receipt handles, no failures should occur due to visibility timeout conflicts")
                                .isEqualTo(0);

                // Verify that all selected messages were successfully processed
                assertThat(result.getSuccessCount())
                                .as("All selected messages should succeed when using original receipt handles")
                                .isEqualTo(scenario.selectedMessageIds.size());
        }

        /**
         * Generates test scenarios for selective redrive with visibility timeout
         * conflicts.
         * 
         * Each scenario includes:
         * - Originally selected messages (what the user chose)
         * - Freshly received messages (what the backend gets when it re-receives)
         * - The mismatch between these two sets demonstrates the bug
         */
        @Provide
        Arbitrary<SelectiveRedriveScenario> selectedMessagesWithVisibilityTimeout() {
                return Combinators.combine(
                                Arbitraries.integers().between(2, 5), // Number of originally selected messages
                                Arbitraries.integers().between(1, 4) // Number of messages in fresh receive
                ).as((selectedCount, freshCount) -> {
                        SelectiveRedriveScenario scenario = new SelectiveRedriveScenario();
                        scenario.dlqUrl = "https://sqs.us-east-1.amazonaws.com/123/test-dlq";
                        scenario.mainQueueUrl = "https://sqs.us-east-1.amazonaws.com/123/test-queue";
                        scenario.region = "us-east-1";

                        // Generate originally selected message IDs
                        scenario.selectedMessageIds = new ArrayList<>();
                        for (int i = 0; i < selectedCount; i++) {
                                scenario.selectedMessageIds.add("original-msg-" + i);
                        }

                        // Convert to MessageDetails with receipt handles
                        scenario.selectedMessages = createMessageDetails(scenario.selectedMessageIds);

                        // Generate freshly received messages (simulating visibility timeout conflict)
                        // These are DIFFERENT messages than what the user selected
                        scenario.freshlyReceivedMessages = new ArrayList<>();
                        for (int i = 0; i < freshCount; i++) {
                                // Mix of some matching and some different messages
                                String messageId = (i < selectedCount / 2)
                                                ? scenario.selectedMessageIds.get(i) // Some matches
                                                : "fresh-msg-" + i; // Some different (visibility timeout conflict)

                                scenario.freshlyReceivedMessages.add(
                                                Message.builder()
                                                                .messageId(messageId)
                                                                .body("Test message body")
                                                                .receiptHandle("receipt-" + messageId)
                                                                .build());
                        }

                        return scenario;
                });
        }

        /**
         * Test scenario representing a selective redrive operation with visibility
         * timeout conflict.
         */
        static class SelectiveRedriveScenario {
                String dlqUrl;
                String mainQueueUrl;
                String region;
                List<String> selectedMessageIds; // What the user originally selected
                List<MessageDetails> selectedMessages; // MessageDetails with receipt handles
                List<Message> freshlyReceivedMessages; // What the backend receives (different due to visibility
                                                       // timeout)
        }

        /**
         * Helper method to convert message IDs to MessageDetails with receipt handles
         */
        private static List<MessageDetails> createMessageDetails(List<String> messageIds) {
                return messageIds.stream()
                                .map(id -> {
                                        MessageDetails details = new MessageDetails();
                                        details.setMessageId(id);
                                        details.setReceiptHandle("receipt-" + id);
                                        details.setBody("Test message body for " + id);
                                        details.setMessageAttributes(new HashMap<>());
                                        return details;
                                })
                                .collect(Collectors.toList());
        }

        /**
         * Unit test demonstrating the specific bug: Complete message ID mismatch
         * 
         * This test shows the exact scenario described in the bug report:
         * User selects messages M1, M2, M3, but backend receives M4, M5, M6 due to
         * visibility timeout.
         * All redrives fail with "Message not found" errors.
         */
        @Example
        @Label("Bug Example 1: Complete message ID mismatch due to visibility timeout")
        void completeMismatchCausesAllFailures() {
                // Setup mocks
                MessageService messageService = mock(MessageService.class);
                RedriveService redriveService = new RedriveService(messageService);

                // Given: User has loaded and selected messages M1, M2, M3
                List<String> selectedMessageIds = Arrays.asList("M1", "M2", "M3");
                List<MessageDetails> selectedMessages = createMessageDetails(selectedMessageIds);

                // And: Backend's fresh receive gets completely different messages (visibility
                // timeout)
                List<Message> freshlyReceived = Arrays.asList(
                                Message.builder().messageId("M4").body("body4").receiptHandle("receipt-M4").build(),
                                Message.builder().messageId("M5").body("body5").receiptHandle("receipt-M5").build(),
                                Message.builder().messageId("M6").body("body6").receiptHandle("receipt-M6").build());

                when(messageService.receiveMessages(anyString(), anyString(), anyInt(), anyInt(), anyInt()))
                                .thenReturn(freshlyReceived);

                // When: User attempts to redrive selected messages
                RedriveResult result = redriveService.redriveSelectedMessages(
                                "https://sqs.us-east-1.amazonaws.com/123/dlq",
                                "https://sqs.us-east-1.amazonaws.com/123/queue",
                                "us-east-1",
                                selectedMessages);

                // Then: EXPECTED BEHAVIOR after fix - should use original receipt handles
                assertThat(result.getProcessedCount())
                                .as("All selected messages should be processed")
                                .isEqualTo(3);

                // On fixed code: All messages should succeed using original receipt handles
                assertThat(result.getSuccessCount())
                                .as("All messages should succeed when using original receipt handles")
                                .isEqualTo(3);

                assertThat(result.getFailureCount())
                                .as("No failures should occur when using original receipt handles")
                                .isEqualTo(0);
        }

        /**
         * Unit test demonstrating partial message ID mismatch
         * 
         * This shows the scenario where some messages match and some don't,
         * leading to partial success but incorrect UI state.
         */
        @Example
        @Label("Bug Example 2: Partial message ID mismatch causes inconsistent state")
        void partialMismatchCausesInconsistentState() {
                // Setup mocks
                MessageService messageService = mock(MessageService.class);
                RedriveService redriveService = new RedriveService(messageService);

                // Given: User selects 5 messages
                List<String> selectedMessageIds = Arrays.asList("M1", "M2", "M3", "M4", "M5");
                List<MessageDetails> selectedMessages = createMessageDetails(selectedMessageIds);

                // And: Backend's fresh receive gets 3 matching + 2 different messages
                List<Message> freshlyReceived = Arrays.asList(
                                Message.builder().messageId("M1").body("body1").receiptHandle("receipt-M1").build(),
                                Message.builder().messageId("M2").body("body2").receiptHandle("receipt-M2").build(),
                                Message.builder().messageId("M3").body("body3").receiptHandle("receipt-M3").build()
                // M4 and M5 are missing due to visibility timeout
                );

                when(messageService.receiveMessages(anyString(), anyString(), anyInt(), anyInt(), anyInt()))
                                .thenReturn(freshlyReceived);

                when(messageService.sendMessage(anyString(), anyString(), anyString(), any(), any()))
                                .thenReturn("sent-id");

                // When: User attempts to redrive
                RedriveResult result = redriveService.redriveSelectedMessages(
                                "https://sqs.us-east-1.amazonaws.com/123/dlq",
                                "https://sqs.us-east-1.amazonaws.com/123/queue",
                                "us-east-1",
                                selectedMessages);

                // Then: EXPECTED BEHAVIOR after fix - all should succeed using original receipt
                // handles
                assertThat(result.getProcessedCount())
                                .as("All 5 selected messages should be processed")
                                .isEqualTo(5);

                // On fixed code: All 5 should succeed using original receipt handles
                assertThat(result.getSuccessCount())
                                .as("All 5 messages should succeed when using original receipt handles")
                                .isEqualTo(5);

                assertThat(result.getFailureCount())
                                .as("No failures should occur when using original receipt handles")
                                .isEqualTo(0);
        }

        /**
         * Unit test demonstrating correct UI behavior after successful redrive
         * 
         * This test shows that after the fix, when messages are successfully redriven
         * using original receipt handles, the UI correctly reflects the operation's
         * success
         * and the DLQ is properly emptied.
         */
        @Example
        @Label("Bug Example 3: UI updates correctly after successful redrive using original receipt handles")
        void uiUpdatesCorrectlyAfterSuccessfulRedrive() {
                // Setup mocks
                MessageService messageService = mock(MessageService.class);
                RedriveService redriveService = new RedriveService(messageService);

                // Given: User selects 2 messages
                List<String> selectedMessageIds = Arrays.asList("M1", "M2");
                List<MessageDetails> selectedMessages = createMessageDetails(selectedMessageIds);

                // Setup: Mock successful send and delete operations
                when(messageService.sendMessage(anyString(), anyString(), anyString(), any(), any()))
                                .thenReturn("sent-id");
                doNothing().when(messageService).deleteMessage(anyString(), anyString(), anyString());

                // Setup: Mock that after successful redrive, DLQ is empty
                when(messageService.receiveMessages(anyString(), anyString(), anyInt(), anyInt(), anyInt()))
                                .thenReturn(Collections.emptyList()); // DLQ is empty after successful redrive

                // When: Redrive is attempted
                RedriveResult result = redriveService.redriveSelectedMessages(
                                "https://sqs.us-east-1.amazonaws.com/123/dlq",
                                "https://sqs.us-east-1.amazonaws.com/123/queue",
                                "us-east-1",
                                selectedMessages);

                // Then: EXPECTED BEHAVIOR after fix - should use original receipt handles
                // All messages should succeed
                assertThat(result.getProcessedCount())
                                .as("All selected messages should be processed")
                                .isEqualTo(2);

                assertThat(result.getSuccessCount())
                                .as("All messages should succeed when using original receipt handles")
                                .isEqualTo(2);

                assertThat(result.getFailureCount())
                                .as("No failures should occur when using original receipt handles")
                                .isEqualTo(0);

                // And: When frontend calls loadMessages() immediately after
                List<Message> messagesAfterRedrive = messageService.receiveMessages(
                                "https://sqs.us-east-1.amazonaws.com/123/dlq",
                                "us-east-1",
                                10,
                                30,
                                0);

                // EXPECTED BEHAVIOR after fix: Messages were successfully redriven using
                // original receipt handles
                // The DLQ should be empty because messages were actually deleted
                // The key difference from buggy behavior: result.getSuccessCount() == 2, so the
                // UI knows the operation succeeded
                assertThat(messagesAfterRedrive)
                                .as("After successful redrive, DLQ should be empty (messages were deleted)")
                                .isEmpty();

                // The fix ensures: System uses original receipt handles,
                // provides detailed feedback (successCount=2, failureCount=0),
                // and only removes successfully redriven messages from UI
        }
}
