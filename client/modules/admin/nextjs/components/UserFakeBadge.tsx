type Props = {
  label: string;
};

export function UserFakeBadge({ label }: Props) {
  return (
    <span className="inline-flex rounded-full border border-violet-200 bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900">
      {label}
    </span>
  );
}
