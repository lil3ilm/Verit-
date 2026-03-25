export type TimerDuration = 5 | 10 | 15 | 20 | 30 | 45 | 60;

export interface FoodAnalysis {
  visual_data: {
    ingredients: string[];
    nutrients: {
      protein?: number;
      carbs?: number;
      fats?: number;
    };
    calories: string;
    medical_alerts: string[];
  };
  mert_chat_response?: string;
}

export interface LogEntry {
  id: string;
  userId: string;
  timestamp: number;
  type: 'task' | 'food' | 'mood' | 'habit';
  content: string;
  imageUrl?: string;
  analysis?: FoodAnalysis;
}

export interface TimerSession {
  id: string;
  userId: string;
  startTime: number;
  duration: number; // in minutes
  completed: boolean;
  taskName: string;
  fruitIcon?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  stats: {
    totalDeepWorkBlocks: number;
    consistencyScore: number;
    lastActive: number;
  };
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}
