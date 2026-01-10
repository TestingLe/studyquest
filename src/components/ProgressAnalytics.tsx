import React, { useMemo } from 'react';
import type { StudyData } from '../types';

interface ProgressAnalyticsProps {
  studyData: StudyData;
}

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({ studyData }) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Progress Analytics 📊</h2>
          <p className="text-gray-600 dark:text-gray-300">Insights into your study patterns and progress over time</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '📊', value: `${Math.floor(analytics.weeklyTime / 60)}h ${analytics.weeklyTime % 60}m`, label: 'This Week', color: 'from-blue-500 to-indigo-600' },
          { icon: '⏱️', value: `${Math.floor(analytics.avgDailyTime)}min`, label: 'Daily Average', color: 'from-green-500 to-emerald-600' },
          { icon: '📈', value: studyData.sessions.length.toString(), label: 'Total Sessions', color: 'from-purple-500 to-pink-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 group hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Activity Chart */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-sm">📅</span>
          Daily Study Time (Last 30 Days)
        </h3>
        <div className="space-y-2">
          <div className="flex items-end space-x-1 h-40">
            {analytics.dailyData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center group relative">
                <div
                  className="w-full bg-gradient-to-t from-purple-500 to-blue-500 rounded-t transition-all duration-300 hover:from-purple-400 hover:to-blue-400 cursor-pointer"
                  style={{ height: `${Math.max((day.time / maxDailyTime) * 100, day.time > 0 ? 3 : 0)}%` }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                    <div className="font-medium">{day.date}</div>
                    <div>{day.time} minutes</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-white/10">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-sm">📚</span>
          Subject Performance
        </h3>
        <div className="space-y-4">
          {analytics.subjectStats.slice(0, 5).map((subject) => (
            <div key={subject.id} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${subject.color}20` }}>
                  {subject.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">{subject.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{Math.floor(subject.recentTime / 60)}h {subject.recentTime % 60}m</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${analytics.totalRecentTime > 0 ? (subject.recentTime / analytics.totalRecentTime) * 100 : 0}%`, backgroundColor: subject.color }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <span>{subject.recentSessions} sessions</span>
                    <span>Avg: {Math.floor(subject.avgSessionLength)}min</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {analytics.subjectStats.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📚</div>
              <p className="text-gray-500 dark:text-gray-400">No study data available yet.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Start studying to see your progress!</p>
            </div>
          )}
        </div>
      </div>

      {/* Mood Analysis */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
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
              <div key={mood} className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all text-center group">
                <div className={`w-14 h-14 mx-auto bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-3 group-hover:scale-110 transition-transform`}>
                  {emoji}
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">{label}</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{count}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{percentage}% of sessions</div>
              </div>
            );
          })}
        </div>
        {Object.keys(analytics.moodStats).length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Complete some study sessions to see your mood patterns!</p>
          </div>
        )}
      </div>
    </div>
  );
};
