-- CreateTable
CREATE TABLE "Kiosk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pairingCode" TEXT,
    "deviceToken" TEXT,
    "layout" TEXT,
    "tabId" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Kiosk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Kiosk_pairingCode_key" ON "Kiosk"("pairingCode");

-- CreateIndex
CREATE UNIQUE INDEX "Kiosk_deviceToken_key" ON "Kiosk"("deviceToken");
