import Link from "next/link";
import type { FC, SVGProps } from "react";
import {
  ColleagueIcon,
  EmailIcon,
  ReportIcon,
  SettingsIcon,
  SupportIcon,
  TeamIcon,
} from "./icons";

export type DashboardNavLabels = {
  label: string;
  emails: string;
  reports: string;
  teams: string;
  colleagues: string;
  support: string;
  settings: string;
};

export type DashboardNavHrefs = {
  emails: string;
  reports: string;
  teams: string;
  colleagues: string;
  support: string;
  settings: string;
};

type NavKey = Exclude<keyof DashboardNavLabels, "label">;

type NavItem = {
  key: NavKey;
  Icon: FC<SVGProps<SVGSVGElement>>;
};

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { key: "emails", Icon: EmailIcon },
  { key: "reports", Icon: ReportIcon },
  { key: "teams", Icon: TeamIcon },
  { key: "colleagues", Icon: ColleagueIcon },
  { key: "support", Icon: SupportIcon },
  { key: "settings", Icon: SettingsIcon },
];

const GROUP_BREAKS: ReadonlySet<NavKey> = new Set(["emails", "teams"]);

type Props = {
  labels: DashboardNavLabels;
  hrefs: DashboardNavHrefs;
  activeKey?: NavKey;
};

export const DashboardSidebar: FC<Props> = ({ labels, hrefs, activeKey }) => (
  <aside
    aria-labelledby="dashboard-nav-heading"
    className="dashboard-card w-full lg:w-60 lg:shrink-0 lg:self-start"
  >
    <h2 id="dashboard-nav-heading" className="sr-only">
      {labels.label}
    </h2>
    <nav aria-label={labels.label} className="p-2 lg:p-3">
      <ul role="list" className="flex flex-wrap gap-2 lg:flex-col lg:gap-0.5">
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
