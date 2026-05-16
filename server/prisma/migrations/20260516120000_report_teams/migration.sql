-- CreateEnum
CREATE TYPE "ReportTeamMemberRole" AS ENUM ('HUNTER', 'QUALITY_CHECKER', 'MENTOR');

-- CreateEnum
CREATE TYPE "ReportTeamJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "report_draft_teams" (
    "id" TEXT NOT NULL,
    "report_draft_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_draft_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_team_members" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "ReportTeamMemberRole" NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_team_join_requests" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "requested_role" "ReportTeamMemberRole" NOT NULL,
    "message" TEXT,
    "status" "ReportTeamJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),
    "decided_by_id" TEXT,

    CONSTRAINT "report_team_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "report_draft_teams_report_draft_id_key" ON "report_draft_teams"("report_draft_id");

-- CreateIndex
CREATE INDEX "report_team_members_team_id_idx" ON "report_team_members"("team_id");

-- CreateIndex
CREATE INDEX "report_team_members_user_id_idx" ON "report_team_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_team_members_team_id_user_id_key" ON "report_team_members"("team_id", "user_id");

-- CreateIndex
CREATE INDEX "report_team_join_requests_team_id_status_idx" ON "report_team_join_requests"("team_id", "status");

-- CreateIndex
CREATE INDEX "report_team_join_requests_user_id_status_idx" ON "report_team_join_requests"("user_id", "status");

-- AddForeignKey
ALTER TABLE "report_draft_teams" ADD CONSTRAINT "report_draft_teams_report_draft_id_fkey" FOREIGN KEY ("report_draft_id") REFERENCES "report_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_team_members" ADD CONSTRAINT "report_team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "report_draft_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_team_members" ADD CONSTRAINT "report_team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_team_join_requests" ADD CONSTRAINT "report_team_join_requests_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "report_draft_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_team_join_requests" ADD CONSTRAINT "report_team_join_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_team_join_requests" ADD CONSTRAINT "report_team_join_requests_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
