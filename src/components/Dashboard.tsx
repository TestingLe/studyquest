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
    // Change quote daily based on date
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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Welcome back, {userName || 'Scholar'}! 🎓</h2>
        <p className="text-indigo-100 text-lg">
          Ready to level up your knowledge? You're currently Level {studyData.level}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Progress</p>
              <p className="text-2xl font-bold text-gray-900">{todayTime}min</p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(goalProgress, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(goalProgress)}% of daily goal
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Level</p>
              <p className="text-2xl font-bold text-gray-900">{studyData.level}</p>
            </div>
            <div className="text-3xl">⭐</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {studyData.totalXP} total XP earned
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Study Streak</p>
              <p className="text-2xl font-bold text-gray-900">{studyData.streak}</p>
            </div>
            <div className="text-3xl">🔥</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {studyData.streak > 0 ? 'Keep it up!' : 'Start your streak today!'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Subjects</p>
              <p className="text-2xl font-bold text-gray-900">{studyData.subjects.length}</p>
            </div>
            <div className="text-3xl">📚</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Active learning paths
          </p>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Study Sessions</h3>
          <div className="space-y-3">
            {todaySessions.slice(-5).map((session) => {
              const subject = studyData.subjects.find(s => s.id === session.subjectId);
              return (
                <div key={session.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">{subject?.icon || '📖'}</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{subject?.name || 'Unknown Subject'}</p>
                    <p className="text-sm text-gray-500">{session.duration} minutes • {session.mood}</p>
                  </div>
                  <div className="text-sm font-medium text-indigo-600">
                    +{session.duration} XP
                  </div>
                </div>
              );
            })}
            {todaySessions.length === 0 && (
              <p className="text-gray-500 text-center py-4">No study sessions today yet. Start studying to see your progress!</p>
            )}
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Activity</h3>
          <div className="space-y-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
              const minutes = weeklyStats[day] || 0;
              const maxMinutes = Math.max(...Object.values(weeklyStats), 60);
              const percentage = (minutes / maxMinutes) * 100;
              
              return (
                <div key={day} className="flex items-center space-x-3">
                  <div className="w-8 text-sm font-medium text-gray-600">{day}</div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-sm font-medium text-gray-900 text-right">
                    {minutes}m
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <span className="text-4xl">💡</span>
          <div>
            <p className="text-lg font-medium italic mb-2">"{quote.text}"</p>
            <p className="text-yellow-100">— {quote.author}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
