import * as vscode from 'vscode';

const BACKEND_BASE_URL = 'http://localhost:8080/api';

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

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BACKEND_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! Status: ${response.status}`;
      try {
        const errorBody: any = await response.json();
        errorMessage = errorBody.message || errorMessage;
      } catch (jsonError) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null as T;
    }

    return (await response.json()) as T;
  } catch (error: any) {
    if (error.cause && error.cause.code === 'ECONNREFUSED') {
      throw new Error('Connection to backend refused. Is the backend server running?');
    }
    throw new Error(`Network error or backend not reachable: ${error.message}`);
  }
}

export async function getAwsProfiles(): Promise<string[]> {
  return request<string[]>('/config/profiles');
}

export async function setAwsProfile(profileName: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/config/profile', {
    method: 'POST',
    body: JSON.stringify({ profileName }),
  });
}

export async function sendMessage(
  queueId: string,
  messageBody: string,
  delaySeconds: number = 0,
  messageAttributes: Record<string, any> = {},
  messageGroupId?: string,
  messageDeduplicationId?: string
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/queues/${queueId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      body: messageBody,
      delaySeconds,
      messageAttributes,
      messageGroupId,
      messageDeduplicationId
    }),
  });
}

export async function getAllQueues(): Promise<QueueConfiguration[]> {
  return request<QueueConfiguration[]>('/queues');
}

export async function addQueue(identifier: string, region: string): Promise<QueueConfiguration> {
  return request<QueueConfiguration>('/queues', {
    method: 'POST',
    body: JSON.stringify({ identifier, region }),
  });
}

export async function receiveMessages(
  queueId: string,
  peek: boolean = false,
  maxMessages: number = 10,
  visibilityTimeout: number = 30,
  waitTime: number = 0,
  searchPattern: string = '',
  viewMode: string = 'formatted'
): Promise<any[]> {
  const params = new URLSearchParams();
  params.append('peek', String(peek));
  params.append('maxMessages', String(maxMessages));
  params.append('visibilityTimeout', String(visibilityTimeout));
  params.append('waitTime', String(waitTime));
  if (searchPattern) {
    params.append('searchPattern', searchPattern);
  }
  params.append('viewMode', viewMode);

  return request<any[]>(`/queues/${queueId}/messages?${params.toString()}`);
}

export async function deleteMessage(queueId: string, receiptHandle: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/queues/${queueId}/messages?receiptHandle=${encodeURIComponent(receiptHandle)}`, {
    method: 'DELETE',
  });
}

export async function purgeQueue(queueId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/queues/${queueId}/purge`, {
    method: 'POST',
  });
}

export async function removeQueue(queueId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/queues/${queueId}`, {
    method: 'DELETE',
  });
}

export async function changeMessageVisibility(queueId: string, receiptHandle: string, visibilityTimeout: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/queues/${queueId}/messages/visibility`, {
    method: 'POST',
    body: JSON.stringify({ receiptHandle, visibilityTimeout }),
  });
}

export async function redriveDLQ(queueId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/queues/${queueId}/redrive-dlq`, {
    method: 'POST',
  });
}

export type { QueueConfiguration };
