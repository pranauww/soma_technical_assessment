-- CreateTable
CREATE TABLE "Todo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "dueDate" DATETIME,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TaskDependency" (
    "fromId" INTEGER NOT NULL,
    "toId" INTEGER NOT NULL,

    PRIMARY KEY ("fromId", "toId"),
    CONSTRAINT "TaskDependency_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Todo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TaskDependency_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Todo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
