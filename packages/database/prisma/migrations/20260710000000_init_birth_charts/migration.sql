-- CreateTable
CREATE TABLE "BirthChart" (
    "id" TEXT NOT NULL,
    "subjectName" TEXT,
    "birthDateTime" TIMESTAMP(3) NOT NULL,
    "birthPlace" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "timezone" TEXT,
    "chartJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BirthChart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BirthChart_createdAt_idx" ON "BirthChart"("createdAt");
