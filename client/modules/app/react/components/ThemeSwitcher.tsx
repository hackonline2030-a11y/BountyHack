"use client";
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const src = theme === 'light' ? '/dark.svg' : '/light.svg';
  const label = theme === 'dark' ? 'Light' : 'Dark';

  const placeholderIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 opacity-60"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center gap-2 h-8 min-h-8 min-w-[7.5rem] py-1"
      suppressHydrationWarning
    >
      <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded flex items-center justify-center">
        {mounted ? (
          <Image
            src={src}
            width={24}
            height={24}
            alt=""
            aria-hidden
            className="h-6 w-6 object-contain"
          />
        ) : (
          placeholderIcon
        )}
      </span>
      <span className="text-sm font-medium leading-none">{mounted ? `${label} mode` : 'Dark mode'}</span>
    </button>
  );
};
