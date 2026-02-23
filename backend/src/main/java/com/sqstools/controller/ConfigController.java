package com.sqstools.controller;

import com.sqstools.aws.CredentialsProvider;
import com.sqstools.aws.SQSClientFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.profiles.ProfileFile;
import software.amazon.awssdk.profiles.ProfileProperty;

import java.nio.file.Paths;
import java.io.File;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    private final CredentialsProvider credentialsProvider;
    private final SQSClientFactory clientFactory;

    public ConfigController(CredentialsProvider credentialsProvider, SQSClientFactory clientFactory) {
        this.credentialsProvider = credentialsProvider;
        this.clientFactory = clientFactory;
    }


    @GetMapping("/profiles")
    public ResponseEntity<List<String>> getProfiles() {
        try {
            ProfileFile profileFile = ProfileFile.defaultProfileFile(); // Reverted to original
            List<String> profiles = profileFile.profiles().keySet().stream()
                    .sorted()
                    .collect(Collectors.toList());
            System.out.println("Discovered AWS Profiles: " + profiles); // Added debug logging
            return ResponseEntity.ok(profiles);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Error discovering AWS profiles: " + e.getMessage()); // Added debug logging
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @PostMapping("/profile")
    public ResponseEntity<Map<String, Object>> setProfile(@RequestBody SetProfileRequest request) {
        credentialsProvider.setActiveProfile(request.getProfileName());
        clientFactory.refreshClients();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("activeProfile", request.getProfileName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test-credentials")
    public ResponseEntity<Map<String, Object>> testCredentials() {
        boolean isValid = credentialsProvider.validateCredentials();
        Map<String, Object> response = new HashMap<>();
        response.put("valid", isValid);

        if (isValid) {
            try {
                // Use STS to get caller identity and verify credentials
                Optional<String> accountId = credentialsProvider.getAccountId();
                accountId.ifPresent(s -> response.put("accountId", s));
                response.put("method", credentialsProvider.getCredentialMethod());
            } catch (Exception e) {
                // If STS call fails, credentials might still be valid for some operations,
                // but we report the error for better user feedback.
                response.put("valid", false);
                response.put("error", "Failed to get caller identity: " + e.getMessage());
            }
        } else {
            response.put("error", "Invalid or no AWS credentials configured.");
        }
        return ResponseEntity.ok(response);
    }



    static class SetProfileRequest {
        private String profileName;

        public String getProfileName() {
            return profileName;
        }

        public void setProfileName(String profileName) {
            this.profileName = profileName;
        }
    }
}