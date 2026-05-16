-- Allow enrollment requests without a specific team (coordinator assigns later).
ALTER TABLE "report_team_join_requests" ALTER COLUMN "team_id" DROP NOT NULL;
