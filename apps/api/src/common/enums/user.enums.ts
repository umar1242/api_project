/**
 * Canonical enum definitions for User domain.
 *
 * Defined locally (not imported from @prisma/client) so TypeScript compilation
 * works even before `prisma generate` has been run.
 * These values MUST stay in sync with schema.prisma.
 */
export enum UserRole {
  STUDENT = "STUDENT",
  CURATOR = "CURATOR",
  ADMIN = "ADMIN",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  BANNED = "BANNED",
}
