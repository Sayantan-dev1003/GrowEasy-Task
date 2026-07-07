'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, Megaphone, Menu, X } from 'lucide-react';
import { DarkModeToggle } from '@/components/DarkModeToggle';

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Lead Sources', href: '/', icon: Megaphone },
    { name: 'Manage Leads', href: '/manage-leads', icon: Database },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex-none h-16 border-b dark:border-white/10 border-slate-200 bg-slate-50 dark:bg-surface-900 flex items-center justify-between px-4 sticky top-0 z-30">
        <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">GrowEasy</h1>
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          <button onClick={() => setIsOpen(true)} className="p-2 -mr-2 text-slate-600 dark:text-slate-300">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Sidebar Drawer / Desktop Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r dark:border-white/10 border-slate-200 dark:bg-surface-900 bg-slate-50 flex flex-col h-screen transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b dark:border-white/10 border-slate-200">
          <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">GrowEasy</h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 -mr-2 text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider dark:text-white/40 text-slate-500">
          Main Menu
        </div>
        
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 dark:bg-brand-500/20 font-medium' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-brand-500 dark:text-brand-400' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      </aside>
    </>
  );
}
