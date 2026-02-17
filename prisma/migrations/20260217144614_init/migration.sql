-- CreateTable
CREATE TABLE "ContainerStat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "containerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "cpu" REAL,
    "memory" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ContainerStat_containerId_idx" ON "ContainerStat"("containerId");
