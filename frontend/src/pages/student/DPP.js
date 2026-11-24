import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Clock, Zap, CheckCircle, XCircle, ChevronRight, ArrowLeft, Timer } from 'lucide-react';
import { toast } from 'sonner';

export default function DPP() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      const { data } = await api.get('/dpp');
      setSets(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const startQuiz = async (dppId) => {
    try {
      const { data } = await api.get(`/dpp/${dppId}`);
      setActiveQuiz(data);
      setQuestions(data.questions || []);
      setCurrentQ(0);
      setAnswers({});
      setQuizResult(null);
      setTimeLeft(data.time_limit || 600);
    } catch (err) { toast.error('Failed to load quiz'); }
  };

  useEffect(() => {
    if (!activeQuiz || quizResult) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuiz, quizResult]);

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitQuiz = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/dpp/${activeQuiz.id}/attempt`, {
        answers,
        time_taken: (activeQuiz.time_limit || 600) - timeLeft,
      });
      setQuizResult(data);
      toast.success(`Quiz completed! Score: ${data.score}/${data.total_marks}`);
      fetchSets();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="glass-card h-28 shimmer-bg rounded-xl" />)}</div>;
  }

  // Quiz Mode
  if (activeQuiz && !quizResult) {
    const q = questions[currentQ];
    if (!q) return null;

    return (
      <div className="quiz-mode flex flex-col" data-testid="quiz-mode">
        <div className="h-16 bg-[#111827]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6">
          <button onClick={() => setActiveQuiz(null)} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Exit Quiz
          </button>
          <span className="text-sm font-medium">{activeQuiz.title}</span>
          <div className="flex items-center gap-2 text-amber-400">
            <Timer className="w-4 h-4" />
            <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="h-1 bg-white/[0.06]">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl w-full"
          >
            <p className="text-xs text-white/30 font-mono mb-2">Question {currentQ + 1} of {questions.length}</p>
            <h2 className="text-xl font-semibold mb-8">{q.question_text}</h2>

            <div className="space-y-3">
              {q.options && Object.entries(q.options).map(([key, val]) => (
                <button
                  key={key}
                  data-testid={`option-${key}`}
                  onClick={() => handleAnswer(q.id, key)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    answers[q.id] === key
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-white'
                      : 'bg-white/[0.02] border-white/[0.06] text-white/70 hover:bg-white/[0.04] hover:border-white/[0.1]'
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.06] text-xs font-mono font-bold mr-3">{key}</span>
                  {val}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
                disabled={currentQ === 0}
                className="px-4 py-2 rounded-lg bg-white/[0.04] text-sm text-white/50 hover:text-white disabled:opacity-30 transition-all"
              >
                Previous
              </button>
              {currentQ < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQ(prev => prev + 1)}
                  className="px-6 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/30 transition-all flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  data-testid="submit-quiz-btn"
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                  className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium  transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Results View
  if (quizResult) {
    const pct = quizResult.total_marks > 0 ? Math.round((quizResult.score / quizResult.total_marks) * 100) : 0;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto space-y-6"
        data-testid="quiz-result"
      >
        <div className="glass-card p-8 text-center">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl font-bold font-mono mb-4 ${pct >= 80 ? 'bg-emerald-500/20 text-emerald-400' : pct >= 60 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
            {pct}%
          </div>
          <h2 className="text-xl font-bold mb-1">Quiz Complete!</h2>
          <p className="text-white/40 text-sm">Score: {quizResult.score}/{quizResult.total_marks}</p>
          {quizResult.xp_earned && (
            <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm">
              <Zap className="w-3.5 h-3.5" /> +{quizResult.xp_earned.amount} XP
            </div>
          )}
        </div>

        {/* Question Review */}
        <div className="space-y-3">
          {(quizResult.results_detail || []).map((r, i) => {
            const q = questions[i];
            return (
              <div key={r.question_id} className={`glass-card p-4 border-l-2 ${r.is_correct ? 'border-emerald-500' : 'border-red-500'}`}>
                <div className="flex items-start gap-2 mb-2">
                  {r.is_correct ? <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 mt-0.5" />}
                  <p className="text-sm">{q?.question_text}</p>
                </div>
                <div className="ml-6 text-xs space-y-1">
                  <p className="text-white/40">Your answer: <span className={r.is_correct ? 'text-emerald-400' : 'text-red-400'}>{r.user_answer || 'Not answered'}</span></p>
                  {!r.is_correct && <p className="text-white/40">Correct: <span className="text-emerald-400">{r.correct_answer}</span></p>}
                  {r.explanation && <p className="text-white/30 italic mt-1">{r.explanation}</p>}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => { setActiveQuiz(null); setQuizResult(null); }}
          className="w-full py-3 rounded-lg bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
        >
          Back to DPP List
        </button>
      </motion.div>
    );
  }

  // DPP List
  return (
    <motion.div
      data-testid="dpp-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold font-['Outfit'] tracking-tight">Daily Practice Problems</h1>
        <p className="text-white/40 text-sm mt-1">Sharpen your skills with practice quizzes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sets.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card glass-card-hover p-5 cursor-pointer"
            onClick={() => startQuiz(s.id)}
            data-testid={`dpp-card-${s.id}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-5 h-5 text-indigo-400" />
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50">{s.subject_name}</span>
            </div>
            <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
            <p className="text-xs text-white/40 mb-3">{s.description}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/30 flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor((s.time_limit || 600) / 60)} min</span>
              <span className="text-white/30">{s.question_count || 5} questions</span>
              <span className="text-indigo-400 flex items-center gap-1"><Zap className="w-3 h-3" /> +{s.xp_reward} XP</span>
            </div>
            {s.attempted && (
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Completed - {s.last_attempt?.score}/{s.last_attempt?.total_marks}
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
