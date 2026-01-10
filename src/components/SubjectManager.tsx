import React, { useState } from 'react';
import type { Subject } from '../types';

interface SubjectManagerProps {
  subjects: Subject[];
  onAddSubject: (subject: Omit<Subject, 'id' | 'totalTime' | 'sessionsCount'>) => void;
  onUpdateSubject: (id: string, updates: Partial<Subject>) => void;
  onDeleteSubject: (id: string) => void;
  darkMode?: boolean;
}

export const SubjectManager: React.FC<SubjectManagerProps> = ({ subjects, onAddSubject, onUpdateSubject, onDeleteSubject, darkMode = false }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newSubject, setNewSubject] = useState<{ name: string; color: string; icon: string; difficulty: 'easy' | 'medium' | 'hard'; targetTime: number }>({
    name: '', color: '#6366f1', icon: '📚', difficulty: 'medium', targetTime: 120
  });

  const presetSubjects = [
    { name: 'Mathematics', icon: '🧮', color: '#6366f1', difficulty: 'hard' as const },
    { name: 'Physics', icon: '🔬', color: '#8b5cf6', difficulty: 'hard' as const },
    { name: 'Chemistry', icon: '⚗️', color: '#06b6d4', difficulty: 'hard' as const },
    { name: 'Biology', icon: '🧬', color: '#10b981', difficulty: 'medium' as const },
    { name: 'History', icon: '📜', color: '#f59e0b', difficulty: 'medium' as const },
    { name: 'Literature', icon: '📚', color: '#ef4444', difficulty: 'medium' as const },
    { name: 'Computer Science', icon: '💻', color: '#3b82f6', difficulty: 'hard' as const },
    { name: 'Art', icon: '🎨', color: '#ec4899', difficulty: 'easy' as const },
    { name: 'Music', icon: '🎵', color: '#a855f7', difficulty: 'easy' as const },
    { name: 'Geography', icon: '🌍', color: '#14b8a6', difficulty: 'medium' as const },
    { name: 'Economics', icon: '📊', color: '#f97316', difficulty: 'medium' as const },
    { name: 'Language', icon: '🗣️', color: '#84cc16', difficulty: 'medium' as const },
  ];

  const subjectIcons = ['📚', '🔬', '🧮', '🎨', '💻', '🌍', '📝', '🎵', '⚖️', '🏥', '🔧', '📊', '⚗️', '🧬', '📜', '🗣️', '✏️'];
  const difficultyConfig = {
    easy: { label: 'Easy', bg: darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700' },
    medium: { label: 'Medium', bg: darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700' },
    hard: { label: 'Hard', bg: darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700' }
  };

  const cardBg = darkMode ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200 shadow-lg';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const modalBg = darkMode ? 'bg-gradient-to-br from-slate-900 to-purple-950 border-white/10' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

  const handleQuickAdd = (preset: typeof presetSubjects[0]) => {
    onAddSubject({ name: preset.name, color: preset.color, icon: preset.icon, difficulty: preset.difficulty, targetTime: 120 });
    setShowQuickAdd(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubject.name.trim()) {
      onAddSubject(newSubject);
      setNewSubject({ name: '', color: '#6366f1', icon: '📚', difficulty: 'medium', targetTime: 120 });
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`relative overflow-hidden rounded-3xl p-8 border ${darkMode ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-xl border-white/10' : 'bg-gradient-to-r from-indigo-500 to-purple-600 border-transparent'}`}>
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Subject Management 📚</h2>
            <p className={darkMode ? 'text-gray-300' : 'text-indigo-100'}>Organize your learning paths and track progress</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowQuickAdd(true)} className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:scale-105">➕ Quick Add</button>
            <button onClick={() => setShowAddForm(true)} className={`px-5 py-3 rounded-xl font-medium border transition-all ${darkMode ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}`}>✏️ Custom</button>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <div key={subject.id} className={`group rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] ${cardBg}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg" style={{ backgroundColor: `${subject.color}30` }}>{subject.icon}</div>
                <div>
                  <h3 className={`font-semibold ${textPrimary}`}>{subject.name}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${difficultyConfig[subject.difficulty].bg}`}>{difficultyConfig[subject.difficulty].label}</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className={`flex justify-between text-sm ${textSecondary}`}><span>Total Time</span><span className={`font-medium ${textPrimary}`}>{Math.floor(subject.totalTime / 60)}h {subject.totalTime % 60}m</span></div>
              <div className={`flex justify-between text-sm ${textSecondary}`}><span>Sessions</span><span className={`font-medium ${textPrimary}`}>{subject.sessionsCount}</span></div>
              {subject.targetTime && (
                <div className="space-y-2">
                  <div className={`flex justify-between text-sm ${textSecondary}`}><span>Weekly Goal</span><span className={`font-medium ${textPrimary}`}>{subject.targetTime}min</span></div>
                  <div className={`w-full rounded-full h-2 overflow-hidden ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min((subject.totalTime / subject.targetTime) * 100, 100)}%`, backgroundColor: subject.color }} />
                  </div>
                </div>
              )}
            </div>
            <div className={`mt-4 pt-4 border-t flex justify-between opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <button onClick={() => { const t = prompt('Enter weekly target (minutes):', subject.targetTime?.toString() || '120'); if (t && !isNaN(Number(t))) onUpdateSubject(subject.id, { targetTime: Number(t) }); }} className="text-sm text-purple-500 hover:text-purple-400 font-medium">⚙️ Edit Goal</button>
              <button onClick={() => { if (confirm(`Delete "${subject.name}"?`)) onDeleteSubject(subject.id); }} className="text-sm text-red-500 hover:text-red-400 font-medium">🗑️ Delete</button>
            </div>
          </div>
        ))}

        {subjects.length === 0 && (
          <div className={`col-span-full rounded-2xl p-12 border text-center ${cardBg}`}>
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl flex items-center justify-center text-4xl shadow-lg mb-4">📚</div>
            <h3 className={`text-xl font-semibold ${textPrimary} mb-2`}>No subjects yet</h3>
            <p className={`${textSecondary} mb-6`}>Add your first subject to start tracking your study progress!</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowQuickAdd(true)} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all">Quick Add Subject</button>
              <button onClick={() => setShowAddForm(true)} className={`px-6 py-3 rounded-xl font-medium border transition-all ${darkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>Create Custom</button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowQuickAdd(false)}>
          <div className={`rounded-3xl p-8 max-w-2xl w-full border max-h-[90vh] overflow-y-auto ${modalBg}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-2xl font-bold ${textPrimary}`}>Quick Add Subject</h3>
              <button onClick={() => setShowQuickAdd(false)} className={`text-2xl ${textSecondary} hover:${textPrimary}`}>×</button>
            </div>
            <p className={`${textSecondary} mb-6`}>Select a subject to add to your study list:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {presetSubjects.map((preset) => (
                <button key={preset.name} onClick={() => handleQuickAdd(preset)} className={`p-4 rounded-2xl border transition-all text-left group hover:scale-[1.02] ${darkMode ? 'bg-white/5 border-white/10 hover:border-purple-500/50' : 'bg-gray-50 border-gray-200 hover:border-indigo-500'}`}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform" style={{ backgroundColor: `${preset.color}30` }}>{preset.icon}</div>
                  <div className={`font-semibold ${textPrimary}`}>{preset.name}</div>
                  <div className={`text-xs mt-1 ${difficultyConfig[preset.difficulty].bg} inline-block px-2 py-0.5 rounded-full`}>{preset.difficulty}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Add Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddForm(false)}>
          <div className={`rounded-3xl p-8 max-w-md w-full border ${modalBg}`} onClick={e => e.stopPropagation()}>
            <h3 className={`text-2xl font-bold ${textPrimary} mb-6`}>Create Custom Subject</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-2`}>Subject Name</label>
                <input type="text" value={newSubject.name} onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })} placeholder="e.g., Mathematics" className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${inputBg}`} required />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-2`}>Choose Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {subjectIcons.map((icon) => (
                    <button key={icon} type="button" onClick={() => setNewSubject({ ...newSubject, icon })} className={`p-3 text-xl rounded-xl border transition-all ${newSubject.icon === icon ? 'border-purple-500 bg-purple-500/20' : (darkMode ? 'border-white/10 hover:border-white/30' : 'border-gray-200 hover:border-gray-300')}`}>{icon}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-2`}>Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button key={d} type="button" onClick={() => setNewSubject({ ...newSubject, difficulty: d })} className={`p-3 rounded-xl border capitalize transition-all ${newSubject.difficulty === d ? 'border-purple-500 bg-purple-500/20' : (darkMode ? 'border-white/10 hover:border-white/30' : 'border-gray-200 hover:border-gray-300')} ${textPrimary}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-2`}>Weekly Goal (minutes)</label>
                <input type="number" value={newSubject.targetTime} onChange={(e) => setNewSubject({ ...newSubject, targetTime: Number(e.target.value) })} min="30" max="1000" className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${inputBg}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-2`}>Color</label>
                <div className="grid grid-cols-6 gap-2">
                  {['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'].map((color) => (
                    <button key={color} type="button" onClick={() => setNewSubject({ ...newSubject, color })} className={`w-10 h-10 rounded-xl border-2 transition-all ${newSubject.color === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddForm(false)} className={`flex-1 py-3 rounded-xl font-medium transition-all ${darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all">Add Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
