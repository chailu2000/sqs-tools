package com.sqstools.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import software.amazon.awssdk.services.sqs.model.*;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(QueueDoesNotExistException.class)
    public ResponseEntity<ErrorResponse> handleQueueNotFound(QueueDoesNotExistException e) {
        logger.error("Queue not found", e);
        ErrorResponse error = new ErrorResponse(
                "QUEUE_NOT_FOUND",
                "Queue not found. Verify the queue name and your AWS permissions.",
                redactSensitiveInfo(e.getMessage())
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(SqsException.class)
    public ResponseEntity<ErrorResponse> handleSqsException(SqsException e) {
        logger.error("AWS SQS error", e);
        
        if (e.awsErrorDetails() != null) {
            String errorCode = e.awsErrorDetails().errorCode();
            
            if ("AccessDenied".equals(errorCode) || "UnauthorizedOperation".equals(errorCode)) {
                ErrorResponse error = new ErrorResponse(
                        "ACCESS_DENIED",
                        "Access denied. Check your AWS credentials and permissions.",
                        redactSensitiveInfo(e.getMessage())
                );
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }
            
            if ("Throttling".equals(errorCode) || "RequestLimitExceeded".equals(errorCode)) {
                ErrorResponse error = new ErrorResponse(
                        "THROTTLED",
                        "Request throttled. Please try again later.",
                        redactSensitiveInfo(e.getMessage())
                );
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error);
            }
        }
        
        ErrorResponse error = new ErrorResponse(
                "AWS_ERROR",
                "AWS service error: " + e.getMessage(),
                redactSensitiveInfo(e.getMessage())
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    @ExceptionHandler(PurgeQueueInProgressException.class)
    public ResponseEntity<ErrorResponse> handlePurgeInProgress(PurgeQueueInProgressException e) {
        logger.warn("Purge queue in progress", e);
        ErrorResponse error = new ErrorResponse(
                "PURGE_IN_PROGRESS",
                "Queue was recently purged. AWS allows purge operations once every 60 seconds.",
                null
        );
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleValidationError(IllegalArgumentException e) {
        logger.warn("Validation error", e);
        ErrorResponse error = new ErrorResponse(
                "VALIDATION_ERROR",
                e.getMessage(),
                null
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException e) {
        logger.error("Runtime error", e);
        ErrorResponse error = new ErrorResponse(
                "INTERNAL_ERROR",
                "An error occurred: " + e.getMessage(),
                redactSensitiveInfo(e.getMessage())
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception e) {
        logger.error("Unexpected error", e);
        ErrorResponse error = new ErrorResponse(
                "UNEXPECTED_ERROR",
                "An unexpected error occurred",
                redactSensitiveInfo(e.getMessage())
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    private String redactSensitiveInfo(String message) {
        if (message == null) return null;
        
        // Redact AWS account IDs
        message = message.replaceAll("\\d{12}", "************");
        
        // Redact access keys
        message = message.replaceAll("AKIA[0-9A-Z]{16}", "AKIA****************");
        
        return message;
    }

    public static class ErrorResponse {
        private String errorCode;
        private String message;
        private String details;

        public ErrorResponse(String errorCode, String message, String details) {
            this.errorCode = errorCode;
            this.message = message;
            this.details = details;
        }

        public String getErrorCode() { return errorCode; }
        public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }
    }
}
