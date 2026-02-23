package com.sqstools.repository;

import com.sqstools.entity.QueueEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QueueRepository extends JpaRepository<QueueEntity, String> {
    Optional<QueueEntity> findByQueueUrl(String queueUrl);
}
