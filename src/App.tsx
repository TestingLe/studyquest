import { useState, useEffect, useRef } from 'react';
import { Dashboard } from './components/Dashboard';
import { StudyTimer } from './components/StudyTimer';
import { SubjectManager } from './components/SubjectManager';
import { ProgressAnalytics } from './components/ProgressAnalytics';
import { Achievements } from './components/Achievements';
import { StudyRooms } from './components/StudyRooms';
import { Quiz } from './components/Quiz';
import { Navigation } from './components/Navigation';
import { StarryBackground } from './components/StarryBackground';
import { Auth } from './components/Auth';
import { checkSession, saveStudyData, loadStudyData, logoutUser } from './utils/supabaseApi';
import { isSupabaseConfigured } from './utils/supabase';
import type { StudyData, Subject, StudySession } from './types';

// Global timer state interface
interface TimerState {
  isActive: boolean;
  isBreak: boolean;
  timeLeft: number;
  sessionTime: number;
  pomodoroCount: number;
  selectedSubject: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
}

const defaultStudyData: StudyData = {
  subjects: [],
  sessions: [],
  totalXP: 0,
  level: 1,
  streak: 0,
  achievements: [],
  preferences: {
    pomodoroLength: 25,
    shortBreak: 5,
    longBreak: 15,
    studyGoal: 120,
    theme: 'light'
  }
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('studyquest-darkmode');
    return saved ? JSON.parse(saved) : false;
  });
  const [studyData, setStudyData] = useState<StudyData>(defaultStudyData);

  // Global timer state - persists across page navigation
  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    isBreak: false,
    timeLeft: defaultStudyData.preferences.pomodoroLength * 60,
    sessionTime: 0,
    pomodoroCount: 0,
    selectedSubject: ''
  });

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Global timer effect - runs regardless of current view
  useEffect(() => {
    if (timerState.isActive && timerState.timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerState(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          
          if (newTimeLeft <= 0) {
            // Timer completed - handle break/pomodoro transition
            const isCurrentlyBreak = prev.isBreak;
            const newPomodoroCount = isCurrentlyBreak ? prev.pomodoroCount : prev.pomodoroCount + 1;
            
            // Play notification sound
            try {
              const audioContext = new AudioContext();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              oscillator.frequency.value = 800;
              oscillator.type = 'sine';
              gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.5);
            } catch (e) { /* ignore audio errors */ }

            if (!isCurrentlyBreak) {
              // Finished a pomodoro, start break
              const breakLength = newPomodoroCount % 4 === 0 
                ? studyData.preferences.longBreak 
                : studyData.preferences.shortBreak;
              return {
                ...prev,
                isActive: false,
                isBreak: true,
                timeLeft: breakLength * 60,
                pomodoroCount: newPomodoroCount
              };
            } else {
              // Finished break, ready for new pomodoro
              return {
                ...prev,
                isActive: false,
                isBreak: false,
                timeLeft: studyData.preferences.pomodoroLength * 60
              };
            }
          }

          return {
            ...prev,
            timeLeft: newTimeLeft,
            sessionTime: prev.isBreak ? prev.sessionTime : prev.sessionTime + 1
          };
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerState.isActive, studyData.preferences]);

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        // Check for Supabase session
        if (isSupabaseConfigured()) {
          const sessionUser = await checkSession();
          if (sessionUser) {
            setUser(sessionUser);
            const data = await loadStudyData(sessionUser.id);
            if (data) setStudyData(data);
            setIsLoading(false);
            return;
          }
        }

        // Check for local session
        const localUser = localStorage.getItem('studyquest-local-user');
        if (localUser) {
          const parsedUser = JSON.parse(localUser);
          setUser(parsedUser);
          const savedData = localStorage.getItem('studyquest-data');
          if (savedData) setStudyData(JSON.parse(savedData));
        }
      } catch (err) {
        console.warn('Session check failed:', err);
        // Fall back to localStorage
        const savedData = localStorage.getItem('studyquest-data');
        if (savedData) setStudyData(JSON.parse(savedData));
      }
      setIsLoading(false);
    };

    initSession();
  }, []);

  // Save data whenever studyData changes
  useEffect(() => {
    if (!isLoading && user) {
      // Save to Supabase or localStorage
      saveStudyData(user.id, studyData);
      // Always keep localStorage backup
      localStorage.setItem('studyquest-data', JSON.stringify(studyData));
    }
  }, [studyData, isLoading, user]);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('studyquest-darkmode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleLogin = async (loggedInUser: User, _token: string) => {
    setUser(loggedInUser);
    localStorage.setItem('studyquest-local-user', JSON.stringify(loggedInUser));
    
    // Load user data
    const data = await loadStudyData(loggedInUser.id);
    if (data) setStudyData(data);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    localStorage.removeItem('studyquest-local-user');
    setStudyData(defaultStudyData);
  };

  const addStudySession = (session: Omit<StudySession, 'id'>) => {
    const newSession: StudySession = {
      ...session,
      id: Date.now().toString()
    };

    const xpGained = session.duration; // 2 XP every 2 minutes = 1 XP per minute
    const newTotalXP = studyData.totalXP + xpGained;
    const newLevel = Math.floor(newTotalXP / 100) + 1;

    setStudyData(prev => ({
      ...prev,
      sessions: [...prev.sessions, newSession],
      totalXP: newTotalXP,
      level: newLevel
    }));
  };

  const addSubject = (subject: Omit<Subject, 'id' | 'totalTime' | 'sessionsCount'>) => {
    const newSubject: Subject = {
      ...subject,
      id: Date.now().toString(),
      totalTime: 0,
      sessionsCount: 0
    };

    setStudyData(prev => ({
      ...prev,
      subjects: [...prev.subjects, newSubject]
    }));
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    setStudyData(prev => ({
      ...prev,
      subjects: prev.subjects.map(subject =>
        subject.id === id ? { ...subject, ...updates } : subject
      )
    }));
  };

  const deleteSubject = (id: string) => {
    setStudyData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(subject => subject.id !== id)
    }));
  };

  // Show loading screen
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
        {darkMode && <StarryBackground />}
        <div className="text-center relative z-10">
          <div className="text-6xl mb-4 animate-bounce">🎯</div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-indigo-600'}`}>StudyQuest</h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return (
      <>
        {darkMode && <StarryBackground />}
        <Auth onLogin={handleLogin} darkMode={darkMode} />
      </>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard studyData={studyData} userName={user.displayName} />;
      case 'timer':
        return (
          <StudyTimer
            subjects={studyData.subjects}
            preferences={studyData.preferences}
            onSessionComplete={addStudySession}
            timerState={timerState}
            onTimerStateChange={setTimerState}
          />
        );
      case 'subjects':
        return (
          <SubjectManager
            subjects={studyData.subjects}
            onAddSubject={addSubject}
            onUpdateSubject={updateSubject}
            onDeleteSubject={deleteSubject}
          />
        );
      case 'analytics':
        return <ProgressAnalytics studyData={studyData} />;
      case 'achievements':
        return <Achievements studyData={studyData} />;
      case 'quiz':
        return <Quiz darkMode={darkMode} />;
      case 'rooms':
        return <StudyRooms userName={user.displayName} userAvatar={user.avatar} />;
      default:
        return <Dashboard studyData={studyData} userName={user.displayName} />;
    }
  };

  return (
    <div className={`min-h-screen relative transition-colors duration-500 ${
      darkMode 
        ? 'bg-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {darkMode && <StarryBackground />}
      <Navigation
        currentView={currentView}
        onViewChange={setCurrentView}
        level={studyData.level}
        xp={studyData.totalXP}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        user={user}
        onLogout={handleLogout}
      />
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className={darkMode ? 'dark-mode' : ''}>
          {renderCurrentView()}
        </div>
      </main>

      {/* Floating Mini Timer - shows when timer is active and not on timer page */}
      {(timerState.isActive || timerState.sessionTime > 0) && currentView !== 'timer' && (
        <div 
          onClick={() => setCurrentView('timer')}
          className={`fixed bottom-6 right-6 z-50 cursor-pointer transition-all duration-300 hover:scale-105 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } rounded-2xl shadow-2xl p-4 border-2 ${
            timerState.isBreak ? 'border-green-500' : 'border-indigo-500'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Animated indicator */}
            <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
              timerState.isBreak ? 'bg-green-100' : 'bg-indigo-100'
            }`}>
              {timerState.isActive && (
                <div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
                  timerState.isBreak ? 'bg-green-500' : 'bg-indigo-500'
                }`}></div>
              )}
              <span className="text-2xl relative z-10">
                {timerState.isBreak ? '☕' : '📚'}
              </span>
            </div>
            
            <div>
              <div className={`text-xl font-bold font-mono ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {formatTime(timerState.timeLeft)}
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {timerState.isBreak ? 'Break' : `Pomodoro ${timerState.pomodoroCount + 1}`}
                {timerState.isActive ? '' : ' (Paused)'}
              </div>
            </div>

            {/* Play/Pause button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTimerState(prev => ({ ...prev, isActive: !prev.isActive }));
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                timerState.isActive 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
            >
              {timerState.isActive ? '⏸' : '▶'}
            </button>
          </div>
          
          {/* Session progress */}
          {timerState.sessionTime > 0 && (
            <div className={`mt-2 pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Session: {Math.floor(timerState.sessionTime / 60)}min • {timerState.pomodoroCount} 🍅
              </div>
            </div>
          )}
          
          <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Click to open timer
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
