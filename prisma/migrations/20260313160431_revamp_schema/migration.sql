/*
  Warnings:

  - You are about to drop the column `teamId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `OrgInvite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrgMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Team` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamMember` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `createdById` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrgInvite" DROP CONSTRAINT "OrgInvite_invitedById_fkey";

-- DropForeignKey
ALTER TABLE "OrgInvite" DROP CONSTRAINT "OrgInvite_orgId_fkey";

-- DropForeignKey
ALTER TABLE "OrgMember" DROP CONSTRAINT "OrgMember_orgId_fkey";

-- DropForeignKey
ALTER TABLE "OrgMember" DROP CONSTRAINT "OrgMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_orgId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_projectId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_teamId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_userId_fkey";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "parentId" TEXT,
ALTER COLUMN "orgId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "teamId";

-- DropTable
DROP TABLE "OrgInvite";

-- DropTable
DROP TABLE "OrgMember";

-- DropTable
DROP TABLE "Team";

-- DropTable
DROP TABLE "TeamMember";

-- DropEnum
DROP TYPE "OrgRole";

-- CreateTable
CREATE TABLE "ProjectInvite" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "ProjectRole" NOT NULL DEFAULT 'MEMBER',
    "tokenHash" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectInvite_tokenHash_key" ON "ProjectInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "ProjectInvite_tokenHash_idx" ON "ProjectInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "ProjectInvite_email_idx" ON "ProjectInvite"("email");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvite" ADD CONSTRAINT "ProjectInvite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvite" ADD CONSTRAINT "ProjectInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
