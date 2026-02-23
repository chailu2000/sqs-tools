package com.sqstools.aws;

import org.springframework.stereotype.Component;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sqs.SqsClient;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SQSClientFactory {

    private final CredentialsProvider credentialsProvider;
    private final Map<String, SqsClient> clientCache = new ConcurrentHashMap<>();

    public SQSClientFactory(CredentialsProvider credentialsProvider) {
        this.credentialsProvider = credentialsProvider;
    }

    public SqsClient getClient(String regionName) {
        return clientCache.computeIfAbsent(regionName, this::createClient);
    }

    private SqsClient createClient(String regionName) {
        return SqsClient.builder()
                .region(Region.of(regionName))
                .credentialsProvider(credentialsProvider.getCredentialsProvider())
                .build();
    }

    public void clearCache() {
        clientCache.values().forEach(SqsClient::close);
        clientCache.clear();
    }

    public void refreshClients() {
        clearCache();
    }
}
