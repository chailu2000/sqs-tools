// API Client for SQS Management Tool

const API_BASE_URL = 'http://localhost:8080/api';

interface QueueConfiguration {
    id: string;
    queueUrl: string;
    queueName: string;
    region: string;
    attributes: Record<string, any>;
    dlqUrl?: string;
    dlqName?: string;
    savedAt: string;
}

interface Message {
    messageId: string;
    body: string;
    bodyFormatted?: string;
    receiptHandle: string;
    attributes: Record<string, any>;
    messageAttributes: Record<string, any>;
    md5OfBody: string;
}

interface RedriveResult {
    processedCount: number;
    successCount: number;
    failureCount: number;
    succeeded: Array<{ messageId: string }>;
    failed: Array<{ messageId: string; error: string }>;
    errors: Array<{ messageId: string; error: string }>;
}

class ApiClient {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({
                    message: response.statusText,
                }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            if (response.status === 204) {
                return null as T;
            }

            return await response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Network error');
        }
    }

    // Queue operations
    async addQueue(identifier: string, region: string): Promise<QueueConfiguration> {
        return this.request('/queues', {
            method: 'POST',
            body: JSON.stringify({ identifier, region }),
        });
    }

    async getAllQueues(): Promise<QueueConfiguration[]> {
        return this.request('/queues');
    }

    async getQueue(queueId: string): Promise<QueueConfiguration> {
        return this.request(`/queues/${queueId}`);
    }

    async refreshQueue(queueId: string): Promise<QueueConfiguration> {
        return this.request(`/queues/${queueId}/refresh`, { method: 'POST' });
    }

    async removeQueue(queueId: string): Promise<void> {
        return this.request(`/queues/${queueId}`, { method: 'DELETE' });
    }

    async purgeQueue(queueId: string): Promise<{ success: boolean; message: string }> {
        return this.request(`/queues/${queueId}/purge`, { method: 'POST' });
    }

    // Message operations
    async receiveMessages(
        queueId: string,
        params?: {
            maxMessages?: number;
            visibilityTimeout?: number;
            waitTimeSeconds?: number;
        }
    ): Promise<Message[]> {
        const queryParams = new URLSearchParams();
        if (params?.maxMessages) queryParams.set('maxMessages', params.maxMessages.toString());
        if (params?.visibilityTimeout) queryParams.set('visibilityTimeout', params.visibilityTimeout.toString());
        if (params?.waitTimeSeconds) queryParams.set('waitTimeSeconds', params.waitTimeSeconds.toString());

        const query = queryParams.toString();
        return this.request(`/queues/${queueId}/messages${query ? `?${query}` : ''}`);
    }

    async sendMessage(
        queueId: string,
        body: string,
        attributes?: Record<string, any>,
        delaySeconds?: number
    ): Promise<{ messageId: string; success: boolean }> {
        return this.request(`/queues/${queueId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ body, attributes, delaySeconds }),
        });
    }

    async deleteMessage(queueId: string, receiptHandle: string): Promise<{ success: boolean }> {
        return this.request(`/queues/${queueId}/messages?receiptHandle=${encodeURIComponent(receiptHandle)}`, {
            method: 'DELETE',
        });
    }

    async changeMessageVisibility(
        queueId: string,
        receiptHandle: string,
        visibilityTimeout: number
    ): Promise<{ success: boolean }> {
        return this.request(`/queues/${queueId}/messages/visibility?receiptHandle=${encodeURIComponent(receiptHandle)}`, {
            method: 'PATCH',
            body: JSON.stringify({ visibilityTimeout }),
        });
    }

    // Redrive operations
    async redriveMessages(
        queueId: string,
        maxMessages?: number,
        redriveAll: boolean = false
    ): Promise<RedriveResult> {
        return this.request(`/queues/${queueId}/redrive`, {
            method: 'POST',
            body: JSON.stringify({ maxMessages, redriveAll }),
        });
    }

    async redriveSelectedMessages(
        queueId: string,
        messages: Array<{ messageId: string; receiptHandle: string; body: string; messageAttributes: any }>
    ): Promise<RedriveResult> {
        return this.request(`/queues/${queueId}/redrive/selective`, {
            method: 'POST',
            body: JSON.stringify({ messages }),
        });
    }

    async receiveDlqMessages(
        queueId: string,
        params?: {
            maxMessages?: number;
            visibilityTimeout?: number;
        }
    ): Promise<Message[]> {
        const queryParams = new URLSearchParams();
        if (params?.maxMessages) queryParams.set('maxMessages', params.maxMessages.toString());
        if (params?.visibilityTimeout) queryParams.set('visibilityTimeout', params.visibilityTimeout.toString());

        const query = queryParams.toString();
        return this.request(`/queues/${queueId}/dlq/messages${query ? `?${query}` : ''}`);
    }

    // Config operations
    async getProfiles(): Promise<string[]> {
        return this.request('/config/profiles');
    }

    async setProfile(profileName: string): Promise<{ success: boolean }> {
        return this.request('/config/profile', {
            method: 'POST',
            body: JSON.stringify({ profileName }),
        });
    }

    async testCredentials(): Promise<{
        valid: boolean;
        accountId?: string;
        method?: string;
    }> {
        return this.request('/config/test-credentials');
    }
}

export const api = new ApiClient();
export type { QueueConfiguration, Message, RedriveResult };
