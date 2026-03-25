import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Moon, Sun, Monitor, Trash2, Palette, Shield, Bell, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearData: () => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
  onSetToGoldenTime?: () => void;
  shareAiData: boolean;
  setShareAiData: (val: boolean) => void;
  includeEmptyDays: boolean;
  setIncludeEmptyDays: (val: boolean) => void;
  calorieGoal: number;
  setCalorieGoal: (val: number) => void;
  proteinGoal: number;
  setProteinGoal: (val: number) => void;
  carbsGoal: number;
  setCarbsGoal: (val: number) => void;
  fatsGoal: number;
  setFatsGoal: (val: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onClearData,
  theme,
  setTheme,
  language,
  setLanguage,
  dailyGoal,
  setDailyGoal,
  onSetToGoldenTime,
  shareAiData,
  setShareAiData,
  includeEmptyDays,
  setIncludeEmptyDays,
  calorieGoal,
  setCalorieGoal,
  proteinGoal,
  setProteinGoal,
  carbsGoal,
  setCarbsGoal,
  fatsGoal,
  setFatsGoal,
}) => {
  const [activeTab, setActiveTab] = React.useState<'general' | 'privacy' | 'notifications'>('general');

  const t = {
    ar: {
      settings: 'الإعدادات',
      general: 'عام',
      privacy: 'الخصوصية',
      notifications: 'تنبيهات',
      clearData: 'مسح البيانات',
      themes: 'المظهر',
      white: 'أبيض',
      dark: 'داكن',
      system: 'تلقائي',
      language: 'اللغة',
      arabic: 'العربية',
      english: 'الإنجليزية',
      dailyGoal: 'الهدف اليومي',
      minutes: 'دقيقة',
      goalDesc: 'حدد عدد الدقائق التي تطمح لإنجازها يومياً.',
      privacyDesc: 'بياناتك تُحفظ محلياً في متصفحك فقط. نحن لا نشارك بياناتك مع أي طرف ثالث.',
      privacyControl: 'التحكم في الخصوصية',
      shareAi: 'مشاركة البيانات مع الذكاء الاصطناعي',
      localStorage: 'تخزين محلي فقط',
      notifDesc: 'تفعيل التنبيهات الصوتية عند انتهاء الجلسات.',
      enableNotifs: 'تفعيل التنبيهات',
      sessionSound: 'صوت عند انتهاء الجلسة',
      dailyReminder: 'تذكير يومي بالهدف',
      save: 'حفظ التغييرات',
      setGolden: 'تعيين الوقت الذهبي كهدف',
      includeEmptyDays: 'شمول الأيام الفارغة',
      includeEmptyDaysDesc: 'حساب المتوسط بناءً على جميع الأيام بما فيها التي لم تفتح فيها التطبيق.',
      calorieGoal: "هدف السعرات اليومي",
      proteinGoal: "هدف البروتين اليومي (غ)",
      carbsGoal: "هدف الكربوهيدرات اليومي (غ)",
      fatsGoal: "هدف الدهون اليومي (غ)",
    },
    en: {
      settings: 'Settings',
      general: 'General',
      privacy: 'Privacy',
      notifications: 'Notifications',
      clearData: 'Clear Data',
      themes: 'Themes',
      white: 'White',
      dark: 'Dark',
      system: 'System',
      language: 'Language',
      arabic: 'Arabic',
      english: 'English',
      dailyGoal: 'Daily Goal',
      minutes: 'min',
      goalDesc: 'Set the number of minutes you aim to focus on daily.',
      privacyDesc: 'Your data is stored locally in your browser. We do not share your data with any third party.',
      privacyControl: 'Privacy Control',
      shareAi: 'Share data with AI',
      localStorage: 'Local storage only',
      notifDesc: 'Enable sound notifications when sessions are complete.',
      enableNotifs: 'Enable Notifications',
      sessionSound: 'Session completion sound',
      dailyReminder: 'Daily goal reminder',
      save: 'Save Changes',
      setGolden: 'Set to Golden Time',
      includeEmptyDays: 'Include Empty Days',
      includeEmptyDaysDesc: "Calculate average based on all days, including those you didn't open the app.",
      calorieGoal: "Daily Calorie Goal",
      proteinGoal: "Daily Protein Goal (g)",
      carbsGoal: "Daily Carbs Goal (g)",
      fatsGoal: "Daily Fats Goal (g)",
    }
  }[language];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-[#1A1D23] rounded-[2.5rem] overflow-hidden border border-black/5 dark:border-white/5 shadow-2xl flex flex-col md:flex-row h-[600px]"
          >
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-black/5 dark:bg-white/5 p-8 border-r border-black/5 dark:border-white/5 space-y-8">
              <div className="flex items-center gap-3 text-emerald-500">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <Palette size={20} />
                </div>
                <span className="font-bold text-sm uppercase tracking-widest">{t.settings}</span>
              </div>
              
              <nav className="space-y-2">
                <button 
                  onClick={() => setActiveTab('general')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                    activeTab === 'general' ? "bg-white dark:bg-white/10 shadow-sm" : "text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <Monitor size={16} />
                  <span>{t.general}</span>
                </button>
                <button 
                  onClick={() => setActiveTab('privacy')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                    activeTab === 'privacy' ? "bg-white dark:bg-white/10 shadow-sm" : "text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <Shield size={16} />
                  <span>{t.privacy}</span>
                </button>
                <button 
                  onClick={() => setActiveTab('notifications')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                    activeTab === 'notifications' ? "bg-white dark:bg-white/10 shadow-sm" : "text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <Bell size={16} />
                  <span>{t.notifications}</span>
                </button>
              </nav>

              <div className="pt-8 border-t border-black/5 dark:border-white/5">
                <button 
                  onClick={onClearData}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-500/60 hover:text-red-500 hover:bg-red-500/5 rounded-xl text-sm font-bold transition-all"
                >
                  <Trash2 size={16} />
                  <span>{t.clearData}</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-10 space-y-10 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">{t.settings}</h2>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {activeTab === 'general' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                  {/* Theme Selection */}
                  <div className="space-y-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">{t.themes}</div>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => setTheme('light')}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500' : 'border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5'}`}
                      >
                        <Sun size={20} />
                        <span className="text-[10px] font-bold uppercase">{t.white}</span>
                      </button>
                      <button 
                        onClick={() => setTheme('dark')}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500' : 'border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5'}`}
                      >
                        <Moon size={20} />
                        <span className="text-[10px] font-bold uppercase">{t.dark}</span>
                      </button>
                      <button 
                        onClick={() => setTheme('system')}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${theme === 'system' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500' : 'border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5'}`}
                      >
                        <Monitor size={20} />
                        <span className="text-[10px] font-bold uppercase">{t.system}</span>
                      </button>
                    </div>
                  </div>

                  {/* Language Selection */}
                  <div className="space-y-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">{t.language}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setLanguage('ar')}
                        className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${language === 'ar' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500' : 'border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Globe size={18} className={language === 'ar' ? 'text-emerald-500' : 'opacity-40'} />
                          <span className="text-sm font-bold">{t.arabic}</span>
                        </div>
                        {language === 'ar' && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                      </button>
                      <button 
                        onClick={() => setLanguage('en')}
                        className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${language === 'en' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500' : 'border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Globe size={18} className={language === 'en' ? 'text-emerald-500' : 'opacity-40'} />
                          <span className="text-sm font-bold">{t.english}</span>
                        </div>
                        {language === 'en' && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                      </button>
                    </div>
                  </div>

                  {/* Daily Goal */}
                  <div className="space-y-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">{t.dailyGoal}</div>
                    <div className="p-6 bg-black/5 dark:bg-white/5 rounded-2xl space-y-4">
                      <p className="text-xs font-medium opacity-60">{t.goalDesc}</p>
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <input 
                            type="number" 
                            value={dailyGoal}
                            onChange={(e) => setDailyGoal(Number(e.target.value))}
                            className="w-24 px-4 py-2 bg-white dark:bg-black/20 rounded-xl border-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold"
                          />
                          <span className="text-xs font-bold opacity-40">{t.minutes}</span>
                        </div>
                        {onSetToGoldenTime && (
                          <button
                            onClick={onSetToGoldenTime}
                            className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                          >
                            {t.setGolden}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Food Goals */}
                  <div className="space-y-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">
                      {language === 'ar' ? 'أهداف التغذية' : 'Nutrition Goals'}
                    </div>
                    <div className="p-6 bg-black/5 dark:bg-white/5 rounded-2xl space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t.calorieGoal}</div>
                          <input 
                            type="number" 
                            value={calorieGoal}
                            onChange={(e) => setCalorieGoal(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-white dark:bg-black/20 rounded-xl border-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t.proteinGoal}</div>
                          <input 
                            type="number" 
                            value={proteinGoal}
                            onChange={(e) => setProteinGoal(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-white dark:bg-black/20 rounded-xl border-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t.carbsGoal}</div>
                          <input 
                            type="number" 
                            value={carbsGoal}
                            onChange={(e) => setCarbsGoal(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-white dark:bg-black/20 rounded-xl border-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t.fatsGoal}</div>
                          <input 
                            type="number" 
                            value={fatsGoal}
                            onChange={(e) => setFatsGoal(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-white dark:bg-black/20 rounded-xl border-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'privacy' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">{t.privacyControl}</div>
                  <div className="p-8 bg-black/5 dark:bg-white/5 rounded-[2rem] space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-bold">{t.shareAi}</div>
                        <p className="text-xs opacity-40">{language === 'ar' ? 'السماح للذكاء الاصطناعي بتحليل بياناتك.' : 'Allow AI to analyze your data.'}</p>
                      </div>
                      <button 
                        onClick={() => setShareAiData(!shareAiData)}
                        className={cn(
                          "w-10 h-5 rounded-full relative p-1 transition-colors",
                          shareAiData ? "bg-emerald-500" : "bg-black/10 dark:bg-white/10"
                        )}
                      >
                        <motion.div 
                          animate={{ x: shareAiData ? 20 : 0 }}
                          className="w-3 h-3 bg-white rounded-full" 
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-bold">{t.includeEmptyDays}</div>
                        <p className="text-xs opacity-40">{t.includeEmptyDaysDesc}</p>
                      </div>
                      <button 
                        onClick={() => setIncludeEmptyDays(!includeEmptyDays)}
                        className={cn(
                          "w-10 h-5 rounded-full relative p-1 transition-colors",
                          includeEmptyDays ? "bg-emerald-500" : "bg-black/10 dark:bg-white/10"
                        )}
                      >
                        <motion.div 
                          animate={{ x: includeEmptyDays ? 20 : 0 }}
                          className="w-3 h-3 bg-white rounded-full" 
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-bold">{t.localStorage}</div>
                        <p className="text-xs opacity-40">{language === 'ar' ? 'حفظ البيانات محلياً فقط.' : 'Store data locally only.'}</p>
                      </div>
                      <div className="w-10 h-5 bg-emerald-500 rounded-full relative p-1 cursor-default transition-colors">
                        <div className="w-3 h-3 bg-white rounded-full absolute right-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                    <p className="text-[10px] font-medium leading-relaxed opacity-60">
                      {t.privacyDesc}
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">{t.notifications}</div>
                  <div className="p-8 bg-black/5 dark:bg-white/5 rounded-[2rem] space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-bold">{t.sessionSound}</div>
                        <p className="text-xs opacity-40">{t.notifDesc}</p>
                      </div>
                      <div className="w-10 h-5 bg-emerald-500 rounded-full relative p-1 cursor-pointer transition-colors">
                        <div className="w-3 h-3 bg-white rounded-full absolute right-1" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-bold">{t.dailyReminder}</div>
                        <p className="text-xs opacity-40">{language === 'ar' ? 'تذكير يومي لتحقيق هدفك.' : 'Daily reminder to reach your goal.'}</p>
                      </div>
                      <div className="w-10 h-5 bg-emerald-500 rounded-full relative p-1 cursor-pointer transition-colors">
                        <div className="w-3 h-3 bg-white rounded-full absolute right-1" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
