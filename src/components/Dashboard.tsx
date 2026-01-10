import React, { useState, useEffect } from 'react';
import type { StudyData } from '../types';

interface DashboardProps {
  studyData: StudyData;
  userName?: string;
  darkMode?: boolean;
}

const motivationalQuotes = [
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Education is the passport to the future.", author: "Malcolm X" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Study hard, for the well is deep, and our brains are shallow.", author: "Richard Baxter" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
];

export const Dashboard: React.FC<DashboardProps> = ({ studyData, userName, darkMode = false }) => {
  const [quote, setQuote] = useState(motivationalQuotes[0]);
  
  useEffect(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setQuote(motivationalQuotes[dayOfYear % motivationalQuotes.length]);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = studyData.sessions.filter(session => session.date.startsWith(today));
  const todayTime = todaySessions.reduce((total, session) => total + session.duration, 0);
  const goalProgress = (todayTime / studyData.preferences.studyGoal) * 100;

  const weekSessions = studyData.sessions.filter(session => {
    const sessionDate = new Date(session.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  });

  const weeklyStats = weekSessions.reduce((acc, session) => {
    const day = new Date(session.date).toLocaleDateString('en-US', { weekday: 'short' });
    acc[day] = (acc[day] || 0) + session.duration;
    return acc;
  }, {} as Record<string, number>);

  const currentLevelXP = studyData.totalXP - ((studyData.level - 1) * 100);
  const levelProgress = (currentLevelXP / 100) * 100;

  // Theme classes
  const cardBg = darkMode ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200 shadow-lg';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const textMuted = darkMode ? 'text-gray-500' : 'text-gray-500';

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className={`relative overflow-hidden rounded-3xl p-8 border ${darkMode ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-xl border-white/10' : 'bg-gradient-to-r from-indigo-500 to-purple-600 border-transparent'}`}>
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {userName || 'Scholar'}! 🎓</h2>
            <p className={darkMode ? 'text-gray-300' : 'text-indigo-100'}>Ready to level up your knowledge? You're currently Level {studyData.level}!</p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg">🚀</div>
          </div>
        </div>
        
        {/* Level Progress */}
        <div className="relative mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className={darkMode ? 'text-gray-300' : 'text-indigo-100'}>Level {studyData.level}</span>
            <span className={darkMode ? 'text-gray-300' : 'text-indigo-100'}>{currentLevelXP}/100 XP to Level {studyData.level + 1}</span>
          </div>
          <div className={`h-3 rounded-full overflow-hidden ${darkMode ? 'bg-white/20' : 'bg-white/30'}`}>
            <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500" style={{ width: `${levelProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Today's Progress", value: `${todayTime}min`, icon: '📈', color: 'from-green-500 to-emerald-600', progress: goalProgress, subtitle: `${Math.round(goalProgress)}% of daily goal` },
          { title: 'Current Level', value: studyData.level.toString(), icon: '⭐', color: 'from-blue-500 to-indigo-600', subtitle: `${studyData.totalXP} total XP earned` },
          { title: 'Study Streak', value: studyData.streak.toString(), icon: '🔥', color: 'from-orange-500 to-red-600', subtitle: studyData.streak > 0 ? 'Keep it up!' : 'Start your streak today!' },
          { title: 'Subjects', value: studyData.subjects.length.toString(), icon: '📚', color: 'from-purple-500 to-pink-600', subtitle: 'Active learning paths' },
        ].map((stat, i) => (
          <div key={i} className={`group relative rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] overflow-hidden ${cardBg}`}>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>{stat.icon}</div>
                <p className={`text-sm font-medium ${textSecondary}`}>{stat.title}</p>
              </div>
              <p className={`text-3xl font-bold ${textPrimary} mb-1`}>{stat.value}</p>
              {stat.progress !== undefined && (
                <div className="mt-2">
                  <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
                    <div className={`bg-gradient-to-r ${stat.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(stat.progress, 100)}%` }} />
                  </div>
                </div>
              )}
              <p className={`text-xs ${textMuted} mt-2`}>{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity & Weekly Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className={`rounded-2xl p-6 border ${cardBg}`}>
          <h3 className={`text-lg font-semibold ${textPrimary} mb-4 flex items-center gap-2`}>
            <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-sm">📋</span>
            Recent Study Sessions
          </h3>
          <div className="space-y-3">
            {todaySessions.slice(-5).map((session) => {
              const subject = studyData.subjects.find(s => s.id === session.subjectId);
              return (
                <div key={session.id} className={`flex items-center space-x-3 p-3 rounded-xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${darkMode ? 'bg-purple-500/20' : 'bg-indigo-100'}`}>{subject?.icon || '📖'}</div>
                  <div className="flex-1">
                    <p className={`font-medium ${textPrimary}`}>{subject?.name || 'Unknown Subject'}</p>
                    <p className={`text-sm ${textSecondary}`}>{session.duration} minutes • {session.mood}</p>
                  </div>
                  <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">+{session.duration} XP</div>
                </div>
              );
            })}
            {todaySessions.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📚</div>
                <p className={textSecondary}>No study sessions today yet.</p>
                <p className={`text-sm ${textMuted}`}>Start studying to see your progress!</p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Overview */}
        <div className={`rounded-2xl p-6 border ${cardBg}`}>
          <h3 className={`text-lg font-semibold ${textPrimary} mb-4 flex items-center gap-2`}>
            <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-sm">📊</span>
            This Week's Activity
          </h3>
          <div className="space-y-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
              const minutes = weeklyStats[day] || 0;
              const maxMinutes = Math.max(...Object.values(weeklyStats), 60);
              const percentage = (minutes / maxMinutes) * 100;
              return (
                <div key={day} className="flex items-center space-x-3">
                  <div className={`w-10 text-sm font-medium ${textSecondary}`}>{day}</div>
                  <div className="flex-1">
                    <div className={`w-full rounded-full h-3 overflow-hidden ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                  <div className={`w-14 text-sm font-medium ${textPrimary} text-right`}>{minutes}m</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className={`relative overflow-hidden rounded-2xl p-6 border ${darkMode ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-xl border-white/10' : 'bg-gradient-to-r from-yellow-400 to-orange-500 border-transparent'}`}>
        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0">💡</div>
          <div>
            <p className={`text-lg font-medium italic mb-2 ${darkMode ? 'text-white' : 'text-white'}`}>"{quote.text}"</p>
            <p className={darkMode ? 'text-gray-300' : 'text-yellow-100'}>— {quote.author}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
