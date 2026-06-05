CREATE TYPE "AiChatRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');
CREATE TYPE "AiChatSessionStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');
CREATE TYPE "AiRagSourceType" AS ENUM ('RECIPE', 'INGREDIENT', 'NOTICE', 'USER_UPLOAD', 'ADMIN_DOC');
CREATE TYPE "AiRagDocumentStatus" AS ENUM ('ACTIVE', 'DISABLED');

CREATE TABLE "ai_chat_sessions" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "title" TEXT,
  "status" "AiChatSessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "lastMessageAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_chat_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_chat_messages" (
  "id" SERIAL NOT NULL,
  "sessionId" INTEGER NOT NULL,
  "userId" INTEGER,
  "role" "AiChatRole" NOT NULL,
  "content" TEXT NOT NULL,
  "model" TEXT,
  "tokensUsed" INTEGER,
  "ragContext" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_rag_documents" (
  "id" SERIAL NOT NULL,
  "sourceType" "AiRagSourceType" NOT NULL DEFAULT 'ADMIN_DOC',
  "sourceId" TEXT,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "status" "AiRagDocumentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdBy" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_rag_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_rag_chunks" (
  "id" SERIAL NOT NULL,
  "documentId" INTEGER NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "embedding" JSONB,
  "tokenCount" INTEGER,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_rag_chunks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_chat_sessions_userId_lastMessageAt_idx" ON "ai_chat_sessions"("userId", "lastMessageAt");
CREATE INDEX "ai_chat_sessions_status_idx" ON "ai_chat_sessions"("status");
CREATE INDEX "ai_chat_messages_sessionId_createdAt_idx" ON "ai_chat_messages"("sessionId", "createdAt");
CREATE INDEX "ai_chat_messages_userId_createdAt_idx" ON "ai_chat_messages"("userId", "createdAt");
CREATE INDEX "ai_chat_messages_role_idx" ON "ai_chat_messages"("role");
CREATE INDEX "ai_rag_documents_sourceType_sourceId_idx" ON "ai_rag_documents"("sourceType", "sourceId");
CREATE INDEX "ai_rag_documents_status_idx" ON "ai_rag_documents"("status");
CREATE INDEX "ai_rag_documents_createdAt_idx" ON "ai_rag_documents"("createdAt");
CREATE UNIQUE INDEX "ai_rag_chunks_documentId_chunkIndex_key" ON "ai_rag_chunks"("documentId", "chunkIndex");
CREATE INDEX "ai_rag_chunks_documentId_idx" ON "ai_rag_chunks"("documentId");

ALTER TABLE "ai_chat_sessions"
  ADD CONSTRAINT "ai_chat_sessions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_chat_messages"
  ADD CONSTRAINT "ai_chat_messages_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "ai_chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_chat_messages"
  ADD CONSTRAINT "ai_chat_messages_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_rag_chunks"
  ADD CONSTRAINT "ai_rag_chunks_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "ai_rag_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
