-- Both evaluation forms were cut down to ten questions each, so the columns of
-- the retired questions are no longer filled in. They are kept - just made
-- nullable - so the answers already collected are not lost. Nothing in the app
-- reads or writes them any more, which is why they are listed under "Retired
-- questions" in `prisma/schema.prisma`.

-- Feedback (participants' evaluation form)
ALTER TABLE "Feedback" ALTER COLUMN "programRating" DROP NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "engaging" DROP NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "favouritePart" DROP NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "nextTopic" DROP NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "facilitatorTiming" DROP NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "dateTimeConvenience" DROP NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "locationRating" DROP NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "seating" DROP NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "soundSetup" DROP NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "foodTiming" DROP NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "recommendScore" DROP NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "enjoyedMost" DROP NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "improveNext" DROP NOT NULL;

-- PanelFeedback (panelists' evaluation form)
ALTER TABLE "PanelFeedback" ALTER COLUMN "prepAdequacy" DROP NOT NULL;
ALTER TABLE "PanelFeedback" ALTER COLUMN "contributionBalance" DROP NOT NULL;
ALTER TABLE "PanelFeedback" ALTER COLUMN "audienceQuestions" DROP NOT NULL;
ALTER TABLE "PanelFeedback" ALTER COLUMN "audienceConnection" DROP NOT NULL;
ALTER TABLE "PanelFeedback" ALTER COLUMN "panelDateTime" DROP NOT NULL;
ALTER TABLE "PanelFeedback" ALTER COLUMN "venueSuitability" DROP NOT NULL;
ALTER TABLE "PanelFeedback" ALTER COLUMN "technicalLogistics" DROP NOT NULL;
ALTER TABLE "PanelFeedback" ALTER COLUMN "overallOrganization" DROP NOT NULL;
ALTER TABLE "PanelFeedback" ALTER COLUMN "panelistHospitality" DROP NOT NULL;
ALTER TABLE "PanelFeedback" ALTER COLUMN "wentWell" DROP NOT NULL;
ALTER TABLE "PanelFeedback" ALTER COLUMN "challenge" DROP NOT NULL;
ALTER TABLE "PanelFeedback" ALTER COLUMN "topicSuggestion" DROP NOT NULL;
