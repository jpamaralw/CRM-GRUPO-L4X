-- Meta Lead Ads integration: add attribution columns to LeadJudicial + event log table

ALTER TABLE "LeadJudicial"
  ADD COLUMN IF NOT EXISTS "metaLeadId" TEXT,
  ADD COLUMN IF NOT EXISTS "metaCampaignName" TEXT,
  ADD COLUMN IF NOT EXISTS "metaFormName" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "LeadJudicial_metaLeadId_key" ON "LeadJudicial"("metaLeadId");
CREATE INDEX IF NOT EXISTS "LeadJudicial_metaLeadId_idx" ON "LeadJudicial"("metaLeadId");

CREATE TABLE IF NOT EXISTS "MetaWebhookEvent" (
  "id" TEXT NOT NULL,
  "leadgenId" TEXT NOT NULL,
  "pageId" TEXT,
  "formId" TEXT,
  "adId" TEXT,
  "campaignId" TEXT,
  "rawPayload" JSONB NOT NULL,
  "processed" BOOLEAN NOT NULL DEFAULT false,
  "error" TEXT,
  "leadId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MetaWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MetaWebhookEvent_leadgenId_key" ON "MetaWebhookEvent"("leadgenId");
CREATE INDEX IF NOT EXISTS "MetaWebhookEvent_processed_idx" ON "MetaWebhookEvent"("processed");
CREATE INDEX IF NOT EXISTS "MetaWebhookEvent_createdAt_idx" ON "MetaWebhookEvent"("createdAt");
