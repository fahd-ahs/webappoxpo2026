import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Trophy, BarChart3, Users, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const TABS = [
  { id: 'analytics', label: 'Results & Momentum' },
  { id: 'dpp', label: 'Interactive DPP Quiz' },
  { id: 'timeline', label: 'Curriculum Timeline' },
  { id: 'teacher', label: 'Teacher View' },
];

const EXAM_SCORES = {
  'Unit Test 1': [
    { subject: 'Mathematics', score: 82, grade: 'A', color: '#6366f1' },
    { subject: 'Physics', score: 84, grade: 'A', color: '#22d3ee' },
    { subject: 'Chemistry', score: 86, grade: 'A', color: '#10b981' },
  ],
  'Mid-Term': [
    { subject: 'Mathematics', score: 87, grade: 'A', color: '#6366f1' },
    { subject: 'Physics', score: 89, grade: 'A', color: '#22d3ee' },
    { subject: 'Chemistry', score: 91, grade: 'A+', color: '#10b981' },
  ],
  'Unit Test 2': [
    { subject: 'Mathematics', score: 91, grade: 'A+', color: '#6366f1' },
    { subject: 'Physics', score: 93, grade: 'A+', color: '#22d3ee' },
    { subject: 'Chemistry', score: 95, grade: 'A+', color: '#10b981' },
  ],
};

const DPP_QUESTIONS = [
  {
    id: 'q1',
    subject: 'Mathematics · Sets & Relations',
    prompt: 'If A = {1, 2, 3} and B = {2, 3, 4}, what is A ∩ B?',
    options: [
      { key: 'A', label: '{2, 3}' },
      { key: 'B', label: '{1, 2, 3, 4}' },
      { key: 'C', label: '{1, 4}' },
      { key: 'D', label: '{}' },
    ],
    correct: 'A',
    explanation: 'A ∩ B contains only the elements common to both sets: 2 and 3.',
  },
  {
    id: 'q2',
    subject: 'Physics · Kinematics',
    prompt: 'A car accelerates from rest at 2 m/s². What is its velocity after 5 seconds?',
    options: [
      { key: 'A', label: '5 m/s' },
      { key: 'B', label: '10 m/s' },
      { key: 'C', label: '15 m/s' },
      { key: 'D', label: '20 m/s' },
    ],
    correct: 'B',
    explanation: 'Using v = u + at with u = 0, a = 2 m/s², and t = 5 s gives v = 10 m/s.',
  },
  {
    id: 'q3',
    subject: 'Chemistry · Atomic Structure',
    prompt: 'What is the maximum number of electrons in the 3rd shell (n = 3)?',
    options: [
      { key: 'A', label: '8' },
      { key: 'B', label: '18' },
      { key: 'C', label: '32' },
      { key: 'D', label: '2' },
    ],
    correct: 'B',
    explanation: 'Maximum electrons in shell n equals 2n², so 2 × 3² = 18 electrons.',
  },
];

const CURRICULUM_DATA = {
  Mathematics: [
    { chapter: '01. Sets & Relations', status: 'Completed', progress: 100, topics: ['Introduction to Sets', 'Venn Diagrams', 'Operations on Sets', 'Relations'] },
    { chapter: '02. Trigonometry', status: 'Ongoing', progress: 25, topics: ['Angles & Measurement', 'Trigonometric Ratios', 'Identities', 'Graphs'] },
    { chapter: '03. Calculus Basics', status: 'Upcoming', progress: 0, topics: ['Limits', 'Continuity', 'Differentiation Basics'] },
  ],
  Physics: [
    { chapter: '01. Kinematics', status: 'Completed', progress: 100, topics: ['Displacement & Velocity', 'Equations of Motion', 'Projectile Motion'] },
    { chapter: '02. Laws of Motion', status: 'Ongoing', progress: 25, topics: ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", 'Friction'] },
    { chapter: '03. Work, Energy & Power', status: 'Upcoming', progress: 0, topics: ['Work Done by Force', 'Kinetic Energy', 'Conservation of Energy'] },
  ],
  Chemistry: [
    { chapter: '01. Atomic Structure', status: 'Completed', progress: 100, topics: ['Discovery of Electron', 'Rutherford Model', 'Bohr Model', 'Quantum Model'] },
    { chapter: '02. Chemical Bonding', status: 'Ongoing', progress: 25, topics: ['Ionic Bond', 'Covalent Bond', 'Metallic Bond', 'VSEPR Theory'] },
  ],
};

const INITIAL_ROSTER = [
  { id: 'r1', name: 'Aarav Patel', roll: '2024001', present: true },
  { id: 'r2', name: 'Ananya Singh', roll: '2024002', present: true },
  { id: 'r3', name: 'Rohan Sharma', roll: '2024003', present: false },
];

export default function ProductPreviewTabs() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [selectedExam, setSelectedExam] = useState('Unit Test 2');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [activeSubject, setActiveSubject] = useState('Mathematics');
  const [roster, setRoster] = useState(INITIAL_ROSTER);

  const currentExamRows = EXAM_SCORES[selectedExam];
  const examAvg = (currentExamRows.reduce((sum, r) => sum + r.score, 0) / currentExamRows.length).toFixed(1);
  const currentQ = DPP_QUESTIONS[questionIdx];
  const presentCount = roster.filter((s) => s.present).length;

  const toggleRoster = (id) => {
    setRoster((prev) => prev.map((s) => (s.id === id ? { ...s, present: !s.present } : s)));
  };

  return (
    <section id="preview" className="py-20 lg:py-28 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <p className="text-xs font-mono tracking-wider text-[#22d3ee] mb-3">
              Interactive Preview
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold font-['Outfit'] tracking-tight text-white [text-wrap:balance]">
              Explore how the workspace feels before signing in
            </h2>
          </div>

          {/* Segmented Tab Controls */}
          <div
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#12141a] border border-white/[0.08]"
            role="tablist"
            aria-label="Product feature previews"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[#6366f1] text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Stage */}
        <div className="bg-[#111318] border border-white/[0.09] rounded-xl p-5 sm:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              >
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-base font-semibold font-['Outfit'] text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#22d3ee]" aria-hidden="true" />
                      <span>Subject Score Overview</span>
                    </h3>

                    <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-[#0b0d11] border border-white/[0.07]">
                      {Object.keys(EXAM_SCORES).map((exam) => (
                        <button
                          key={exam}
                          type="button"
                          onClick={() => setSelectedExam(exam)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            selectedExam === exam
                              ? 'bg-white text-[#0a0a0a]'
                              : 'text-white/55 hover:text-white'
                          }`}
                        >
                          {exam}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-1">
                    {currentExamRows.map((row) => (
                      <div key={row.subject} className="p-3.5 rounded-lg border border-white/[0.06] bg-[#0b0d11]">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-medium text-white">{row.subject}</span>
                          <span className="font-mono tabular-nums text-xs text-white/70">
                            {row.score}/100 · Grade {row.grade}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${row.score}%`, backgroundColor: row.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-lg border border-white/[0.06] bg-[#0b0d11]">
                    <p className="text-xs text-white/50">{selectedExam} Avg</p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-white mt-1">{examAvg}%</p>
                    <p className="text-[11px] text-emerald-400 mt-1">Above class benchmark</p>
                  </div>
                  <div className="p-4 rounded-lg border border-white/[0.06] bg-[#0b0d11]">
                    <p className="text-xs text-white/50">Class Rank</p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-[#818cf8] mt-1">#4</p>
                    <p className="text-[11px] text-white/45 mt-1">Class 11-A standings</p>
                  </div>
                  <div className="col-span-2 p-4 rounded-lg border border-white/[0.06] bg-[#0b0d11] flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-white/50">Class 11-A Top Podium</p>
                      <p className="text-sm font-medium text-white mt-0.5">
                        Kavya Reddy (3,560 XP) · Ananya Singh (3,120 XP)
                      </p>
                    </div>
                    <Trophy className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'dpp' && (
              <motion.div
                key="dpp"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              >
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono text-[#818cf8]">
                      {currentQ.subject} · Sample {questionIdx + 1} of {DPP_QUESTIONS.length}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-amber-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      09:42 remaining
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold font-['Outfit'] text-white">
                    {currentQ.prompt}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentQ.options.map((opt) => {
                      const isPicked = selectedAnswer === opt.key;
                      const isCorrect = opt.key === currentQ.correct;
                      let styleClass =
                        'border-white/[0.08] bg-[#0b0d11] text-white/80 hover:border-white/[0.2]';
                      if (selectedAnswer) {
                        if (isCorrect) {
                          styleClass = 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300';
                        } else if (isPicked) {
                          styleClass = 'border-rose-500/60 bg-rose-500/10 text-rose-300';
                        }
                      }
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setSelectedAnswer(opt.key)}
                          className={`p-3.5 rounded-lg border text-left text-sm font-medium transition-colors duration-150 flex items-center justify-between ${styleClass}`}
                        >
                          <span>
                            <span className="font-mono text-white/45 mr-2">{opt.key}.</span>
                            {opt.label}
                          </span>
                          {selectedAnswer && isCorrect && (
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                          )}
                          {selectedAnswer && isPicked && !isCorrect && (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-5 p-5 rounded-lg border border-white/[0.06] bg-[#0b0d11] space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-white/45">Instant Solution Check</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAnswer(null);
                        setQuestionIdx((prev) => (prev + 1) % DPP_QUESTIONS.length);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#22d3ee] hover:underline"
                    >
                      <span>Next sample</span>
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  {selectedAnswer ? (
                    <>
                      <p className={`text-sm font-semibold ${selectedAnswer === currentQ.correct ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {selectedAnswer === currentQ.correct
                          ? 'Correct — +1 mark earned'
                          : `Not quite — option ${currentQ.correct} is correct`}
                      </p>
                      <p className="text-sm text-white/65 leading-relaxed">
                        {currentQ.explanation}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedAnswer(null)}
                        className="text-xs font-medium text-[#818cf8] hover:underline"
                      >
                        Try again
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-white/55 leading-relaxed">
                      Select any option on the left to preview how SchoolExpo's Daily Practice Problem engine grades answers and shows concept explanations.
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-base font-semibold font-['Outfit'] text-white">
                    Chapter & Topic Roadmap
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {Object.keys(CURRICULUM_DATA).map((subj) => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => setActiveSubject(subj)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          activeSubject === subj
                            ? 'bg-white text-[#0a0a0a]'
                            : 'bg-[#0b0d11] text-white/60 hover:text-white border border-white/[0.07]'
                        }`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {CURRICULUM_DATA[activeSubject].map((ch) => (
                    <div key={ch.chapter} className="p-4 rounded-lg border border-white/[0.06] bg-[#0b0d11] space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-white">{ch.chapter}</span>
                        <span
                          className={`text-xs font-mono ${
                            ch.status === 'Completed'
                              ? 'text-emerald-400'
                              : ch.status === 'Ongoing'
                                ? 'text-amber-400'
                                : 'text-white/40'
                          }`}
                        >
                          {ch.status}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#6366f1]"
                          style={{ width: `${ch.progress}%` }}
                        />
                      </div>
                      <ul className="space-y-1 text-xs text-white/50">
                        {ch.topics.map((topic) => (
                          <li key={topic} className="truncate">· {topic}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'teacher' && (
              <motion.div
                key="teacher"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              >
                <div className="lg:col-span-6 space-y-3">
                  <h3 className="text-base font-semibold font-['Outfit'] text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#818cf8]" aria-hidden="true" />
                    <span>Class 11-A Teacher Overview</span>
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Teachers publish assignments with due dates and XP rewards, grade pending submissions with feedback, and mark daily attendance for the entire Class 11-A roster in one view.
                  </p>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 rounded-lg border border-white/[0.06] bg-[#0b0d11]">
                      <p className="text-xs text-white/45">Roster Sample</p>
                      <p className="text-xl font-bold font-mono tabular-nums text-white mt-0.5">
                        {presentCount}/{roster.length}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-lg border border-white/[0.06] bg-[#0b0d11]">
                      <p className="text-xs text-white/45">Pending</p>
                      <p className="text-xl font-bold font-mono tabular-nums text-amber-400 mt-0.5">1</p>
                    </div>
                    <div className="p-3.5 rounded-lg border border-white/[0.06] bg-[#0b0d11]">
                      <p className="text-xs text-white/45">Active Tasks</p>
                      <p className="text-xl font-bold font-mono tabular-nums text-[#22d3ee] mt-0.5">5</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 divide-y divide-white/[0.06] border border-white/[0.06] rounded-lg bg-[#0b0d11]">
                  {roster.map((student) => (
                    <div key={student.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{student.name}</p>
                        <p className="text-xs font-mono tabular-nums text-white/45">Roll {student.roll} · Class 11-A</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleRoster(student.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors whitespace-nowrap shrink-0 ${
                          student.present
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {student.present ? 'Present' : 'Absent'}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
