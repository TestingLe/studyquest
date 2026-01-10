import React, { useState, useEffect } from 'react';
import type { StudyData } from '../types';

interface DashboardProps {
  studyData: StudyData;
  userName?: string;
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
  { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" }
];

export const Dashboard: React.FC<DashboardProps> = ({ studyData, userName }) => {
  const [quote, setQuote] = useState(motivationalQuotes[0]);
  
  useEffect(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setQuote(motivationalQuotes[dayOfYear % motivationalQuotes.length]);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = studyData.sessions.filter(session => 
    session.date.startsWith(today)
  );
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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {userName || 'Scholar'}! 🎓
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Ready to level up your knowledge? You're currently Level {studyData.level}!
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-purple-500/30">
              🚀
            </div>
          </div>
        </div>
        
        {/* Level Progress */}
        <div className="relative mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-300">Level {studyData.level}</span>
            <span className="text-gray-600 dark:text-gray-300">{currentLevelXP}/{100} XP to Level {studyData.level + 1}</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            title: "Today's Progress", 
            value: `${todayTime}min`, 
            icon: '📈', 
            color: 'from-green-500 to-emerald-600',
            progress: goalProgress,
            subtitle: `${Math.round(goalProgress)}% of daily goal`
          },
          { 
            title: 'Current Level', 
            value: studyData.level.toString(), 
            icon: '⭐', 
            color: 'from-blue-500 to-indigo-600',
            subtitle: `${studyData.totalXP} total XP earned`
          },
          { 
            title: 'Study Streak', 
            value: studyData.streak.toString(), 
            icon: '🔥', 
            color: 'from-orange-500 to-red-600',
            subtitle: studyData.streak > 0 ? 'Keep it up!' : 'Start your streak today!'
          },
          { 
            title: 'Subjects', 
            value: studyData.subjects.length.toString(), 
            icon: '📚', 
            color: 'from-purple-500 to-pink-600',
            subtitle: 'Active learning paths'
          },
        ].map((stat, i) => (
          <div 
            key={i}
            className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                  {stat.icon}
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
              {stat.progress !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
                    <div 
                      className={`bg-gradient-to-r ${stat.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(stat.progress, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity & Weekly Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-sm">📋</span>
            Recent Study Sessions
          </h3>
          <div className="space-y-3">
            {todaySessions.slice(-5).map((session) => {
              const subject = studyData.subjects.find(s => s.id === session.subjectId);
              return (
                <div 
                  key={session.id} 
                  className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center text-xl">
                    {subject?.icon || '📖'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{subject?.name || 'Unknown Subject'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{session.duration} minutes • {session.mood}</p>
                  </div>
                  <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                    +{session.duration} XP
                  </div>
                </div>
              );
            })}
            {todaySessions.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📚</div>
                <p className="text-gray-500 dark:text-gray-400">No study sessions today yet.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Start studying to see your progress!</p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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
                  <div className="w-10 text-sm font-medium text-gray-500 dark:text-gray-400">{day}</div>
                  <div className="flex-1">
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-14 text-sm font-medium text-gray-900 dark:text-white text-right">
                    {minutes}m
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-orange-500/30 flex-shrink-0">
            💡
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white italic mb-2">"{quote.text}"</p>
            <p className="text-gray-600 dark:text-gray-300">— {quote.author}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
