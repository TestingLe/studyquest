import React, { useState, useCallback } from 'react';
import { playSound } from '../utils/sounds';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  subject: string;
}

interface QuizSet {
  id: string;
  name: string;
  subject: string;
  questions: Question[];
  createdAt: string;
  timesPlayed: number;
  bestScore: number;
}

interface QuizProps {
  darkMode?: boolean;
}

export const Quiz: React.FC<QuizProps> = (_props) => {
  const [quizSets, setQuizSets] = useState<QuizSet[]>(() => {
    const saved = localStorage.getItem('studyquest-quizzes');
    return saved ? JSON.parse(saved) : [];
  });
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

  const saveQuizSets = useCallback((sets: QuizSet[]) => {
    localStorage.setItem('studyquest-quizzes', JSON.stringify(sets));
    setQuizSets(sets);
  }, []);

  const startQuiz = useCallback((quiz: QuizSet) => {
    playSound('click');
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizComplete(false);
  }, []);

  const handleAnswerSelect = useCallback((answerIndex: number) => {
    if (showResult) return;
    playSound('click');
    setSelectedAnswer(answerIndex);
  }, [showResult]);

  const submitAnswer = useCallback(() => {
    if (selectedAnswer === null || !activeQuiz) return;
    const isCorrect = selectedAnswer === activeQuiz.questions[currentQuestionIndex].correctAnswer;
    if (isCorrect) { playSound('correct'); setScore(s => s + 1); } else { playSound('wrong'); }
    setShowResult(true);
  }, [selectedAnswer, activeQuiz, currentQuestionIndex]);

  const nextQuestion = useCallback(() => {
    playSound('click');
    if (!activeQuiz) return;
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
      playSound('complete');
      const finalScore = score + (selectedAnswer === activeQuiz.questions[currentQuestionIndex].correctAnswer ? 1 : 0);
      saveQuizSets(quizSets.map(q => q.id === activeQuiz.id ? { ...q, timesPlayed: q.timesPlayed + 1, bestScore: Math.max(q.bestScore, finalScore) } : q));
    }
  }, [activeQuiz, currentQuestionIndex, score, selectedAnswer, quizSets, saveQuizSets]);

  const addQuestion = useCallback(() => {
    if (!currentQuestion.trim() || currentOptions.some(o => !o.trim())) return;
    playSound('click');
    setNewQuestions([...newQuestions, { id: Date.now().toString(), question: currentQuestion, options: [...currentOptions], correctAnswer: currentCorrectAnswer, subject: newQuizSubject }]);
    setCurrentQuestion(''); setCurrentOptions(['', '', '', '']); setCurrentCorrectAnswer(0); setShowAddQuestion(false);
  }, [currentQuestion, currentOptions, currentCorrectAnswer, newQuizSubject, newQuestions]);

  const createQuiz = useCallback(() => {
    if (!newQuizName.trim() || newQuestions.length === 0) return;
    playSound('complete');
    saveQuizSets([...quizSets, { id: Date.now().toString(), name: newQuizName, subject: newQuizSubject || 'General', questions: newQuestions, createdAt: new Date().toISOString(), timesPlayed: 0, bestScore: 0 }]);
    setShowCreateModal(false); setNewQuizName(''); setNewQuizSubject(''); setNewQuestions([]);
  }, [newQuizName, newQuizSubject, newQuestions, quizSets, saveQuizSets]);

  const deleteQuiz = useCallback((quizId: string) => {
    playSound('click');
    if (confirm('Delete this quiz?')) saveQuizSets(quizSets.filter(q => q.id !== quizId));
  }, [quizSets, saveQuizSets]);

  const exitQuiz = useCallback(() => { playSound('click'); setActiveQuiz(null); setQuizComplete(false); }, []);

  // Quiz in progress
  if (activeQuiz && !quizComplete) {
    const question = activeQuiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={exitQuiz} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">← Exit Quiz</button>
          <div className="text-right">
            <div className="text-sm text-gray-400">Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</div>
            <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Score: {score}</div>
          </div>
        </div>

        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-6">{question.question}</h3>
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button key={index} onClick={() => handleAnswerSelect(index)} disabled={showResult}
                className={`w-full p-4 rounded-2xl text-left transition-all duration-300 border-2 ${
                  showResult
                    ? index === question.correctAnswer ? 'bg-green-500/20 border-green-500 text-green-300' : index === selectedAnswer ? 'bg-red-500/20 border-red-500 text-red-300' : 'bg-white/5 border-white/10 text-gray-500'
                    : selectedAnswer === index ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-white hover:border-purple-500/50 hover:bg-white/10'
                }`}>
                <span className="font-medium mr-3 opacity-60">{String.fromCharCode(65 + index)}.</span>{option}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            {!showResult ? (
              <button onClick={submitAnswer} disabled={selectedAnswer === null}
                className={`px-8 py-3 rounded-xl font-semibold transition-all ${selectedAnswer === null ? 'bg-white/10 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:shadow-purple-500/30'}`}>
                Submit Answer
              </button>
            ) : (
              <button onClick={nextQuestion} className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all">
                {currentQuestionIndex < activeQuiz.questions.length - 1 ? 'Next Question →' : 'See Results'}
              </button>
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
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
          <div className="text-6xl mb-4">{percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : percentage >= 40 ? '📚' : '💪'}</div>
          <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
          <p className="text-gray-400 mb-6">{activeQuiz.name}</p>
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl p-6 border border-purple-500/30 mb-6">
            <div className="text-5xl font-bold text-white mb-2">{score}/{activeQuiz.questions.length}</div>
            <div className="text-purple-300">{percentage}% Correct</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-400">Correct</span><span className="text-green-400 font-medium">{score}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Wrong</span><span className="text-red-400 font-medium">{activeQuiz.questions.length - score}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Best Score</span><span className="text-purple-400 font-medium">{Math.max(activeQuiz.bestScore, score)}/{activeQuiz.questions.length}</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => startQuiz(activeQuiz)} className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all">Try Again</button>
            <button onClick={exitQuiz} className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all">Back</button>
          </div>
        </div>
      </div>
    );
  }

  // Main quiz list
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-pink-400/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quiz Center 📝</h2>
            <p className="text-gray-600 dark:text-gray-300">Create custom quizzes to test your knowledge</p>
          </div>
          <button onClick={() => { playSound('click'); setShowCreateModal(true); }} className="px-5 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105">
            ➕ Create Quiz
          </button>
        </div>
      </div>

      {quizSets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizSets.map(quiz => (
            <div key={quiz.id} className="group bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all">
              <div className="bg-gradient-to-r from-purple-500/30 to-blue-500/30 p-5">
                <h3 className="text-lg font-bold text-white">{quiz.name}</h3>
                <p className="text-purple-200 text-sm">{quiz.subject}</p>
              </div>
              <div className="p-5">
                <div className="flex justify-between text-sm text-gray-400 mb-4">
                  <span>📝 {quiz.questions.length} questions</span>
                  <span>🎯 Best: {quiz.bestScore}/{quiz.questions.length}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startQuiz(quiz)} className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all">Start</button>
                  <button onClick={() => deleteQuiz(quiz.id)} className="px-4 py-2.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl flex items-center justify-center text-4xl shadow-lg shadow-purple-500/30 mb-4">📝</div>
          <h3 className="text-xl font-semibold text-white mb-2">No quizzes yet</h3>
          <p className="text-gray-400 mb-6">Create your first quiz to start testing your knowledge!</p>
          <button onClick={() => { playSound('click'); setShowCreateModal(true); }} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all">Create Your First Quiz</button>
        </div>
      )}

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-gradient-to-br from-slate-900 to-purple-950 rounded-3xl w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Create New Quiz</h3>
              <button onClick={() => { playSound('click'); setShowCreateModal(false); }} className="text-white/50 hover:text-white text-2xl">×</button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Quiz Name</label>
                <input type="text" value={newQuizName} onChange={e => setNewQuizName(e.target.value)} placeholder="e.g., Biology Chapter 5" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Subject</label>
                <input type="text" value={newQuizSubject} onChange={e => setNewQuizSubject(e.target.value)} placeholder="e.g., Biology" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white/80">Questions ({newQuestions.length})</label>
                  <button onClick={() => { playSound('click'); setShowAddQuestion(true); }} className="text-sm text-purple-400 hover:text-purple-300 font-medium">+ Add Question</button>
                </div>
                {newQuestions.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {newQuestions.map((q, i) => (
                      <div key={q.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-sm text-white truncate flex-1">{i + 1}. {q.question}</span>
                        <button onClick={() => { playSound('click'); setNewQuestions(newQuestions.filter(nq => nq.id !== q.id)); }} className="text-red-400 hover:text-red-300 ml-2">×</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white/5 rounded-xl text-gray-500 border border-white/10">No questions added yet</div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button onClick={() => { playSound('click'); setShowCreateModal(false); }} className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all">Cancel</button>
              <button onClick={createQuiz} disabled={!newQuizName.trim() || newQuestions.length === 0} className={`flex-1 py-3 rounded-xl font-medium transition-all ${!newQuizName.trim() || newQuestions.length === 0 ? 'bg-white/10 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:shadow-purple-500/30'}`}>Create Quiz</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQuestion && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddQuestion(false)}>
          <div className="bg-gradient-to-br from-slate-900 to-purple-950 rounded-3xl w-full max-w-lg border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add Question</h3>
              <button onClick={() => { playSound('click'); setShowAddQuestion(false); }} className="text-white/50 hover:text-white text-2xl">×</button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Question</label>
                <textarea value={currentQuestion} onChange={e => setCurrentQuestion(e.target.value)} placeholder="Enter your question..." rows={2} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Answer Options</label>
                <div className="space-y-2">
                  {currentOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <button onClick={() => { playSound('click'); setCurrentCorrectAnswer(index); }} className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${currentCorrectAnswer === index ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>{String.fromCharCode(65 + index)}</button>
                      <input type="text" value={option} onChange={e => { const newOptions = [...currentOptions]; newOptions[index] = e.target.value; setCurrentOptions(newOptions); }} placeholder={`Option ${String.fromCharCode(65 + index)}`} className="flex-1 p-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Click the letter to mark the correct answer (green = correct)</p>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button onClick={() => { playSound('click'); setShowAddQuestion(false); }} className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all">Cancel</button>
              <button onClick={addQuestion} disabled={!currentQuestion.trim() || currentOptions.some(o => !o.trim())} className={`flex-1 py-3 rounded-xl font-medium transition-all ${!currentQuestion.trim() || currentOptions.some(o => !o.trim()) ? 'bg-white/10 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:shadow-purple-500/30'}`}>Add Question</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
