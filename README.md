# SQS Management Tool

A locally-running web application for managing and visualizing AWS SQS queues. This tool provides a user-friendly interface to interact with your SQS queues, send and receive messages, manage dead letter queues, and more.

## Features

- 🔍 **Queue Management**: Add, view, and remove SQS queues
- 📨 **Message Operations**: Send, receive, and delete messages
- 🎨 **JSON Formatting**: Pretty-print JSON messages with syntax highlighting
- 🔄 **DLQ Redrive**: Redrive messages from Dead Letter Queues back to main queues
- 🔎 **Message Search**: Filter messages by content or attributes
- ⚙️ **AWS Profile Management**: Switch between AWS profiles and test credentials
- 💾 **Persistent Configuration**: Queue configurations saved locally in SQLite
- 🌓 **Dark Mode**: Automatic dark mode support

## Project Structure

```
sqs-tools/
├── backend/                 # Spring Boot backend (Java 21)
│   ├── src/
│   │   ├── main/java/com/sqstools/
│   │   │   ├── controller/  # REST API controllers
│   │   │   ├── service/     # Business logic
│   │   │   ├── repository/  # Data access
│   │   │   ├── entity/      # JPA entities
│   │   │   ├── model/       # DTOs
│   │   │   └── aws/         # AWS SDK integration
│   │   └── test/            # Unit tests
│   ├── data/                # SQLite database location
│   ├── build.gradle.kts
│   └── settings.gradle.kts
│
└── frontend/                # Svelte 5 frontend (TypeScript)
    ├── src/
    │   ├── lib/
    │   │   ├── components/  # Svelte components
    │   │   ├── api.ts       # API client
    │   │   └── stores.svelte.ts  # State management
    │   ├── App.svelte       # Main app component
    │   └── main.ts
    ├── package.json
    └── vite.config.ts
```

## Prerequisites

- **Java 21 or 23** (for backend)
- **Node.js 18+** and **pnpm** (for frontend)
- **AWS credentials** configured via:
  - AWS CLI profiles (`~/.aws/credentials`)
  - Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)

## Installation

### Using mise (Recommended)

This project uses [mise](https://mise.jdx.dev/) for tool version management:

```bash
# Install mise if you haven't already
curl https://mise.run | sh

# Install project dependencies
mise install
```

### Manual Installation

Install the required tools manually:
- Java 21: https://adoptium.net/
- Node.js 18+: https://nodejs.org/
- pnpm: `npm install -g pnpm`

## Getting Started

### 1. Start the Backend

```bash
cd backend
./gradlew bootRun
```

The backend will start on `http://localhost:8080`

### 2. Start the Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

The frontend will start on `http://localhost:5173`

### 3. Open the Application

Navigate to `http://localhost:5173` in your browser.

## Usage

### Adding a Queue

1. Click the "+ Add Queue" button in the sidebar
2. Enter either:
   - Queue name (e.g., `my-queue`)
   - Full queue URL (e.g., `https://sqs.us-east-1.amazonaws.com/123456789012/my-queue`)
3. Select the AWS region
4. Click "Add"

### Sending Messages

1. Select a queue from the sidebar
2. In the "Send Message" section:
   - Enter your message body
   - Optionally enable JSON validation
   - Add message attributes (key-value pairs)
   - Set a delay in seconds (0-900)
3. Click "Send Message"

### Receiving Messages

1. Select a queue from the sidebar
2. Configure receive parameters:
   - Max Messages (1-10)
   - Visibility Timeout (0-43200 seconds)
   - Wait Time (0-20 seconds)
3. Click "Receive Messages"
4. Use the search box to filter messages
5. Expand messages to view full content with JSON highlighting

### Redrive from DLQ

If a queue has a Dead Letter Queue configured:

1. Select the queue from the sidebar
2. In the "Dead Letter Queue Redrive" section:
   - Click "Redrive Single Message" to move one message
   - Click "Redrive All Messages" to move all messages
3. View the results showing success/failure counts

### Managing AWS Credentials

1. Click the "⚙️ Settings" button in the header
2. Select an AWS profile from the dropdown
3. Click "Set Profile" to activate it
4. Click "Test Credentials" to verify they work

## API Endpoints

### Queue Operations
- `POST /api/queues` - Add a queue
- `GET /api/queues` - Get all saved queues
- `GET /api/queues/{queueId}` - Get queue details
- `DELETE /api/queues/{queueId}` - Remove a queue
- `POST /api/queues/{queueId}/purge` - Purge all messages

### Message Operations
- `GET /api/queues/{queueId}/messages` - Receive messages
- `POST /api/queues/{queueId}/messages` - Send a message
- `DELETE /api/queues/{queueId}/messages/{receiptHandle}` - Delete a message
- `PATCH /api/queues/{queueId}/messages/{receiptHandle}/visibility` - Change visibility timeout

### Redrive Operations
- `POST /api/queues/{queueId}/redrive` - Redrive messages from DLQ

### Configuration
- `GET /api/config/profiles` - Get available AWS profiles
- `POST /api/config/profile` - Set active AWS profile
- `GET /api/config/test-credentials` - Test AWS credentials

## Development

### Backend Development

```bash
cd backend

# Run tests
./gradlew test

# Build
./gradlew build

# Run with auto-reload
./gradlew bootRun
```

### Frontend Development

```bash
cd frontend

# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## Testing

### Backend Tests
```bash
cd backend
./gradlew test
```

The backend includes:
- Unit tests for services
- Integration tests for controllers
- 23 tests covering core functionality

### Frontend Tests
```bash
cd frontend
pnpm test
```

## Database

The application uses SQLite for persistent storage:
- Location: `backend/data/sqs-management.db`
- Stores: Queue configurations and user preferences
- Automatically created on first run

## AWS Permissions Required

The application requires the following AWS IAM permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:GetQueueUrl",
        "sqs:GetQueueAttributes",
        "sqs:ListQueues",
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:ChangeMessageVisibility",
        "sqs:PurgeQueue"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

## Troubleshooting

### Backend won't start
- Ensure Java 21 or 23 is installed: `java -version`
- Check if port 8080 is available
- Verify AWS credentials are configured

### Frontend won't start
- Ensure Node.js 18+ is installed: `node -version`
- Install dependencies: `pnpm install`
- Check if port 5173 is available

### Can't connect to AWS
- Verify AWS credentials: `aws sts get-caller-identity`
- Check AWS region configuration
- Use the Settings panel to test credentials

### Database errors
- Ensure `backend/data/` directory exists
- Check file permissions on `sqs-management.db`
- Delete the database file to reset (will lose saved queues)

## Technology Stack

### Backend
- **Spring Boot 4.0** - Application framework
- **Java 21** - Programming language
- **AWS SDK for Java v2** - AWS integration
- **SQLite** - Database
- **Hibernate 6** - ORM
- **Gradle 8.14** - Build tool
- **JUnit 5** - Testing framework

### Frontend
- **Svelte 5** - UI framework
- **TypeScript 5** - Programming language
- **Vite 6** - Build tool
- **Prism.js** - Syntax highlighting
- **Vitest** - Testing framework

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Open Source
