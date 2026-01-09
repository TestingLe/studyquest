export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  totalTime: number; // in minutes
  sessionsCount: number;
  targetTime?: number; // weekly target in minutes
}

export interface StudySession {
  id: string;
  subjectId: string;
  duration: number; // in minutes
  date: string;
  mood: 'focused' | 'distracted' | 'tired' | 'energetic';
  notes?: string;
  pomodoroCount: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  xpReward: number;
}

export interface StudyPreferences {
  pomodoroLength: number;
  shortBreak: number;
  longBreak: number;
  studyGoal: number; // daily goal in minutes
  theme: 'light' | 'dark';
}

export interface StudyData {
  subjects: Subject[];
  sessions: StudySession[];
  totalXP: number;
  level: number;
  streak: number;
  achievements: Achievement[];
  preferences: StudyPreferences;
}
