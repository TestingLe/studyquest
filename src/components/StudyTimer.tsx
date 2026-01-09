import React, { useState, useEffect, useRef } from 'react';
import type { Subject, StudyPreferences } from '../types';
import { playSound } from '../utils/sounds';

// Timer state interface (shared with App)
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
  onSessionComplete: (session: {
    subjectId: string;
    duration: number;
    date: string;
    mood: 'focused' | 'distracted' | 'tired' | 'energetic';
    notes?: string;
    pomodoroCount: number;
  }) => void;
  timerState: TimerState;
  onTimerStateChange: React.Dispatch<React.SetStateAction<TimerState>>;
}

export const StudyTimer: React.FC<StudyTimerProps> = ({
  subjects,
  preferences,
  onSessionComplete,
  timerState,
  onTimerStateChange
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [customPreferences, setCustomPreferences] = useState(preferences);
  const [mood, setMood] = useState<'focused' | 'distracted' | 'tired' | 'energetic'>('focused');
  const [notes, setNotes] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Destructure timer state for easier access
  const { isActive, isBreak, timeLeft, sessionTime, pomodoroCount, selectedSubject } = timerState;

  // Helper to update timer state
  const updateTimer = (updates: Partial<TimerState>) => {
    onTimerStateChange(prev => ({ ...prev, ...updates }));
  };

  // ESC key to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusMode) {
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode]);

  const startTimer = () => {
    if (!selectedSubject && !isBreak) {
      alert('Please select a subject first!');
      return;
    }
    playSound('click');
    updateTimer({ isActive: true });
  };

  const pauseTimer = () => {
    playSound('click');
    updateTimer({ isActive: false });
  };

  const resetTimer = () => {
    updateTimer({
      isActive: false,
      timeLeft: customPreferences.pomodoroLength * 60,
      isBreak: false
    });
  };

  const handleSettingsSave = () => {
    updateTimer({
      timeLeft: customPreferences.pomodoroLength * 60,
      isBreak: false,
      pomodoroCount: 0,
      isActive: false
    });
    setShowSettings(false);
  };

  const completeSession = () => {
    if (selectedSubject && sessionTime > 0) {
      onSessionComplete({
        subjectId: selectedSubject,
        duration: Math.floor(sessionTime / 60),
        date: new Date().toISOString(),
        mood,
        notes: notes.trim() || undefined,
        pomodoroCount
      });
      
      // Reset for next session
      updateTimer({
        sessionTime: 0,
        pomodoroCount: 0,
        timeLeft: customPreferences.pomodoroLength * 60,
        isBreak: false,
        isActive: false,
        selectedSubject: ''
      });
      setNotes('');
      setShowCompletionModal(false);
    }
  };

  const setSelectedSubject = (subjectId: string) => {
    updateTimer({ selectedSubject: subjectId });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreak 
    ? ((customPreferences.shortBreak * 60 - timeLeft) / (customPreferences.shortBreak * 60)) * 100
    : ((customPreferences.pomodoroLength * 60 - timeLeft) / (customPreferences.pomodoroLength * 60)) * 100;

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Study Timer</h2>
          <p className="text-gray-600">Focus with the Pomodoro Technique</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { playSound('click'); setFocusMode(!focusMode); }}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              focusMode 
                ? 'bg-indigo-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {focusMode ? '🧘 Focus Mode' : '🧘 Focus'}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Timer Display */}
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isBreak ? '☕ Break Time' : '📚 Study Time'}
          </h2>
          {selectedSubjectData && !isBreak && (
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">{selectedSubjectData.icon}</span>
              <span className="text-lg font-medium text-gray-700">{selectedSubjectData.name}</span>
            </div>
          )}
        </div>

        {/* Circular Progress */}
        <div className="relative w-64 h-64 mx-auto mb-6">
          <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              className="text-gray-200"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className={isBreak ? "text-green-500" : "text-indigo-500"}
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">{formatTime(timeLeft)}</div>
              <div className="text-sm text-gray-500 mt-1">
                {isBreak ? 'Break' : `Pomodoro ${pomodoroCount + 1}`}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={isActive ? pauseTimer : startTimer}
            className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
              isActive
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-indigo-500 hover:bg-indigo-600'
            }`}
          >
            {isActive ? '⏸️ Pause' : '▶️ Start'}
          </button>
          <button
            onClick={resetTimer}
            className="px-8 py-3 rounded-xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all duration-200"
          >
            🔄 Reset
          </button>
          {sessionTime > 0 && (
            <button
              onClick={() => setShowCompletionModal(true)}
              className="px-8 py-3 rounded-xl font-semibold text-white bg-green-500 hover:bg-green-600 transition-all duration-200"
            >
              ✅ Complete
            </button>
          )}
        </div>
      </div>

      {/* Subject Selection */}
      {!isBreak && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Subject</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedSubject === subject.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{subject.icon}</div>
                <div className="text-sm font-medium text-gray-900">{subject.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Session Stats */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Session</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-indigo-600">{Math.floor(sessionTime / 60)}</div>
            <div className="text-sm text-gray-500">Minutes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{pomodoroCount}</div>
            <div className="text-sm text-gray-500">Pomodoros</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{Math.floor(sessionTime / 60)}</div>
            <div className="text-sm text-gray-500">XP Earned</div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Great Job! 🎉</h3>
            <p className="text-gray-600 mb-6">
              You studied for {Math.floor(sessionTime / 60)} minutes and completed {pomodoroCount} pomodoros!
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How did you feel during this session?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'focused', emoji: '🎯', label: 'Focused' },
                    { value: 'distracted', emoji: '😵', label: 'Distracted' },
                    { value: 'tired', emoji: '😴', label: 'Tired' },
                    { value: 'energetic', emoji: '⚡', label: 'Energetic' }
                  ].map((moodOption) => (
                    <button
                      key={moodOption.value}
                      onClick={() => setMood(moodOption.value as any)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        mood === moodOption.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xl mb-1">{moodOption.emoji}</div>
                      <div className="text-sm font-medium">{moodOption.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What did you learn? Any insights or challenges?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={completeSession}
                className="flex-1 px-4 py-2 text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors"
              >
                Save Session
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Hidden audio element for notifications */}
        <audio ref={audioRef} preload="auto">
          <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT" type="audio/wav" />
        </audio>
      </div>

      {/* Focus Mode Overlay */}
      {focusMode && (
        <div className="fixed inset-0 bg-gray-900/95 z-50 flex items-center justify-center">
          <div className="text-center">
            {/* Breathing circle animation */}
            <div className="relative w-80 h-80 mx-auto mb-8">
              <div className={`absolute inset-0 rounded-full border-4 ${isBreak ? 'border-green-500' : 'border-indigo-500'} opacity-20`}></div>
              <div 
                className={`absolute inset-4 rounded-full ${isBreak ? 'bg-green-500/10' : 'bg-indigo-500/10'} flex items-center justify-center ${isActive ? 'animate-pulse' : ''}`}
              >
                <div className="text-center">
                  <div className={`text-7xl font-bold mb-2 ${isBreak ? 'text-green-400' : 'text-white'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className={`text-xl ${isBreak ? 'text-green-300' : 'text-indigo-300'}`}>
                    {isBreak ? '☕ Break Time' : `🎯 Pomodoro ${pomodoroCount + 1}`}
                  </div>
                  {selectedSubjectData && !isBreak && (
                    <div className="mt-4 text-gray-400">
                      {selectedSubjectData.icon} {selectedSubjectData.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={isActive ? pauseTimer : startTimer}
                className={`px-8 py-4 rounded-full font-semibold text-lg transition-all ${
                  isActive
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                }`}
              >
                {isActive ? '⏸️ Pause' : '▶️ Start'}
              </button>
              <button
                onClick={resetTimer}
                className="px-8 py-4 rounded-full font-semibold text-lg bg-gray-700 text-white hover:bg-gray-600 transition-all"
              >
                🔄 Reset
              </button>
            </div>

            {/* Session stats */}
            <div className="flex justify-center gap-8 text-gray-400 mb-8">
              <div>
                <div className="text-2xl font-bold text-white">{Math.floor(sessionTime / 60)}</div>
                <div className="text-sm">Minutes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{pomodoroCount}</div>
                <div className="text-sm">Pomodoros</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{Math.floor(sessionTime / 60)}</div>
                <div className="text-sm">XP Earned</div>
              </div>
            </div>

            {/* Exit focus mode */}
            <button
              onClick={() => { playSound('click'); setFocusMode(false); }}
              className="text-gray-500 hover:text-white transition-colors"
            >
              Exit Focus Mode (ESC)
            </button>

            {sessionTime > 0 && (
              <button
                onClick={() => { setFocusMode(false); setShowCompletionModal(true); }}
                className="ml-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                ✅ Complete Session
              </button>
            )}
          </div>
        </div>
      )}

      {/* Timer Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Timer Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Pomodoro Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pomodoro Length (minutes)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCustomPreferences({
                      ...customPreferences,
                      pomodoroLength: Math.max(1, customPreferences.pomodoroLength - 5)
                    })}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    value={customPreferences.pomodoroLength}
                    onChange={(e) => setCustomPreferences({
                      ...customPreferences,
                      pomodoroLength: Math.max(1, parseInt(e.target.value) || 1)
                    })}
                    className="flex-1 p-3 border border-gray-300 rounded-lg text-center text-xl font-bold"
                    min="1"
                    max="120"
                  />
                  <button
                    onClick={() => setCustomPreferences({
                      ...customPreferences,
                      pomodoroLength: Math.min(120, customPreferences.pomodoroLength + 5)
                    })}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* Short Break */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Break (minutes)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCustomPreferences({
                      ...customPreferences,
                      shortBreak: Math.max(1, customPreferences.shortBreak - 1)
                    })}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    value={customPreferences.shortBreak}
                    onChange={(e) => setCustomPreferences({
                      ...customPreferences,
                      shortBreak: Math.max(1, parseInt(e.target.value) || 1)
                    })}
                    className="flex-1 p-3 border border-gray-300 rounded-lg text-center text-xl font-bold"
                    min="1"
                    max="30"
                  />
                  <button
                    onClick={() => setCustomPreferences({
                      ...customPreferences,
                      shortBreak: Math.min(30, customPreferences.shortBreak + 1)
                    })}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    +1
                  </button>
                </div>
              </div>

              {/* Long Break */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Long Break (minutes)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCustomPreferences({
                      ...customPreferences,
                      longBreak: Math.max(1, customPreferences.longBreak - 5)
                    })}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    value={customPreferences.longBreak}
                    onChange={(e) => setCustomPreferences({
                      ...customPreferences,
                      longBreak: Math.max(1, parseInt(e.target.value) || 1)
                    })}
                    className="flex-1 p-3 border border-gray-300 rounded-lg text-center text-xl font-bold"
                    min="1"
                    max="60"
                  />
                  <button
                    onClick={() => setCustomPreferences({
                      ...customPreferences,
                      longBreak: Math.min(60, customPreferences.longBreak + 5)
                    })}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* Daily Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Study Goal (minutes)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCustomPreferences({
                      ...customPreferences,
                      studyGoal: Math.max(30, customPreferences.studyGoal - 30)
                    })}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    -30
                  </button>
                  <input
                    type="number"
                    value={customPreferences.studyGoal}
                    onChange={(e) => setCustomPreferences({
                      ...customPreferences,
                      studyGoal: Math.max(30, parseInt(e.target.value) || 30)
                    })}
                    className="flex-1 p-3 border border-gray-300 rounded-lg text-center text-xl font-bold"
                    min="30"
                    max="720"
                  />
                  <button
                    onClick={() => setCustomPreferences({
                      ...customPreferences,
                      studyGoal: Math.min(720, customPreferences.studyGoal + 30)
                    })}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    +30
                  </button>
                </div>
              </div>

              {/* Preset Timers */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quick Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCustomPreferences({
                      ...customPreferences,
                      pomodoroLength: 25,
                      shortBreak: 5,
                      longBreak: 15
                    })}
                    className="p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 text-sm"
                  >
                    <div className="font-bold">Classic</div>
                    <div className="text-xs text-gray-500">25/5/15</div>
                  </button>
                  <button
                    onClick={() => setCustomPreferences({
                      ...customPreferences,
                      pomodoroLength: 50,
                      shortBreak: 10,
                      longBreak: 30
                    })}
                    className="p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 text-sm"
                  >
                    <div className="font-bold">Extended</div>
                    <div className="text-xs text-gray-500">50/10/30</div>
                  </button>
                  <button
                    onClick={() => setCustomPreferences({
                      ...customPreferences,
                      pomodoroLength: 15,
                      shortBreak: 3,
                      longBreak: 10
                    })}
                    className="p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 text-sm"
                  >
                    <div className="font-bold">Short Sprint</div>
                    <div className="text-xs text-gray-500">15/3/10</div>
                  </button>
                  <button
                    onClick={() => setCustomPreferences({
                      ...customPreferences,
                      pomodoroLength: 90,
                      shortBreak: 15,
                      longBreak: 45
                    })}
                    className="p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 text-sm"
                  >
                    <div className="font-bold">Deep Work</div>
                    <div className="text-xs text-gray-500">90/15/45</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setCustomPreferences(preferences);
                  setShowSettings(false);
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSettingsSave}
                className="flex-1 px-4 py-2 text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
