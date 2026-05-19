-- Migration: add_ai_api_key
-- Created: 2026-05-17
-- Desc: Add ai_api_keys table and extend ai_scans with token tracking fields

BEGIN;

-- Add new ai_api_keys table
CREATE TABLE "ai_api_keys" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "apiKey" VARCHAR(1000) NOT NULL,
    "baseUrl" VARCHAR(500) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "usedTokens" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Extend ai_scans with token tracking fields
ALTER TABLE "ai_scans" ADD COLUMN "tokensUsed" INTEGER;
ALTER TABLE "ai_scans" ADD COLUMN "apiKeyName" VARCHAR(255);
ALTER TABLE "ai_scans" ADD COLUMN "model" VARCHAR(100);

-- Add index on model for token stats aggregation
CREATE INDEX "ai_scans_model_idx" ON "ai_scans"("model");

COMMIT;
