import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Timer } from './components/Timer';
import { CalendarView } from './components/CalendarView';
import { TimerDuration, TimerSession, LogEntry, FoodAnalysis, TodoItem } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Clock, Play, ListTodo, Plus, X, Check, Zap, BarChart3, Sparkles, Loader2, AlertTriangle, Trash2, LogOut, Utensils, Camera, Send, Info, ArrowDown, ArrowUp, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SettingsModal } from './components/SettingsModal';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { cn } from './lib/utils';

const FRUIT_MAP: Record<number, string> = {
  5: "🍋",
  10: "🫐",
  15: "🍎",
  20: "🍊",
  25: "🍅",
  30: "🍓",
  40: "🍇",
  45: "🍍",
  50: "🍒",
  55: "🥝",
  60: "🍉"
};

const CircularProgress = ({ size, strokeWidth, percentage, color }: { size: number, strokeWidth: number, percentage: number, color: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        className="text-black/5 dark:text-white/5"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        className={color}
      />
    </svg>
  );
};

const FoodListSection = ({ 
  title, 
  items, 
  onAdd, 
  onRemove, 
  onMove,
  placeholder, 
  color,
  language,
  showOptions = false
}: { 
  title: string, 
  items: string[], 
  onAdd: (item: string) => void, 
  onRemove: (index: number) => void, 
  onMove?: (index: number, target: 'reduce' | 'stop' | 'eat') => void,
  placeholder: string,
  color: string,
  language: 'ar' | 'en',
  showOptions?: boolean
}) => {
  const [input, setInput] = useState('');
  return (
    <div className="p-6 bg-black/5 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5 space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{title}</div>
        <div className="text-[10px] font-mono opacity-20">{items.length}</div>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5 group">
            <span className="text-sm font-bold">{item}</span>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {showOptions && onMove && (
                <>
                  <button 
                    onClick={() => onMove(i, 'reduce')}
                    className="p-1 hover:text-yellow-500 transition-colors"
                    title={language === 'ar' ? 'تقليل' : 'Reduce'}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button 
                    onClick={() => onMove(i, 'stop')}
                    className="p-1 hover:text-red-500 transition-colors"
                    title={language === 'ar' ? 'إيقاف' : 'Stop'}
                  >
                    <AlertTriangle size={14} />
                  </button>
                </>
              )}
              {title.includes('Reduce') || title.includes('تقليل') || title.includes('Stop') || title.includes('إيقاف') ? (
                <button 
                  onClick={() => onMove?.(i, 'eat')}
                  className="p-1 hover:text-blue-500 transition-colors"
                  title={language === 'ar' ? 'إعادة للأكل' : 'Move back to Eat'}
                >
                  <ArrowUp size={14} />
                </button>
              ) : null}
              <button onClick={() => onRemove(i)} className="p-1 hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              onAdd(input.trim());
              setInput('');
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-b border-black/10 dark:border-white/10 px-2 py-1 text-sm focus:border-black dark:focus:border-white transition-colors outline-none"
        />
        <button 
          onClick={() => {
            if (input.trim()) {
              onAdd(input.trim());
              setInput('');
            }
          }}
          className={cn("p-2 rounded-lg transition-all", color)}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem('verit_credits');
    return saved ? Number(saved) : 500;
  });
  const [lastRefillDate, setLastRefillDate] = useState<string>(() => {
    return localStorage.getItem('verit_last_refill') || new Date().toDateString();
  });

  useEffect(() => {
    localStorage.setItem('verit_credits', credits.toString());
  }, [credits]);

  useEffect(() => {
    localStorage.setItem('verit_last_refill', lastRefillDate);
  }, [lastRefillDate]);

  useEffect(() => {
    const today = new Date().toDateString();
    if (lastRefillDate !== today) {
      setCredits(prev => prev + 100);
      setLastRefillDate(today);
    }
  }, [lastRefillDate]);

  const checkCredits = (amount: number) => {
    if (credits < amount) {
      const msg = language === 'ar' 
        ? 'لقد نفذ الحد المجاني، يرجى الانتظار حتى اليوم التالي للحصول على المزيد من الكروت.' 
        : 'Free limit reached, please wait until tomorrow for more credits.';
      alert(msg);
      return false;
    }
    return true;
  };

  const consumeCredits = (amount: number) => {
    setCredits(prev => Math.max(0, prev - amount));
  };

  const [activeTimer, setActiveTimer] = useState<{ minutes: number; task: string; fruit: string; sessionId: string } | null>(null);
  const [customMinutes, setCustomMinutes] = useState<string>('25');
  const [sessions, setSessions] = useState<TimerSession[]>(() => {
    try {
      const saved = localStorage.getItem('verit_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading sessions:", e);
      return [];
    }
  });
  const [newTaskName, setNewTaskName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
  });
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    return Number(localStorage.getItem('verit_daily_goal')) || 120;
  });
  const [calorieGoal, setCalorieGoal] = useState<number>(() => {
    return Number(localStorage.getItem('verit_calorie_goal')) || 2000;
  });
  const [proteinGoal, setProteinGoal] = useState<number>(() => {
    return Number(localStorage.getItem('verit_protein_goal')) || 150;
  });
  const [carbsGoal, setCarbsGoal] = useState<number>(() => {
    return Number(localStorage.getItem('verit_carbs_goal')) || 250;
  });
  const [fatsGoal, setFatsGoal] = useState<number>(() => {
    return Number(localStorage.getItem('verit_fats_goal')) || 70;
  });
  const [foodsIEat, setFoodsIEat] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('verit_foods_i_eat');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [foodsIWantToEat, setFoodsIWantToEat] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('verit_foods_i_want_to_eat');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [foodsIWantToReduce, setFoodsIWantToReduce] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('verit_foods_i_want_to_reduce');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [foodsIWantToStop, setFoodsIWantToStop] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('verit_foods_i_want_to_stop');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [foodListAdvice, setFoodListAdvice] = useState<string | null>(null);
  const [isAnalyzingFoodList, setIsAnalyzingFoodList] = useState(false);
  const [foodListChatInput, setFoodListChatInput] = useState('');
  const [foodListChatHistory, setFoodListChatHistory] = useState<{ role: 'user' | 'mert', content: string }[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('verit_is_logged_in') === 'true';
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [language, setLanguage] = useState<'ar' | 'en'>(() => {
    return (localStorage.getItem('verit_language') as 'ar' | 'en') || 'ar';
  });
  const [shareAiData, setShareAiData] = useState(() => {
    return localStorage.getItem('verit_share_ai_data') === 'true';
  });
  const [includeEmptyDays, setIncludeEmptyDays] = useState(() => {
    return localStorage.getItem('verit_include_empty_days') === 'true';
  });

  const t = {
    en: {
      focus: "Focus",
      food: "Food",
      sessions: "Sessions",
      hours: "Hours",
      dailyGoal: "Daily Goal (Min)",
      aiAssistant: "AI Assistant",
      aiAnalysis: "AI Analysis",
      askMe: "Ask me about your focus or food...",
      start: "Start",
      pause: "Pause",
      resume: "Resume",
      reset: "Reset",
      tasks: "Tasks",
      addTask: "Add a new task...",
      today: "Today",
      goldenDay: "Golden Day",
      noSessions: "No sessions recorded yet.",
      clearData: "Clear All Data",
      settings: "Settings",
      calendar: "Calendar",
      logout: "Logout",
      totalFocus: "Total Focus Time",
      sessionsCount: "Sessions Completed",
      activeTasks: "Active Tasks",
      completedTasks: "Completed Tasks",
      todaysSessions: "Today's Sessions",
      todaysHours: "Today's Hours",
      weeklyData: "Weekly Data",
      performance: "Performance",
      amazingPerformance: "Amazing performance! You're at your peak focus 🌱",
      keepGoing: "Keep up the great momentum! ✨",
      peakDay: "Peak Day",
      mostProductiveDay: "Most Productive Day",
      recent: "Recent",
      sessionHistory: "Session History",
      mertAi: "Mert AI",
      askMert: "Ask Mert about your performance today...",
      foodScanner: "Food Scanner",
      uploadFile: "Upload File",
      protein: "Protein",
      carbs: "Carbs",
      fats: "Fats",
      loginWelcome: "We value your time and privacy. Log in to start working together calmly.",
      email: "Email",
      password: "Password",
      loginOrCreate: "Login / Create Account",
      loginErrorMsg: "Please check the entered data",
      terms: "Terms of Privacy and Respect",
      lifeManagement: "Life Management",
      average: "Average",
      dailyAverage: "Daily Average",
      weeklyAverage: "Weekly Average",
      allTimeAverage: "All-time Average",
      caloriesLeft: "Calories left",
      carbsLeft: "Carbs Left",
      proteinLeft: "Protein left",
      fatLeft: "Fat Left",
      foodsIEat: "Foods I Eat",
      foodsIWantToEat: "Foods I Want to Eat",
      foodsIWantToReduce: "Foods I Want to Reduce",
      foodsIWantToStop: "Foods I Want to Stop",
      aiAdvice: "Mert's Advice",
      getAdvice: "Get Advice",
      foodList: "Food List",
      addFood: "Add food...",
      offlineMode: "Offline Mode",
      aiRequiresOnline: "AI features require an internet connection.",
      todo: "To Do",
      todoPlaceholder: "What needs to be done?",
      emptyTodo: "No tasks yet. Add one above!",
    },
    ar: {
      focus: "التركيز",
      food: "الطعام",
      sessions: "الجلسات",
      hours: "الساعات",
      dailyGoal: "الهدف اليومي (دقائق)",
      aiAssistant: "مساعد الذكاء الاصطناعي",
      aiAnalysis: "تحليل الذكاء الاصطناعي",
      askMe: "اسألني عن تركيزك أو طعامك...",
      start: "ابدأ",
      pause: "إيقاف مؤقت",
      resume: "استئناف",
      reset: "إعادة تعيين",
      tasks: "المهام",
      addTask: "إضافة مهمة جديدة...",
      today: "اليوم",
      goldenDay: "اليوم الذهبي",
      noSessions: "لا توجد جلسات مسجلة بعد.",
      clearData: "مسح جميع البيانات",
      settings: "الإعدادات",
      calendar: "التقويم",
      logout: "تسجيل الخروج",
      totalFocus: "إجمالي وقت التركيز",
      sessionsCount: "الجلسات المكتملة",
      activeTasks: "المهام النشطة",
      completedTasks: "المهام المكتملة",
      todaysSessions: "جلسات اليوم",
      todaysHours: "ساعات اليوم",
      weeklyData: "بيانات أسبوعية",
      performance: "الأداء",
      amazingPerformance: "أداء مذهل! أنت في قمة تركيزك 🌱",
      keepGoing: "استمر في هذا الزخم الرائع! ✨",
      peakDay: "اليوم الأكثر إنجازاً",
      mostProductiveDay: "اليوم الأكثر إنتاجية",
      recent: "السجل",
      sessionHistory: "سجل الجلسات",
      mertAi: "المساعد الذكي مرت",
      askMert: "اسأل مرت عن أدائك اليوم...",
      foodScanner: "ماسح الطعام",
      uploadFile: "ارفع ملف",
      protein: "بروتين",
      carbs: "كربوهيدرات",
      fats: "دهون",
      loginWelcome: "نقدر وقتك وخصوصيتك. سجل دخولك لنبدأ العمل معاً بكل هدوء.",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      loginOrCreate: "تسجيل الدخول / إنشاء حساب",
      loginErrorMsg: "من فضلك تأكد من البيانات المدخلة",
      terms: "شروط الخصوصية والاحترام",
      lifeManagement: "إدارة الحياة",
      average: "المتوسط",
      dailyAverage: "المتوسط اليومي",
      weeklyAverage: "متوسط الأسبوع",
      allTimeAverage: "المتوسط العام",
      caloriesLeft: "السعرات المتبقية",
      carbsLeft: "الكربوهيدرات المتبقية",
      proteinLeft: "البروتين المتبقي",
      fatLeft: "الدهون المتبقية",
      foodsIEat: "أطعمة آكلها",
      foodsIWantToEat: "أطعمة أريد أكلها",
      foodsIWantToReduce: "أطعمة أريد تقليلها",
      foodsIWantToStop: "أطعمة أريد إيقافها",
      aiAdvice: "نصيحة مرت",
      getAdvice: "احصل على نصيحة",
      foodList: "قائمة الطعام",
      addFood: "أضف طعاماً...",
      offlineMode: "وضع عدم الاتصال",
      aiRequiresOnline: "ميزات الذكاء الاصطناعي تتطلب اتصالاً بالإنترنت.",
      todo: "قائمة المهام",
      todoPlaceholder: "ما الذي يجب القيام به؟",
      emptyTodo: "لا توجد مهام بعد. أضف واحدة أعلاه!",
    }
  }[language];
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [users, setUsers] = useState<{ email: string; password: string }[]>(() => {
    try {
      const saved = localStorage.getItem('verit_users');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading users:", e);
      return [];
    }
  });
  const [foodLogs, setFoodLogs] = useState<LogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('verit_food_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading food logs:", e);
      return [];
    }
  });
  const [foodInput, setFoodInput] = useState('');
  const [activeTab, setActiveTab] = useState<'focus' | 'food' | 'todo'>('focus');
  const [todoItems, setTodoItems] = useState<TodoItem[]>(() => {
    try {
      const saved = localStorage.getItem('verit_todo_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading todo items:", e);
      return [];
    }
  });
  const [todoInput, setTodoInput] = useState('');
  const [selectedFoodImage, setSelectedFoodImage] = useState<string | null>(null);
  const [isAnalyzingFood, setIsAnalyzingFood] = useState(false);
  const [foodAnalysis, setFoodAnalysis] = useState<FoodAnalysis | null>(null);
  const [foodChatInput, setFoodChatInput] = useState('');
  const [isFoodChatting, setIsFoodChatting] = useState(false);

  const todaySessions = React.useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return sessions.filter(s => s.startTime >= startOfToday);
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('verit_todo_items', JSON.stringify(todoItems));
  }, [todoItems]);

  const addTodoItem = (text: string) => {
    const newItem: TodoItem = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      completed: false,
      createdAt: Date.now()
    };
    setTodoItems([newItem, ...todoItems]);
  };

  const toggleTodoItem = (id: string) => {
    setTodoItems(todoItems.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const removeTodoItem = (id: string) => {
    setTodoItems(todoItems.filter(item => item.id !== id));
  };

  const todayFoodLogs = React.useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return foodLogs.filter(log => log.timestamp >= startOfToday && log.analysis);
  }, [foodLogs]);

  const consumedStats = React.useMemo(() => {
    return todayFoodLogs.reduce((acc, log) => {
      const analysis = log.analysis?.visual_data;
      if (!analysis) return acc;
      
      const calories = parseInt(analysis.calories) || 0;
      const pPercent = analysis.nutrients.protein || 0;
      const cPercent = analysis.nutrients.carbs || 0;
      const fPercent = analysis.nutrients.fats || 0;

      acc.calories += calories;
      acc.protein += (calories * (pPercent / 100)) / 4;
      acc.carbs += (calories * (cPercent / 100)) / 4;
      acc.fats += (calories * (fPercent / 100)) / 9;
      
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }, [todayFoodLogs]);

  useEffect(() => {
    localStorage.setItem('verit_food_logs', JSON.stringify(foodLogs));
  }, [foodLogs]);

  useEffect(() => {
    localStorage.setItem('verit_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('verit_is_logged_in', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('verit_daily_goal', String(dailyGoal));
  }, [dailyGoal]);

  useEffect(() => {
    localStorage.setItem('verit_calorie_goal', String(calorieGoal));
  }, [calorieGoal]);

  useEffect(() => {
    localStorage.setItem('verit_protein_goal', String(proteinGoal));
  }, [proteinGoal]);

  useEffect(() => {
    localStorage.setItem('verit_carbs_goal', String(carbsGoal));
  }, [carbsGoal]);

  useEffect(() => {
    localStorage.setItem('verit_fats_goal', String(fatsGoal));
  }, [fatsGoal]);

  useEffect(() => {
    localStorage.setItem('verit_language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('verit_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('verit_share_ai_data', String(shareAiData));
  }, [shareAiData]);

  useEffect(() => {
    localStorage.setItem('verit_include_empty_days', String(includeEmptyDays));
  }, [includeEmptyDays]);

  useEffect(() => {
    localStorage.setItem('verit_foods_i_eat', JSON.stringify(foodsIEat));
  }, [foodsIEat]);

  useEffect(() => {
    localStorage.setItem('verit_foods_i_want_to_eat', JSON.stringify(foodsIWantToEat));
  }, [foodsIWantToEat]);

  useEffect(() => {
    localStorage.setItem('verit_foods_i_want_to_reduce', JSON.stringify(foodsIWantToReduce));
  }, [foodsIWantToReduce]);

  useEffect(() => {
    localStorage.setItem('verit_foods_i_want_to_stop', JSON.stringify(foodsIWantToStop));
  }, [foodsIWantToStop]);

  const getClosestFruit = (minutes: number) => {
    const presetMinutes = Object.keys(FRUIT_MAP).map(Number);
    const closest = presetMinutes.reduce((prev, curr) => {
      return (Math.abs(curr - minutes) < Math.abs(prev - minutes) ? curr : prev);
    });
    return FRUIT_MAP[closest];
  };

  const startTimer = (minutes: number, task: string, fruit?: string) => {
    if (!checkCredits(1)) return;
    consumeCredits(1);
    const finalFruit = fruit || FRUIT_MAP[minutes] || getClosestFruit(minutes);
    const sessionId = Math.random().toString(36).substring(2, 9);
    setActiveTimer({ minutes, task, fruit: finalFruit, sessionId });
    
    // Auto-complete task when session starts
    setTodoItems(prev => prev.map(item => 
      item.text === task ? { ...item, completed: true } : item
    ));
    
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleTimerComplete = React.useCallback(() => {
    if (activeTimer) {
      const newSession: TimerSession = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        userId: 'local-user',
        startTime: Date.now() - (activeTimer.minutes * 60 * 1000),
        duration: activeTimer.minutes,
        completed: true,
        taskName: activeTimer.task,
        fruitIcon: activeTimer.fruit
      };
      
      setSessions(prev => {
        const isDuplicate = prev.length > 0 && 
          Math.abs(prev[0].startTime - newSession.startTime) < 5000 &&
          prev[0].duration === newSession.duration &&
          prev[0].taskName === newSession.taskName;
        
        if (isDuplicate) return prev;
        return [newSession, ...prev];
      });
    }
  }, [activeTimer]);

  const getPeakDay = () => {
    if (sessions.length === 0) return null;
    const dayTotals: Record<string, number> = {};
    const dayFormatter = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' });
    
    sessions.forEach(s => {
      const day = dayFormatter.format(new Date(s.startTime));
      dayTotals[day] = (dayTotals[day] || 0) + s.duration;
    });

    const peakDay = Object.entries(dayTotals).reduce((a, b) => a[1] > b[1] ? a : b);
    return {
      day: peakDay[0],
      hours: Math.floor(peakDay[1] / 60),
      minutes: peakDay[1] % 60,
      totalMinutes: peakDay[1]
    };
  };

  const handleSetToGoldenTime = () => {
    const peak = getPeakDay();
    if (peak) {
      setDailyGoal(peak.totalMinutes);
    }
  };

  const getAverageStats = () => {
    if (sessions.length === 0) return { weekly: 0, allTime: 0 };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // All-time average
    const firstSession = sessions.reduce((prev, curr) => prev.startTime < curr.startTime ? prev : curr);
    const daysSinceStart = Math.max(1, Math.ceil((startOfToday - firstSession.startTime) / (1000 * 60 * 60 * 24)) + 1);
    
    const totalDuration = sessions.reduce((acc, s) => acc + s.duration, 0);
    
    let allTimeAvg;
    if (includeEmptyDays) {
      allTimeAvg = totalDuration / daysSinceStart;
    } else {
      const activeDays = new Set(sessions.map(s => new Date(s.startTime).toDateString())).size;
      allTimeAvg = totalDuration / activeDays;
    }

    // Weekly average (last 7 days)
    const sevenDaysAgo = startOfToday - (6 * 1000 * 60 * 60 * 24);
    const weeklySessions = sessions.filter(s => s.startTime >= sevenDaysAgo);
    const weeklyTotal = weeklySessions.reduce((acc, s) => acc + s.duration, 0);
    
    let weeklyAvg;
    if (includeEmptyDays) {
      weeklyAvg = weeklyTotal / 7;
    } else {
      const activeWeeklyDays = new Set(weeklySessions.map(s => new Date(s.startTime).toDateString())).size;
      weeklyAvg = activeWeeklyDays > 0 ? weeklyTotal / activeWeeklyDays : 0;
    }

    return {
      weekly: Math.round(weeklyAvg),
      allTime: Math.round(allTimeAvg)
    };
  };

  const getWeeklyData = () => {
    const dayFormatter = new Intl.DateTimeFormat('ar-EG', { weekday: 'short' });
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return dayFormatter.format(d);
    }).reverse();

    return last7Days.map(day => {
      const total = sessions
        .filter(s => dayFormatter.format(new Date(s.startTime)) === day)
        .reduce((acc, s) => acc + s.duration, 0);
      return { name: day, value: total };
    });
  };

  const handleChatSubmit = async () => {
    if (!isOnline) {
      setAnalysisResult(language === 'ar' ? "أنت غير متصل بالإنترنت. الذكاء الاصطناعي يتطلب اتصالاً." : "You are offline. AI features require an internet connection.");
      return;
    }
    if (!chatInput.trim()) return;
    if (!checkCredits(5)) return;
    
    const userMessage = chatInput;
    setChatInput('');
    setIsAnalyzing(true);
    consumeCredits(5);
    
    try {
      const apiKey = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY 
        ? process.env.GEMINI_API_KEY 
        : (import.meta as any).env?.VITE_GEMINI_API_KEY || "";

      if (!apiKey) {
        throw new Error("API Key is missing");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const now = new Date();
      const todayMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);
      const todayHours = Math.floor(todayMinutes / 60);
      const todayRemainingMinutes = todayMinutes % 60;

      const dayFormatter = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' });
      
      // Today's sessions string
      const todaySessionData = todaySessions.length > 0 
        ? todaySessions.map(s => {
            const fruit = FRUIT_MAP[s.duration] || getClosestFruit(s.duration);
            return `(${fruit}، ${s.duration}د)`;
          }).join('، ')
        : "لا توجد جلسات مسجلة لليوم بعد.";

      // All sessions for historical context (Golden Day)
      const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
      const totalHours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;

      // Calculate Golden Day
      let goldenDayInfo = "لا توجد بيانات كافية لليوم الذهبي.";
      if (sessions.length > 0) {
        const dayTotals: Record<string, number> = {};
        sessions.forEach(s => {
          const day = dayFormatter.format(new Date(s.startTime));
          dayTotals[day] = (dayTotals[day] || 0) + s.duration;
        });
        const peak = Object.entries(dayTotals).reduce((a, b) => a[1] > b[1] ? a : b);
        goldenDayInfo = `${peak[0]} (بإجمالي ${Math.floor(peak[1] / 60)} ساعة و ${peak[1] % 60} دقيقة)`;
      }

      const systemPrompt = shareAiData ? `
اسمك هو "مرت" (Mert)، المساعد الذكي الرسمي وحارس الخصوصية لتطبيق Verit.
أنت لست مجرد برنامج، بل "كوتش" رقمي يحلل البيانات ليساعد المستخدم على الازدهار (Flourish).

قواعد الإجابة:
1. اللغة: لغة عربية فصحى معاصرة، أنيقة، ومختصرة.
2. الصدق والشفافية: إذا لم تتوفر بيانات كافية للإجابة، اطلب من المستخدم إكمال جلسة موقت أولاً.
3. التفاعل: كن مشجعاً وحفز المستخدم بناءً على أداء "اليوم" بشكل أساسي.
4. الهوية: عندما يسألك المستخدم عن اسمك، أجب بكل ثقة وهدوء: "أنا مرت، مساعدك الذكي في تطبيق Verit."

النبرة: وقورة، رسمية، وتوحي بالأمان.

القدرة التحليلية (الربط بالبيانات):
بيانات "اليوم" (${dayFormatter.format(now)}):
- جلسات اليوم: ${todaySessionData}
- إجمالي وقت اليوم: ${todayHours} ساعة و ${todayRemainingMinutes} دقيقة.
- عدد جلسات اليوم: ${todaySessions.length}

بيانات تاريخية (لليوم الذهبي والإحصائيات الكلية):
- اليوم الذهبي (أفضل يوم تاريخياً): ${goldenDayInfo}
- إجمالي الوقت الكلي: ${totalHours} ساعة و ${remainingMinutes} دقيقة.
- إجمالي عدد الجلسات الكلي: ${sessions.length}

عندما يسألك المستخدم، استخدم هذه البيانات للإجابة على:
- تقييم الأداء: ركز تقييمك العام ونصائحك على أداء المستخدم "اليوم" فقط.
- إحصائيات الفواكه: معرفة أي فاكهة هي الأكثر استخداماً اليوم.
- اليوم الذهبي: تحديد اليوم الذي تم فيه العمل لأكبر عدد من الساعات تاريخياً (لا يتغير بتغير اليوم).
- مجموع الوقت: اذكر وقت اليوم بشكل أساسي، والوقت الكلي إذا طُلب منك.

أجب الآن على رسالة المستخدم التالية باحترافية وهدوء:
"${userMessage}"
      ` : `
اسمك هو "مرت" (Mert)، المساعد الذكي الرسمي وحارس الخصوصية لتطبيق Verit.
أنت لست مجرد برنامج، بل "كوتش" رقمي يحلل البيانات ليساعد المستخدم على الازدهار (Flourish).

قواعد الإجابة:
1. اللغة: لغة عربية فصحى معاصرة، أنيقة، ومختصرة.
2. الصدق والشفافية: لقد اختار المستخدم عدم مشاركة بياناته معك حالياً. أخبره بلطف أنك لا تملك الوصول لبياناته بسبب إعدادات الخصوصية، ولكن يمكنك الإجابة على أسئلة عامة حول التركيز والإنتاجية.
3. التفاعل: كن مشجعاً وحفز المستخدم.
4. الهوية: عندما يسألك المستخدم عن اسمك، أجب بكل ثقة وهدوء: "أنا مرت، مساعدك الذكي في تطبيق Verit."

النبرة: وقورة، رسمية، وتوحي بالأمان.

أجب الآن على رسالة المستخدم التالية باحترافية وهدوء:
"${userMessage}"
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: systemPrompt,
      });

      setAnalysisResult(response.text);
    } catch (error) {
      console.error("Chat error:", error);
      setAnalysisResult("عذراً، واجهت مشكلة في الاتصال. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMinutes);
    if (isNaN(mins) || mins <= 0) return;
    startTimer(mins, "Custom Session");
  };

  const clearAllData = () => {
    setSessions([]);
    setTodoItems([]);
    setFoodLogs([]);
    setFoodsIEat([]);
    setFoodsIWantToEat([]);
    setFoodsIWantToReduce([]);
    setFoodsIWantToStop([]);
    setAnalysisResult(null);
    localStorage.clear();
    setShowConfirmModal(false);
  };

  const handleTaskChange = React.useCallback((newTask: string) => 
    setActiveTimer(prev => prev ? { ...prev, task: newTask } : { minutes: 25, task: newTask, fruit: "🍅", sessionId: Math.random().toString(36).substring(2, 9) }), 
  []);

  const handleAddTask = React.useCallback((name: string) => addTodoItem(name), [addTodoItem]);

  const handleCancelTimer = React.useCallback(() => setActiveTimer(null), []);

  const handleFoodImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      setSelectedFoodImage(base64Data);
      await analyzeFoodImage(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const analyzeFoodImage = async (base64Image: string) => {
    if (!isOnline) {
      setFoodAnalysis({
        visual_data: {
          ingredients: [],
          nutrients: { protein: 0, carbs: 0, fats: 0 },
          calories: '0',
          medical_alerts: []
        },
        mert_chat_response: language === 'ar' ? "أنت غير متصل بالإنترنت. الذكاء الاصطناعي يتطلب اتصالاً." : "You are offline. AI features require an internet connection."
      });
      return;
    }
    if (!shareAiData) {
      setFoodAnalysis({
        visual_data: {
          ingredients: [],
          nutrients: { protein: 0, carbs: 0, fats: 0 },
          calories: '0',
          medical_alerts: []
        },
        mert_chat_response: language === 'ar' ? 'يرجى تفعيل "ربط البيانات بالذكاء الاصطناعي" في الإعدادات لتحليل الطعام.' : 'Please enable "Link data with AI" in settings to analyze food.'
      });
      setIsAnalyzingFood(false);
      return;
    }
    if (!checkCredits(40)) {
      setIsAnalyzingFood(false);
      return;
    }
    setIsAnalyzingFood(true);
    setFoodAnalysis(null);
    try {
      consumeCredits(40);
      const apiKey = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY 
        ? process.env.GEMINI_API_KEY 
        : (import.meta as any).env?.VITE_GEMINI_API_KEY || "";

      if (!apiKey) throw new Error("API Key is missing");

      const ai = new GoogleGenAI({ apiKey });
      
      const base64Content = base64Image.split(',')[1];
      
      const prompt = `
        أنت "مرت" (Mert)، المحلل البصري لتطبيق Verit. مهمتك هي تحليل صورة الطعام بدقة متناهية واستخراج البيانات التقنية المباشرة والواقعية فقط بناءً على ما تراه.

        المهمة التحليلية (Vision Task):
        1. التحليل البصري الصرف: ذكر المكونات الموجودة في الصورة فعلياً بدقة (مثلاً: "صدر دجاج مشوي"، "أرز بسمتي"، "سلطة خضراء").
        2. الأعمدة الحيوية (Dynamic Bars): استخراج نسب المغذيات الكبرى (البروتين، الكربوهيدرات، الدهون) بناءً على تقدير واقعي لحجم الحصة والمكونات الظاهرة. يجب أن تعكس النسب التوزيع الطاقي التقريبي للوجبة.
        3. السعرات الحرارية: تقدير واقعي للسعرات الحرارية بناءً على كثافة الطاقة في المكونات (مثلاً: الوجبات المقلية تأخذ سعرات أعلى).
        4. تنبيهات صحية واقعية ودقيقة (Specific & Realistic Health Alerts):
           - البقوليات (مثل الفول والعدس): "قد يسبب غازات وتهيجاً لمرضى القولون العصبي، ويمنع لمرضى أنيميا الفول (G6PD)".
           - الكربوهيدرات المكررة/السكريات: "مؤشر جلايسيمي مرتفع - خطر لمرضى السكري ومقاومة الأنسولين".
           - التوابل الحارة/الأحماض: "مهيج قوي للقولون العصبي وقرحة المعدة".
           - الدهون المشبعة/المقليات: "عالي الكوليسترول - غير مناسب لمرضى القلب والضغط".
           - الأملاح العالية (المخللات/المعلبات): "صوديوم مرتفع - قد يسبب احتباس سوائل وارتفاع ضغط الدم".
           - منتجات الألبان الظاهرة: "قد يسبب اضطرابات لمن يعانون من حساسية اللاكتوز".
           - إذا كانت الوجبة متوازنة: "وجبة متوازنة ومغذية".
           - إذا كانت تفتقر للألياف: "منخفض الألياف - يفضل إضافة خضروات ورقية".

        يجب أن تكون تقديراتك مبنية على المعايير الغذائية العالمية للوجبات المشابهة.

        يجب أن يكون الرد بتنسيق JSON حصراً كما يلي:
        {
          "visual_data": {
            "ingredients": ["مكون دقيق 1", "مكون دقيق 2"],
            "nutrients": {
              "protein": 30,
              "carbs": 50,
              "fats": 20
            },
            "calories": "350 Kcal",
            "medical_alerts": ["تنبيه واقعي 1"]
          },
          "mert_chat_response": "مرحباً، أنا مرت. لقد حللت وجبتك بواقعية..."
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: base64Content } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text);
      setFoodAnalysis(result);
      
      // Add to logs
      const newLog: LogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        userId: 'local-user',
        timestamp: Date.now(),
        type: 'food',
        content: `تحليل وجبة: ${result.visual_data.ingredients.join(', ')}`,
        imageUrl: base64Image,
        analysis: result
      };
      setFoodLogs(prev => [newLog, ...prev]);

    } catch (error) {
      console.error("Food analysis error:", error);
    } finally {
      setIsAnalyzingFood(false);
    }
  };

  const handleFoodChatSubmit = async () => {
    if (!isOnline) {
      setFoodAnalysis(prev => prev ? { ...prev, mert_chat_response: language === 'ar' ? "أنت غير متصل بالإنترنت." : "You are offline." } : null);
      return;
    }
    if (!foodChatInput.trim() || !foodAnalysis) return;
    if (!checkCredits(5)) return;
    
    const userMessage = foodChatInput;
    setFoodChatInput('');
    setIsFoodChatting(true);
    consumeCredits(5);
    
    try {
      const apiKey = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY 
        ? process.env.GEMINI_API_KEY 
        : (import.meta as any).env?.VITE_GEMINI_API_KEY || "";

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        أنت "مرت" (Mert)، المحلل البصري لتطبيق Verit.
        لقد قمت مسبقاً بتحليل صورة طعام وخرجت بالنتائج التالية:
        المكونات: ${foodAnalysis.visual_data.ingredients.join(', ')}
        المغذيات: بروتين ${foodAnalysis.visual_data.nutrients.protein}%, كربوهيدرات ${foodAnalysis.visual_data.nutrients.carbs}%, دهون ${foodAnalysis.visual_data.nutrients.fats}%
        السعرات: ${foodAnalysis.visual_data.calories}
        التنبيهات: ${foodAnalysis.visual_data.medical_alerts.join(', ')}

        أجب على سؤال المستخدم بناءً على هذه البيانات فقط وبنبرة مرت (وقورة، رسمية، ومختصرة):
        "${userMessage}"
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setFoodAnalysis(prev => prev ? { ...prev, mert_chat_response: response.text } : null);
    } catch (error) {
      console.error("Food chat error:", error);
    } finally {
      setIsFoodChatting(false);
    }
  };

  const getFoodListAdvice = async () => {
    if (!isOnline) {
      setFoodListAdvice(language === 'ar' ? "أنت غير متصل بالإنترنت. الذكاء الاصطناعي يتطلب اتصالاً." : "You are offline. AI features require an internet connection.");
      return;
    }
    if (!shareAiData) {
      setFoodListAdvice(language === 'ar' ? 'يرجى تفعيل "ربط البيانات بالذكاء الاصطناعي" في الإعدادات للحصول على نصيحة.' : 'Please enable "Link data with AI" in settings to get advice.');
      return;
    }
    if (!checkCredits(5)) return;
    setIsAnalyzingFoodList(true);
    try {
      consumeCredits(5);
      const apiKey = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY 
        ? process.env.GEMINI_API_KEY 
        : (import.meta as any).env?.VITE_GEMINI_API_KEY || "";

      if (!apiKey) throw new Error("API Key is missing");

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        أنت "مرت" (Mert)، خبير التغذية الذكي لتطبيق Verit.
        بناءً على قوائم الطعام الخاصة بالمستخدم:
        1. أطعمة يأكلها: ${foodsIEat.join(', ')}
        2. أطعمة يريد أكلها: ${foodsIWantToEat.join(', ')}
        3. أطعمة يريد تقليلها: ${foodsIWantToReduce.join(', ')}
        4. أطعمة يريد إيقافها: ${foodsIWantToStop.join(', ')}

        قدم نصيحة واقعية، علمية، ومشجعة باللغة العربية الفصحى. 
        حلل التوازن الغذائي، قدم بدائل ذكية، واشرح فوائد أو أضرار بعض الأطعمة المذكورة بشكل مقتضب ومفيد.
        اجعل النبرة وقورة وداعمة.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setFoodListAdvice(response.text);
    } catch (error) {
      console.error("Food list advice error:", error);
      setFoodListAdvice(language === 'ar' ? 'عذراً، واجهت مشكلة في تحليل القائمة.' : 'Sorry, I encountered an issue analyzing the list.');
    } finally {
      setIsAnalyzingFoodList(false);
    }
  };

  const handleFoodListChatSubmit = async () => {
    if (!isOnline) {
      setFoodListChatHistory(prev => [...prev, { role: 'mert', content: language === 'ar' ? "أنت غير متصل بالإنترنت. يرجى الاتصال لاستخدام دردشة مرت." : "You are offline. Please connect to use Mert Chat." }]);
      return;
    }
    if (!foodListChatInput.trim()) return;
    if (!shareAiData) {
      setFoodListChatHistory(prev => [...prev, { role: 'mert', content: language === 'ar' ? 'يرجى تفعيل "ربط البيانات بالذكاء الاصطناعي" في الإعدادات.' : 'Please enable "Link data with AI" in settings.' }]);
      return;
    }

    const userMsg = foodListChatInput;
    setFoodListChatInput('');
    if (!checkCredits(5)) return;
    setFoodListChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAnalyzingFoodList(true);

    try {
      consumeCredits(5);
      const apiKey = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY 
        ? process.env.GEMINI_API_KEY 
        : (import.meta as any).env?.VITE_GEMINI_API_KEY || "";

      const ai = new GoogleGenAI({ apiKey });
      
      const historyStr = foodListChatHistory.map(h => `${h.role === 'user' ? 'المستخدم' : 'مرت'}: ${h.content}`).join('\n');
      
      const prompt = `
        أنت "مرت" (Mert)، خبير التغذية الذكي لتطبيق Verit.
        بيانات قوائم الطعام الحالية للمستخدم:
        1. أطعمة يأكلها: ${foodsIEat.join(', ')}
        2. أطعمة يريد أكلها: ${foodsIWantToEat.join(', ')}
        3. أطعمة يريد تقليلها: ${foodsIWantToReduce.join(', ')}
        4. أطعمة يريد إيقافها: ${foodsIWantToStop.join(', ')}

        سجل المحادثة الحالي:
        ${historyStr}

        سؤال المستخدم الجديد: "${userMsg}"

        أجب بنبرة مرت (وقورة، هادئة، علمية، ومختصرة) وباللغة العربية الفصحى.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setFoodListChatHistory(prev => [...prev, { role: 'mert', content: response.text }]);
    } catch (error) {
      console.error("Food list chat error:", error);
    } finally {
      setIsAnalyzingFoodList(false);
    }
  };

  const handleAddFoodLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodInput.trim()) return;
    
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      userId: 'local-user',
      timestamp: Date.now(),
      type: 'food',
      content: foodInput.trim()
    };
    
    setFoodLogs(prev => [newLog, ...prev]);
    setFoodInput('');
  };

  const deleteFoodLog = (id: string) => {
    setFoodLogs(prev => prev.filter(log => log.id !== id));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const existingUser = users.find(u => u.email === loginForm.email);

    if (existingUser) {
      if (existingUser.password === loginForm.password) {
        setIsLoggedIn(true);
      } else {
        setLoginError(t.loginErrorMsg);
      }
    } else {
      setUsers(prev => [...prev, { email: loginForm.email, password: loginForm.password }]);
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#1A1D23] flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-12 text-center"
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[#10B981]/10 rounded-2xl flex items-center justify-center text-[#10B981]">
              <Leaf size={32} />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-white tracking-tight">Verit</h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-[280px] mx-auto font-medium">
              {t.loginWelcome}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <input 
                type="email" 
                required
                placeholder={t.email}
                value={loginForm.email}
                onChange={(e) => {
                  setLoginForm({...loginForm, email: e.target.value});
                  setLoginError(null);
                }}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 transition-all text-sm"
              />
              <input 
                type="password" 
                required
                placeholder={t.password}
                value={loginForm.password}
                onChange={(e) => {
                  setLoginForm({...loginForm, password: e.target.value});
                  setLoginError(null);
                }}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 transition-all text-sm"
              />
            </div>

            {loginError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-red-400 text-xs font-bold flex items-center justify-center gap-2"
              >
                <AlertTriangle size={14} />
                <span>{loginError}</span>
              </motion.div>
            )}

            <button 
              type="submit"
              className="w-full py-4 bg-[#10B981] text-white rounded-xl font-bold text-sm hover:bg-[#059669] transition-all shadow-lg shadow-[#10B981]/10"
            >
              {t.loginOrCreate}
            </button>
          </form>

          <div className="pt-8">
            <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 hover:text-white/40 transition-colors">
              {t.terms}
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] dark:bg-[#0F1115] text-black dark:text-white font-sans selection:bg-black selection:text-white relative overflow-x-hidden transition-colors duration-300 pb-20">
      <Header 
        onLogout={() => setIsLoggedIn(false)} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme}
        language={language}
        credits={credits}
      />

      <main className="max-w-5xl mx-auto px-8 py-8 space-y-12">
        {/* Tab Switcher */}
        <div className="flex items-center justify-center p-1 bg-black/5 dark:bg-white/5 rounded-2xl w-fit mx-auto">
          <button 
            onClick={() => setActiveTab('focus')}
            className={cn(
              "px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'focus' 
                ? "bg-white dark:bg-[#1A1D23] text-black dark:text-white shadow-sm" 
                : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
            )}
          >
            <Zap size={16} />
            <span>{t.focus}</span>
          </button>
          <button 
            onClick={() => setActiveTab('todo')}
            className={cn(
              "px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'todo' 
                ? "bg-white dark:bg-[#1A1D23] text-black dark:text-white shadow-sm" 
                : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
            )}
          >
            <ListTodo size={16} />
            <span>{t.todo}</span>
          </button>
          <button 
            onClick={() => setActiveTab('food')}
            className={cn(
              "px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'food' 
                ? "bg-white dark:bg-[#1A1D23] text-black dark:text-white shadow-sm" 
                : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
            )}
          >
            <Utensils size={16} />
            <span>{t.food}</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'focus' && (
            <motion.div
              key="focus-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-20"
            >
              {/* 1. Timers */}
              <div className="space-y-12 max-w-3xl mx-auto">
                {/* Quick Presets */}
                <div className="p-8 bg-white dark:bg-[#1A1D23] rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-widest text-black/20 dark:text-white/20 mb-6 text-center">{language === 'ar' ? 'خيارات سريعة' : 'Quick Presets'}</div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {Object.entries(FRUIT_MAP).map(([m, fruit]) => (
                      <button
                        key={m}
                        onClick={() => startTimer(Number(m), "Deep Work Session")}
                        className="px-6 py-3 bg-black/5 dark:bg-white/5 rounded-2xl hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all text-sm font-bold tracking-tight flex items-center gap-2"
                      >
                        <span>{fruit}</span>
                        <span>{m}m</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Session Form */}
                <div className="p-8 bg-white dark:bg-[#1A1D23] rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-xs font-bold uppercase tracking-widest text-black/20 dark:text-white/20">{language === 'ar' ? 'جلسة مخصصة' : 'Custom Session'}</div>
                  </div>

                  <form onSubmit={handleCustomSubmit} className="flex flex-col md:flex-row gap-4 items-end justify-center">
                    <div className="w-full md:w-32 space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40 ml-2">{language === 'ar' ? 'دقائق' : 'Minutes'}</label>
                      <input 
                        type="number" 
                        min="1"
                        max="1440"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        className="w-full px-6 py-3 bg-black/5 dark:bg-white/5 rounded-2xl border-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 transition-all text-sm font-bold dark:text-white"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full md:w-auto px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl hover:bg-black/80 dark:hover:bg-white/80 transition-all flex items-center justify-center gap-2 text-sm font-bold"
                    >
                      <Play size={16} fill="currentColor" />
                      <span>{t.start}</span>
                    </button>
                  </form>
                </div>

                {/* Active Timer */}
                <div className="w-full">
                  <div className="flex items-center justify-center gap-2 mb-6 text-black/40 dark:text-white/40 uppercase tracking-widest font-bold text-xs">
                    <Clock size={14} />
                    <span>{language === 'ar' ? 'المؤقت النشط' : 'Active Timer'}</span>
                  </div>
                  <Timer 
                    key={activeTimer?.sessionId || 'default'}
                    initialMinutes={activeTimer?.minutes || 25}
                    taskName={activeTimer?.task || (language === 'ar' ? "جلسة عمل عميقة" : "Deep Work Session")}
                    fruitIcon={activeTimer?.fruit || "🍅"}
                    tasks={todoItems}
                    onTaskChange={handleTaskChange}
                    onAddTask={handleAddTask}
                    onCancel={handleCancelTimer}
                    onComplete={handleTimerComplete}
                    className="w-full"
                    autoStart={!!activeTimer}
                    language={language}
                  />
                </div>

                {/* 1.5. Linked Tasks List */}
                <div className="p-8 bg-white dark:bg-[#1A1D23] rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-black/40 dark:text-white/40 uppercase tracking-widest font-bold text-xs">
                      <CheckCircle2 size={14} />
                      <span>{t.todo}</span>
                    </div>
                    <button 
                      onClick={() => setActiveTab('todo')}
                      className="text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors"
                    >
                      {language === 'ar' ? 'إدارة الكل' : 'Manage All'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {todoItems.length === 0 ? (
                      <div className="text-center py-4 text-sm text-black/20 dark:text-white/20 italic">
                        {t.emptyTodo}
                      </div>
                    ) : (
                      todoItems.slice(0, 5).map((item) => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl group"
                        >
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => toggleTodoItem(item.id)}
                              className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                item.completed 
                                  ? "bg-emerald-500 border-emerald-500 text-white" 
                                  : "border-black/10 dark:border-white/10"
                              )}
                            >
                              {item.completed && <CheckCircle2 size={12} />}
                            </button>
                            <span className={cn(
                              "text-sm font-medium transition-all",
                              item.completed ? "text-black/20 dark:text-white/20 line-through" : "text-black/80 dark:text-white/80"
                            )}>
                              {item.text}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleTaskChange(item.text)}
                            className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                          >
                            {language === 'ar' ? 'تركيز' : 'Focus'}
                          </button>
                        </div>
                      ))
                    )}
                    {todoItems.length > 5 && (
                      <div className="text-center pt-2">
                        <p className="text-[10px] text-black/20 dark:text-white/20 font-bold uppercase tracking-widest">
                          {language === 'ar' ? `+${todoItems.length - 5} مهام أخرى` : `+${todoItems.length - 5} more tasks`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Usage Data Section */}
              <div className="p-8 bg-white dark:bg-[#1A1D23] rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-sm space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-black/40 dark:text-white/40 uppercase tracking-widest font-bold text-xs">
                    <BarChart3 size={14} />
                    <span>{language === 'ar' ? 'بيانات الاستخدام' : 'Usage Data'}</span>
                  </div>
                  {sessions.length > 0 && (
                    <button 
                      onClick={() => setShowConfirmModal(true)}
                      className="text-[10px] font-bold uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors"
                    >
                      Clear Data | مسح البيانات
                    </button>
                  )}
                </div>

                {sessions.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="text-4xl opacity-20">📊</div>
                    <p className="text-sm text-black/40 dark:text-white/40 font-medium">لا توجد بيانات مسجلة بعد. ابدأ أول جلسة لك!</p>
                  </div>
                ) : (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsCalendarOpen(true)}
                        className="p-8 bg-black/5 dark:bg-white/5 rounded-[2rem] text-center border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all group"
                      >
                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📅</div>
                        <div className="text-2xl font-black tracking-tighter dark:text-white">{t.calendar}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 dark:text-white/40">{t.performance}</div>
                      </motion.button>
                      <div className="p-8 bg-black/5 dark:bg-white/5 rounded-[2rem] text-center border border-black/5 dark:border-white/5">
                        <div className="text-3xl font-bold mb-1">{todaySessions.length}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t.todaysSessions}</div>
                      </div>
                      <div className="p-8 bg-black/5 dark:bg-white/5 rounded-[2rem] text-center border border-black/5 dark:border-white/5">
                        <div className="text-3xl font-bold mb-1">{(todaySessions.reduce((acc, s) => acc + s.duration, 0) / 60).toFixed(1)}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t.todaysHours}</div>
                      </div>
                      <div className="p-8 bg-black/5 dark:bg-white/5 rounded-[2rem] text-center border border-black/5 dark:border-white/5 flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="text-3xl font-bold">{Math.min(todaySessions.reduce((acc, s) => acc + s.duration, 0), dailyGoal)}</div>
                          <div className="text-xl font-bold opacity-20">/</div>
                          <div className="text-xl font-bold opacity-40">{dailyGoal}</div>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">{t.dailyGoal}</div>
                        {sessions.length > 0 && (
                          <button 
                            onClick={handleSetToGoldenTime}
                            className="text-[8px] font-bold uppercase tracking-widest text-emerald-500/60 hover:text-emerald-500 transition-colors"
                          >
                            {language === 'ar' ? 'تعيين الوقت الذهبي كهدف' : 'Set Golden Time as Goal'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-xl font-bold italic text-black/60 dark:text-white/60">
                        {sessions.length > 10 ? t.amazingPerformance : t.keepGoing}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 bg-black/5 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5 space-y-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t.weeklyData}</div>
                        <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getWeeklyData()}>
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, opacity: 0.4 }} />
                              <Tooltip 
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-lg text-[10px] font-bold">
                                        {payload[0].value}m
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                                {getWeeklyData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#FFD700' : 'rgba(0,0,0,0.1)'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="p-6 bg-black/5 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t.peakDay}</div>
                        <div className="text-4xl font-bold text-[#FFD700]">{getPeakDay()?.day}</div>
                        <div className="text-sm font-medium opacity-60">
                          {getPeakDay()?.hours} {language === 'ar' ? 'ساعة' : 'h'} {language === 'ar' ? 'و' : '&'} {getPeakDay()?.minutes} {language === 'ar' ? 'دقيقة' : 'm'}
                        </div>
                      </div>

                      <div className="p-6 bg-black/5 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5 space-y-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t.recent}</div>
                        <div className="space-y-3">
                          {sessions.slice(0, 4).map(s => (
                            <div key={s.id} className="flex items-center justify-between group">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{FRUIT_MAP[s.duration] || "⏱️"}</span>
                                <span className="text-xs font-bold truncate max-w-[80px]">{s.taskName}</span>
                              </div>
                              <span className="text-[10px] font-mono opacity-40">{s.duration}m</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-[2.5rem] border border-emerald-500/10 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/60">{t.weeklyAverage}</div>
                          <div className="text-3xl font-black tracking-tighter text-emerald-500">{getAverageStats().weekly}m</div>
                        </div>
                        <div className="text-4xl opacity-20">📈</div>
                      </div>
                      <div className="p-8 bg-blue-500/5 dark:bg-blue-500/10 rounded-[2.5rem] border border-blue-500/10 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-blue-500/60">{t.allTimeAverage}</div>
                          <div className="text-3xl font-black tracking-tighter text-blue-500">{getAverageStats().allTime}m</div>
                        </div>
                        <div className="text-4xl opacity-20">📊</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. AI Assistant Section */}
              <div className="p-8 bg-white dark:bg-[#1A1D23] rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-black/40 dark:text-white/40 uppercase tracking-widest font-bold text-xs">
                    <Sparkles size={14} />
                    <span>{t.mertAi}</span>
                  </div>
                  {!isOnline && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-bold">
                      <Zap size={10} />
                      {t.offlineMode}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={t.askMert}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                      className="flex-1 px-6 py-4 bg-black/5 dark:bg-white/5 rounded-2xl border-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 transition-all text-sm font-medium dark:text-white"
                    />
                    <button 
                      onClick={handleChatSubmit}
                      disabled={isAnalyzing || !chatInput.trim() || !isOnline}
                      className="px-6 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl hover:bg-black/80 dark:hover:bg-white/80 transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                      {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                    </button>
                  </div>
                  {!isOnline && (
                    <div className="text-[10px] text-red-500 font-bold text-center">
                      {t.aiRequiresOnline}
                    </div>
                  )}

                  {analysisResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 relative group"
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap dark:text-white/80">
                        {analysisResult}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'todo' && (
            <motion.div
              key="todo-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 max-w-2xl mx-auto w-full"
            >
              <div className="p-8 bg-white dark:bg-[#1A1D23] rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-black/40 dark:text-white/40 uppercase tracking-widest font-bold text-xs">
                    <ListTodo size={14} />
                    <span>{t.todo}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder={t.todoPlaceholder}
                    value={todoInput}
                    onChange={(e) => setTodoInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && todoInput.trim()) {
                        addTodoItem(todoInput.trim());
                        setTodoInput('');
                      }
                    }}
                    className="flex-1 px-6 py-4 bg-black/5 dark:bg-white/5 rounded-2xl border-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 transition-all text-sm font-medium dark:text-white"
                  />
                  <button 
                    onClick={() => {
                      if (todoInput.trim()) {
                        addTodoItem(todoInput.trim());
                        setTodoInput('');
                      }
                    }}
                    className="px-6 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl hover:bg-black/80 dark:hover:bg-white/80 transition-all flex items-center justify-center"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  {todoItems.length === 0 ? (
                    <div className="text-center py-12 text-black/20 dark:text-white/20 text-sm font-medium italic">
                      {t.emptyTodo}
                    </div>
                  ) : (
                    todoItems.map((item) => (
                      <motion.div 
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group flex items-center gap-4 p-4 bg-black/5 dark:bg-white/5 rounded-2xl hover:bg-black/[0.08] dark:hover:bg-white/[0.08] transition-all"
                      >
                        <button 
                          onClick={() => toggleTodoItem(item.id)}
                          className={cn(
                            "p-1 rounded-lg transition-all",
                            item.completed ? "text-green-500" : "text-black/20 dark:text-white/20 hover:text-black/40 dark:hover:text-white/40"
                          )}
                        >
                          {item.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                        </button>
                        <span className={cn(
                          "flex-1 text-sm font-medium transition-all",
                          item.completed ? "text-black/20 dark:text-white/20 line-through" : "text-black dark:text-white"
                        )}>
                          {item.text}
                        </span>
                        <button 
                          onClick={() => removeTodoItem(item.id)}
                          className="p-2 opacity-0 group-hover:opacity-100 text-black/20 dark:text-white/20 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'food' && (
            <motion.div
              key="food-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto w-full space-y-12"
            >
              {/* Mert AI Food Analysis Section (Sketch Layout) */}
              <div className="p-8 md:p-12 bg-white dark:bg-[#1A1D23] rounded-[3rem] border border-black/5 dark:border-white/5 shadow-sm space-y-12">
                {/* Header from Sketch */}
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black tracking-tighter uppercase">{t.foodScanner}</h2>
                </div>

                {/* Upload Button */}
                {!selectedFoodImage && (
                  <div className="flex justify-center">
                    <label className="cursor-pointer px-12 py-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-sm hover:scale-105 transition-transform flex items-center gap-3 shadow-2xl shadow-black/10 dark:shadow-white/10 group">
                      <Camera size={20} className="group-hover:rotate-12 transition-transform" />
                      <span>{t.uploadFile}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFoodImageUpload} />
                    </label>
                  </div>
                )}

                {/* Analysis Grid (Sketch Top Part) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                  {/* Left: Nutrients (Dynamic Bars) */}
                  <div className="space-y-8">
                    {foodAnalysis ? (
                      <>
                        {[
                          { key: 'protein', label: t.protein, color: 'bg-blue-500' },
                          { key: 'carbs', label: t.carbs, color: 'bg-green-500' },
                          { key: 'fats', label: t.fats, color: 'bg-orange-500' }
                        ].map((nutrient) => {
                          const val = foodAnalysis.visual_data.nutrients[nutrient.key as keyof typeof foodAnalysis.visual_data.nutrients];
                          if (val === undefined) return null;
                          return (
                            <div key={nutrient.key} className="space-y-3">
                              <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                <span className="opacity-40">{nutrient.key}</span>
                                <span>{nutrient.label} {val}%</span>
                              </div>
                              <div className="h-5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${val}%` }}
                                  className={cn("h-full", nutrient.color)}
                                />
                              </div>
                            </div>
                          );
                        })}
                        <div className="pt-6 text-center">
                          <div className="text-5xl font-black tracking-tighter">{foodAnalysis.visual_data.calories}</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">Kcal</div>
                        </div>

                        {/* Ingredients List */}
                        <div className="pt-4 space-y-3">
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                            {language === 'ar' ? 'المكونات المكتشفة' : 'Detected Ingredients'}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {foodAnalysis.visual_data.ingredients.map((ing, i) => (
                              <span key={i} className="px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full text-[10px] font-bold border border-black/5 dark:border-white/5">
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-6 py-16">
                        <BarChart3 size={64} strokeWidth={1.5} />
                        <p className="text-xs font-bold uppercase tracking-[0.2em]">Waiting for analysis...</p>
                      </div>
                    )}
                  </div>

                  {/* Right: Image Frame */}
                  <div className="relative aspect-square bg-black/5 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-black/10 dark:border-white/10 overflow-hidden flex items-center justify-center group shadow-inner">
                    {selectedFoodImage ? (
                      <>
                        <img src={selectedFoodImage} alt="Food" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <label className="cursor-pointer p-5 bg-white text-black rounded-full shadow-2xl hover:scale-110 transition-transform">
                            <Camera size={28} />
                            <input type="file" accept="image/*" className="hidden" onChange={handleFoodImageUpload} />
                          </label>
                        </div>
                      </>
                    ) : (
                      <div className="text-center opacity-20 space-y-4">
                        <Utensils size={64} strokeWidth={1} className="mx-auto" />
                        <div className="text-sm font-black uppercase tracking-widest">الصورة | Image</div>
                      </div>
                    )}
                    {isAnalyzingFood && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-6">
                        <Loader2 className="animate-spin" size={40} />
                        <div className="text-xs font-bold uppercase tracking-[0.3em]">Mert is analyzing...</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle: Medical Alerts (Sketch Middle Part) */}
                <div className="relative p-10 bg-red-500/5 dark:bg-red-500/10 rounded-[2.5rem] border border-red-500/10 space-y-8">
                  {/* "تحليل" Label from Sketch */}
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-black uppercase tracking-[0.5em] opacity-20 hidden md:block">
                    تحليل
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-red-500">
                      <AlertTriangle size={24} />
                      <span className="text-2xl font-black tracking-tighter">لا ينصح به | Not Recommended</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {foodAnalysis?.visual_data.medical_alerts.length ? (
                      foodAnalysis.visual_data.medical_alerts.map((alert, i) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          key={i} 
                          className="flex items-center gap-4 text-sm font-bold p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-black/5 dark:border-white/5"
                        >
                          <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                          <span>{alert}</span>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-sm font-bold opacity-30 italic py-4 text-center">
                        {foodAnalysis ? "لا توجد تنبيهات صحية | No health alerts" : "بانتظار التحليل... | Waiting for analysis"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Decision Section (Sketch Bottom Part) */}
                <div className="text-center space-y-10 py-6 border-t border-black/5 dark:border-white/5">
                  <h3 className="text-3xl font-black tracking-tighter">هل ستأكله؟ | Will you eat it?</h3>
                  <div className="flex justify-center gap-6 flex-wrap">
                    <button 
                      onClick={() => {
                        if (foodAnalysis) {
                          const mainIngredient = foodAnalysis.visual_data.ingredients[0];
                          if (mainIngredient && !foodsIEat.includes(mainIngredient)) {
                            setFoodsIEat(prev => [...prev, mainIngredient]);
                          }
                          setFoodAnalysis(null);
                          setSelectedFoodImage(null);
                        }
                      }}
                      className="w-24 h-24 rounded-3xl bg-black dark:bg-white text-white dark:text-black font-black text-xl hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-black/20 dark:shadow-white/10 flex items-center justify-center"
                    >
                      نعم
                    </button>
                    <button 
                      onClick={() => {
                        if (foodAnalysis) {
                          const mainIngredient = foodAnalysis.visual_data.ingredients[0];
                          if (mainIngredient && !foodsIWantToReduce.includes(mainIngredient)) {
                            setFoodsIWantToReduce(prev => [...prev, mainIngredient]);
                          }
                          setFoodAnalysis(null);
                          setSelectedFoodImage(null);
                        }
                      }}
                      className="w-24 h-24 rounded-3xl bg-yellow-500 text-white font-black text-xl hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-yellow-500/20 flex items-center justify-center"
                    >
                      تقليل
                    </button>
                    <button 
                      onClick={() => {
                        if (foodAnalysis) {
                          const mainIngredient = foodAnalysis.visual_data.ingredients[0];
                          if (mainIngredient && !foodsIWantToStop.includes(mainIngredient)) {
                            setFoodsIWantToStop(prev => [...prev, mainIngredient]);
                          }
                          setFoodAnalysis(null);
                          setSelectedFoodImage(null);
                        }
                      }}
                      className="w-24 h-24 rounded-3xl bg-red-500 text-white font-black text-xl hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-red-500/20 flex items-center justify-center"
                    >
                      إيقاف
                    </button>
                  </div>
                </div>

                {/* Mert Chat Interface (Keep for identity, but secondary) */}
                {foodAnalysis && (
                  <div className="space-y-6 pt-10 border-t border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2 text-black/40 dark:text-white/40 uppercase tracking-widest font-bold text-[10px]">
                      <Sparkles size={12} />
                      <span>Mert Chat | دردشة مرت</span>
                    </div>

                    {foodAnalysis.mert_chat_response && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5"
                      >
                        <div className="text-sm leading-relaxed whitespace-pre-wrap dark:text-white/80 font-medium">
                          {foodAnalysis.mert_chat_response}
                        </div>
                      </motion.div>
                    )}

                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="اسأل مرت عن هذه الوجبة..."
                        value={foodChatInput}
                        onChange={(e) => setFoodChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleFoodChatSubmit()}
                        className="flex-1 px-6 py-4 bg-black/5 dark:bg-white/5 rounded-2xl border-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 transition-all text-sm font-bold dark:text-white"
                      />
                      <button 
                        onClick={handleFoodChatSubmit}
                        disabled={isFoodChatting || !foodChatInput.trim() || !isOnline}
                        className="px-6 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl hover:bg-black/80 dark:hover:bg-white/80 transition-all disabled:opacity-50 flex items-center justify-center shadow-lg"
                      >
                        {isFoodChatting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                      </button>
                    </div>
                    {!isOnline && (
                      <div className="text-[10px] text-red-500 font-bold text-center">
                        {t.aiRequiresOnline}
                      </div>
                    )}
                  </div>
                )}

                {/* New Food List Section */}
                <div className="pt-12 space-y-8 border-t border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center shadow-lg">
                      <ListTodo size={20} />
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter uppercase">{t.foodList}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FoodListSection 
                      title={t.foodsIEat} 
                      items={foodsIEat} 
                      onAdd={(item) => setFoodsIEat(prev => [...prev, item])}
                      onRemove={(index) => setFoodsIEat(prev => prev.filter((_, i) => i !== index))}
                      onMove={(index, target) => {
                        const item = foodsIEat[index];
                        setFoodsIEat(prev => prev.filter((_, i) => i !== index));
                        if (target === 'reduce') setFoodsIWantToReduce(prev => [...prev, item]);
                        if (target === 'stop') setFoodsIWantToStop(prev => [...prev, item]);
                      }}
                      placeholder={t.addFood}
                      color="bg-blue-500 text-white"
                      language={language}
                      showOptions={true}
                    />
                    <FoodListSection 
                      title={t.foodsIWantToEat} 
                      items={foodsIWantToEat} 
                      onAdd={(item) => setFoodsIWantToEat(prev => [...prev, item])}
                      onRemove={(index) => setFoodsIWantToEat(prev => prev.filter((_, i) => i !== index))}
                      placeholder={t.addFood}
                      color="bg-emerald-500 text-white"
                      language={language}
                    />
                    <FoodListSection 
                      title={t.foodsIWantToReduce} 
                      items={foodsIWantToReduce} 
                      onAdd={(item) => setFoodsIWantToReduce(prev => [...prev, item])}
                      onRemove={(index) => setFoodsIWantToReduce(prev => prev.filter((_, i) => i !== index))}
                      onMove={(index, target) => {
                        const item = foodsIWantToReduce[index];
                        setFoodsIWantToReduce(prev => prev.filter((_, i) => i !== index));
                        if (target === 'eat') setFoodsIEat(prev => [...prev, item]);
                      }}
                      placeholder={t.addFood}
                      color="bg-yellow-500 text-white"
                      language={language}
                    />
                    <FoodListSection 
                      title={t.foodsIWantToStop} 
                      items={foodsIWantToStop} 
                      onAdd={(item) => setFoodsIWantToStop(prev => [...prev, item])}
                      onRemove={(index) => setFoodsIWantToStop(prev => prev.filter((_, i) => i !== index))}
                      onMove={(index, target) => {
                        const item = foodsIWantToStop[index];
                        setFoodsIWantToStop(prev => prev.filter((_, i) => i !== index));
                        if (target === 'eat') setFoodsIEat(prev => [...prev, item]);
                      }}
                      placeholder={t.addFood}
                      color="bg-red-500 text-white"
                      language={language}
                    />
                  </div>

                  {/* AI Advice Section */}
                  <div className="p-8 bg-black dark:bg-white text-white dark:text-black rounded-[2.5rem] shadow-2xl space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 uppercase tracking-widest font-bold text-xs opacity-60">
                        <Sparkles size={14} />
                        <span>{t.aiAdvice}</span>
                      </div>
                      <button 
                        onClick={() => setFoodListChatHistory([])}
                        className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                      >
                        {language === 'ar' ? 'مسح المحادثة' : 'Clear Chat'}
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {foodListChatHistory.length === 0 && !foodListAdvice && (
                        <div className="text-center py-10 opacity-40 space-y-4">
                          <Sparkles size={32} className="mx-auto" />
                          <p className="text-xs font-bold uppercase tracking-widest">
                            {language === 'ar' ? 'ابدأ محادثة مع مرت حول قائمتك' : 'Start a conversation with Mert about your list'}
                          </p>
                          <button 
                            onClick={getFoodListAdvice}
                            disabled={isAnalyzingFoodList}
                            className="px-6 py-3 bg-white/10 dark:bg-black/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/20 dark:hover:bg-black/20 transition-all"
                          >
                            {isAnalyzingFoodList ? <Loader2 className="animate-spin" size={16} /> : t.getAdvice}
                          </button>
                        </div>
                      )}

                      {foodListAdvice && foodListChatHistory.length === 0 && (
                        <div className="p-4 bg-white/5 dark:bg-black/5 rounded-2xl text-sm leading-relaxed font-medium">
                          {foodListAdvice}
                        </div>
                      )}

                      {foodListChatHistory.map((chat, i) => (
                        <div key={i} className={cn(
                          "flex flex-col space-y-2",
                          chat.role === 'user' ? "items-end" : "items-start"
                        )}>
                          <div className={cn(
                            "max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed",
                            chat.role === 'user' 
                              ? "bg-emerald-500 text-white rounded-tr-none" 
                              : "bg-white/10 dark:bg-black/10 rounded-tl-none"
                          )}>
                            {chat.content}
                          </div>
                        </div>
                      ))}
                      {isAnalyzingFoodList && (
                        <div className="flex items-start">
                          <div className="p-4 bg-white/10 dark:bg-black/10 rounded-2xl rounded-tl-none">
                            <Loader2 className="animate-spin" size={16} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-white/10 dark:border-black/10">
                      <input 
                        type="text" 
                        placeholder={language === 'ar' ? 'اسأل مرت عن قائمتك...' : 'Ask Mert about your list...'}
                        value={foodListChatInput}
                        onChange={(e) => setFoodListChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleFoodListChatSubmit()}
                        className="flex-1 bg-white/5 dark:bg-black/5 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-white/20 dark:focus:ring-black/20 transition-all"
                      />
                      <button 
                        onClick={handleFoodListChatSubmit}
                        disabled={isAnalyzingFoodList || !foodListChatInput.trim() || !isOnline}
                        className="p-4 bg-white dark:bg-black text-black dark:text-white rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                    {!isOnline && (
                      <div className="text-[10px] text-red-500 font-bold text-center mt-2">
                        {t.aiRequiresOnline}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#1A1D23] rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto">
                <Trash2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold dark:text-white">هل أنت متأكد؟</h3>
                <p className="text-sm text-black/40 dark:text-white/40 font-medium">سيتم مسح جميع بيانات الجلسات والمهام نهائياً.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-4 bg-black/5 dark:bg-white/5 rounded-2xl text-sm font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                >
                  إلغاء
                </button>
                <button 
                  onClick={clearAllData}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  مسح الكل
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isCalendarOpen && (
          <CalendarView 
            sessions={sessions} 
            onClose={() => setIsCalendarOpen(false)} 
          />
        )}

        {isSettingsOpen && (
          <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onClearData={() => {
              setIsSettingsOpen(false);
              setShowConfirmModal(true);
            }}
            theme={theme}
            setTheme={setTheme}
            language={language}
            setLanguage={setLanguage}
            dailyGoal={dailyGoal}
            setDailyGoal={setDailyGoal}
            onSetToGoldenTime={handleSetToGoldenTime}
            shareAiData={shareAiData}
            setShareAiData={setShareAiData}
            includeEmptyDays={includeEmptyDays}
            setIncludeEmptyDays={setIncludeEmptyDays}
            calorieGoal={calorieGoal}
            setCalorieGoal={setCalorieGoal}
            proteinGoal={proteinGoal}
            setProteinGoal={setProteinGoal}
            carbsGoal={carbsGoal}
            setCarbsGoal={setCarbsGoal}
            fatsGoal={fatsGoal}
            setFatsGoal={setFatsGoal}
          />
        )}

        {!isOnline && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-500 text-white rounded-full text-[10px] font-bold shadow-xl flex items-center gap-2 whitespace-nowrap"
          >
            <Zap size={12} className="animate-pulse" />
            {language === 'ar' ? 'وضع عدم الاتصال | Offline Mode' : 'Offline Mode'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
