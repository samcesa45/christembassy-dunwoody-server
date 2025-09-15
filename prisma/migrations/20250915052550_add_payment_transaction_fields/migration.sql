/*
  Warnings:

  - Added the required column `gatewayResponse` to the `PaymentTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerTxnId` to the `PaymentTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."PaymentTransaction" ADD COLUMN     "gatewayResponse" TEXT NOT NULL,
ADD COLUMN     "providerTxnId" TEXT NOT NULL;
