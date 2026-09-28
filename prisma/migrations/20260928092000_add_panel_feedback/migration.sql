-- Singles Connect Hangout - Panelists' Evaluation Form.
--
-- Adds the PanelFeedback table that stores one evaluation per panelist, keyed
-- by the panelist's name (lower-cased, spacing flattened) so a second
-- submission updates the first instead of duplicating it.
--
-- Purely additive: no existing table, row or column is touched.

-- CreateTable
CREATE TABLE "PanelFeedback" (
    "id" TEXT NOT NULL,
    "panelistName" TEXT NOT NULL,
    "panelistKey" TEXT NOT NULL,
    "topicClarity" INTEGER NOT NULL,
    "prepAdequacy" INTEGER NOT NULL,
    "preEventComms" INTEGER NOT NULL,
    "moderatorSteering" INTEGER NOT NULL,
    "timeAdequacy" TEXT NOT NULL,
    "contributionBalance" INTEGER NOT NULL,
    "questionRelevance" INTEGER NOT NULL,
    "audienceEngagement" INTEGER NOT NULL,
    "audienceQuestions" INTEGER NOT NULL,
    "audienceConnection" INTEGER NOT NULL,
    "panelDateTime" INTEGER NOT NULL,
    "venueSuitability" INTEGER NOT NULL,
    "technicalLogistics" INTEGER NOT NULL,
    "overallOrganization" INTEGER NOT NULL,
    "panelistHospitality" INTEGER NOT NULL,
    "objectivesAchieved" TEXT NOT NULL,
    "wentWell" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "topicSuggestion" TEXT NOT NULL,
    "overallSuccess" INTEGER NOT NULL,
    "serveAgain" TEXT NOT NULL,
    "suggestions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PanelFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PanelFeedback_panelistKey_key" ON "PanelFeedback"("panelistKey");

-- CreateIndex
CREATE INDEX "PanelFeedback_createdAt_idx" ON "PanelFeedback"("createdAt");
