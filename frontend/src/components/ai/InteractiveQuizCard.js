import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, RotateCcw, Sparkles, HelpCircle } from 'lucide-react';
import ProgressRing from '../compass/ProgressRing';

export default function InteractiveQuizCard({ quiz, onExplainQuestion, onRequestNewQuiz }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const questions = useMemo(() => quiz?.questions || [], [quiz]);
  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;
  const completionPct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  const score = useMemo(() => {
    if (!submitted) return 0;
    return questions.reduce((acc, q) => {
      const selected = answers[q.id];
      return acc + (selected === q.correct_key ? 1 : 0);
    }, 0);
  }, [submitted, questions, answers]);

  const percentage = totalCount > 0 ? Math.round((score / totalCount) * 100) : 0;

  const selectOption = (questionId, key) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: key }));
  };

  const handleSubmit = () => {
    if (answeredCount < totalCount) return;
    setSubmitted(true);
  };

  const handleRetake = () => {
    setAnswers({});
    setSubmitted(false);
  };

  if (!quiz || totalCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      data-testid="ai-quiz-card"
      className="rounded-2xl bg-[#10182d] border border-indigo-400/25 overflow-hidden shadow-xl"
    >
      {/* Quiz Header */}
      <div className="px-4 py-3.5 sm:px-5 border-b border-white/[0.08] bg-[#141f3a]/70 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-cyan-300 mb-0.5">
            <span>{quiz.subject}</span>
            <span>·</span>
            <span className="capitalize">{quiz.difficulty || 'medium'}</span>
            {quiz.isDemoSample && (
              <>
                <span>·</span>
                <span className="text-amber-300">Demo Sample Quiz (Not Live AI)</span>
              </>
            )}
          </div>
          <h4 className="text-sm sm:text-base font-semibold font-['Outfit'] text-white">
            {quiz.title}
          </h4>
        </div>

        <div className="text-right">
          {submitted ? (
            <span
              data-testid="ai-quiz-score"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-semibold border ${
                percentage >= 70
                  ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                  : 'bg-amber-500/15 border-amber-400/30 text-amber-300'
              }`}
            >
              Score: {score}/{totalCount} ({percentage}%)
            </span>
          ) : (
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              {answeredCount}/{totalCount} answered
            </span>
          )}
        </div>
      </div>

      {/* Animated Progress Indicator */}
      {!submitted && (
        <div className="h-1 bg-white/[0.06] w-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPct}%` }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
          />
        </div>
      )}

      {/* Post-submission Result Summary */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="px-4 py-4 sm:px-5 bg-gradient-to-r from-indigo-500/12 via-cyan-500/8 to-transparent border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <ProgressRing
              value={percentage}
              size={60}
              strokeWidth={5}
              color={percentage >= 70 ? '#10b981' : '#f59e0b'}
              label={`${percentage}%`}
            />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold font-['Outfit'] text-white">
                {percentage === 100
                  ? 'Perfect score!'
                  : percentage >= 70
                    ? 'Strong mastery!'
                    : 'Keep practicing!'}
              </p>
              <p className="text-xs text-slate-300 max-w-md">
                {percentage === 100
                  ? 'You answered every question correctly. Challenge yourself with Hard mode next.'
                  : percentage >= 70
                    ? `You scored ${score} out of ${totalCount}. Review any missed explanations below.`
                    : `You scored ${score} out of ${totalCount}. Read each explanation below or ask Nova to explain.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRetake}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake</span>
            </button>
            {onRequestNewQuiz && (
              <button
                type="button"
                onClick={onRequestNewQuiz}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white inline-flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Quiz</span>
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Questions List */}
      <div className="p-4 sm:p-5 space-y-5">
        {questions.map((q, qIdx) => {
          const selected = answers[q.id];
          const isCorrect = submitted && selected === q.correct_key;

          return (
            <div
              key={q.id || qIdx}
              className="p-3.5 sm:p-4 rounded-xl bg-[#0a1020] border border-white/[0.08] space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-white leading-snug">
                  <span className="font-mono text-indigo-400 mr-2">Q{qIdx + 1}.</span>
                  {q.question}
                </p>
                {submitted && (
                  <span className="shrink-0 mt-0.5">
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-label="Correct" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" aria-label="Incorrect" />
                    )}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(q.options || []).map((opt) => {
                  const key = String(opt.key).toUpperCase();
                  const isSelected = selected === key;
                  const isAnswer = q.correct_key === key;

                  let styleClass =
                    'bg-[#131c33] border-white/[0.08] text-slate-200 hover:border-indigo-400/40 hover:bg-[#17223d]';

                  if (submitted) {
                    if (isAnswer) {
                      styleClass = 'bg-emerald-500/15 border-emerald-400/45 text-emerald-100';
                    } else if (isSelected && !isAnswer) {
                      styleClass = 'bg-rose-500/15 border-rose-400/45 text-rose-200';
                    } else {
                      styleClass = 'bg-[#0e1528] border-white/[0.05] text-slate-400 opacity-75';
                    }
                  } else if (isSelected) {
                    styleClass =
                      'bg-indigo-500/20 border-indigo-400 text-white shadow-[0_0_0_1px_rgba(129,140,248,0.35)]';
                  }

                  return (
                    <motion.button
                      key={key}
                      type="button"
                      whileTap={!submitted ? { scale: 0.985 } : undefined}
                      disabled={submitted}
                      onClick={() => selectOption(q.id, key)}
                      data-testid={`quiz-opt-${qIdx}-${key}`}
                      className={`px-3 py-2.5 rounded-xl border text-left text-xs sm:text-[13px] transition-colors flex items-start gap-2.5 ${styleClass}`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md font-mono text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5 ${
                          submitted && isAnswer
                            ? 'bg-emerald-500/30 text-emerald-200'
                            : submitted && isSelected && !isAnswer
                              ? 'bg-rose-500/30 text-rose-200'
                              : isSelected
                                ? 'bg-indigo-500 text-white'
                                : 'bg-white/[0.06] text-slate-300'
                        }`}
                      >
                        {key}
                      </span>
                      <span className="leading-snug">{opt.text}</span>
                    </motion.button>
                  );
                })}
              </div>

              {submitted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pt-2.5 border-t border-white/[0.07] space-y-2"
                >
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-semibold text-cyan-300 mr-1.5">Explanation:</span>
                    {q.explanation}
                  </p>
                  {onExplainQuestion && (
                    <button
                      type="button"
                      onClick={() =>
                        onExplainQuestion(
                          `Explain why option ${q.correct_key} is the right answer for: "${q.question}"`
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-300 hover:text-indigo-200 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Ask Nova to explain this deeper</span>
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Bar */}
      {!submitted && (
        <div className="px-4 py-3.5 sm:px-5 border-t border-white/[0.08] bg-[#0c1324] flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            {answeredCount < totalCount
              ? `Select answers for all ${totalCount} questions to grade your quiz.`
              : 'All questions answered — ready to check your score!'}
          </p>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            data-testid="submit-ai-quiz-btn"
            onClick={handleSubmit}
            disabled={answeredCount < totalCount}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-45 disabled:pointer-events-none text-xs font-semibold text-white transition-all shadow-lg"
          >
            Submit Answers ({answeredCount}/{totalCount})
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
