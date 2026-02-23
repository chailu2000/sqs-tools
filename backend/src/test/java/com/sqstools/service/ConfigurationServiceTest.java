package com.sqstools.service;

import tools.jackson.databind.ObjectMapper;
import com.sqstools.entity.QueueEntity;
import com.sqstools.model.QueueConfiguration;
import com.sqstools.repository.QueueRepository;
import com.sqstools.repository.PreferenceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConfigurationServiceTest {

    @Mock
    private QueueRepository queueRepository;

    @Mock
    private PreferenceRepository preferenceRepository;

    private ConfigurationService configService;

    @BeforeEach
    void setUp() {
        configService = new ConfigurationService(queueRepository, preferenceRepository, new ObjectMapper());
    }

    @Test
    void shouldSaveQueueConfiguration() throws Exception {
        // Given
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("VisibilityTimeout", "30");
        
        QueueConfiguration config = new QueueConfiguration(
                null,
                "https://sqs.us-east-1.amazonaws.com/123/queue",
                "queue",
                "us-east-1",
                attributes,
                null,
                null,
                null
        );

        when(queueRepository.save(any(QueueEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        QueueConfiguration saved = configService.saveQueue(config);

        // Then
        assertThat(saved).isNotNull();
        assertThat(saved.getId()).isNotNull();
        verify(queueRepository).save(any(QueueEntity.class));
    }

    @Test
    void shouldLoadAllQueues() throws Exception {
        // Given
        QueueEntity entity = new QueueEntity(
                "id-1",
                "https://sqs.us-east-1.amazonaws.com/123/queue",
                "queue",
                "us-east-1",
                "{\"VisibilityTimeout\":\"30\"}",
                null,
                null
        );
        
        when(queueRepository.findAll()).thenReturn(List.of(entity));

        // When
        List<QueueConfiguration> configs = configService.loadAllQueues();

        // Then
        assertThat(configs).hasSize(1);
        assertThat(configs.get(0).getQueueName()).isEqualTo("queue");
    }

    @Test
    void shouldLoadQueueById() throws Exception {
        // Given
        QueueEntity entity = new QueueEntity(
                "id-1",
                "https://sqs.us-east-1.amazonaws.com/123/queue",
                "queue",
                "us-east-1",
                "{\"VisibilityTimeout\":\"30\"}",
                null,
                null
        );
        
        when(queueRepository.findById("id-1")).thenReturn(Optional.of(entity));

        // When
        Optional<QueueConfiguration> config = configService.loadQueue("id-1");

        // Then
        assertThat(config).isPresent();
        assertThat(config.get().getQueueName()).isEqualTo("queue");
    }

    @Test
    void shouldRemoveQueue() {
        // When
        configService.removeQueue("id-1");

        // Then
        verify(queueRepository).deleteById("id-1");
    }

    @Test
    void shouldUpdateQueue() throws Exception {
        // Given
        QueueEntity existingEntity = new QueueEntity(
                "id-1",
                "https://sqs.us-east-1.amazonaws.com/123/queue",
                "queue",
                "us-east-1",
                "{\"VisibilityTimeout\":\"30\"}",
                null,
                null
        );
        
        when(queueRepository.findById("id-1")).thenReturn(Optional.of(existingEntity));
        when(queueRepository.save(any(QueueEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> newAttributes = new HashMap<>();
        newAttributes.put("VisibilityTimeout", "60");
        
        QueueConfiguration updateConfig = new QueueConfiguration();
        updateConfig.setAttributes(newAttributes);

        // When
        QueueConfiguration updated = configService.updateQueue("id-1", updateConfig);

        // Then
        assertThat(updated).isNotNull();
        verify(queueRepository).save(any(QueueEntity.class));
    }
}
