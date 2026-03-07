/**
 * Logger utility that automatically sanitizes sensitive information before logging.
 * 
 * This module provides a safe logging interface that ensures AWS credentials
 * and other sensitive data are never exposed in console output or debug logs.
 */

import * as vscode from 'vscode';
import { sanitizeForLog, sanitizeError } from './sanitizer';

/**
 * Safe logger that sanitizes all output to prevent credential leakage
 * 
 * NOTE: Console logging is disabled in production to reduce noise.
 * To enable logging for debugging, set the environment variable:
 * VSCODE_SQS_DEBUG=true
 */
export class SafeLogger {
    private static isDebugEnabled(): boolean {
        return process.env.VSCODE_SQS_DEBUG === 'true';
    }

    /**
     * Logs an informational message with sanitized data
     */
    static log(...args: any[]): void {
        if (!this.isDebugEnabled()) return;
        const sanitizedArgs = args.map(arg => sanitizeForLog(arg));
        console.log(...sanitizedArgs);
    }

    /**
     * Logs an error message with sanitized data
     */
    static error(...args: any[]): void {
        if (!this.isDebugEnabled()) return;
        const sanitizedArgs = args.map(arg => {
            if (arg instanceof Error) {
                return sanitizeError(arg);
            }
            return sanitizeForLog(arg);
        });
        console.error(...sanitizedArgs);
    }

    /**
     * Logs a warning message with sanitized data
     */
    static warn(...args: any[]): void {
        if (!this.isDebugEnabled()) return;
        const sanitizedArgs = args.map(arg => sanitizeForLog(arg));
        console.warn(...sanitizedArgs);
    }

    /**
     * Logs an info message with sanitized data
     */
    static info(...args: any[]): void {
        if (!this.isDebugEnabled()) return;
        const sanitizedArgs = args.map(arg => sanitizeForLog(arg));
        console.info(...sanitizedArgs);
    }

    /**
     * Logs a debug message with sanitized data
     */
    static debug(...args: any[]): void {
        if (!this.isDebugEnabled()) return;
        const sanitizedArgs = args.map(arg => sanitizeForLog(arg));
        console.debug(...sanitizedArgs);
    }
}

/**
 * Convenience exports for direct usage
 */
export const log = SafeLogger.log.bind(SafeLogger);
export const error = SafeLogger.error.bind(SafeLogger);
export const warn = SafeLogger.warn.bind(SafeLogger);
export const info = SafeLogger.info.bind(SafeLogger);
export const debug = SafeLogger.debug.bind(SafeLogger);

/**
 * OutputLogger writes to VS Code's Output panel with timestamps.
 * Provides a dedicated channel for the SQS Management Tool extension.
 */
export class OutputLogger {
    private channel: vscode.OutputChannel;
    private static instance: OutputLogger | null = null;

    private constructor() {
        this.channel = vscode.window.createOutputChannel('SQS Management Tool');
    }

    /**
     * Gets the singleton instance of OutputLogger
     */
    static getInstance(): OutputLogger {
        if (!OutputLogger.instance) {
            OutputLogger.instance = new OutputLogger();
        }
        return OutputLogger.instance;
    }

    /**
     * Logs an error message with timestamp
     */
    error(message: string, error?: Error): void {
        const timestamp = new Date().toISOString();
        const sanitizedMessage = sanitizeForLog(message);

        this.channel.appendLine(`[${timestamp}] ERROR: ${sanitizedMessage}`);

        if (error) {
            const sanitizedErrorStr = sanitizeError(error);
            this.channel.appendLine(`  ${sanitizedErrorStr}`);
        }
    }

    /**
     * Logs a warning message with timestamp
     */
    warn(message: string): void {
        const timestamp = new Date().toISOString();
        const sanitizedMessage = sanitizeForLog(message);
        this.channel.appendLine(`[${timestamp}] WARN: ${sanitizedMessage}`);
    }

    /**
     * Logs an info message with timestamp
     */
    info(message: string): void {
        const timestamp = new Date().toISOString();
        const sanitizedMessage = sanitizeForLog(message);
        this.channel.appendLine(`[${timestamp}] INFO: ${sanitizedMessage}`);
    }

    /**
     * Shows the output channel
     */
    show(): void {
        this.channel.show();
    }

    /**
     * Disposes the output channel
     */
    dispose(): void {
        this.channel.dispose();
        OutputLogger.instance = null;
    }
}
