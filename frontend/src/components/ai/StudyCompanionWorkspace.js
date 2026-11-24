import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Lightbulb, HelpCircle, Calendar, Send, Sparkles,
  RotateCcw, AlertCircle, RefreshCw, ArrowRight, Clock, Layers,
  CheckCircle2, Maximize2, GraduationCap, Info
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  getDemoExplainResponse,
  getDemoHintResponse,
  getDemoQuiz,
  getDemoStudyPlan,
} from '../../lib/aiDemoSamples';
import FormattedTutorMessage from './FormattedTutorMessage';
import ExplainSectionsCard from './ExplainSectionsCard';
import InteractiveQuizCard from './InteractiveQuizCard';
import WeeklyStudyPlanner from './WeeklyStudyPlanner';

export const TUTOR_MODES = [
  {
    id: 'explain',
    label: 'Explain',
    shortLabel: 'Explain',
    tagline: 'Overview, steps, worked example & formulas',
    icon: BookOpen,
    accent: 'text-indigo-300',
    badgeBg: 'bg-indigo-500/15 border-indigo-400/30 text-indigo-200',
    placeholder: 'Enter any concept, theorem, or question to break down...',
  },
  {
    id: 'hint',
    label: 'Give Me a Hint',
    shortLabel: 'Hint',
    tagline: 'Progressive clues one step at a time',
    icon: Lightbulb,
    accent: 'text-amber-300',
    badgeBg: 'bg-amber-500/15 border-amber-400/30 text-amber-200',
    placeholder: 'Paste a homework problem or your partial attempt...',
  },
  {
    id: 'quiz',
    label: 'Quiz Me',
    shortLabel: 'Quiz Me',
    tagline: 'Interactive practice questions with scoring',
    icon: HelpCircle,
    accent: 'text-cyan-300',
    badgeBg: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-200',
    placeholder: 'Enter a topic to generate a practice quiz (e.g., Kinematics)...',
  },
  {
    id: 'study-plan',
    label: 'Study Plan',
    shortLabel: 'Study Plan',
    tagline: 'Weekly planner built from your workload',
    icon: Calendar,
    accent: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200',
    placeholder: 'Describe your exam goals or focus areas for this week...',
  },
];

export const SUBJECT_OPTIONS = [
  'All Subjects',
  'Mathematics',
  'Physics',
  'Chemistry',
  'English',
  'Computer Science',
];

const SUGGESTED_PROMPTS = {
  explain: {
    'All Subjects': [
      "Explain Newton's 2nd Law with a worked example and formula",
      'Break down Trigonometric Identities on the unit circle',
      'How do Quantum Numbers and atomic orbitals work?',
    ],
    Mathematics: [
      'Explain trigonometric identities and when to apply each',
      'Walk me through solving quadratic inequalities step by step',
      'What is the geometric meaning of a derivative?',
    ],
    Physics: [
      "Explain Newton's 2nd Law of Motion and F = ma units",
      'How does conservation of mechanical energy work with examples?',
      'Clarify Ohm’s Law and series vs. parallel circuits',
    ],
    Chemistry: [
      'Explain quantum numbers and orbital shapes clearly',
      'How do I balance redox reactions step by step?',
      'Difference between ideal and real gases',
    ],
    English: [
      'How do I structure an analytical essay thesis and topic sentences?',
      'Explain irony vs. satire with clear literary examples',
      'Common active vs. passive voice pitfalls to avoid',
    ],
    'Computer Science': [
      'Explain time complexity (Big-O) using binary search vs. linear search',
      'How does recursion work with a base case and call stack?',
      'Difference between stacks, queues, and linked lists',
    ],
  },
  hint: {
    'All Subjects': [
      'Solve: 2x² - 7x + 3 = 0',
      'A 4 kg block accelerates at 3 m/s² against 2 N friction. Find the applied force.',
      'Help me balance: Fe + O2 -> Fe2O3 step by step',
    ],
    Mathematics: [
      'Solve: 2x² - 7x + 3 = 0',
      'Give me a first hint to prove: (1 - cos²θ) / sinθ = sinθ',
      'Guide me on finding the vertex of y = x² - 6x + 5',
    ],
    Physics: [
      'A 4 kg block accelerates at 3 m/s² against 2 N friction. Find the applied force.',
      'Help me set up forces for a block on a 30° frictionless incline',
      'Hint for finding equivalent resistance of 6Ω and 3Ω in parallel',
    ],
    Chemistry: [
      'How many moles are in 44g of CO2? Give me a first nudge',
      'Help me find the oxidation state of Cr in K2Cr2O7',
      'Guide me to write the electron configuration of Copper (Z=29)',
    ],
    English: [
      'Help me improve this thesis: "Technology has pros and cons in schools."',
      'Give me a clue on identifying the tone in an argumentative passage',
      'How can I tighten wordy transitions between essay paragraphs?',
    ],
    'Computer Science': [
      'Hint for finding two numbers in a sorted array that sum to target T',
      'Why does my recursive factorial function cause a stack overflow?',
      'Help me trace a breadth-first search step by step',
    ],
  },
  quiz: {
    'All Subjects': [
      'Laws of Motion & Kinematics',
      'Trigonometric Identities & Equations',
      'Atomic Structure & Quantum Numbers',
    ],
    Mathematics: [
      'Trigonometric Identities',
      'Quadratic Equations & Functions',
      'Permutations & Combinations',
    ],
    Physics: [
      "Newton's Laws & Friction",
      'Work, Energy & Power',
      'Current Electricity & Circuits',
    ],
    Chemistry: [
      'Atomic Structure & Orbitals',
      'Chemical Bonding & VSEPR',
      'Mole Concept & Stoichiometry',
    ],
    English: [
      'Grammar, Clauses & Modifiers',
      'Literary Devices & Rhetoric',
      'Reading Comprehension & Inference',
    ],
    'Computer Science': [
      'Arrays, Searching & Big-O',
      'Object-Oriented Programming',
      'Recursion & Stack Traces',
    ],
  },
  'study-plan': {
    'All Subjects': [
      'Build a balanced 7-day study planner around my assignments & quizzes',
      'Focus this week on Trigonometry and Laws of Motion',
      'Create an evening exam revision planner for 2 hours/day',
    ],
    Mathematics: [
      'Plan a 7-day Trigonometry and Algebra practice sprint',
      'Daily Mathematics problem-solving schedule',
    ],
    Physics: [
      '7-day Physics conceptual review + numerical practice schedule',
      'Prepare me for my upcoming Mechanics assessment',
    ],
    Chemistry: [
      'Plan weekly Chemistry revision mixing reactions and numericals',
      'Weekly Atomic Structure and Bonding schedule',
    ],
    English: ['Schedule essay drafting, vocabulary, and comprehension practice'],
    'Computer Science': ['Weekly coding practice plan covering algorithms and debugging'],
  },
};

function TypingIndicator({ label = 'Nova is thinking' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex justify-start"
    >
      <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#121a30] border border-white/[0.08] text-xs text-slate-300">
        <span className="flex items-center gap-1" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="w-1.5 h-1.5 rounded-full bg-cyan-400"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: dot * 0.16,
                ease: 'easeInOut',
              }}
            />
          ))}
        </span>
        <span className="font-mono text-[11px] text-slate-400">{label}...</span>
      </div>
    </motion.div>
  );
}

export default function StudyCompanionWorkspace({
  variant = 'page', // 'page' | 'drawer'
  externalLaunch = null,
  onExpandFullView = null,
}) {
  const { user } = useAuth();
  const isDrawer = variant === 'drawer';

  const [aiConfigured, setAiConfigured] = useState(null); // null | true | false
  const [mode, setMode] = useState('explain');
  const [subject, setSubject] = useState('All Subjects');
  const [input, setInput] = useState('');
  const [loadingMode, setLoadingMode] = useState(null);

  const [threads, setThreads] = useState({
    explain: [],
    hint: [],
    quiz: [],
    'study-plan': [],
  });
  const [errors, setErrors] = useState({});

  // Track active hint problem prompt for Demo Mode multi-step progression
  const [activeHintTopic, setActiveHintTopic] = useState('');

  const [quizDifficulty, setQuizDifficulty] = useState('medium');
  const [quizCount, setQuizCount] = useState(4);
  const [dailyHours, setDailyHours] = useState(2);

  const [sessionId] = useState(() => `companion-${Date.now()}`);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastLaunchRef = useRef(null);

  useEffect(() => {
    let active = true;
    api
      .get('/ai/status')
      .then(({ data }) => {
        if (active) setAiConfigured(Boolean(data?.configured));
      })
      .catch(() => {
        if (active) setAiConfigured(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const activeModeConfig = useMemo(
    () => TUTOR_MODES.find((m) => m.id === mode) || TUTOR_MODES[0],
    [mode]
  );

  const currentItems = threads[mode] || [];
  const currentError = errors[mode] || null;
  const isLoading = loadingMode === mode;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentItems.length, isLoading, mode]);

  const clearError = (targetMode) => {
    setErrors((prev) => ({ ...prev, [targetMode]: null }));
  };

  const runExplainOrHint = useCallback(
    async (targetMode, text, targetSubject = subject, options = {}) => {
      const { isRetry = false, revealWalkthrough = false } = options;
      const msg = text.trim();
      if (!msg || loadingMode) return;

      clearError(targetMode);
      const currentThread = threads[targetMode] || [];
      const historySlice =
        isRetry && currentThread[currentThread.length - 1]?.role === 'user'
          ? currentThread.slice(0, -1)
          : currentThread;
      const existingHistory = historySlice.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      if (targetMode === 'hint' && !revealWalkthrough && !/next.*hint/i.test(msg)) {
        setActiveHintTopic(msg);
      }

      if (!isRetry) {
        setThreads((prev) => ({
          ...prev,
          [targetMode]: [
            ...(prev[targetMode] || []),
            { id: `u-${Date.now()}`, role: 'user', content: msg, subject: targetSubject },
          ],
        }));
        setInput('');
      }
      setLoadingMode(targetMode);

      const deliverDemoFallback = async () => {
        await new Promise((r) => setTimeout(r, 420));
        setAiConfigured(false);
        setThreads((prev) => {
          const priorAssistantCount = (prev[targetMode] || []).filter(
            (m) => m.role === 'assistant'
          ).length;
          const nextHintStep = priorAssistantCount + 1;
          const responseText =
            targetMode === 'hint'
              ? getDemoHintResponse(
                  activeHintTopic || msg,
                  targetSubject,
                  nextHintStep,
                  revealWalkthrough
                )
              : getDemoExplainResponse(msg, targetSubject);

          return {
            ...prev,
            [targetMode]: [
              ...(prev[targetMode] || []),
              {
                id: `a-${Date.now()}`,
                role: 'assistant',
                content: responseText,
                mode: targetMode,
                subject: targetSubject,
                hintNumber: targetMode === 'hint' && !revealWalkthrough ? nextHintStep : null,
                isWalkthrough: revealWalkthrough,
                isDemoSample: true,
              },
            ],
          };
        });
      };

      if (aiConfigured === false) {
        await deliverDemoFallback();
        setLoadingMode(null);
        return;
      }

      try {
        const { data } = await api.post('/ai/chat', {
          message: msg,
          session_id: `${sessionId}-${targetMode}`,
          mode: targetMode,
          subject: targetSubject,
          history: existingHistory,
        });

        setThreads((prev) => {
          const priorAssistantCount = (prev[targetMode] || []).filter(
            (m) => m.role === 'assistant'
          ).length;
          return {
            ...prev,
            [targetMode]: [
              ...(prev[targetMode] || []),
              {
                id: `a-${Date.now()}`,
                role: 'assistant',
                content: data.response,
                mode: targetMode,
                subject: targetSubject,
                hintNumber: targetMode === 'hint' && !revealWalkthrough ? priorAssistantCount + 1 : null,
                isWalkthrough: revealWalkthrough,
                isDemoSample: false,
              },
            ],
          };
        });
      } catch (err) {
        if (err.response?.status === 503) {
          await deliverDemoFallback();
        } else {
          const detail =
            err.response?.data?.detail ||
            'Unable to reach SchoolExpo AI Tutor right now. Please try again.';
          setErrors((prev) => ({
            ...prev,
            [targetMode]: {
              message: detail,
              retryAction: () =>
                runExplainOrHint(targetMode, msg, targetSubject, { isRetry: true, revealWalkthrough }),
            },
          }));
        }
      } finally {
        setLoadingMode(null);
      }
    },
    [activeHintTopic, aiConfigured, loadingMode, sessionId, subject, threads]
  );

  const runQuizGenerator = useCallback(
    async (
      topicText,
      targetSubject = subject,
      diff = quizDifficulty,
      count = quizCount,
      isRetry = false
    ) => {
      const topic = topicText.trim();
      if (!topic || loadingMode) return;

      clearError('quiz');
      if (!isRetry) {
        setThreads((prev) => ({
          ...prev,
          quiz: [
            ...(prev.quiz || []),
            {
              id: `qu-${Date.now()}`,
              type: 'user',
              content: `Generate a ${count}-question ${diff} quiz on "${topic}"`,
              subject: targetSubject,
            },
          ],
        }));
        setInput('');
      }
      setLoadingMode('quiz');

      const deliverDemoQuiz = async () => {
        await new Promise((r) => setTimeout(r, 420));
        setAiConfigured(false);
        const demoQuiz = getDemoQuiz(topic, targetSubject, count);
        setThreads((prev) => ({
          ...prev,
          quiz: [
            ...(prev.quiz || []),
            {
              id: `qa-${Date.now()}`,
              type: 'quiz',
              quiz: { ...demoQuiz, difficulty: diff, isDemoSample: true },
            },
          ],
        }));
      };

      if (aiConfigured === false) {
        await deliverDemoQuiz();
        setLoadingMode(null);
        return;
      }

      try {
        const { data } = await api.post('/ai/quiz', {
          topic,
          subject: targetSubject,
          difficulty: diff,
          question_count: count,
        });
        setThreads((prev) => ({
          ...prev,
          quiz: [
            ...(prev.quiz || []),
            {
              id: `qa-${Date.now()}`,
              type: 'quiz',
              quiz: { ...data.quiz, isDemoSample: false },
            },
          ],
        }));
      } catch (err) {
        if (err.response?.status === 503) {
          await deliverDemoQuiz();
        } else {
          const detail =
            err.response?.data?.detail ||
            'Unable to generate an interactive quiz right now. Please try again.';
          setErrors((prev) => ({
            ...prev,
            quiz: {
              message: detail,
              retryAction: () => runQuizGenerator(topic, targetSubject, diff, count, true),
            },
          }));
        }
      } finally {
        setLoadingMode(null);
      }
    },
    [aiConfigured, loadingMode, quizCount, quizDifficulty, subject]
  );

  const runStudyPlan = useCallback(
    async (goalText = '', targetSubject = subject, hours = dailyHours, isRetry = false) => {
      if (loadingMode) return;
      const cleanGoal = goalText.trim();
      const displayMsg =
        cleanGoal || `Create my personalized ${hours}h/day weekly study plan (${targetSubject})`;

      clearError('study-plan');
      if (!isRetry) {
        setThreads((prev) => ({
          ...prev,
          'study-plan': [
            ...(prev['study-plan'] || []),
            {
              id: `su-${Date.now()}`,
              role: 'user',
              content: displayMsg,
              subject: targetSubject,
            },
          ],
        }));
        setInput('');
      }
      setLoadingMode('study-plan');

      const deliverDemoPlan = async () => {
        await new Promise((r) => setTimeout(r, 420));
        setAiConfigured(false);
        const demoPlan = getDemoStudyPlan({ subject: targetSubject, dailyHours: hours });
        setThreads((prev) => ({
          ...prev,
          'study-plan': [
            ...(prev['study-plan'] || []),
            {
              id: `sa-${Date.now()}`,
              role: 'assistant',
              content: demoPlan.summary,
              plan: demoPlan,
              isDemoSample: true,
            },
          ],
        }));
      };

      if (aiConfigured === false) {
        await deliverDemoPlan();
        setLoadingMode(null);
        return;
      }

      try {
        const { data } = await api.post('/ai/study-plan', {
          message: cleanGoal,
          subject: targetSubject,
          daily_hours: hours,
          goal: cleanGoal,
        });
        setThreads((prev) => ({
          ...prev,
          'study-plan': [
            ...(prev['study-plan'] || []),
            {
              id: `sa-${Date.now()}`,
              role: 'assistant',
              content: data.response,
              plan: data.plan || null,
              contextSummary: data.context_summary,
              isDemoSample: false,
            },
          ],
        }));
      } catch (err) {
        if (err.response?.status === 503) {
          await deliverDemoPlan();
        } else {
          const detail =
            err.response?.data?.detail ||
            'Unable to build your personalized study plan right now. Please try again.';
          setErrors((prev) => ({
            ...prev,
            'study-plan': {
              message: detail,
              retryAction: () => runStudyPlan(cleanGoal, targetSubject, hours, true),
            },
          }));
        }
      } finally {
        setLoadingMode(null);
      }
    },
    [aiConfigured, dailyHours, loadingMode, subject]
  );

  // Handle external deep links / triggers
  useEffect(() => {
    if (!externalLaunch || externalLaunch.timestamp === lastLaunchRef.current) return;
    lastLaunchRef.current = externalLaunch.timestamp;

    const targetMode = externalLaunch.studyPlan
      ? 'study-plan'
      : externalLaunch.mode || 'explain';
    const targetSubject = externalLaunch.subject || subject;

    setMode(targetMode);
    if (externalLaunch.subject) setSubject(externalLaunch.subject);

    if (externalLaunch.prompt) {
      if (targetMode === 'quiz') {
        runQuizGenerator(externalLaunch.prompt, targetSubject);
      } else if (targetMode === 'study-plan') {
        runStudyPlan(externalLaunch.prompt, targetSubject);
      } else {
        runExplainOrHint(targetMode, externalLaunch.prompt, targetSubject);
      }
    } else {
      setTimeout(() => inputRef.current?.focus(), 160);
    }
  }, [externalLaunch, runExplainOrHint, runQuizGenerator, runStudyPlan, subject]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (loadingMode) return;

    if (mode === 'quiz') {
      if (!input.trim()) return;
      runQuizGenerator(input);
    } else if (mode === 'study-plan') {
      runStudyPlan(input);
    } else {
      if (!input.trim()) return;
      runExplainOrHint(mode, input);
    }
  };

  const handleSuggestedPrompt = (promptText) => {
    if (loadingMode) return;
    if (mode === 'quiz') {
      runQuizGenerator(promptText);
    } else if (mode === 'study-plan') {
      runStudyPlan(promptText);
    } else {
      runExplainOrHint(mode, promptText);
    }
  };

  const handleClearModeSession = () => {
    setThreads((prev) => ({ ...prev, [mode]: [] }));
    clearError(mode);
    if (mode === 'hint') setActiveHintTopic('');
  };

  const handleExplainFromQuiz = (questionPrompt) => {
    setMode('explain');
    runExplainOrHint('explain', questionPrompt, subject);
  };

  const modeSuggestions =
    SUGGESTED_PROMPTS[mode]?.[subject] || SUGGESTED_PROMPTS[mode]?.['All Subjects'] || [];
  const firstName = user?.name?.split(' ')[0] || 'Student';

  return (
    <div
      className={`flex flex-col ${
        isDrawer ? 'h-full' : 'min-h-[calc(100vh-8.5rem)] rounded-2xl bg-[#0f1628] border border-white/[0.08] overflow-hidden'
      }`}
    >
      {/* Top Tutor Banner & Mode Switcher */}
      <div
        className={`border-b border-white/[0.08] bg-[#0f1628]/95 backdrop-blur-xl shrink-0 ${
          isDrawer ? 'px-4 py-3 space-y-3' : 'px-5 py-4 sm:px-6 space-y-4'
        }`}
      >
        {!isDrawer && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_24px_rgba(99,102,241,0.28)] shrink-0">
                <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <h1 className="text-lg sm:text-xl font-bold font-['Outfit'] tracking-tight text-white">
                    Nova · AI Study Companion
                  </h1>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{user?.class_name || 'Class 11-A'}</span>
                  {aiConfigured === false && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-amber-300 font-semibold">DEMO MODE</span>
                    </>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-400">
                  Structured concept explanations, progressive hints, interactive quizzes, and 7-day study planning.
                </p>
              </div>
            </div>

            {currentItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearModeSession}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 inline-flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Clear {activeModeConfig.shortLabel}</span>
              </button>
            )}
          </div>
        )}

        {/* Transparent Demo Mode Notice when GEMINI_API_KEY is absent */}
        {aiConfigured === false && (
          <div
            data-testid="ai-demo-mode-banner"
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-400/25 flex items-center gap-2.5 text-xs text-amber-200"
          >
            <Info className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
            <p className="leading-snug">
              <strong className="font-semibold">DEMO MODE:</strong> Live{' '}
              <code className="font-mono text-[11px]">GEMINI_API_KEY</code> is not configured on the server. Showing curated sample interactions for all four modes (not live AI output).
            </p>
          </div>
        )}

        {/* 4 Mode Selector Tabs */}
        <div
          role="tablist"
          aria-label="Study Companion modes"
          className={`grid gap-2 ${isDrawer ? 'grid-cols-4' : 'grid-cols-2 lg:grid-cols-4'}`}
        >
          {TUTOR_MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <motion.button
                key={m.id}
                type="button"
                role="tab"
                whileTap={{ scale: 0.985 }}
                aria-selected={active}
                data-testid={`ai-mode-${m.id}`}
                onClick={() => setMode(m.id)}
                className={`relative text-left rounded-xl border transition-colors ${
                  isDrawer
                    ? 'px-2 py-2 flex flex-col items-center justify-center gap-1'
                    : 'p-3 flex items-start gap-3'
                } ${
                  active
                    ? 'bg-indigo-500/15 border-indigo-400/45 text-white'
                    : 'bg-[#0a1020]/70 border-white/[0.07] text-slate-400 hover:text-slate-200 hover:border-white/[0.14]'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId={isDrawer ? 'drawerModeActive' : 'pageModeActive'}
                    className="absolute inset-x-3 bottom-0 h-[2px] bg-gradient-to-r from-indigo-400 to-cyan-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 ${active ? m.accent : 'text-slate-400'}`}
                  aria-hidden="true"
                />
                {isDrawer ? (
                  <span className="text-[11px] font-medium truncate max-w-full">{m.shortLabel}</span>
                ) : (
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-white leading-tight">
                      {m.label}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{m.tagline}</p>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Subject Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full">
            <span className="text-xs text-slate-400 mr-1 shrink-0 hidden sm:inline">Subject:</span>
            {SUBJECT_OPTIONS.map((subj) => {
              const selected = subject === subj;
              return (
                <button
                  key={subj}
                  type="button"
                  data-testid={`ai-subject-${subj.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setSubject(subj)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                    selected
                      ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200'
                      : 'bg-[#0a1020]/70 border-white/[0.07] text-slate-400 hover:text-white'
                  }`}
                >
                  {subj}
                </button>
              );
            })}
          </div>

          {isDrawer && (
            <div className="flex items-center gap-2 ml-auto">
              {currentItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearModeSession}
                  className="text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
              {onExpandFullView && (
                <button
                  type="button"
                  onClick={() => onExpandFullView({ mode, subject })}
                  className="text-[11px] text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1 font-medium"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Full View</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mode-Specific Configuration Strip (Quiz Me & Study Plan) */}
      {(mode === 'quiz' || mode === 'study-plan') && (
        <div className="px-4 sm:px-6 py-2.5 bg-[#0a1020] border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {mode === 'quiz' ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                  <span className="text-slate-400">Difficulty:</span>
                  {['easy', 'medium', 'hard'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setQuizDifficulty(d)}
                      className={`px-2 py-0.5 rounded-md capitalize font-medium border transition-colors ${
                        quizDifficulty === d
                          ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-200'
                          : 'bg-transparent border-white/[0.08] text-slate-400 hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Questions:</span>
                  {[3, 4, 5].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuizCount(cnt)}
                      className={`w-6 h-6 rounded-md font-mono font-semibold border transition-colors ${
                        quizCount === cnt
                          ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200'
                          : 'bg-transparent border-white/[0.08] text-slate-400 hover:text-white'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Enter any topic below or click a topic starter
              </span>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span className="text-slate-400">Daily study budget:</span>
                  {[1, 2, 3, 4].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setDailyHours(hrs)}
                      className={`px-2 py-0.5 rounded-md font-mono font-medium border transition-colors ${
                        dailyHours === hrs
                          ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                          : 'bg-transparent border-white/[0.08] text-slate-400 hover:text-white'
                      }`}
                    >
                      {hrs}h
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                data-testid="generate-study-plan-btn"
                disabled={Boolean(loadingMode)}
                onClick={() => runStudyPlan(input)}
                className="px-3 py-1 rounded-lg bg-emerald-600/85 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Generate Weekly Plan</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Conversation Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#080c17]/40">
        {currentItems.length === 0 && !isLoading && (
          <motion.div
            key={`welcome-${mode}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-3xl mx-auto py-4 sm:py-6 space-y-6"
          >
            {/* Mode Intro Card */}
            <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-[#131c34] via-[#0e1528] to-[#0b1121] border border-white/[0.09] space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center ${activeModeConfig.badgeBg}`}
                >
                  <activeModeConfig.icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">
                    {activeModeConfig.label} Mode · {subject}
                  </p>
                  <h2 className="text-base sm:text-lg font-semibold font-['Outfit'] text-white">
                    {mode === 'explain' && `Ready to break down tricky concepts, ${firstName}.`}
                    {mode === 'hint' && `Let’s solve it together one clue at a time, ${firstName}.`}
                    {mode === 'quiz' && `Test your mastery with an interactive practice quiz.`}
                    {mode === 'study-plan' && `Build a 7-day weekly study planner around your workload.`}
                  </h2>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {mode === 'explain' &&
                  'Answers are structured into Concept Overview, Step-by-Step Explanation, Worked Example, Important Formulas, and Key Takeaway.'}
                {mode === 'hint' &&
                  'Paste a problem or your first attempt. Nova reveals one progressive clue at a time without spoiling the solution unless you ask.'}
                {mode === 'quiz' &&
                  'Pick a subject and enter any topic below to generate clickable multiple-choice questions with instant grading and explanations.'}
                {mode === 'study-plan' &&
                  'Generates a color-coded 7-day weekly planner with time slots, study durations, and daily priorities calibrated to your courses.'}
              </p>
            </div>

            {/* Suggested Prompts */}
            <div className="space-y-2.5">
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
                <span>
                  {mode === 'quiz' ? 'Popular quiz topics' : 'Try a starter prompt'} ({subject})
                </span>
              </p>
              <div className="grid grid-cols-1 gap-2">
                {modeSuggestions.map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    onClick={() => handleSuggestedPrompt(promptText)}
                    className="w-full px-4 py-3 rounded-xl bg-[#0f1628] hover:bg-[#15203b] border border-white/[0.08] hover:border-indigo-400/35 text-left text-xs sm:text-sm text-slate-200 hover:text-white flex items-center justify-between gap-3 transition-all group"
                  >
                    <span>{promptText}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Session Items */}
        <AnimatePresence initial={false}>
          {currentItems.map((item, idx) => {
            if (item.type === 'quiz') {
              return (
                <div key={item.id} className="max-w-3xl mx-auto w-full">
                  <InteractiveQuizCard
                    quiz={item.quiz}
                    onExplainQuestion={handleExplainFromQuiz}
                    onRequestNewQuiz={() => inputRef.current?.focus()}
                  />
                </div>
              );
            }

            const isUser = item.role === 'user' || item.type === 'user';
            const isLatestHint =
              mode === 'hint' &&
              item.role === 'assistant' &&
              !item.isWalkthrough &&
              idx === currentItems.length - 1;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${
                  isDrawer ? '' : 'max-w-3xl mx-auto w-full'
                }`}
              >
                <div
                  className={`${
                    isDrawer
                      ? 'max-w-[94%]'
                      : item.plan
                        ? 'w-full'
                        : 'max-w-[90%] sm:max-w-[84%]'
                  } rounded-2xl p-3.5 sm:p-4 border ${
                    isUser
                      ? 'bg-indigo-600/20 border-indigo-400/35 text-white'
                      : 'bg-[#10182d] border-white/[0.09] text-slate-200'
                  }`}
                >
                  {!isUser && (
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-white/[0.07]">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" aria-hidden="true" />
                        </span>
                        <span className="font-semibold text-white">Nova</span>
                        {item.hintNumber && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="font-mono text-amber-300 font-semibold">
                              Hint #{item.hintNumber}
                            </span>
                          </>
                        )}
                        {item.isWalkthrough && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="font-mono text-emerald-300 font-semibold">
                              Full Walkthrough
                            </span>
                          </>
                        )}
                        {item.isDemoSample && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="font-mono text-amber-300">
                              Demo Sample (Not Live AI)
                            </span>
                          </>
                        )}
                        {item.contextSummary && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="font-mono text-emerald-300 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                              Synced: {item.contextSummary.recent_exams} exams ·{' '}
                              {item.contextSummary.pending_assignments} due ·{' '}
                              {item.contextSummary.open_todos} tasks
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {isUser ? (
                    <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{item.content}</p>
                  ) : item.plan ? (
                    <WeeklyStudyPlanner
                      plan={item.plan}
                      fallbackMarkdown={item.content}
                      compact={isDrawer}
                    />
                  ) : mode === 'explain' || item.isWalkthrough ? (
                    <ExplainSectionsCard content={item.content} />
                  ) : (
                    <FormattedTutorMessage content={item.content} />
                  )}

                  {isLatestHint && !isLoading && (
                    <div className="mt-3.5 pt-3 border-t border-white/[0.07] flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        data-testid="next-hint-btn"
                        onClick={() =>
                          runExplainOrHint('hint', 'Give me the next progressive hint.')
                        }
                        className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-xs font-medium text-amber-200 transition-colors"
                      >
                        Request Next Hint
                      </button>
                      <button
                        type="button"
                        data-testid="full-walkthrough-btn"
                        onClick={() =>
                          runExplainOrHint(
                            'hint',
                            'Show the full step-by-step explanation now.',
                            subject,
                            { revealWalkthrough: true }
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-xs font-medium text-slate-300 transition-colors"
                      >
                        View Full Explanation
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Animated Typing / Generating Indicator */}
        <AnimatePresence>
          {isLoading && (
            <div className={isDrawer ? '' : 'max-w-3xl mx-auto w-full'}>
              <TypingIndicator
                label={
                  mode === 'quiz'
                    ? 'Crafting interactive quiz'
                    : mode === 'study-plan'
                      ? 'Building weekly study planner'
                      : mode === 'hint'
                        ? 'Preparing next hint'
                        : 'Nova is structuring explanation'
                }
              />
            </div>
          )}
        </AnimatePresence>

        {/* Honest Error State */}
        {currentError && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            data-testid="ai-error-banner"
            className={`${
              isDrawer ? '' : 'max-w-3xl mx-auto w-full'
            } p-4 rounded-xl bg-rose-500/10 border border-rose-400/30 flex items-start justify-between gap-3`}
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-rose-200">AI Request Could Not Complete</p>
                <p className="text-xs text-rose-300/90 mt-0.5 leading-relaxed">
                  {currentError.message}
                </p>
              </div>
            </div>
            {currentError.retryAction && (
              <button
                type="button"
                onClick={currentError.retryAction}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/35 text-xs font-medium text-rose-100 inline-flex items-center gap-1 shrink-0 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Polished Composer Footer */}
      <form
        onSubmit={handleSubmit}
        className={`border-t border-white/[0.08] bg-[#0f1628]/95 shrink-0 ${
          isDrawer ? 'p-3.5' : 'px-5 py-4 sm:px-6'
        }`}
      >
        <div className={`${isDrawer ? '' : 'max-w-3xl mx-auto'} flex items-center gap-2.5`}>
          <input
            ref={inputRef}
            data-testid="ai-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={activeModeConfig.placeholder}
            aria-label={activeModeConfig.label}
            className="flex-1 bg-[#080c17] border border-white/[0.12] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/45 focus:border-indigo-400/40 transition-colors"
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.96 }}
            data-testid="ai-chat-send-btn"
            aria-label={
              mode === 'quiz'
                ? 'Generate Quiz'
                : mode === 'study-plan'
                  ? 'Generate Study Plan'
                  : 'Send message'
            }
            disabled={Boolean(loadingMode) || (mode !== 'study-plan' && !input.trim())}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-45 disabled:pointer-events-none text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-lg shrink-0"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            {!isDrawer && (
              <span>
                {mode === 'quiz'
                  ? 'Generate Quiz'
                  : mode === 'study-plan'
                    ? 'Build Plan'
                    : 'Send'}
              </span>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
