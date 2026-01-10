import React, { useMemo } from 'react';
import type { StudyData } from '../types';

interface ProgressAnalyticsProps {
  studyData: StudyData;
  darkMode?: boolean;
}

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({ studyData, darkMode = false }) => {
  const analytics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentSessions = studyData.sessions.filter(session => new Date(session.date) >= thirtyDaysAgo);
    const weekSessions = studyData.sessions.filter(session => new Date(session.date) >= sevenDaysAgo);

    const dailyData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const daySessions = recentSessions.filter(session => session.date.startsWith(dateStr));
      return { date: dateStr, day: date.getDate(), time: daySessions.reduce((sum, s) => sum + s.duration, 0), sessions: daySessions.length };
    });

    const subjectStats = studyData.subjects.map(subject => {
      const subjectSessions = recentSessions.filter(session => session.subjectId === subject.id);
      const totalTime = subjectSessions.reduce((sum, s) => sum + s.duration, 0);
      return { ...subject, recentTime: totalTime, recentSessions: subjectSessions.length, avgSessionLength: subjectSessions.length > 0 ? totalTime / subjectSessions.length : 0 };
    }).sort((a, b) => b.recentTime - a.recentTime);

    const moodStats = recentSessions.reduce((acc, session) => { acc[session.mood] = (acc[session.mood] || 0) + 1; return acc; }, {} as Record<string, number>);

    return {
      dailyData, subjectStats, moodStats,
      totalRecentTime: recentSessions.reduce((sum, s) => sum + s.duration, 0),
      avgDailyTime: recentSessions.reduce((sum, s) => sum + s.duration, 0) / 30,
      weeklyTime: weekSessions.reduce((sum, s) => sum + s.duration, 0)
    };
  }, [studyData]);

  const maxDailyTime = Math.max(...analytics.dailyData.map(d => d.time), 60);
  const cardBg = darkMode ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200 shadow-lg';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`relative overflow-hidden rounded-3xl p-8 border ${darkMode ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border-white/10' : 'bg-gradient-to-r from-blue-500 to-cyan-500 border-transparent'}`}>
        <div className="relative">
          <h2 className="text-3xl font-bold text-white mb-2">Progress Analytics 📊</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-blue-100'}>Insights into your study patterns and progress over time</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '📊', value: `${Math.floor(analytics.weeklyTime / 60)}h ${analytics.weeklyTime % 60}m`, label: 'This Week', color: 'from-blue-500 to-indigo-600' },
          { icon: '⏱️', value: `${Math.floor(analytics.avgDailyTime)}min`, label: 'Daily Average', color: 'from-green-500 to-emerald-600' },
          { icon: '📈', value: studyData.sessions.length.toString(), label: 'Total Sessions', color: 'from-purple-500 to-pink-600' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-2xl p-6 border group hover:scale-[1.02] transition-all ${cardBg}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${textSecondary} mb-1`}>{stat.label}</p>
                <p className={`text-3xl font-bold ${textPrimary}`}>{stat.value}</p>
              </div>
              <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Activity Chart */}
      <div className={`rounded-2xl p-6 border ${cardBg}`}>
        <h3 className={`text-lg font-semibold ${textPrimary} mb-6 flex items-center gap-2`}>
          <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-sm">📅</span>
          Daily Study Time (Last 30 Days)
        </h3>
        <div className="space-y-2">
          <div className="flex items-end space-x-1 h-40">
            {analytics.dailyData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center group relative">
                <div className="w-full bg-gradient-to-t from-purple-500 to-blue-500 rounded-t transition-all duration-300 hover:from-purple-400 hover:to-blue-400 cursor-pointer" style={{ height: `${Math.max((day.time / maxDailyTime) * 100, day.time > 0 ? 3 : 0)}%` }} />
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div className={`text-xs rounded-lg px-3 py-2 whitespace-nowrap ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'}`}>
                    <div className="font-medium">{day.date}</div>
                    <div>{day.time} minutes</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={`flex justify-between text-xs ${textSecondary} pt-2 border-t ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
            <span>30 days ago</span><span>Today</span>
          </div>
        </div>
      </div>

      {/* Subject Performance */}
      <div className={`rounded-2xl p-6 border ${cardBg}`}>
        <h3 className={`text-lg font-semibold ${textPrimary} mb-6 flex items-center gap-2`}>
          <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-sm">📚</span>
          Subject Performance
        </h3>
        <div className="space-y-4">
          {analytics.subjectStats.slice(0, 5).map((subject) => (
            <div key={subject.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${subject.color}20` }}>{subject.icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-medium ${textPrimary}`}>{subject.name}</span>
                    <span className={`text-sm ${textSecondary}`}>{Math.floor(subject.recentTime / 60)}h {subject.recentTime % 60}m</span>
                  </div>
                  <div className={`w-full rounded-full h-2 overflow-hidden ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${analytics.totalRecentTime > 0 ? (subject.recentTime / analytics.totalRecentTime) * 100 : 0}%`, backgroundColor: subject.color }} />
                  </div>
                  <div className={`flex justify-between text-xs ${textSecondary} mt-2`}><span>{subject.recentSessions} sessions</span><span>Avg: {Math.floor(subject.avgSessionLength)}min</span></div>
                </div>
              </div>
            </div>
          ))}
          {analytics.subjectStats.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📚</div>
              <p className={textSecondary}>No study data available yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mood Analysis */}
      <div className={`rounded-2xl p-6 border ${cardBg}`}>
        <h3 className={`text-lg font-semibold ${textPrimary} mb-6 flex items-center gap-2`}>
          <span className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center text-sm">🧠</span>
          Study Mood Analysis
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { mood: 'focused', emoji: '🎯', label: 'Focused', color: 'from-green-500 to-emerald-600' },
            { mood: 'energetic', emoji: '⚡', label: 'Energetic', color: 'from-yellow-500 to-orange-600' },
            { mood: 'tired', emoji: '😴', label: 'Tired', color: 'from-blue-500 to-indigo-600' },
            { mood: 'distracted', emoji: '😵', label: 'Distracted', color: 'from-red-500 to-pink-600' }
          ].map(({ mood, emoji, label, color }) => {
            const count = analytics.moodStats[mood] || 0;
            const total = Object.values(analytics.moodStats).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={mood} className={`rounded-2xl p-5 border text-center group hover:scale-[1.02] transition-all ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`w-14 h-14 mx-auto bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-3 group-hover:scale-110 transition-transform`}>{emoji}</div>
                <div className={`font-semibold ${textPrimary}`}>{label}</div>
                <div className={`text-3xl font-bold ${textPrimary} mt-1`}>{count}</div>
                <div className={`text-sm ${textSecondary}`}>{percentage}% of sessions</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
