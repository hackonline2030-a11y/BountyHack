import type { FC } from "react";

type Props = {
  name: string;
  color: string;
  unclassifiedLabel?: string;
};

export const CategoryPill: FC<Props> = ({
  name,
  color,
  unclassifiedLabel = "Unclassified",
}) => {
  const label = name.trim() || unclassifiedLabel;
  const bg = color.trim() || "#94a3b8";
  return (
    <span
      className="inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: bg }}
    >
      {label}
    </span>
  );
};
