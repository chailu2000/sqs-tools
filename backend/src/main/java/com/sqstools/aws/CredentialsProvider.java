package com.sqstools.aws;

import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.*;
import software.amazon.awssdk.profiles.ProfileFile;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sts.StsClient;
import software.amazon.awssdk.services.sts.model.GetCallerIdentityRequest;
import software.amazon.awssdk.services.sts.model.GetCallerIdentityResponse;

import java.nio.file.Paths;
import java.util.Optional;

@Component
public class CredentialsProvider {

    private AwsCredentialsProvider credentialsProvider;
    private String activeProfile;

    public CredentialsProvider() {
        this.credentialsProvider = resolveCredentials();
    }

    private AwsCredentialsProvider resolveCredentials() {
        // Priority: Environment variables > AWS profile > Default chain
        if (hasEnvironmentVariables()) {
            return EnvironmentVariableCredentialsProvider.create();
        }
        
        if (activeProfile != null) {
            return ProfileCredentialsProvider.builder()
                    .profileName(activeProfile)
                    .build();
        }
        
        return DefaultCredentialsProvider.create();
    }

    private boolean hasEnvironmentVariables() {
        return System.getenv("AWS_ACCESS_KEY_ID") != null 
                && System.getenv("AWS_SECRET_ACCESS_KEY") != null;
    }

    public AwsCredentialsProvider getCredentialsProvider() {
        return credentialsProvider;
    }

    public void setActiveProfile(String profileName) {
        this.activeProfile = profileName;
        this.credentialsProvider = resolveCredentials();
    }

    public String getActiveProfile() {
        return activeProfile;
    }

    public boolean validateCredentials() {
        try {
            AwsCredentials credentials = credentialsProvider.resolveCredentials();
            return credentials != null 
                    && credentials.accessKeyId() != null 
                    && !credentials.accessKeyId().isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    public Optional<String> getAccountId() {
        try (StsClient stsClient = StsClient.builder()
                .credentialsProvider(credentialsProvider)
                .region(Region.US_EAST_1)
                .build()) {
            
            GetCallerIdentityResponse response = stsClient.getCallerIdentity(
                    GetCallerIdentityRequest.builder().build()
            );
            return Optional.of(response.account());
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public String getCredentialMethod() {
        if (hasEnvironmentVariables()) {
            return "environment";
        } else if (activeProfile != null) {
            return "profile:" + activeProfile;
        }
        return "default";
    }
}
