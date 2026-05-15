import { AppRoleCode } from "@/lib/app-role-code";
import { createMemberTeamsPage } from "@modules/report-team/react/render-member-teams-page";

const { generateMetadata, default: HunterTeamsPage } = createMemberTeamsPage({
  allowedRoles: [AppRoleCode.HUNTER],
  defaultRole: "hunter",
  roleOptions: ["hunter"],
  welcomePath: "welcome-hunter",
});

export { generateMetadata };
export default HunterTeamsPage;
