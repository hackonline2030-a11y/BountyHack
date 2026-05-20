-- CreateTable
CREATE TABLE "report_team_leave_requests" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message" TEXT,
    "status" "ReportTeamJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),
    "decided_by_id" TEXT,

    CONSTRAINT "report_team_leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_team_leave_requests_team_id_status_idx" ON "report_team_leave_requests"("team_id", "status");

-- CreateIndex
CREATE INDEX "report_team_leave_requests_user_id_status_idx" ON "report_team_leave_requests"("user_id", "status");

-- AddForeignKey
ALTER TABLE "report_team_leave_requests" ADD CONSTRAINT "report_team_leave_requests_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "report_draft_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_team_leave_requests" ADD CONSTRAINT "report_team_leave_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_team_leave_requests" ADD CONSTRAINT "report_team_leave_requests_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
