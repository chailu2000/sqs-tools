package com.sqstools.controller;

import com.sqstools.model.QueueConfiguration;
import com.sqstools.service.ConfigurationService;
import com.sqstools.service.MessageService;
import com.sqstools.service.QueueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/queues")
public class QueueController {

    private final QueueService queueService;
    private final ConfigurationService configService;
    private final MessageService messageService;

    public QueueController(QueueService queueService, 
                          ConfigurationService configService,
                          MessageService messageService) {
        this.queueService = queueService;
        this.configService = configService;
        this.messageService = messageService;
    }

    @PostMapping
    public ResponseEntity<QueueConfiguration> addQueue(@RequestBody AddQueueRequest request) {
        try {
            String queueUrl = queueService.resolveQueueUrl(request.getIdentifier(), request.getRegion());
            String queueName = queueService.extractQueueName(queueUrl);
            System.out.println("Received add queue request for identifier: " + request.getIdentifier() + ", region: " + request.getRegion());
            Map<String, String> attributes = queueService.getQueueAttributes(queueUrl, request.getRegion());
            
            // Extract DLQ if present
            String dlqUrl = queueService.extractDlqFromAttributes(attributes).orElse(null);
            String dlqName = dlqUrl != null ? queueService.extractQueueName(dlqUrl) : null;
            
            // Convert attributes to Map<String, Object>
            Map<String, Object> attributesMap = new HashMap<>(attributes);
            
            QueueConfiguration config = new QueueConfiguration(
                    UUID.randomUUID().toString(),
                    queueUrl,
                    queueName,
                    request.getRegion(),
                    attributesMap,
                    dlqUrl,
                    dlqName,
                    null
            );
            
            QueueConfiguration saved = configService.saveQueue(config);
            System.out.println("Saved queue configuration: " + saved.getQueueName() + " (ID: " + saved.getId() + ")");
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            throw new RuntimeException("Failed to add queue: " + e.getMessage(), e);
        }
    }

    @GetMapping
    public ResponseEntity<List<QueueConfiguration>> getAllQueues() {
        return ResponseEntity.ok(configService.loadAllQueues());
    }

    @GetMapping("/{queueId}")
    public ResponseEntity<QueueConfiguration> getQueue(@PathVariable String queueId) {
        return configService.loadQueue(queueId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{queueId}/refresh")
    public ResponseEntity<QueueConfiguration> refreshQueue(@PathVariable String queueId) {
        QueueConfiguration config = configService.loadQueue(queueId)
                .orElseThrow(() -> new RuntimeException("Queue not found"));

        try {
            // Fetch fresh attributes from AWS
            Map<String, String> attributes = queueService.getQueueAttributes(config.getQueueUrl(), config.getRegion());

            // Extract DLQ if present
            String dlqUrl = queueService.extractDlqFromAttributes(attributes).orElse(null);
            String dlqName = dlqUrl != null ? queueService.extractQueueName(dlqUrl) : null;

            // Convert attributes to Map<String, Object>
            Map<String, Object> attributesMap = new HashMap<>(attributes);

            // Create updated configuration
            QueueConfiguration updatedConfig = new QueueConfiguration(
                    config.getId(),
                    config.getQueueUrl(),
                    config.getQueueName(),
                    config.getRegion(),
                    attributesMap,
                    dlqUrl,
                    dlqName,
                    config.getSavedAt()
            );

            // Save updated configuration
            QueueConfiguration saved = configService.saveQueue(updatedConfig);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            throw new RuntimeException("Failed to refresh queue: " + e.getMessage(), e);
        }
    }

    @DeleteMapping("/{queueId}")
    public ResponseEntity<Void> removeQueue(@PathVariable String queueId) {
        configService.removeQueue(queueId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{queueId}/purge")
    public ResponseEntity<Map<String, Object>> purgeQueue(@PathVariable String queueId) {
        QueueConfiguration config = configService.loadQueue(queueId)
                .orElseThrow(() -> new RuntimeException("Queue not found"));
        
        messageService.purgeQueue(config.getQueueUrl(), config.getRegion());
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Queue purged successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{queueId}/dlq/messages")
    public ResponseEntity<List<Map<String, Object>>> receiveDlqMessages(
            @PathVariable String queueId,
            @RequestParam(required = false) Integer maxMessages,
            @RequestParam(required = false) Integer visibilityTimeout) {

        QueueConfiguration config = configService.loadQueue(queueId)
                .orElseThrow(() -> new RuntimeException("Queue not found"));

        if (config.getDlqUrl() == null) {
            throw new RuntimeException("Queue does not have a DLQ configured");
        }

        List<software.amazon.awssdk.services.sqs.model.Message> messages = messageService.receiveMessages(
                config.getDlqUrl(),
                config.getRegion(),
                maxMessages,
                visibilityTimeout,
                null
        );

        List<Map<String, Object>> response = new java.util.ArrayList<>();
        for (software.amazon.awssdk.services.sqs.model.Message message : messages) {
            Map<String, Object> messageMap = new HashMap<>();
            messageMap.put("messageId", message.messageId());
            messageMap.put("body", message.body());
            messageMap.put("bodyFormatted", messageService.prettyPrintJson(message.body()));
            messageMap.put("receiptHandle", message.receiptHandle());
            messageMap.put("attributes", message.attributes());

            // Convert MessageAttributeValue to simple map
            Map<String, Map<String, String>> simpleAttributes = new HashMap<>();
            if (message.messageAttributes() != null) {
                for (Map.Entry<String, software.amazon.awssdk.services.sqs.model.MessageAttributeValue> entry : message.messageAttributes().entrySet()) {
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

    public static class AddQueueRequest {
        private String identifier;
        private String region;

        public String getIdentifier() { return identifier; }
        public void setIdentifier(String identifier) { this.identifier = identifier; }

        public String getRegion() { return region; }
        public void setRegion(String region) { this.region = region; }
    }
}
