import Link from "next/link";
import type { FC, SVGProps } from "react";
import {
  CoordinationIcon,
  SettingsIcon,
  SupportIcon,
  TeamIcon,
} from "./icons";

export type CoordinatorNavLabels = {
  label: string;
  coordination: string;
  teams: string;
  support: string;
  settings: string;
};

export type CoordinatorNavHrefs = {
  coordination: string;
  teams: string;
  support: string;
  settings: string;
};

type NavKey = Exclude<keyof CoordinatorNavLabels, "label">;

type NavItem = {
  key: NavKey;
  Icon: FC<SVGProps<SVGSVGElement>>;
};

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { key: "coordination", Icon: CoordinationIcon },
  { key: "teams", Icon: TeamIcon },
  { key: "support", Icon: SupportIcon },
  { key: "settings", Icon: SettingsIcon },
];

type Props = {
  labels: CoordinatorNavLabels;
  hrefs: CoordinatorNavHrefs;
};

export const CoordinatorDashboardSidebar: FC<Props> = ({ labels, hrefs }) => (
  <aside
    aria-labelledby="coordinator-dashboard-nav-heading"
    className="dashboard-card w-full lg:w-60 lg:shrink-0 lg:self-start"
  >
    <h2 id="coordinator-dashboard-nav-heading" className="sr-only">
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
            {index === 1 && (
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
