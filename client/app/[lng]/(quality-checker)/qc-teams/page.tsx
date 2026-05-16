import { AppRoleCode } from "@/lib/app-role-code";
import { createMemberTeamsPage } from "@modules/report-team/react/render-member-teams-page";

const { generateMetadata, default: QcTeamsPage } = createMemberTeamsPage({
  allowedRoles: [AppRoleCode.QUALITY_CHECKER],
  defaultRole: "quality_checker",
  roleOptions: ["quality_checker"],
  welcomePath: "welcome-quality-checker",
});

export { generateMetadata };
export default QcTeamsPage;
