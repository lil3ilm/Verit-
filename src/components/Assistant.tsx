import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AssistantProps {
  analysis?: {
    insight: string;
    actionPlan: string;
    recommendedTimer: number;
    fuelType?: string;
  };
  onStartTimer: (minutes: number, task: string) => void;
  className?: string;
}

export const Assistant: React.FC<AssistantProps> = ({ analysis, onStartTimer, className }) => {
  if (!analysis) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={analysis.insight}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className={cn("p-8 bg-black text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden", className)}
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles size={120} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Verit Analysis</span>
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-xs font-medium text-white/40 uppercase tracking-widest mb-2">Insight</div>
              <p className="text-xl font-light leading-relaxed text-white/90">
                {analysis.insight}
              </p>
            </div>

            {analysis.fuelType && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{analysis.fuelType}</span>
              </div>
            )}

            <div>
              <div className="text-xs font-medium text-white/40 uppercase tracking-widest mb-2">Action Plan</div>
              <p className="text-lg font-medium text-white">
                {analysis.actionPlan}
              </p>
            </div>

            <button
              onClick={() => onStartTimer(analysis.recommendedTimer, analysis.actionPlan)}
              className="group flex items-center justify-between w-full p-6 bg-white text-black rounded-2xl hover:bg-emerald-400 transition-all active:scale-[0.98]"
            >
              <div className="flex flex-col items-start">
                <span className="text-xs font-bold uppercase tracking-widest opacity-40">Start Timer</span>
                <span className="text-2xl font-light tracking-tighter">{analysis.recommendedTimer} Minutes</span>
              </div>
              <div className="p-3 bg-black/5 rounded-full group-hover:bg-black/10 transition-colors">
                <ArrowRight size={24} />
              </div>
            </button>
            
            <p className="text-[10px] text-white/20 text-center uppercase tracking-[0.3em] pt-4">
              هل نبدأ موقت الـ {analysis.recommendedTimer} دقيقة في Verit الآن؟
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
