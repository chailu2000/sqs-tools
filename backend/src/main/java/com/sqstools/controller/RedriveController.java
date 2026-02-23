package com.sqstools.controller;

import com.sqstools.model.QueueConfiguration;
import com.sqstools.model.RedriveResult;
import com.sqstools.service.ConfigurationService;
import com.sqstools.service.RedriveService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/queues/{queueId}/redrive")
public class RedriveController {

    private final RedriveService redriveService;
    private final ConfigurationService configService;

    public RedriveController(RedriveService redriveService, ConfigurationService configService) {
        this.redriveService = redriveService;
        this.configService = configService;
    }

    @PostMapping
    public ResponseEntity<RedriveResult> redriveMessages(
            @PathVariable String queueId,
            @RequestBody RedriveRequest request) {

        QueueConfiguration config = configService.loadQueue(queueId)
                .orElseThrow(() -> new RuntimeException("Queue not found"));

        if (config.getDlqUrl() == null) {
            throw new RuntimeException("Queue does not have a DLQ configured");
        }

        RedriveResult result = redriveService.redriveMessages(
                config.getDlqUrl(),
                config.getQueueUrl(),
                config.getRegion(),
                request.getMaxMessages(),
                request.isRedriveAll());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/selective")
    public ResponseEntity<RedriveResult> redriveSelectedMessages(
            @PathVariable String queueId,
            @RequestBody SelectiveRedriveRequest request) {

        QueueConfiguration config = configService.loadQueue(queueId)
                .orElseThrow(() -> new RuntimeException("Queue not found"));

        if (config.getDlqUrl() == null) {
            throw new RuntimeException("Queue does not have a DLQ configured");
        }

        // Validate that all messages have receipt handles
        if (request.getMessages() == null || request.getMessages().isEmpty()) {
            throw new RuntimeException("No messages provided for selective redrive");
        }

        for (MessageDetails message : request.getMessages()) {
            if (message.getReceiptHandle() == null || message.getReceiptHandle().isEmpty()) {
                throw new RuntimeException("Receipt handle is required for message: " + message.getMessageId());
            }
        }

        RedriveResult result = redriveService.redriveSelectedMessages(
                config.getDlqUrl(),
                config.getQueueUrl(),
                config.getRegion(),
                request.getMessages());

        return ResponseEntity.ok(result);
    }

    public static class SelectiveRedriveRequest {
        private List<MessageDetails> messages;

        public List<MessageDetails> getMessages() {
            return messages;
        }

        public void setMessages(List<MessageDetails> messages) {
            this.messages = messages;
        }
    }

    public static class MessageDetails {
        private String messageId;
        private String receiptHandle;
        private String body;
        private Map<String, Object> messageAttributes;

        public String getMessageId() {
            return messageId;
        }

        public void setMessageId(String messageId) {
            this.messageId = messageId;
        }

        public String getReceiptHandle() {
            return receiptHandle;
        }

        public void setReceiptHandle(String receiptHandle) {
            this.receiptHandle = receiptHandle;
        }

        public String getBody() {
            return body;
        }

        public void setBody(String body) {
            this.body = body;
        }

        public Map<String, Object> getMessageAttributes() {
            return messageAttributes;
        }

        public void setMessageAttributes(Map<String, Object> messageAttributes) {
            this.messageAttributes = messageAttributes;
        }
    }

    public static class RedriveRequest {
        private Integer maxMessages;
        private boolean redriveAll;

        public Integer getMaxMessages() {
            return maxMessages;
        }

        public void setMaxMessages(Integer maxMessages) {
            this.maxMessages = maxMessages;
        }

        public boolean isRedriveAll() {
            return redriveAll;
        }

        public void setRedriveAll(boolean redriveAll) {
            this.redriveAll = redriveAll;
        }
    }
}
