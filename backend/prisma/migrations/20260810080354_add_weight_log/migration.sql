-- CreateTable
CREATE TABLE "WeightLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "weightKg" REAL NOT NULL,
    "logDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeightLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WeightLog_userId_logDate_idx" ON "WeightLog"("userId", "logDate");

-- CreateIndex
CREATE UNIQUE INDEX "WeightLog_userId_logDate_key" ON "WeightLog"("userId", "logDate");
