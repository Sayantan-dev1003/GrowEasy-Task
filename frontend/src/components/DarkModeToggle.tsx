'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';

export function DarkModeToggle() {
  const { isDark, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-16" />;
  }

  return (
    <button
      id="dark-mode-toggle"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={clsx(
        'relative inline-flex h-9 w-16 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-transparent',
        isDark ? 'bg-brand-600' : 'bg-slate-200'
      )}
    >
      <span
        className={clsx(
          'absolute flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all duration-300',
          isDark ? 'translate-x-8 bg-surface-900' : 'translate-x-1 bg-white'
        )}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-brand-400" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500" />
        )}
      </span>
    </button>
  );
}
