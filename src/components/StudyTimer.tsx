import React, { useState, useEffect, useRef } from 'react';
import type { Subject, StudyPreferences } from '../types';
import { playSound } from '../utils/sounds';

interface TimerState {
  isActive: boolean;
  isBreak: boolean;
  timeLeft: number;
  sessionTime: number;
  pomodoroCount: number;
  selectedSubject: string;
}

interface StudyTimerProps {
  subjects: Subject[];
  preferences: StudyPreferences;
  onSessionComplete: (session: { subjectId: string; duration: number; date: string; mood: 'focused' | 'distracted' | 'tired' | 'energetic'; notes?: string; pomodoroCount: number }) => void;
  timerState: TimerState;
  onTimerStateChange: React.Dispatch<React.SetStateAction<TimerState>>;
}

export const StudyTimer: React.FC<StudyTimerProps> = ({ subjects, preferences, onSessionComplete, timerState, onTimerStateChange }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [customPreferences, setCustomPreferences] = useState(preferences);
  const [mood, setMood] = useState<'focused' | 'distracted' | 'tired' | 'energetic'>('focused');
  const [notes, setNotes] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { isActive, isBreak, timeLeft, sessionTime, pomodoroCount, selectedSubject } = timerState;
  const updateTimer = (updates: Partial<TimerState>) => onTimerStateChange(prev => ({ ...prev, ...updates }));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && focusMode) setFocusMode(false); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode]);

  const startTimer = () => { if (!selectedSubject && !isBreak) { alert('Please select a subject first!'); return; } playSound('click'); updateTimer({ isActive: true }); };
  const pauseTimer = () => { playSound('click'); updateTimer({ isActive: false }); };
  const resetTimer = () => { updateTimer({ isActive: false, timeLeft: customPreferences.pomodoroLength * 60, isBreak: false }); };
  const handleSettingsSave = () => { updateTimer({ timeLeft: customPreferences.pomodoroLength * 60, isBreak: false, pomodoroCount: 0, isActive: false }); setShowSettings(false); };

  const completeSession = () => {
    if (selectedSubject && sessionTime > 0) {
      onSessionComplete({ subjectId: selectedSubject, duration: Math.floor(sessionTime / 60), date: new Date().toISOString(), mood, notes: notes.trim() || undefined, pomodoroCount });
      updateTimer({ sessionTime: 0, pomodoroCount: 0, timeLeft: customPreferences.pomodoroLength * 60, isBreak: false, isActive: false, selectedSubject: '' });
      setNotes(''); setShowCompletionModal(false);
    }
  };

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  const progress = isBreak ? ((customPreferences.shortBreak * 60 - timeLeft) / (customPreferences.shortBreak * 60)) * 100 : ((customPreferences.pomodoroLength * 60 - timeLeft) / (customPreferences.pomodoroLength * 60)) * 100;
  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-400/20 to-blue-500/20 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Study Timer ⏱️</h2>
            <p className="text-gray-600 dark:text-gray-300">Focus with the Pomodoro Technique</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { playSound('click'); setFocusMode(!focusMode); }} className={`px-5 py-3 rounded-xl font-medium transition-all ${focusMode ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}>
              🧘 {focusMode ? 'Focus Mode' : 'Focus'}
            </button>
            <button onClick={() => setShowSettings(true)} className="px-5 py-3 bg-white/10 text-white rounded-xl font-medium border border-white/20 hover:bg-white/20 transition-all">⚙️ Settings</button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Timer Display */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{isBreak ? '☕ Break Time' : '📚 Study Time'}</h2>
            {selectedSubjectData && !isBreak && (
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">{selectedSubjectData.icon}</span>
                <span className="text-lg font-medium text-gray-600 dark:text-gray-300">{selectedSubjectData.name}</span>
              </div>
            )}
          </div>

          {/* Circular Progress */}
          <div className="relative w-64 h-64 mx-auto mb-6">
            <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white/10" />
              <circle cx="50" cy="50" r="45" stroke="url(#timerGradient)" strokeWidth="3" fill="transparent" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`} style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={isBreak ? '#10b981' : '#8b5cf6'} />
                  <stop offset="100%" stopColor={isBreak ? '#06b6d4' : '#3b82f6'} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900 dark:text-white">{formatTime(timeLeft)}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{isBreak ? 'Break' : `Pomodoro ${pomodoroCount + 1}`}</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            <button onClick={isActive ? pauseTimer : startTimer} className={`px-8 py-4 rounded-2xl font-semibold text-white transition-all duration-300 hover:scale-105 ${isActive ? 'bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/30' : 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg shadow-purple-500/30'}`}>
              {isActive ? '⏸️ Pause' : '▶️ Start'}
            </button>
            <button onClick={resetTimer} className="px-8 py-4 rounded-2xl font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-all">🔄 Reset</button>
            {sessionTime > 0 && (
              <button onClick={() => setShowCompletionModal(true)} className="px-8 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30 hover:scale-105 transition-all">✅ Complete</button>
            )}
          </div>
        </div>

        {/* Subject Selection */}
        {!isBreak && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-sm">📚</span>
              Select Subject
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {subjects.map((subject) => (
                <button key={subject.id} onClick={() => updateTimer({ selectedSubject: subject.id })} className={`p-4 rounded-xl border-2 transition-all duration-300 ${selectedSubject === subject.id ? 'border-purple-500 bg-purple-500/20' : 'border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-white/10'}`}>
                  <div className="text-2xl mb-2">{subject.icon}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{subject.name}</div>
                </button>
              ))}
              {subjects.length === 0 && <p className="col-span-full text-center text-gray-500 py-4">Add subjects in Subject Management first</p>}
            </div>
          </div>
        )}

        {/* Session Stats */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-sm">📊</span>
            Current Session
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: Math.floor(sessionTime / 60), label: 'Minutes', color: 'from-indigo-500 to-purple-500' },
              { value: pomodoroCount, label: 'Pomodoros', color: 'from-green-500 to-emerald-500' },
              { value: Math.floor(sessionTime / 60), label: 'XP Earned', color: 'from-yellow-500 to-orange-500' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                <div className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCompletionModal(false)}>
          <div className="bg-gradient-to-br from-slate-900 to-purple-950 rounded-3xl p-8 max-w-md w-full border border-white/10" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-2">Great Job! 🎉</h3>
            <p className="text-gray-400 mb-6">You studied for {Math.floor(sessionTime / 60)} minutes and completed {pomodoroCount} pomodoros!</p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">How did you feel?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ value: 'focused', emoji: '🎯', label: 'Focused' }, { value: 'distracted', emoji: '😵', label: 'Distracted' }, { value: 'tired', emoji: '😴', label: 'Tired' }, { value: 'energetic', emoji: '⚡', label: 'Energetic' }].map((m) => (
                    <button key={m.value} onClick={() => setMood(m.value as any)} className={`p-3 rounded-xl border-2 transition-all ${mood === m.value ? 'border-purple-500 bg-purple-500/20' : 'border-white/10 hover:border-white/30'}`}>
                      <div className="text-xl mb-1">{m.emoji}</div>
                      <div className="text-sm font-medium text-white">{m.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Session Notes (Optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did you learn?" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none" rows={3} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCompletionModal(false)} className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all">Cancel</button>
              <button onClick={completeSession} className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all">Save Session</button>
            </div>
          </div>
        </div>
      )}

      {/* Focus Mode Overlay */}
      {focusMode && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 z-50 flex items-center justify-center">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`, backgroundSize: '50px 50px' }} />
          <div className="text-center relative z-10">
            <div className="relative w-80 h-80 mx-auto mb-8">
              <div className={`absolute inset-0 rounded-full border-4 ${isBreak ? 'border-green-500/30' : 'border-purple-500/30'}`}></div>
              <div className={`absolute inset-4 rounded-full ${isBreak ? 'bg-green-500/10' : 'bg-purple-500/10'} flex items-center justify-center ${isActive ? 'animate-pulse' : ''}`}>
                <div className="text-center">
                  <div className={`text-7xl font-bold mb-2 ${isBreak ? 'text-green-400' : 'text-white'}`}>{formatTime(timeLeft)}</div>
                  <div className={`text-xl ${isBreak ? 'text-green-300' : 'text-purple-300'}`}>{isBreak ? '☕ Break Time' : `🎯 Pomodoro ${pomodoroCount + 1}`}</div>
                  {selectedSubjectData && !isBreak && <div className="mt-4 text-gray-400">{selectedSubjectData.icon} {selectedSubjectData.name}</div>}
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-4 mb-8">
              <button onClick={isActive ? pauseTimer : startTimer} className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all ${isActive ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/30' : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30'}`}>{isActive ? '⏸️ Pause' : '▶️ Start'}</button>
              <button onClick={resetTimer} className="px-8 py-4 rounded-2xl font-semibold text-lg bg-white/10 text-white hover:bg-white/20 transition-all">🔄 Reset</button>
            </div>
            <div className="flex justify-center gap-8 text-gray-400 mb-8">
              <div><div className="text-2xl font-bold text-white">{Math.floor(sessionTime / 60)}</div><div className="text-sm">Minutes</div></div>
              <div><div className="text-2xl font-bold text-white">{pomodoroCount}</div><div className="text-sm">Pomodoros</div></div>
              <div><div className="text-2xl font-bold text-white">{Math.floor(sessionTime / 60)}</div><div className="text-sm">XP Earned</div></div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => { playSound('click'); setFocusMode(false); }} className="text-gray-500 hover:text-white transition-colors">Exit Focus Mode (ESC)</button>
              {sessionTime > 0 && <button onClick={() => { setFocusMode(false); setShowCompletionModal(true); }} className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all">✅ Complete Session</button>}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-gradient-to-br from-slate-900 to-purple-950 rounded-3xl p-8 max-w-md w-full border border-white/10 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Timer Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-white/50 hover:text-white text-2xl">×</button>
            </div>
            <div className="space-y-6">
              {[
                { label: 'Pomodoro Length (min)', value: customPreferences.pomodoroLength, key: 'pomodoroLength', step: 5, min: 1, max: 120 },
                { label: 'Short Break (min)', value: customPreferences.shortBreak, key: 'shortBreak', step: 1, min: 1, max: 30 },
                { label: 'Long Break (min)', value: customPreferences.longBreak, key: 'longBreak', step: 5, min: 1, max: 60 },
                { label: 'Daily Goal (min)', value: customPreferences.studyGoal, key: 'studyGoal', step: 30, min: 30, max: 720 },
              ].map((setting) => (
                <div key={setting.key}>
                  <label className="block text-sm font-medium text-white/80 mb-2">{setting.label}</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setCustomPreferences({ ...customPreferences, [setting.key]: Math.max(setting.min, setting.value - setting.step) })} className="px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 text-white">-{setting.step}</button>
                    <input type="number" value={setting.value} onChange={(e) => setCustomPreferences({ ...customPreferences, [setting.key]: Math.max(setting.min, parseInt(e.target.value) || setting.min) })} className="flex-1 p-3 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" min={setting.min} max={setting.max} />
                    <button onClick={() => setCustomPreferences({ ...customPreferences, [setting.key]: Math.min(setting.max, setting.value + setting.step) })} className="px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 text-white">+{setting.step}</button>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-white/10">
                <label className="block text-sm font-medium text-white/80 mb-3">Quick Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Classic', values: { pomodoroLength: 25, shortBreak: 5, longBreak: 15 }, desc: '25/5/15' },
                    { name: 'Extended', values: { pomodoroLength: 50, shortBreak: 10, longBreak: 30 }, desc: '50/10/30' },
                    { name: 'Short Sprint', values: { pomodoroLength: 15, shortBreak: 3, longBreak: 10 }, desc: '15/3/10' },
                    { name: 'Deep Work', values: { pomodoroLength: 90, shortBreak: 15, longBreak: 45 }, desc: '90/15/45' },
                  ].map((preset) => (
                    <button key={preset.name} onClick={() => setCustomPreferences({ ...customPreferences, ...preset.values })} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/50 hover:bg-white/10 transition-all text-left">
                      <div className="font-bold text-white">{preset.name}</div>
                      <div className="text-xs text-gray-500">{preset.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
              <button onClick={() => { setCustomPreferences(preferences); setShowSettings(false); }} className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all">Cancel</button>
              <button onClick={handleSettingsSave} className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all">Save & Apply</button>
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} preload="auto"><source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT" type="audio/wav" /></audio>
    </div>
  );
};
