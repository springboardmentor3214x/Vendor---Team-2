# Module 7: Communication Module - FastAPI Backend Handoff Specification

This handoff note documents the technical requirements, database schema, HTTP REST API endpoints, and asynchronous worker tasks required to migrate the frontend-only mock implementation of **Module 7 (Communication Module)** to a production FastAPI backend.

---

## 1. Database Schema Requirements (PostgreSQL)

The communication module requires 4 core tables with Foreign Key (FK) relationships to existing domain models (`vendors`, `purchase_orders`, `procurement_requests`, `contracts`).

```sql
-- 1. MESSAGES TABLE
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id VARCHAR(64) NOT NULL,
    sender_id VARCHAR(64) NOT NULL,
    sender_name VARCHAR(128) NOT NULL,
    sender_role VARCHAR(64) NOT NULL,
    receiver_id VARCHAR(64) NOT NULL,
    receiver_name VARCHAR(128) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_status BOOLEAN DEFAULT FALSE,
    related_entity_type VARCHAR(32) CHECK (related_entity_type IN ('Vendor', 'Procurement Request', 'Purchase Order', 'Contract', 'Discussion')),
    related_entity_number VARCHAR(64)
);

-- Indexing for quick thread retrieval and unread counters
CREATE INDEX idx_messages_conversation ON messages(conversation_id, timestamp DESC);
CREATE INDEX idx_messages_unread ON messages(receiver_id, read_status);
CREATE INDEX idx_messages_entity ON messages(related_entity_number);

-- 2. DISCUSSIONS TABLE
CREATE TABLE discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_by_id VARCHAR(64) NOT NULL,
    created_by_name VARCHAR(128) NOT NULL,
    created_by_role VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved', 'Closed')),
    related_entity_type VARCHAR(32) NOT NULL,
    related_entity_number VARCHAR(64) NOT NULL
);

-- Discussion Participants Junction Table
CREATE TABLE discussion_participants (
    discussion_id VARCHAR(64) REFERENCES discussions(discussion_id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    role VARCHAR(64) NOT NULL,
    PRIMARY KEY (discussion_id, user_id)
);

-- Discussion Replies Table
CREATE TABLE discussion_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id VARCHAR(64) REFERENCES discussions(discussion_id) ON DELETE CASCADE,
    sender_id VARCHAR(64) NOT NULL,
    sender_name VARCHAR(128) NOT NULL,
    sender_role VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. SHARED FILES TABLE
CREATE TABLE shared_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id VARCHAR(64) UNIQUE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(32) NOT NULL CHECK (file_type IN ('PDF', 'Excel', 'Word', 'Image', 'ZIP', 'Other')),
    file_size_bytes BIGINT NOT NULL,
    file_size_label VARCHAR(32) NOT NULL,
    storage_url TEXT NOT NULL, -- AWS S3 or MinIO URL
    uploaded_by_id VARCHAR(64) NOT NULL,
    uploaded_by_name VARCHAR(128) NOT NULL,
    uploaded_by_role VARCHAR(64) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    related_entity_type VARCHAR(32) NOT NULL,
    related_entity_number VARCHAR(64) NOT NULL,
    description TEXT
);

CREATE INDEX idx_shared_files_entity ON shared_files(related_entity_type, related_entity_number);

-- 4. ACTIVITY LOGS TABLE
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id VARCHAR(64) UNIQUE NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    user_name VARCHAR(128) NOT NULL,
    user_role VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL, -- e.g. Message Sent, File Uploaded, File Downloaded
    module_name VARCHAR(64) NOT NULL,
    related_entity_type VARCHAR(32),
    related_entity_number VARCHAR(64),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NOT NULL
);

CREATE INDEX idx_activity_logs_time ON activity_logs(timestamp DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
```

---

## 2. FastAPI Endpoint Specifications

### A. Vendor Messaging (`/api/v1/communication/messages`)
- `GET /api/v1/communication/conversations`
  - Returns user's active conversations sorted by latest message timestamp.
- `GET /api/v1/communication/conversations/{conversation_id}/messages`
  - Returns paginated message history. Automatically marks messages as read for receiver.
- `POST /api/v1/communication/messages/send`
  - **Body**: `{ conversation_id, receiver_id, content, related_entity_type, related_entity_number }`
  - **Logic**: Saves message, broadcasts WebSocket message event, triggers background email notification task, logs `Message Sent` in `activity_logs`.

### B. Procurement Discussions (`/api/v1/communication/discussions`)
- `GET /api/v1/communication/discussions`
  - Returns discussions with filters (`status`, `related_entity_type`, `related_entity_number`).
- `POST /api/v1/communication/discussions/create`
  - **Body**: `{ title, initial_message, related_entity_type, related_entity_number, participants: [...] }`
  - **Logic**: Inserts discussion & participants, sends email alerts to participants, logs `Discussion Created`.
- `POST /api/v1/communication/discussions/{discussion_id}/reply`
  - **Body**: `{ content }`
  - **Logic**: Adds reply, notifies participants, logs `Discussion Reply`.
- `PATCH /api/v1/communication/discussions/{discussion_id}/status`
  - **Body**: `{ status: "Resolved" | "Closed" }`

### C. File Sharing (`/api/v1/communication/files`)
- `GET /api/v1/communication/files`
  - Query params: `file_type`, `related_entity_type`, `related_entity_number`, `search`.
- `POST /api/v1/communication/files/upload`
  - Form-data: `file` (UploadFile), `related_entity_type`, `related_entity_number`, `description`.
  - **Logic**: Validates file extension (`.pdf, .xlsx, .docx, .png, .jpg, .zip`) & size (<25MB). Uploads to S3/MinIO. Inserts record. Logs `File Uploaded`.
- `GET /api/v1/communication/files/{file_id}/download`
  - Returns presigned S3 download URL or streaming response. Logs `File Downloaded` activity log entry.
- `DELETE /api/v1/communication/files/{file_id}`
  - **Role restriction**: `Administrator` only. Removes file from S3 and database. Logs `File Deleted`.

### D. Communication History (`/api/v1/communication/history`)
- `GET /api/v1/communication/history`
  - Query params: `lookup_type` (`vendor` | `record`), `query_value`.
  - Aggregates messages, discussion threads, and shared files in a unified timeline payload.
  - Scoped to user permissions (Vendors restricted to their own records).

### E. Activity Logs (`/api/v1/communication/activity-logs`)
- `GET /api/v1/communication/activity-logs`
  - **Role restriction**: `Administrator` and `Auditor` only.
  - Query params: `action`, `module_name`, `page`, `page_size`, `search`.

---

## 3. Background Worker & Infrastructure Guidelines
1. **Email Notification Service**: Use Celery / Redis or FastAPI `BackgroundTasks` to dispatch asynchronous email notifications to conversation/discussion participants when new messages or files are posted.
2. **S3 File Storage**: Use AWS S3 (or MinIO for local dev) to store file binaries. Never store file contents directly in PostgreSQL.
3. **Audit Log Middleware**: Automatically record user IP address, user ID, and action timestamp on every API call to `/api/v1/communication/*`.
