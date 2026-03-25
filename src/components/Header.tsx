import React, { useState, useEffect } from 'react';
import { Leaf, User, Settings, Bell, Sun, Moon, LogOut } from 'lucide-react';

interface HeaderProps {
  onLogout: () => void;
  onOpenSettings: () => void;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ar';
  credits: number;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, onOpenSettings, theme, language, credits }) => {
  const t = {
    en: {
      lifeManagement: "Life Management",
      logout: "Logout",
      credits: "Credits",
    },
    ar: {
      lifeManagement: "إدارة الحياة",
      logout: "تسجيل الخروج",
      credits: "كارت",
    }
  }[language];

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#1A1D23]/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
            <Leaf size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tighter uppercase dark:text-white">Verit</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/20 dark:text-white/20">{t.lifeManagement}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-black tracking-tighter">{credits} {t.credits}</span>
          </div>
          <button className="p-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors relative">
            <Bell size={18} />
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#1A1D23]" />
          </button>
          <button 
            onClick={onOpenSettings}
            className="p-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
          >
            <Settings size={18} />
          </button>
          <button 
            onClick={onLogout}
            className="p-2 text-red-500/40 hover:text-red-500 transition-colors"
            title={`${t.logout} | ${language === 'ar' ? 'تسجيل الخروج' : 'Logout'}`}
          >
            <LogOut size={18} />
          </button>
          <div className="w-9 h-9 bg-black/5 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/5 flex items-center justify-center overflow-hidden">
            <User size={18} className="text-black/40 dark:text-white/40" />
          </div>
        </div>
      </div>
    </header>
  );
};
