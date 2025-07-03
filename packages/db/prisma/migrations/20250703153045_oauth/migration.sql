/*
  Warnings:

  - You are about to drop the column `type` on the `accounts` table. All the data in the column will be lost.
  - Changed the type of `provider` on the `accounts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AccountProvider" AS ENUM ('GOOGLE', 'EMAIL');

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "type",
DROP COLUMN "provider",
ADD COLUMN     "provider" "AccountProvider" NOT NULL;

-- CreateIndex
CREATE INDEX "accounts_provider_idx" ON "accounts"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");
