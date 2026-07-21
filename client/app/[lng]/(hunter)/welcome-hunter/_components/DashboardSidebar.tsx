import Link from "next/link";
import type { FC, SVGProps } from "react";
import {
  CourseIcon,
  EmailIcon,
  CriteriaIcon,
  MentorIcon,
  ProfileIcon,
  ReportIcon,
  SettingsIcon,
  SupportIcon,
  TeamIcon,
  TrackIcon,
} from "./icons";

export type DashboardNavLabels = {
  label: string;
  emails: string;
  reports: string;
  tracks: string;
  courses: string;
  teams: string;
  mentors: string;
  criteria: string;
  support: string;
  profile: string;
  settings: string;
};

export type DashboardNavHrefs = {
  emails: string;
  reports: string;
  tracks: string;
  courses: string;
  teams: string;
  mentors: string;
  criteria: string;
  support: string;
  profile: string;
  settings: string;
};

type NavKey = Exclude<keyof DashboardNavLabels, "label">;

type NavItem = {
  key: NavKey;
  Icon: FC<SVGProps<SVGSVGElement>>;
};

/**
 * UX groups (mirrored from the spec). The dividers only show up on the
 * vertical desktop layout; on mobile / tablet the items live in a flat
 * row or grid and dividers would be noisy.
 */
const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { key: "emails", Icon: EmailIcon },
  { key: "reports", Icon: ReportIcon },
  { key: "tracks", Icon: TrackIcon },
  { key: "courses", Icon: CourseIcon },
  { key: "teams", Icon: TeamIcon },
  { key: "mentors", Icon: MentorIcon },
  { key: "criteria", Icon: CriteriaIcon },
  { key: "support", Icon: SupportIcon },
  { key: "profile", Icon: ProfileIcon },
  { key: "settings", Icon: SettingsIcon },
];

const GROUP_BREAKS: ReadonlySet<NavKey> = new Set([
  "reports",
  "courses",
  "mentors",
  "criteria",
]);

type Props = {
  labels: DashboardNavLabels;
  hrefs: DashboardNavHrefs;
  /** Optional: highlight the currently-active item for `aria-current`. */
  activeKey?: NavKey;
};

/**
 * Dashboard sidebar nav. Only one breakpoint — the meaningful one, where
 * the layout's *orientation* flips:
 *  - `<lg` (phone + tablet): horizontal `flex flex-wrap` row of content-
 *    sized pills. Items wrap onto as many rows as the viewport needs; no
 *    column count to maintain and no horizontal scroll on tablet.
 *  - `>=lg` (desktop): vertical list inside the white sidebar card, with
 *    visible group dividers.
 *
 * Renders as a server component (no client hooks); the active state is
 * opt-in via `activeKey`.
 */
export const DashboardSidebar: FC<Props> = ({ labels, hrefs, activeKey }) => {
  return (
    <aside
      aria-labelledby="dashboard-nav-heading"
      className="dashboard-card w-full lg:w-60 lg:shrink-0 lg:self-start"
    >
      <h2 id="dashboard-nav-heading" className="sr-only">
        {labels.label}
      </h2>
      <nav aria-label={labels.label} className="p-2 lg:p-3">
        <ul
          role="list"
          className="flex flex-wrap gap-2 lg:flex-col lg:gap-0.5"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === activeKey;
            const showDivider = GROUP_BREAKS.has(item.key);
            return (
              <li key={item.key}>
                <Link
                  href={hrefs[item.key]}
                  className={`dashboard-nav-link${isActive ? " dashboard-nav-link--active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.Icon className="size-4 shrink-0" />
                  <span>{labels[item.key]}</span>
                </Link>
                {showDivider && (
                  <hr
                    aria-hidden
                    className="my-1 hidden border-t border-dashboard-divider lg:block"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
