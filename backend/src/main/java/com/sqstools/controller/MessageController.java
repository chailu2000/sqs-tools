package com.sqstools.controller;

import com.sqstools.model.QueueConfiguration;
import com.sqstools.service.ConfigurationService;
import com.sqstools.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.sqs.model.Message;
import software.amazon.awssdk.services.sqs.model.MessageAttributeValue;

import java.util.*;

@RestController
@RequestMapping("/api/queues/{queueId}/messages")
public class MessageController {

    private final MessageService messageService;
    private final ConfigurationService configService;

    public MessageController(MessageService messageService, ConfigurationService configService) {
        this.messageService = messageService;
        this.configService = configService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> receiveMessages(
            @PathVariable String queueId,
            @RequestParam(required = false) Integer maxMessages,
            @RequestParam(required = false) Integer visibilityTimeout,
            @RequestParam(required = false) Integer waitTimeSeconds) {

        QueueConfiguration config = configService.loadQueue(queueId)
                .orElseThrow(() -> new RuntimeException("Queue not found"));

        List<Message> messages = messageService.receiveMessages(
                config.getQueueUrl(),
                config.getRegion(),
                maxMessages,
                visibilityTimeout,
                waitTimeSeconds);

        List<Map<String, Object>> response = new ArrayList<>();
        for (Message message : messages) {
            Map<String, Object> messageMap = new HashMap<>();
            messageMap.put("messageId", message.messageId());
            messageMap.put("body", message.body());
            messageMap.put("bodyFormatted", messageService.prettyPrintJson(message.body()));
            messageMap.put("receiptHandle", message.receiptHandle());
            messageMap.put("attributes", message.attributes());

            // Convert MessageAttributeValue to simple map
            Map<String, Map<String, String>> simpleAttributes = new HashMap<>();
            if (message.messageAttributes() != null) {
                for (Map.Entry<String, MessageAttributeValue> entry : message.messageAttributes().entrySet()) {
                    Map<String, String> attrMap = new HashMap<>();
                    attrMap.put("dataType", entry.getValue().dataType());
                    attrMap.put("stringValue", entry.getValue().stringValue());
                    if (entry.getValue().binaryValue() != null) {
                        attrMap.put("binaryValue", entry.getValue().binaryValue().asUtf8String());
                    }
                    simpleAttributes.put(entry.getKey(), attrMap);
                }
            }
            messageMap.put("messageAttributes", simpleAttributes);
            messageMap.put("md5OfBody", message.md5OfBody());
            response.add(messageMap);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> sendMessage(
            @PathVariable String queueId,
            @RequestBody SendMessageRequest request) {

        QueueConfiguration config = configService.loadQueue(queueId)
                .orElseThrow(() -> new RuntimeException("Queue not found"));

        // Convert DTO to AWS SDK MessageAttributeValue
        Map<String, MessageAttributeValue> awsAttributes = null;
        if (request.getAttributes() != null && !request.getAttributes().isEmpty()) {
            awsAttributes = new HashMap<>();
            for (Map.Entry<String, MessageAttributeDto> entry : request.getAttributes().entrySet()) {
                MessageAttributeDto dto = entry.getValue();
                MessageAttributeValue.Builder builder = MessageAttributeValue.builder()
                        .dataType(dto.getDataType());

                if (dto.getStringValue() != null) {
                    builder.stringValue(dto.getStringValue());
                }
                if (dto.getBinaryValue() != null) {
                    builder.binaryValue(software.amazon.awssdk.core.SdkBytes.fromUtf8String(dto.getBinaryValue()));
                }

                awsAttributes.put(entry.getKey(), builder.build());
            }
        }

        String messageId = messageService.sendMessage(
                config.getQueueUrl(),
                config.getRegion(),
                request.getBody(),
                awsAttributes,
                request.getDelaySeconds());

        Map<String, Object> response = new HashMap<>();
        response.put("messageId", messageId);
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> deleteMessage(
            @PathVariable String queueId,
            @RequestParam String receiptHandle) {

        QueueConfiguration config = configService.loadQueue(queueId)
                .orElseThrow(() -> new RuntimeException("Queue not found"));

        messageService.deleteMessage(config.getQueueUrl(), config.getRegion(), receiptHandle);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/visibility")
    public ResponseEntity<Map<String, Object>> changeVisibility(
            @PathVariable String queueId,
            @RequestParam String receiptHandle,
            @RequestBody ChangeVisibilityRequest request) {

        QueueConfiguration config = configService.loadQueue(queueId)
                .orElseThrow(() -> new RuntimeException("Queue not found"));

        messageService.changeMessageVisibility(
                config.getQueueUrl(),
                config.getRegion(),
                receiptHandle,
                request.getVisibilityTimeout());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    public static class SendMessageRequest {
        private String body;
        private Map<String, MessageAttributeDto> attributes;
        private Integer delaySeconds;

        public String getBody() {
            return body;
        }

        public void setBody(String body) {
            this.body = body;
        }

        public Map<String, MessageAttributeDto> getAttributes() {
            return attributes;
        }

        public void setAttributes(Map<String, MessageAttributeDto> attributes) {
            this.attributes = attributes;
        }

        public Integer getDelaySeconds() {
            return delaySeconds;
        }

        public void setDelaySeconds(Integer delaySeconds) {
            this.delaySeconds = delaySeconds;
        }
    }

    public static class MessageAttributeDto {
        private String dataType;
        private String stringValue;
        private String binaryValue;

        public String getDataType() {
            return dataType;
        }

        public void setDataType(String dataType) {
            this.dataType = dataType;
        }

        public String getStringValue() {
            return stringValue;
        }

        public void setStringValue(String stringValue) {
            this.stringValue = stringValue;
        }

        public String getBinaryValue() {
            return binaryValue;
        }

        public void setBinaryValue(String binaryValue) {
            this.binaryValue = binaryValue;
        }
    }

    public static class ChangeVisibilityRequest {
        private Integer visibilityTimeout;

        public Integer getVisibilityTimeout() {
            return visibilityTimeout;
        }

        public void setVisibilityTimeout(Integer visibilityTimeout) {
            this.visibilityTimeout = visibilityTimeout;
        }
    }
}
