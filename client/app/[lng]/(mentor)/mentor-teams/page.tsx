import { AppRoleCode } from "@/lib/app-role-code";
import { createMemberTeamsPage } from "@modules/report-team/react/render-member-teams-page";

const { generateMetadata, default: MentorTeamsPage } = createMemberTeamsPage({
  allowedRoles: [AppRoleCode.MENTOR],
  defaultRole: "mentor",
  roleOptions: ["mentor"],
  welcomePath: "welcome-mentor",
});

export { generateMetadata };
export default MentorTeamsPage;
