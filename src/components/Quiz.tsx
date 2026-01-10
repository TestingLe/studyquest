import React, { useState, useCallback } from 'react';
import { playSound } from '../utils/sounds';

interface Question { id: string; question: string; options: string[]; correctAnswer: number; subject: string; }
interface QuizSet { id: string; name: string; subject: string; questions: Question[]; createdAt: string; timesPlayed: number; bestScore: number; }
interface QuizProps { darkMode?: boolean; }

export const Quiz: React.FC<QuizProps> = ({ darkMode = false }) => {
  const [quizSets, setQuizSets] = useState<QuizSet[]>(() => { const saved = localStorage.getItem('studyquest-quizzes'); return saved ? JSON.parse(saved) : []; });
  const [activeQuiz, setActiveQuiz] = useState<QuizSet | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuizName, setNewQuizName] = useState('');
  const [newQuizSubject, setNewQuizSubject] = useState('');
  const [newQuestions, setNewQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentOptions, setCurrentOptions] = useState(['', '', '', '']);
  const [currentCorrectAnswer, setCurrentCorrectAnswer] = useState(0);

  const cardBg = darkMode ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200 shadow-lg';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const modalBg = darkMode ? 'bg-gradient-to-br from-slate-900 to-purple-950 border-white/10' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

  const saveQuizSets = useCallback((sets: QuizSet[]) => { localStorage.setItem('studyquest-quizzes', JSON.stringify(sets)); setQuizSets(sets); }, []);
  const startQuiz = useCallback((quiz: QuizSet) => { playSound('click'); setActiveQuiz(quiz); setCurrentQuestionIndex(0); setSelectedAnswer(null); setShowResult(false); setScore(0); setQuizComplete(false); }, []);
  const handleAnswerSelect = useCallback((i: number) => { if (showResult) return; playSound('click'); setSelectedAnswer(i); }, [showResult]);
  const submitAnswer = useCallback(() => { if (selectedAnswer === null || !activeQuiz) return; const isCorrect = selectedAnswer === activeQuiz.questions[currentQuestionIndex].correctAnswer; if (isCorrect) { playSound('correct'); setScore(s => s + 1); } else { playSound('wrong'); } setShowResult(true); }, [selectedAnswer, activeQuiz, currentQuestionIndex]);
  const nextQuestion = useCallback(() => { playSound('click'); if (!activeQuiz) return; if (currentQuestionIndex < activeQuiz.questions.length - 1) { setCurrentQuestionIndex(i => i + 1); setSelectedAnswer(null); setShowResult(false); } else { setQuizComplete(true); playSound('complete'); const finalScore = score + (selectedAnswer === activeQuiz.questions[currentQuestionIndex].correctAnswer ? 1 : 0); saveQuizSets(quizSets.map(q => q.id === activeQuiz.id ? { ...q, timesPlayed: q.timesPlayed + 1, bestScore: Math.max(q.bestScore, finalScore) } : q)); } }, [activeQuiz, currentQuestionIndex, score, selectedAnswer, quizSets, saveQuizSets]);
  const addQuestion = useCallback(() => { if (!currentQuestion.trim() || currentOptions.some(o => !o.trim())) return; playSound('click'); setNewQuestions([...newQuestions, { id: Date.now().toString(), question: currentQuestion, options: [...currentOptions], correctAnswer: currentCorrectAnswer, subject: newQuizSubject }]); setCurrentQuestion(''); setCurrentOptions(['', '', '', '']); setCurrentCorrectAnswer(0); setShowAddQuestion(false); }, [currentQuestion, currentOptions, currentCorrectAnswer, newQuizSubject, newQuestions]);
  const createQuiz = useCallback(() => { if (!newQuizName.trim() || newQuestions.length === 0) return; playSound('complete'); saveQuizSets([...quizSets, { id: Date.now().toString(), name: newQuizName, subject: newQuizSubject || 'General', questions: newQuestions, createdAt: new Date().toISOString(), timesPlayed: 0, bestScore: 0 }]); setShowCreateModal(false); setNewQuizName(''); setNewQuizSubject(''); setNewQuestions([]); }, [newQuizName, newQuizSubject, newQuestions, quizSets, saveQuizSets]);
  const deleteQuiz = useCallback((id: string) => { playSound('click'); if (confirm('Delete this quiz?')) saveQuizSets(quizSets.filter(q => q.id !== id)); }, [quizSets, saveQuizSets]);
  const exitQuiz = useCallback(() => { playSound('click'); setActiveQuiz(null); setQuizComplete(false); }, []);

  // Quiz in progress
  if (activeQuiz && !quizComplete) {
    const question = activeQuiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={exitQuiz} className={`${textSecondary} hover:${textPrimary} flex items-center gap-2 transition-colors`}>← Exit Quiz</button>
          <div className="text-right">
            <div className={`text-sm ${textSecondary}`}>Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</div>
            <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">Score: {score}</div>
          </div>
        </div>
        <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}><div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
        <div className={`rounded-3xl p-8 border ${cardBg}`}>
          <h3 className={`text-xl font-semibold ${textPrimary} mb-6`}>{question.question}</h3>
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button key={index} onClick={() => handleAnswerSelect(index)} disabled={showResult}
                className={`w-full p-4 rounded-2xl text-left transition-all duration-300 border-2 ${
                  showResult ? index === question.correctAnswer ? 'bg-green-500/20 border-green-500 text-green-600' : index === selectedAnswer ? 'bg-red-500/20 border-red-500 text-red-600' : (darkMode ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-400')
                  : selectedAnswer === index ? 'bg-purple-500/20 border-purple-500' : (darkMode ? 'bg-white/5 border-white/10 hover:border-purple-500/50' : 'bg-gray-50 border-gray-200 hover:border-indigo-300')
                } ${textPrimary}`}>
                <span className="font-medium mr-3 opacity-60">{String.fromCharCode(65 + index)}.</span>{option}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            {!showResult ? (
              <button onClick={submitAnswer} disabled={selectedAnswer === null} className={`px-8 py-3 rounded-xl font-semibold transition-all ${selectedAnswer === null ? (darkMode ? 'bg-white/10 text-gray-500' : 'bg-gray-200 text-gray-400') + ' cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg'}`}>Submit Answer</button>
            ) : (
              <button onClick={nextQuestion} className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">{currentQuestionIndex < activeQuiz.questions.length - 1 ? 'Next Question →' : 'See Results'}</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz complete
  if (quizComplete && activeQuiz) {
    const percentage = Math.round((score / activeQuiz.questions.length) * 100);
    return (
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className={`rounded-3xl p-8 border ${cardBg}`}>
          <div className="text-6xl mb-4">{percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : percentage >= 40 ? '📚' : '💪'}</div>
          <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>Quiz Complete!</h2>
          <p className={`${textSecondary} mb-6`}>{activeQuiz.name}</p>
          <div className={`rounded-2xl p-6 border mb-6 ${darkMode ? 'bg-purple-500/20 border-purple-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
            <div className={`text-5xl font-bold ${textPrimary} mb-2`}>{score}/{activeQuiz.questions.length}</div>
            <div className="text-purple-500">{percentage}% Correct</div>
          </div>
          <div className={`rounded-xl p-4 mb-6 text-left space-y-2 ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div className={`flex justify-between text-sm ${textSecondary}`}><span>Correct</span><span className="text-green-500 font-medium">{score}</span></div>
            <div className={`flex justify-between text-sm ${textSecondary}`}><span>Wrong</span><span className="text-red-500 font-medium">{activeQuiz.questions.length - score}</span></div>
            <div className={`flex justify-between text-sm ${textSecondary}`}><span>Best Score</span><span className="text-purple-500 font-medium">{Math.max(activeQuiz.bestScore, score)}/{activeQuiz.questions.length}</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => startQuiz(activeQuiz)} className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">Try Again</button>
            <button onClick={exitQuiz} className={`flex-1 py-3 rounded-xl font-semibold transition-all ${darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  // Main quiz list
  return (
    <div className="space-y-6">
      <div className={`relative overflow-hidden rounded-3xl p-8 border ${darkMode ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-xl border-white/10' : 'bg-gradient-to-r from-pink-500 to-purple-600 border-transparent'}`}>
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Quiz Center 📝</h2>
            <p className={darkMode ? 'text-gray-300' : 'text-pink-100'}>Create custom quizzes to test your knowledge</p>
          </div>
          <button onClick={() => { playSound('click'); setShowCreateModal(true); }} className="px-5 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:scale-105">➕ Create Quiz</button>
        </div>
      </div>

      {quizSets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizSets.map(quiz => (
            <div key={quiz.id} className={`group rounded-2xl overflow-hidden border transition-all hover:scale-[1.02] ${cardBg}`}>
              <div className={`p-5 ${darkMode ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`}>
                <h3 className="text-lg font-bold text-white">{quiz.name}</h3>
                <p className={darkMode ? 'text-purple-200' : 'text-indigo-100'}>{quiz.subject}</p>
              </div>
              <div className="p-5">
                <div className={`flex justify-between text-sm ${textSecondary} mb-4`}><span>📝 {quiz.questions.length} questions</span><span>🎯 Best: {quiz.bestScore}/{quiz.questions.length}</span></div>
                <div className="flex gap-2">
                  <button onClick={() => startQuiz(quiz)} className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all">Start</button>
                  <button onClick={() => deleteQuiz(quiz.id)} className="px-4 py-2.5 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500/30 transition-all">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`rounded-2xl p-12 border text-center ${cardBg}`}>
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl flex items-center justify-center text-4xl shadow-lg mb-4">📝</div>
          <h3 className={`text-xl font-semibold ${textPrimary} mb-2`}>No quizzes yet</h3>
          <p className={`${textSecondary} mb-6`}>Create your first quiz to start testing your knowledge!</p>
          <button onClick={() => { playSound('click'); setShowCreateModal(true); }} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all">Create Your First Quiz</button>
        </div>
      )}

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className={`rounded-3xl w-full max-w-2xl border max-h-[90vh] overflow-y-auto ${modalBg}`} onClick={e => e.stopPropagation()}>
            <div className={`p-6 border-b flex items-center justify-between ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-bold ${textPrimary}`}>Create New Quiz</h3>
              <button onClick={() => { playSound('click'); setShowCreateModal(false); }} className={`text-2xl ${textSecondary}`}>×</button>
            </div>
            <div className="p-6 space-y-5">
              <div><label className={`block text-sm font-medium ${textSecondary} mb-2`}>Quiz Name</label><input type="text" value={newQuizName} onChange={e => setNewQuizName(e.target.value)} placeholder="e.g., Biology Chapter 5" className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${inputBg}`} /></div>
              <div><label className={`block text-sm font-medium ${textSecondary} mb-2`}>Subject</label><input type="text" value={newQuizSubject} onChange={e => setNewQuizSubject(e.target.value)} placeholder="e.g., Biology" className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${inputBg}`} /></div>
              <div>
                <div className="flex items-center justify-between mb-2"><label className={`text-sm font-medium ${textSecondary}`}>Questions ({newQuestions.length})</label><button onClick={() => { playSound('click'); setShowAddQuestion(true); }} className="text-sm text-purple-500 hover:text-purple-400 font-medium">+ Add Question</button></div>
                {newQuestions.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">{newQuestions.map((q, i) => (<div key={q.id} className={`flex items-center justify-between p-3 rounded-xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}><span className={`text-sm ${textPrimary} truncate flex-1`}>{i + 1}. {q.question}</span><button onClick={() => { playSound('click'); setNewQuestions(newQuestions.filter(nq => nq.id !== q.id)); }} className="text-red-500 hover:text-red-400 ml-2">×</button></div>))}</div>
                ) : (<div className={`text-center py-8 rounded-xl border ${darkMode ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>No questions added yet</div>)}
              </div>
            </div>
            <div className={`p-6 border-t flex gap-3 ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <button onClick={() => { playSound('click'); setShowCreateModal(false); }} className={`flex-1 py-3 rounded-xl font-medium transition-all ${darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Cancel</button>
              <button onClick={createQuiz} disabled={!newQuizName.trim() || newQuestions.length === 0} className={`flex-1 py-3 rounded-xl font-medium transition-all ${!newQuizName.trim() || newQuestions.length === 0 ? (darkMode ? 'bg-white/10 text-gray-500' : 'bg-gray-200 text-gray-400') + ' cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg'}`}>Create Quiz</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQuestion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddQuestion(false)}>
          <div className={`rounded-3xl w-full max-w-lg border ${modalBg}`} onClick={e => e.stopPropagation()}>
            <div className={`p-6 border-b flex items-center justify-between ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-bold ${textPrimary}`}>Add Question</h3>
              <button onClick={() => { playSound('click'); setShowAddQuestion(false); }} className={`text-2xl ${textSecondary}`}>×</button>
            </div>
            <div className="p-6 space-y-5">
              <div><label className={`block text-sm font-medium ${textSecondary} mb-2`}>Question</label><textarea value={currentQuestion} onChange={e => setCurrentQuestion(e.target.value)} placeholder="Enter your question..." rows={2} className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none ${inputBg}`} /></div>
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-2`}>Answer Options</label>
                <div className="space-y-2">
                  {currentOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <button onClick={() => { playSound('click'); setCurrentCorrectAnswer(index); }} className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${currentCorrectAnswer === index ? 'bg-green-500 text-white' : (darkMode ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-gray-200 text-gray-600 hover:bg-gray-300')}`}>{String.fromCharCode(65 + index)}</button>
                      <input type="text" value={option} onChange={e => { const newOptions = [...currentOptions]; newOptions[index] = e.target.value; setCurrentOptions(newOptions); }} placeholder={`Option ${String.fromCharCode(65 + index)}`} className={`flex-1 p-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${inputBg}`} />
                    </div>
                  ))}
                </div>
                <p className={`text-xs ${textSecondary} mt-2`}>Click the letter to mark the correct answer (green = correct)</p>
              </div>
            </div>
            <div className={`p-6 border-t flex gap-3 ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <button onClick={() => { playSound('click'); setShowAddQuestion(false); }} className={`flex-1 py-3 rounded-xl font-medium transition-all ${darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Cancel</button>
              <button onClick={addQuestion} disabled={!currentQuestion.trim() || currentOptions.some(o => !o.trim())} className={`flex-1 py-3 rounded-xl font-medium transition-all ${!currentQuestion.trim() || currentOptions.some(o => !o.trim()) ? (darkMode ? 'bg-white/10 text-gray-500' : 'bg-gray-200 text-gray-400') + ' cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg'}`}>Add Question</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
