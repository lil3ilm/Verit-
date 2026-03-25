import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { TodoItem } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimerProps {
  initialMinutes: number;
  onComplete?: () => void;
  onCancel?: () => void;
  taskName: string;
  tasks: TodoItem[];
  onTaskChange: (task: string) => void;
  onAddTask?: (name: string) => void;
  fruitIcon?: string;
  className?: string;
  autoStart?: boolean;
  language?: 'ar' | 'en';
}

const WISDOM_MESSAGES = {
  en: {
    lemon: {
      start: "The hardest step is always the first one.",
      middle: "Just five minutes can change your whole day.. keep going! 🌱",
      end: "When life gives you a lemon.. finish this task in 5 minutes!"
    },
    tomato: {
      start: "Focus is the secret of power.",
      middle: "The tomato is watching you.. don't open distractions now! 👀",
      end: "25 minutes of deep focus makes miracles. You can do it! 🚀"
    },
    watermelon: {
      start: "Great achievement requires long silence and deep focus.",
      middle: "This is a big \"slice\" of work.. take one bite at a time!",
      end: "You are now in the creativity zone.. the world can wait for an hour. ✨"
    }
  },
  ar: {
    lemon: {
      start: "أصعب خطوة هي دائماً البداية.",
      middle: "خمس دقائق فقط قد تغير مجرى يومك بالكامل.. استمر! 🌱",
      end: "عندما تعطيك الحياة ليمونة.. أنجز هذه المهمة في 5 دقائق!"
    },
    tomato: {
      start: "التركيز هو سر القوة.",
      middle: "البندورة تراقبك.. لا تفتح المشتتات الآن! 👀",
      end: "25 دقيقة من التركيز العميق تصنع المعجزات. أنت قدها! 🚀"
    },
    watermelon: {
      start: "الإنجاز العظيم يتطلب صمتاً طويلاً وتركيزاً عميقاً.",
      middle: "هذه \"شريحة\" كبيرة من العمل.. خذ قضمة واحدة كل مرة!",
      end: "أنت الآن في منطقة الإبداع.. العالم يمكنه الانتظار لساعة. ✨"
    }
  }
};

export const Timer: React.FC<TimerProps> = ({ 
  initialMinutes, 
  onComplete, 
  onCancel,
  taskName, 
  tasks,
  onTaskChange,
  onAddTask,
  fruitIcon = "🍋",
  className,
  autoStart = false,
  language = 'ar'
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(autoStart);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskInput, setNewTaskInput] = useState('');
  const timerRef = useRef<any>(null);

  const hasCalledComplete = useRef(false);

  const t = {
    en: {
      selectTask: "Select Task",
      noTasks: "No tasks saved",
      done: "DONE",
      completeNow: "Complete Now",
      newTask: "New Task",
      cancelSession: "Cancel Session",
      taskNamePlaceholder: "Task name...",
    },
    ar: {
      selectTask: "اختر مهمة",
      noTasks: "لا توجد مهام",
      done: "تم",
      completeNow: "إكمال الجلسة الآن",
      newTask: "مهمة جديدة",
      cancelSession: "إلغاء الجلسة",
      taskNamePlaceholder: "اسم المهمة...",
    }
  }[language];

  const getWisdomMessage = () => {
    const totalSeconds = initialMinutes * 60;
    
    let category: 'lemon' | 'tomato' | 'watermelon' = 'lemon';
    
    // Map fruit icons to wisdom categories
    if (fruitIcon === "🍉" || fruitIcon === "🍍" || fruitIcon === "🥝" || fruitIcon === "🍒") category = 'watermelon';
    else if (fruitIcon === "🍅" || fruitIcon === "🍇" || fruitIcon === "🍊" || fruitIcon === "🍓") category = 'tomato';
    else if (fruitIcon === "🍋" || fruitIcon === "🫐" || fruitIcon === "🍎") category = 'lemon';
    // Fallback to minutes if icon doesn't match
    else if (initialMinutes >= 45) category = 'watermelon';
    else if (initialMinutes >= 25) category = 'tomato';

    const messages = WISDOM_MESSAGES[language][category];
    
    if (isCompleted || secondsLeft <= 300) return messages.end;
    if (secondsLeft <= totalSeconds / 2) return messages.middle;
    return messages.start;
  };

  const wisdomMessage = getWisdomMessage();

  useEffect(() => {
    setSecondsLeft(initialMinutes * 60);
    setIsActive(autoStart);
    setIsCompleted(false);
    hasCalledComplete.current = false;
  }, [initialMinutes, autoStart]);

  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && !hasCalledComplete.current) {
      hasCalledComplete.current = true;
      setIsActive(false);
      setIsCompleted(true);
      if (timerRef.current) clearInterval(timerRef.current);
      onComplete?.();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, secondsLeft, onComplete]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setSecondsLeft(initialMinutes * 60);
    setIsActive(false);
    setIsCompleted(false);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className={cn("flex flex-col items-center justify-center p-12 bg-[#2D323C] rounded-[3rem] shadow-2xl relative overflow-visible", className)}>
      {/* Task Selector Dropdown */}
      <div className="relative mb-8 w-full flex justify-center z-50">
        <button 
          onClick={() => setShowTasks(!showTasks)}
          className="flex items-center gap-3 px-6 py-2 bg-[#1A1D23] rounded-full border border-white/5 text-white/90 text-sm font-medium hover:bg-[#252A33] transition-all"
        >
          <motion.div animate={{ rotate: showTasks ? 180 : 0 }}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
          <span>{taskName || t.selectTask}</span>
        </button>

        <AnimatePresence>
          {showTasks && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 w-64 bg-[#1A1D23] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2"
            >
              {tasks.length === 0 ? (
                <div className="px-4 py-3 text-xs text-white/40 text-center italic">{t.noTasks}</div>
              ) : (
                tasks.map((taskItem) => (
                  <button
                    key={taskItem.id}
                    onClick={() => {
                      onTaskChange(taskItem.text);
                      setShowTasks(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between group",
                      taskItem.completed ? "text-white/20" : "text-white/80 hover:bg-white/5"
                    )}
                  >
                    <span className={cn(taskItem.completed && "line-through")}>{taskItem.text}</span>
                    {taskItem.completed && <CheckCircle2 size={12} className="text-emerald-500" />}
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Wisdom Message */}
      <div className="mb-8 min-h-[4rem] flex items-center justify-center text-center px-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={wisdomMessage}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-white/60 text-sm font-medium italic leading-relaxed max-w-xs"
          >
            {wisdomMessage}
          </motion.p>
        </AnimatePresence>
      </div>
      
      {/* Main Timer Circle */}
      <div className="relative flex items-center justify-center w-72 h-72">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="144"
            cy="144"
            r="136"
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-white/5"
          />
          <motion.circle
            cx="144"
            cy="144"
            r="136"
            stroke="#FFD700"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={854}
            initial={{ strokeDashoffset: 854 }}
            animate={{ strokeDashoffset: 854 * (1 - secondsLeft / (initialMinutes * 60)) }}
            transition={{ duration: 0.5, ease: "linear" }}
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute flex flex-col items-center gap-6">
          {/* Fruit Icon */}
          <div className="text-6xl">{fruitIcon}</div>
          
          {/* Time Display */}
          <div className="px-6 py-2 bg-[#1A1D23] rounded-xl border border-white/5">
            <AnimatePresence mode="wait">
              {isCompleted ? (
                <motion.div
                  key="completed"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-[#FFD700] text-2xl font-bold uppercase tracking-tighter flex flex-col items-center"
                >
                  <span>{t.done}</span>
                </motion.div>
              ) : (
                <motion.div
                  key="timer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[#FFD700] text-4xl font-bold tabular-nums tracking-wider"
                >
                  {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col items-center gap-12 mt-12 w-full">
        <button
          onClick={toggleTimer}
          disabled={isCompleted}
          className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl",
            isActive ? "bg-[#FFD700] text-[#1A1D23]" : "bg-[#FFD700] text-[#1A1D23] hover:brightness-110",
            isCompleted && "opacity-50 cursor-not-allowed"
          )}
        >
          {isActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} className="ml-2" fill="currentColor" />}
        </button>

        {/* Complete Early Button - Shows when 5m or less left */}
        {!isCompleted && secondsLeft <= 300 && secondsLeft > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => {
              setSecondsLeft(0);
              setIsActive(false);
              setIsCompleted(true);
              onComplete?.();
            }}
            className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 size={18} />
            <span>{t.completeNow}</span>
          </motion.button>
        )}

        <div className="w-full flex flex-col items-center gap-4">
          <AnimatePresence mode="wait">
            {isAddingTask ? (
              <motion.form 
                key="add-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newTaskInput.trim()) {
                    onAddTask?.(newTaskInput.trim());
                    onTaskChange(newTaskInput.trim());
                    setNewTaskInput('');
                    setIsAddingTask(false);
                  }
                }}
                className="flex gap-2 w-full max-w-xs"
              >
                <input 
                  autoFocus
                  type="text" 
                  placeholder={t.taskNamePlaceholder}
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  className="flex-1 px-4 py-2 bg-[#1A1D23] rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#FFD700]"
                />
                <button type="submit" className="p-2 bg-[#FFD700] text-[#1A1D23] rounded-xl">
                  <CheckCircle2 size={20} />
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsAddingTask(false)}
                  className="p-2 bg-white/5 text-white/40 rounded-xl"
                >
                  <X size={20} />
                </button>
              </motion.form>
            ) : (
              <div className="flex flex-col gap-4 items-center">
                <button
                  onClick={() => setIsAddingTask(true)}
                  className="flex items-center gap-3 px-6 py-3 bg-[#1A1D23] rounded-full border border-white/5 text-white/90 text-sm font-medium hover:bg-[#252A33] transition-all active:scale-95"
                >
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Plus size={14} className="text-white" />
                  </div>
                  <span>{t.newTask}</span>
                </button>

                <button
                  onClick={onCancel}
                  className="text-white/20 hover:text-white/40 text-[10px] uppercase tracking-widest font-bold transition-colors"
                >
                  {t.cancelSession}
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
