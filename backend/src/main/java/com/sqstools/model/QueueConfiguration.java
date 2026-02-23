package com.sqstools.model;

import java.util.Map;

public class QueueConfiguration {
    private String id;
    private String queueUrl;
    private String queueName;
    private String region;
    private Map<String, Object> attributes;
    private String dlqUrl;
    private String dlqName;
    private String savedAt;

    public QueueConfiguration() {
    }

    public QueueConfiguration(String id, String queueUrl, String queueName, String region,
                              Map<String, Object> attributes, String dlqUrl, String dlqName, String savedAt) {
        this.id = id;
        this.queueUrl = queueUrl;
        this.queueName = queueName;
        this.region = region;
        this.attributes = attributes;
        this.dlqUrl = dlqUrl;
        this.dlqName = dlqName;
        this.savedAt = savedAt;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getQueueUrl() { return queueUrl; }
    public void setQueueUrl(String queueUrl) { this.queueUrl = queueUrl; }

    public String getQueueName() { return queueName; }
    public void setQueueName(String queueName) { this.queueName = queueName; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public Map<String, Object> getAttributes() { return attributes; }
    public void setAttributes(Map<String, Object> attributes) { this.attributes = attributes; }

    public String getDlqUrl() { return dlqUrl; }
    public void setDlqUrl(String dlqUrl) { this.dlqUrl = dlqUrl; }

    public String getDlqName() { return dlqName; }
    public void setDlqName(String dlqName) { this.dlqName = dlqName; }

    public String getSavedAt() { return savedAt; }
    public void setSavedAt(String savedAt) { this.savedAt = savedAt; }
}
