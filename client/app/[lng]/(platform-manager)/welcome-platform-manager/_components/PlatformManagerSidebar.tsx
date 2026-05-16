import Link from "next/link";
import type { FC, SVGProps } from "react";
import { BookIcon, SettingsIcon } from "./icons";

export type PlatformManagerNavLabels = {
  label: string;
  settings: string;
  credits: string;
};

export type PlatformManagerNavHrefs = {
  settings: string;
  credits: string;
};

type NavKey = Exclude<keyof PlatformManagerNavLabels, "label">;

type NavItem = {
  key: NavKey;
  Icon: FC<SVGProps<SVGSVGElement>>;
};

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { key: "settings", Icon: SettingsIcon },
  { key: "credits", Icon: BookIcon },
];

type Props = {
  labels: PlatformManagerNavLabels;
  hrefs: PlatformManagerNavHrefs;
};

export const PlatformManagerSidebar: FC<Props> = ({ labels, hrefs }) => (
  <aside
    aria-labelledby="platform-manager-nav-heading"
    className="dashboard-card w-full lg:w-60 lg:shrink-0 lg:self-start"
  >
    <h2 id="platform-manager-nav-heading" className="sr-only">
      {labels.label}
    </h2>
    <nav aria-label={labels.label} className="p-2 lg:p-3">
      <ul role="list" className="flex flex-wrap gap-2 lg:flex-col lg:gap-0.5">
        {NAV_ITEMS.map((item) => (
          <li key={item.key}>
            <Link href={hrefs[item.key]} className="dashboard-nav-link">
              <item.Icon className="size-4 shrink-0" />
              <span>{labels[item.key]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  </aside>
);
