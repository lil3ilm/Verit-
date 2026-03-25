import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Clock, ArrowLeft } from 'lucide-react';
import { TimerSession } from '../types';

interface CalendarViewProps {
  sessions: TimerSession[];
  onClose: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ sessions, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date()); // Start from current date
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthNames = [
    "يناير | January", "فبراير | February", "مارس | March", "أبريل | April", 
    "مايو | May", "يونيو | June", "يوليو | July", "أغسطس | August", 
    "سبتمبر | September", "أكتوبر | October", "نوفمبر | November", "ديسمبر | December"
  ];

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

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

  const getFruitForDuration = (duration: number, savedFruit?: string) => {
    return FRUIT_MAP[duration] || savedFruit || "🍅";
  };

  const sessionsByDay = useMemo(() => {
    const map: Record<string, TimerSession[]> = {};
    sessions.forEach(session => {
      const date = new Date(session.startTime);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(session);
    });
    return map;
  }, [sessions]);

  const totalMinutesByDay = useMemo(() => {
    const map: Record<string, number> = {};
    Object.entries(sessionsByDay).forEach(([key, daySessions]) => {
      map[key] = daySessions.reduce((sum, s) => sum + s.duration, 0);
    });
    return map;
  }, [sessionsByDay]);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    // Only allow going back to Jan 2026
    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    if (prev.getFullYear() >= 2026) {
      setCurrentDate(prev);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const calendarDays = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-24 md:h-32"></div>);
    }

    // Actual days
    for (let day = 1; day <= days; day++) {
      const dateKey = `${year}-${month}-${day}`;
      const totalMinutes = totalMinutesByDay[dateKey] || 0;
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      calendarDays.push(
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          key={day}
          onClick={() => setSelectedDay(new Date(year, month, day))}
          className={`h-24 md:h-32 p-2 border border-black/5 dark:border-white/5 rounded-2xl flex flex-col items-center justify-between transition-all ${
            totalMinutes > 0 
              ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' 
              : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
          } ${isToday ? 'ring-2 ring-emerald-500' : ''}`}
        >
          <span className="text-xs font-bold opacity-40">{day}</span>
          {totalMinutes > 0 && (
            <div className="flex flex-col items-center gap-1">
              <div className="text-lg md:text-xl group-hover:scale-125 transition-transform">
                {getFruitForDuration(sessionsByDay[dateKey]?.[0]?.duration || 0, sessionsByDay[dateKey]?.[0]?.fruitIcon)}
              </div>
              <span className="text-lg md:text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{totalMinutes}</span>
              <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Min | دقيقة</span>
            </div>
          )}
          <div className="h-1 w-1 rounded-full bg-black/10 dark:bg-white/10"></div>
        </motion.button>
      );
    }

    return calendarDays;
  };

  const selectedDaySessions = useMemo(() => {
    if (!selectedDay) return [];
    const key = `${selectedDay.getFullYear()}-${selectedDay.getMonth()}-${selectedDay.getDate()}`;
    return sessionsByDay[key] || [];
  }, [selectedDay, sessionsByDay]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white dark:bg-[#121212] overflow-y-auto"
    >
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={onClose}
            className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tighter mb-1">تقويم الإنجاز | Achievement Calendar</h2>
            <p className="text-xs font-bold uppercase tracking-widest opacity-40">Track your focus journey since 2026</p>
          </div>
          <div className="w-14"></div> {/* Spacer */}
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-6 rounded-[2.5rem] mb-8">
          <button 
            onClick={prevMonth}
            disabled={currentDate.getFullYear() === 2026 && currentDate.getMonth() === 0}
            className="p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl disabled:opacity-20"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <div className="text-xl font-black tracking-tight">{monthNames[currentDate.getMonth()]}</div>
            <div className="text-xs font-bold opacity-40">{currentDate.getFullYear()}</div>
            <button 
              onClick={goToToday}
              className="mt-2 px-4 py-1 bg-black/5 dark:bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black/10 transition-all"
            >
              اليوم | Today
            </button>
          </div>
          <button onClick={nextMonth} className="p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl">
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 md:gap-4 mb-12">
          {['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(day => (
            <div key={day} className="text-center py-2 text-[10px] font-bold uppercase tracking-widest opacity-40">
              {day}
            </div>
          ))}
          {renderCalendar()}
        </div>

        {/* Selected Day Detail View */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed inset-0 z-[110] bg-white dark:bg-[#121212] p-6 md:p-12 overflow-y-auto"
            >
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                  <button 
                    onClick={() => setSelectedDay(null)}
                    className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                  >
                    <X size={24} />
                  </button>
                  <div className="text-center">
                    <h3 className="text-2xl font-black tracking-tighter">
                      {selectedDay.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-40">Session Details | تفاصيل الجلسات</p>
                  </div>
                  <div className="w-14"></div>
                </div>

                {selectedDaySessions.length === 0 ? (
                  <div className="text-center py-20 opacity-20">
                    <CalendarIcon size={64} className="mx-auto mb-4" />
                    <p className="font-bold">لا توجد جلسات في هذا اليوم</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-8 bg-emerald-500 text-white rounded-[2.5rem] mb-8">
                      <div>
                        <div className="text-4xl font-black">{selectedDaySessions.reduce((sum, s) => sum + s.duration, 0)}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Minutes | إجمالي الدقائق</div>
                      </div>
                      <Clock size={48} className="opacity-20" />
                    </div>

                    <div className="space-y-3">
                      {selectedDaySessions.map((session, idx) => (
                        <div 
                          key={session.id}
                          className="p-6 bg-black/5 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5 flex items-center justify-between group hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-3xl group-hover:scale-110 transition-transform">
                              {getFruitForDuration(session.duration, session.fruitIcon)}
                            </div>
                            <div>
                              <div className="font-bold text-lg">{session.taskName}</div>
                              <div className="text-xs opacity-40">
                                {new Date(session.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <div className="text-xl font-black text-emerald-500">
                            {session.duration}m
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
