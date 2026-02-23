package com.sqstools;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class SqsManagementToolApplication {

    private final Environment environment;

    public SqsManagementToolApplication(Environment environment) {
        this.environment = environment;
    }

    public static void main(String[] args) {
        SpringApplication.run(SqsManagementToolApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        String port = environment.getProperty("server.port", "8080");
        System.out.println("\n===========================================");
        System.out.println("SQS Management Tool is running!");
        System.out.println("Access URL: http://localhost:" + port);
        System.out.println("===========================================\n");
    }
}
