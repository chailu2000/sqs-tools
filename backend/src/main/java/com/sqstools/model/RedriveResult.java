package com.sqstools.model;

import java.util.ArrayList;
import java.util.List;

public class RedriveResult {
    private int processedCount;
    private int successCount;
    private int failureCount;
    private List<RedriveError> errors;
    private List<SuccessfulMessage> succeeded;
    private List<FailedMessage> failed;

    public RedriveResult() {
        this.errors = new ArrayList<>();
        this.succeeded = new ArrayList<>();
        this.failed = new ArrayList<>();
    }

    public int getProcessedCount() {
        return processedCount;
    }

    public void setProcessedCount(int processedCount) {
        this.processedCount = processedCount;
    }

    public int getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(int successCount) {
        this.successCount = successCount;
    }

    public int getFailureCount() {
        return failureCount;
    }

    public void setFailureCount(int failureCount) {
        this.failureCount = failureCount;
    }

    public List<RedriveError> getErrors() {
        return errors;
    }

    public void setErrors(List<RedriveError> errors) {
        this.errors = errors;
    }

    public List<SuccessfulMessage> getSucceeded() {
        return succeeded;
    }

    public void setSucceeded(List<SuccessfulMessage> succeeded) {
        this.succeeded = succeeded;
    }

    public List<FailedMessage> getFailed() {
        return failed;
    }

    public void setFailed(List<FailedMessage> failed) {
        this.failed = failed;
    }

    public void addError(String messageId, String error) {
        this.errors.add(new RedriveError(messageId, error));
        this.failed.add(new FailedMessage(messageId, error));
    }

    public void addSuccess(String messageId) {
        this.succeeded.add(new SuccessfulMessage(messageId));
    }

    public static class SuccessfulMessage {
        private String messageId;

        public SuccessfulMessage() {
        }

        public SuccessfulMessage(String messageId) {
            this.messageId = messageId;
        }

        public String getMessageId() {
            return messageId;
        }

        public void setMessageId(String messageId) {
            this.messageId = messageId;
        }
    }

    public static class FailedMessage {
        private String messageId;
        private String error;

        public FailedMessage() {
        }

        public FailedMessage(String messageId, String error) {
            this.messageId = messageId;
            this.error = error;
        }

        public String getMessageId() {
            return messageId;
        }

        public void setMessageId(String messageId) {
            this.messageId = messageId;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }
    }

    public static class RedriveError {
        private String messageId;
        private String error;

        public RedriveError() {
        }

        public RedriveError(String messageId, String error) {
            this.messageId = messageId;
            this.error = error;
        }

        public String getMessageId() {
            return messageId;
        }

        public void setMessageId(String messageId) {
            this.messageId = messageId;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }
    }
}
