package com.sqstools.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "queues")
public class QueueEntity {

    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String queueUrl;

    @Column(nullable = false)
    private String queueName;

    @Column(nullable = false)
    private String region;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String attributes;

    private String dlqUrl;
    private String dlqName;

    @Column(nullable = false)
    private String savedAt;

    public QueueEntity() {
    }

    public QueueEntity(String id, String queueUrl, String queueName, String region, 
                       String attributes, String dlqUrl, String dlqName) {
        this.id = id;
        this.queueUrl = queueUrl;
        this.queueName = queueName;
        this.region = region;
        this.attributes = attributes;
        this.dlqUrl = dlqUrl;
        this.dlqName = dlqName;
        this.savedAt = Instant.now().toString();
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

    public String getAttributes() { return attributes; }
    public void setAttributes(String attributes) { this.attributes = attributes; }

    public String getDlqUrl() { return dlqUrl; }
    public void setDlqUrl(String dlqUrl) { this.dlqUrl = dlqUrl; }

    public String getDlqName() { return dlqName; }
    public void setDlqName(String dlqName) { this.dlqName = dlqName; }

    public String getSavedAt() { return savedAt; }
    public void setSavedAt(String savedAt) { this.savedAt = savedAt; }
}
