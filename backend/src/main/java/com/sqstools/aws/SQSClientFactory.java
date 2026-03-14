package com.sqstools.aws;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.SqsClientBuilder;

import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SQSClientFactory {

    private final CredentialsProvider credentialsProvider;
    private final Map<String, SqsClient> clientCache = new ConcurrentHashMap<>();

    @Value("${aws.endpoint-url:}")
    private String endpointUrl;

    public SQSClientFactory(CredentialsProvider credentialsProvider) {
        this.credentialsProvider = credentialsProvider;
    }

    public SqsClient getClient(String regionName) {
        return clientCache.computeIfAbsent(regionName, this::createClient);
    }

    private SqsClient createClient(String regionName) {
        SqsClientBuilder builder = SqsClient.builder()
                .region(Region.of(regionName))
                .credentialsProvider(credentialsProvider.getCredentialsProvider());

        if (endpointUrl != null && !endpointUrl.isBlank()) {
            builder.endpointOverride(URI.create(endpointUrl));
        }

        return builder.build();
    }

    public void clearCache() {
        clientCache.values().forEach(SqsClient::close);
        clientCache.clear();
    }

    public void refreshClients() {
        clearCache();
    }
}
