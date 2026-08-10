-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "heightCm" REAL,
    "weightKg" REAL,
    "age" INTEGER,
    "gender" TEXT,
    "activityLevel" TEXT,
    "goal" TEXT,
    "goalRateKcal" INTEGER NOT NULL DEFAULT 0,
    "onboarded" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "FoodLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "logDate" TEXT NOT NULL,
    "barcode" TEXT,
    "foodName" TEXT NOT NULL,
    "quantityG" REAL NOT NULL,
    "calories" REAL NOT NULL,
    "proteinG" REAL,
    "carbsG" REAL,
    "fatG" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FoodLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FoodCache" (
    "barcode" TEXT NOT NULL PRIMARY KEY,
    "foodName" TEXT NOT NULL,
    "brand" TEXT,
    "caloriesPer100g" REAL,
    "proteinPer100g" REAL,
    "carbsPer100g" REAL,
    "fatPer100g" REAL,
    "imageUrl" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "FoodLog_userId_logDate_idx" ON "FoodLog"("userId", "logDate");
