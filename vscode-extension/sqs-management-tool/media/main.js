(function () {
    const vscode = acquireVsCodeApi();

    // New elements
    const refreshButton = document.getElementById('refresh-button');
    const purgeQueueButton = document.getElementById('purge-button');
    const messageBodyInput = document.getElementById('message-body');
    const validateJsonCheckbox = document.getElementById('validate-json');
    const delaySecondsInput = document.getElementById('delay-seconds');
    const addAttributeButton = document.getElementById('add-attribute-button');
    const sendMessageButton = document.getElementById('send-message-button');
    const searchMessagesInput = document.getElementById('search-messages');
    const maxMessagesInput = document.getElementById('max-messages');
    const visibilityTimeoutReceiveInput = document.getElementById('visibility-timeout-receive');
    const waitTimeInput = document.getElementById('wait-time');
    const viewModeSelect = document.getElementById('view-mode');
    const receiveMessagesButton = document.getElementById('receive-messages-button');

    const messagesContainer = document.getElementById('messages-container');
    const messageListSection = document.getElementById('message-list-section'); // New element reference

    let currentQueueId = ''; // This will be set by the extension

    // Function to request messages from the extension
    function fetchMessages() {
        console.log('Webview: fetchMessages called for queueId:', currentQueueId);
        if (currentQueueId) {
            messagesContainer.innerHTML = 'Loading messages...';

            const maxMessages = maxMessagesInput ? parseInt(maxMessagesInput.value, 10) : 10;
            const visibilityTimeout = visibilityTimeoutReceiveInput ? parseInt(visibilityTimeoutReceiveInput.value, 10) : 30;
            const waitTime = waitTimeInput ? parseInt(waitTimeInput.value, 10) : 0;
            const searchPattern = searchMessagesInput ? searchMessagesInput.value.trim() : '';
            const viewMode = viewModeSelect ? viewModeSelect.value : 'formatted';

            vscode.postMessage({
                command: 'fetchMessages',
                queueId: currentQueueId,
                maxMessages: maxMessages,
                visibilityTimeout: visibilityTimeout,
                waitTime: waitTime,
                searchPattern: searchPattern,
                viewMode: viewMode
            });
        } else {
            messagesContainer.innerHTML = 'No queue selected.';
        }
    }

    function updateMessagesDisplay(messages) {
        console.log('Webview: updateMessagesDisplay called with messages:', messages);
        messagesContainer.innerHTML = '';

        if (!messages || messages.length === 0) {
            // Removed redundant message, the `messagesLoaded` case will handle display based on `message.error`.
            // If `updateMessagesDisplay` is called with an empty array, this block correctly handles the 'no messages' state.
            if (messageListSection) {
                messageListSection.style.display = 'none'; // Hide section if no messages
            }
            return;
        }

        if (messageListSection) {
            messageListSection.style.display = ''; // Show section if messages are present
        }

        const messagesHtml = messages.map(message => `
            <div class="message-item">
                <p><span class="message-id">Message ID:</span> ${message.messageId}</p>
                <p><span class="message-id">Receipt Handle:</span> ${message.receiptHandle}</p>
                <p><span class="message-id">Body:</span> <pre class="message-body">${escapeHtml(message.body)}</pre></p>
                <button class="delete-message-button vscode-button" data-queue-id="${currentQueueId}" data-receipt-handle="${message.receiptHandle}">Delete</button>
                <button class="change-visibility-button vscode-button" data-queue-id="${currentQueueId}" data-receipt-handle="${message.receiptHandle}">Change Visibility</button>
            </div>
        `).join('');
        messagesContainer.innerHTML = messagesHtml;
    }

    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data; // The JSON data our extension sent
        console.log('Webview: Received message from extension:', message);

        switch (message.command) {
            case 'messagesLoaded':
                if (message.error) {
                    messagesContainer.innerHTML = `<p style="color: red;">Error: ${message.error}</p>`;
                    updateMessagesDisplay([]); // Call with empty array to hide the section
                } else {
                    updateMessagesDisplay(message.messages);
                }
                break;
            case 'sendMessageResult':
                if (message.success) {
                    vscode.postMessage({ command: 'info', message: 'Message sent successfully!' });
                    messageBodyInput.value = ''; // Clear input
                    fetchMessages(); // Refresh messages after sending
                } else {
                    vscode.postMessage({ command: 'error', message: `Error sending message: ${message.error || 'Unknown error'}` });
                }
                break;
            case 'deleteMessageResult':
                if (message.success) {
                    vscode.postMessage({ command: 'info', message: 'Message deleted successfully!' });
                    fetchMessages(); // Refresh messages after deletion
                } else {
                    vscode.postMessage({ command: 'error', message: `Failed to delete message: ${message.error || 'Unknown error'}` });
                }
                break;
            case 'purgeQueueResult':
                if (message.success) {
                    vscode.postMessage({ command: 'info', message: 'Queue purged successfully!' });
                    fetchMessages(); // Refresh messages after purging
                } else {
                    vscode.postMessage({ command: 'error', message: `Failed to purge queue: ${message.error || 'Unknown error'}` });
                }
                break;
            case 'changeVisibilityResult':
                if (message.success) {
                    vscode.postMessage({ command: 'info', message: 'Message visibility timeout updated successfully!' });
                    fetchMessages(); // Refresh messages after successful visibility change
                } else {
                    vscode.postMessage({ command: 'error', message: `Failed to change message visibility: ${message.error || 'Unknown error'}` });
                }
                break;
        }
    });

    // Set initial queue ID and fetch messages
    // The extension will post an initial message with queueId when the webview is created
    // For now, we'll assume the queueId is passed in the initial webview HTML, 
    // or we can add a mechanism for the extension to send it later.
    // For simplicity, let's assume the extension will send a 'setQueueId' message.

    // Event listener for the refresh button
    if (refreshButton) {
        refreshButton.addEventListener('click', fetchMessages);
    }

    if (sendMessageButton) {
        sendMessageButton.addEventListener('click', () => {
            const messageBody = messageBodyInput.value.trim();
            if (!messageBody) {
                vscode.postMessage({ command: 'error', message: 'Message body cannot be empty.' });
                return;
            }

            // Client-side JSON validation
            if (validateJsonCheckbox.checked) {
                try {
                    JSON.parse(messageBody);
                } catch (e) {
                    vscode.postMessage({ command: 'error', message: 'Invalid JSON format in message body.' });
                    return;
                }
            }

            vscode.postMessage({
                command: 'sendMessage',
                queueId: currentQueueId,
                messageBody: messageBody,
                delaySeconds: delaySecondsInput ? parseInt(delaySecondsInput.value, 10) : 0 // Include delaySeconds
            });
        });
    }

    if (purgeQueueButton) {
        purgeQueueButton.addEventListener('click', () => {
            // Show a confirmation dialog before purging
            vscode.postMessage({
                command: 'confirm',
                message: 'Are you sure you want to purge this queue? This action cannot be undone.',
                action: 'purgeQueue',
                queueId: currentQueueId
            });
        });
    }

    if (receiveMessagesButton) {
      receiveMessagesButton.addEventListener('click', () => {
        fetchMessages();
      });
    }

    if (messagesContainer) {
        messagesContainer.addEventListener('click', (event) => {
            const target = event.target;
            if (target && target.classList.contains('delete-message-button')) {
                const receiptHandle = target.dataset.receiptHandle;
                const queueId = target.dataset.queueId;
                if (receiptHandle && queueId) {
                    vscode.postMessage({
                        command: 'deleteMessage',
                        queueId: queueId,
                        receiptHandle: receiptHandle
                    });
                }
            } else if (target && target.classList.contains('change-visibility-button')) {
                const receiptHandle = target.dataset.receiptHandle;
                const queueId = target.dataset.queueId;
                if (receiptHandle && queueId) {
                    // Request visibility timeout from extension host
                    vscode.postMessage({
                        command: 'requestVisibilityTimeoutInput',
                        queueId: queueId,
                        receiptHandle: receiptHandle
                    });
                }
            }
        });
    }

    // Utility to escape HTML for display
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/\'/g, "&#039;");
    }

    // Initial fetch when webview is ready, if queueId is somehow available
    // Or wait for the extension to send the queueId.
    // Let's modify extension.ts to send the queueId to the webview after it's created.
    // For now, I'll add a placeholder to receive it.
    window.addEventListener('message', event => {
        const message = event.data;
        if (message.command === 'setQueueId') {
            currentQueueId = message.queueId;
            fetchMessages(); // Fetch messages once queueId is set
        }
    });

})();
