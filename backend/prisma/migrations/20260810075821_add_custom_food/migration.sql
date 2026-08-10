-- CreateTable
CREATE TABLE "CustomFood" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "foodName" TEXT NOT NULL,
    "caloriesPer100g" REAL NOT NULL,
    "proteinPer100g" REAL,
    "carbsPer100g" REAL,
    "fatPer100g" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomFood_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CustomFood_userId_idx" ON "CustomFood"("userId");
