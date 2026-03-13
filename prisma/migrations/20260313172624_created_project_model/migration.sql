/*
  Warnings:

  - You are about to drop the column `orgId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `progressNote` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Organisation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Organisation" DROP CONSTRAINT "Organisation_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_orgId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "orgId";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "progress",
DROP COLUMN "progressNote";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role";

-- DropTable
DROP TABLE "Organisation";

-- DropEnum
DROP TYPE "Role";

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
