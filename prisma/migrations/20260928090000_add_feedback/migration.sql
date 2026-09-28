-- Singles Connect Hangout - Evaluation Form.
--
-- Adds the Feedback table that stores one evaluation per phone number, and an
-- optional link back to the registration it came from.
--
-- Purely additive: no existing table, row or column is touched.

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "ageRange" TEXT NOT NULL,
    "firstTime" TEXT NOT NULL,
    "programRating" INTEGER NOT NULL,
    "engaging" INTEGER NOT NULL,
    "topicsRelevance" INTEGER NOT NULL,
    "favouritePart" TEXT NOT NULL,
    "nextTopic" TEXT NOT NULL,
    "facilitatorRating" INTEGER NOT NULL,
    "facilitatorFriendly" INTEGER NOT NULL,
    "facilitatorTiming" INTEGER NOT NULL,
    "dateTimeConvenience" INTEGER NOT NULL,
    "duration" TEXT NOT NULL,
    "locationRating" INTEGER NOT NULL,
    "venueComfort" INTEGER NOT NULL,
    "seating" INTEGER NOT NULL,
    "soundSetup" INTEGER NOT NULL,
    "foodQuality" INTEGER NOT NULL,
    "foodTiming" INTEGER NOT NULL,
    "dietarySuggestions" TEXT,
    "recommendScore" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "enjoyedMost" TEXT NOT NULL,
    "improveNext" TEXT NOT NULL,
    "comments" TEXT,
    "smsStatus" "SmsStatus" NOT NULL DEFAULT 'PENDING',
    "smsError" TEXT,
    "smsSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_registrationId_key" ON "Feedback"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_phone_key" ON "Feedback"("phone");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
