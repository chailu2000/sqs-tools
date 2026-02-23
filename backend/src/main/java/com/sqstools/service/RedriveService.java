package com.sqstools.service;

import com.sqstools.controller.RedriveController.MessageDetails;
import com.sqstools.model.RedriveResult;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.model.Message;
import software.amazon.awssdk.services.sqs.model.MessageAttributeValue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RedriveService {

    private final MessageService messageService;

    public RedriveService(MessageService messageService) {
        this.messageService = messageService;
    }

    public RedriveResult redriveMessages(String dlqUrl, String mainQueueUrl,
            String region, Integer maxMessages, boolean redriveAll) {
        RedriveResult result = new RedriveResult();
        int messagesToProcess = redriveAll ? Integer.MAX_VALUE : (maxMessages != null ? maxMessages : 1);
        int processed = 0;

        while (processed < messagesToProcess) {
            // Receive messages from DLQ
            List<Message> messages = messageService.receiveMessages(
                    dlqUrl, region, Math.min(10, messagesToProcess - processed), null, 0);

            if (messages.isEmpty()) {
                break;
            }

            for (Message message : messages) {
                processed++;
                result.setProcessedCount(processed);

                try {
                    // Send to main queue
                    Map<String, MessageAttributeValue> attributes = message.messageAttributes();
                    messageService.sendMessage(mainQueueUrl, region, message.body(), attributes, null);

                    // Delete from DLQ only if send succeeded
                    messageService.deleteMessage(dlqUrl, region, message.receiptHandle());

                    result.setSuccessCount(result.getSuccessCount() + 1);
                    result.addSuccess(message.messageId());
                } catch (Exception e) {
                    result.setFailureCount(result.getFailureCount() + 1);
                    result.addError(message.messageId(), e.getMessage());
                }
            }
        }

        return result;
    }

    public RedriveResult redriveSelectedMessages(String dlqUrl, String mainQueueUrl,
            String region, List<MessageDetails> messages) {
        RedriveResult result = new RedriveResult();

        // Use receipt handles from the request directly (no need to re-receive from
        // DLQ)
        for (MessageDetails messageDetails : messages) {
            result.setProcessedCount(result.getProcessedCount() + 1);

            try {
                // Convert message attributes from Map<String, Object> to Map<String,
                // MessageAttributeValue>
                Map<String, MessageAttributeValue> attributes = convertMessageAttributes(
                        messageDetails.getMessageAttributes());

                // Send to main queue
                messageService.sendMessage(mainQueueUrl, region, messageDetails.getBody(), attributes, null);

                // Delete from DLQ only if send succeeded (atomic operation)
                messageService.deleteMessage(dlqUrl, region, messageDetails.getReceiptHandle());

                result.setSuccessCount(result.getSuccessCount() + 1);
                result.addSuccess(messageDetails.getMessageId());
            } catch (Exception e) {
                result.setFailureCount(result.getFailureCount() + 1);
                result.addError(messageDetails.getMessageId(), e.getMessage());
            }
        }

        return result;
    }

    private Map<String, MessageAttributeValue> convertMessageAttributes(Map<String, Object> attributes) {
        if (attributes == null || attributes.isEmpty()) {
            return new HashMap<>();
        }

        Map<String, MessageAttributeValue> converted = new HashMap<>();
        for (Map.Entry<String, Object> entry : attributes.entrySet()) {
            if (entry.getValue() instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> attrMap = (Map<String, Object>) entry.getValue();
                String dataType = (String) attrMap.get("dataType");
                String stringValue = (String) attrMap.get("stringValue");

                if (dataType != null && stringValue != null) {
                    MessageAttributeValue attributeValue = MessageAttributeValue.builder()
                            .dataType(dataType)
                            .stringValue(stringValue)
                            .build();
                    converted.put(entry.getKey(), attributeValue);
                }
            }
        }
        return converted;
    }

}
