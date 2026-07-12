-- AlterTable
ALTER TABLE "BirthChart" ADD COLUMN     "engineBackend" TEXT,
ADD COLUMN     "engineVersion" TEXT,
ADD COLUMN     "localDateTime" TEXT,
ADD COLUMN     "timezoneOffsetMinutes" INTEGER,
ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "BirthChart_userId_createdAt_idx" ON "BirthChart"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "BirthChart" ADD CONSTRAINT "BirthChart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
