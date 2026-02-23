package com.sqstools.service;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.sqstools.entity.QueueEntity;
import com.sqstools.entity.PreferenceEntity;
import com.sqstools.model.QueueConfiguration;
import com.sqstools.repository.QueueRepository;
import com.sqstools.repository.PreferenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ConfigurationService {

    private final QueueRepository queueRepository;
    private final PreferenceRepository preferenceRepository;
    private final ObjectMapper objectMapper;

    public ConfigurationService(QueueRepository queueRepository,
                                PreferenceRepository preferenceRepository,
                                ObjectMapper objectMapper) {
        this.queueRepository = queueRepository;
        this.preferenceRepository = preferenceRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public QueueConfiguration saveQueue(QueueConfiguration config) {
        // Check if a queue with the same URL already exists
        Optional<QueueEntity> existingQueue = queueRepository.findByQueueUrl(config.getQueueUrl());
        if (existingQueue.isPresent()) {
            // If it exists, return the existing configuration (idempotent save)
            return entityToModel(existingQueue.get());
        }

        try {
            String id = config.getId() != null ? config.getId() : UUID.randomUUID().toString();
            String attributesJson = objectMapper.writeValueAsString(config.getAttributes());

            QueueEntity entity = new QueueEntity(
                    id,
                    config.getQueueUrl(),
                    config.getQueueName(),
                    config.getRegion(),
                    attributesJson,
                    config.getDlqUrl(),
                    config.getDlqName()
            );

            QueueEntity saved = queueRepository.save(entity);
            return entityToModel(saved);
        } catch (JacksonException e) {
            throw new RuntimeException("Failed to serialize queue attributes", e);
        }
    }

    public List<QueueConfiguration> loadAllQueues() {
        return queueRepository.findAll().stream()
                .map(this::entityToModel)
                .collect(Collectors.toList());
    }

    public Optional<QueueConfiguration> loadQueue(String id) {
        return queueRepository.findById(id)
                .map(this::entityToModel);
    }

    @Transactional
    public void removeQueue(String id) {
        queueRepository.deleteById(id);
    }

    @Transactional
    public QueueConfiguration updateQueue(String id, QueueConfiguration config) {
        QueueEntity entity = queueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Queue not found: " + id));
        
        try {
            if (config.getQueueUrl() != null) entity.setQueueUrl(config.getQueueUrl());
            if (config.getQueueName() != null) entity.setQueueName(config.getQueueName());
            if (config.getRegion() != null) entity.setRegion(config.getRegion());
            if (config.getAttributes() != null) {
                entity.setAttributes(objectMapper.writeValueAsString(config.getAttributes()));
            }
            if (config.getDlqUrl() != null) entity.setDlqUrl(config.getDlqUrl());
            if (config.getDlqName() != null) entity.setDlqName(config.getDlqName());
            
            QueueEntity updated = queueRepository.save(entity);
            return entityToModel(updated);
        } catch (JacksonException e) {
            throw new RuntimeException("Failed to serialize queue attributes", e);
        }
    }

    public void savePreference(String key, String value) {
        preferenceRepository.save(new PreferenceEntity(key, value));
    }

    public Optional<String> getPreference(String key) {
        return preferenceRepository.findById(key)
                .map(PreferenceEntity::getValue);
    }

    @SuppressWarnings("unchecked")
    private QueueConfiguration entityToModel(QueueEntity entity) {
        try {
            Map<String, Object> attributes = objectMapper.readValue(entity.getAttributes(), Map.class);
            return new QueueConfiguration(
                    entity.getId(),
                    entity.getQueueUrl(),
                    entity.getQueueName(),
                    entity.getRegion(),
                    attributes,
                    entity.getDlqUrl(),
                    entity.getDlqName(),
                    entity.getSavedAt()
            );
        } catch (JacksonException e) {
            throw new RuntimeException("Failed to deserialize queue attributes", e);
        }
    }
}
