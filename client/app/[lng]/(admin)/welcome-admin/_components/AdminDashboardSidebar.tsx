import Link from "next/link";
import type { FC, SVGProps } from "react";
import {
  CriteriaIcon,
  SettingsIcon,
  TeamIcon,
  UserPlusIcon,
  UsersIcon,
} from "./icons";

export type AdminNavLabels = {
  label: string;
  users: string;
  directory: string;
  register: string;
  teams: string;
  criteria: string;
  settings: string;
};

export type AdminNavHrefs = {
  users: string;
  directory: string;
  register: string;
  teams: string;
  criteria: string;
  settings: string;
};

type NavKey = Exclude<keyof AdminNavLabels, "label">;

type NavItem = {
  key: NavKey;
  Icon: FC<SVGProps<SVGSVGElement>>;
};

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { key: "users", Icon: UsersIcon },
  { key: "directory", Icon: UsersIcon },
  { key: "register", Icon: UserPlusIcon },
  { key: "teams", Icon: TeamIcon },
  { key: "criteria", Icon: CriteriaIcon },
  { key: "settings", Icon: SettingsIcon },
];

type Props = {
  labels: AdminNavLabels;
  hrefs: AdminNavHrefs;
};

export const AdminDashboardSidebar: FC<Props> = ({ labels, hrefs }) => (
  <aside
    aria-labelledby="admin-dashboard-nav-heading"
    className="dashboard-card w-full lg:w-60 lg:shrink-0 lg:self-start"
  >
    <h2 id="admin-dashboard-nav-heading" className="sr-only">
      {labels.label}
    </h2>
    <nav aria-label={labels.label} className="p-2 lg:p-3">
      <ul role="list" className="flex flex-wrap gap-2 lg:flex-col lg:gap-0.5">
        {NAV_ITEMS.map((item, index) => (
          <li key={item.key}>
            <Link href={hrefs[item.key]} className="dashboard-nav-link">
              <item.Icon className="size-4 shrink-0" />
              <span>{labels[item.key]}</span>
            </Link>
            {index === 2 && (
              <hr
                aria-hidden
                className="my-1 hidden border-t border-dashboard-divider lg:block"
              />
            )}
          </li>
        ))}
      </ul>
    </nav>
  </aside>
);
