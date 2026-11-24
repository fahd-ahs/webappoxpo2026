import { useState } from 'react';
import {
  BookOpen,
  Brain,
  Calendar,
  BarChart3,
  Headphones,
  CheckSquare,
  ClipboardCheck,
  Trophy,
  MessageSquare,
} from 'lucide-react';

const ASSIGNMENT_ROWS = [
  { id: 'a1', title: 'Sets & Relations Practice', meta: 'Mathematics · Graded 18/20', status: 'Graded', xp: '+80 XP', color: 'text-emerald-400' },
  { id: 'a2', title: 'Kinematics Numerical Problems', meta: 'Physics · Due in 5 days', status: 'Due', xp: '+75 XP', color: 'text-[#818cf8]' },
  { id: 'a3', title: 'Atomic Structure Worksheet', meta: 'Chemistry · Submitted', status: 'Submitted', xp: '+40 XP', color: 'text-[#22d3ee]' },
];

const ASSIGNMENT_FILTERS = ['All', 'Graded', 'Submitted', 'Due'];

const SECONDARY_CAPABILITIES = [
  {
    icon: CheckSquare,
    title: 'Daily Todo List',
    detail: 'Capture homework tasks, star priorities, and earn +5 XP on completion.',
  },
  {
    icon: ClipboardCheck,
    title: 'Attendance Log',
    detail: 'Track semester attendance against the 75% target with daily history.',
  },
  {
    icon: Trophy,
    title: 'Class Leaderboard',
    detail: 'Compare weekly momentum with classmates through XP levels and streaks.',
  },
  {
    icon: MessageSquare,
    title: 'Peer Chat & AI Tutor',
    detail: 'Ask questions in subject rooms or get help from the built-in study assistant.',
  },
];

export default function FeatureShowcase() {
  const [assignmentFilter, setAssignmentFilter] = useState('All');

  const visibleAssignments =
    assignmentFilter === 'All'
      ? ASSIGNMENT_ROWS
      : ASSIGNMENT_ROWS.filter((a) => a.status === assignmentFilter);

  return (
    <section id="features" className="py-20 lg:py-28 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-2xl mb-12 lg:mb-14">
          <p className="text-xs font-mono tracking-wider text-[#818cf8] mb-3">
            Core Capabilities
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold font-['Outfit'] tracking-tight text-white [text-wrap:balance]">
            Everything students need to stay ahead of every deadline
          </h2>
          <p className="mt-3 text-base text-white/60 leading-relaxed">
            Built around the real daily academic routine—from class timetables and coursework submissions to evening DPP quizzes and exam analytics.
          </p>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 01. Assignments & Deadlines (7 cols) */}
          <article className="lg:col-span-7 bg-[#111318] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-6 sm:p-7 transition-colors duration-200 flex flex-col justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <span className="text-xs font-mono tabular-nums text-white/45 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#818cf8]" aria-hidden="true" />
                  <span>01. Assignments</span>
                </span>

                <div
                  className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-[#0b0d11] border border-white/[0.06]"
                  role="tablist"
                  aria-label="Filter assignment states"
                >
                  {ASSIGNMENT_FILTERS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={assignmentFilter === tab}
                      onClick={() => setAssignmentFilter(tab)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                        assignmentFilter === tab
                          ? 'bg-[#6366f1] text-white'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <h3 className="text-xl font-semibold font-['Outfit'] text-white">
                Assignments, submissions, and grading in one flow
              </h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed max-w-xl">
                Filter coursework by graded, submitted, or upcoming status. Submit directly from the planner and earn 50 XP per submission plus +30 bonus XP for scores above 80%.
              </p>
            </div>

            <div className="divide-y divide-white/[0.06] border border-white/[0.06] rounded-lg bg-[#0b0d11]">
              {visibleAssignments.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.title}</p>
                    <p className="text-xs text-white/45">{item.meta}</p>
                  </div>
                  <span className={`text-xs font-mono tabular-nums shrink-0 ${item.color}`}>
                    {item.xp}
                  </span>
                </div>
              ))}
            </div>
          </article>

          {/* 02. Timed DPP Quizzes (5 cols) */}
          <article className="lg:col-span-5 bg-[#111318] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-6 sm:p-7 transition-colors duration-200 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="text-xs font-mono tabular-nums text-white/45">02. Daily Practice</span>
                <Brain className="w-5 h-5 text-[#22d3ee]" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold font-['Outfit'] text-white">
                Timed DPP quizzes with instant solutions
              </h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">
                Practice 10-minute multiple-choice sets across Mathematics, Physics, and Chemistry. Review step-by-step explanations immediately after submitting.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-white/[0.06] bg-[#0b0d11] space-y-3">
              <div className="flex items-center justify-between text-xs text-white/55 font-mono tabular-nums">
                <span>Sets & Relations Quick Quiz</span>
                <span className="text-amber-400">10:00 timer</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                <div className="h-full w-4/5 rounded-full bg-[#22d3ee]" />
              </div>
              <div className="flex items-center justify-between text-xs text-white/45 font-mono tabular-nums">
                <span>5 MCQs · Easy to Hard</span>
                <span className="text-[#818cf8]">+30 / +50 XP</span>
              </div>
            </div>
          </article>

          {/* 03. Curriculum Timeline (4 cols) */}
          <article className="lg:col-span-4 bg-[#111318] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-6 transition-colors duration-200 flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-xs font-mono tabular-nums text-white/45">03. Curriculum</span>
                <Calendar className="w-4 h-4 text-[#818cf8]" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold font-['Outfit'] text-white">
                Subject-by-subject syllabus timeline
              </h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">
                See completed, ongoing, and upcoming chapters with topic checklists across every enrolled subject.
              </p>
            </div>
            <div className="space-y-2 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="text-white/60">Trigonometry · Ongoing</span>
                <span className="text-amber-400">25%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                <div className="h-full w-1/4 rounded-full bg-[#6366f1]" />
              </div>
            </div>
          </article>

          {/* 04. Exam Analytics (4 cols) */}
          <article className="lg:col-span-4 bg-[#111318] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-6 transition-colors duration-200 flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-xs font-mono tabular-nums text-white/45">04. Analytics</span>
                <BarChart3 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold font-['Outfit'] text-white">
                Clear exam trends & subject averages
              </h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">
                Compare scores across Unit Tests and Mid-Terms to spot your strongest subjects and where to focus next.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] flex items-end justify-between gap-4">
              <div className="flex items-end gap-1.5 h-8" aria-hidden="true">
                <span className="w-2.5 h-4 rounded-sm bg-white/15" />
                <span className="w-2.5 h-6 rounded-sm bg-[#6366f1]/70" />
                <span className="w-2.5 h-8 rounded-sm bg-emerald-400" />
              </div>
              <span className="text-xs font-mono tabular-nums text-white/60">
                UT1 82% → Mid 87% → UT2 91%
              </span>
            </div>
          </article>

          {/* 05. Studycast Audio (4 cols) */}
          <article className="lg:col-span-4 bg-[#111318] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-6 transition-colors duration-200 flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-xs font-mono tabular-nums text-white/45">05. Studycast</span>
                <Headphones className="w-4 h-4 text-amber-400" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold font-['Outfit'] text-white">
                Audio revision episodes with saved progress
              </h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">
                Listen to focused 15–35 minute breakdowns in Math, Physics, Chemistry, English, and CS, picking up where you left off.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono tabular-nums text-white/55">
              <span>8 curated episodes</span>
              <span className="text-[#22d3ee]">1x · 1.25x · 1.5x</span>
            </div>
          </article>
        </div>

        {/* Supporting Capabilities Strip */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-white/[0.08] rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] bg-[#0e1015]">
          {SECONDARY_CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div key={cap.title} className="p-5 sm:p-6">
                <Icon className="w-4 h-4 text-[#818cf8] mb-3" aria-hidden="true" />
                <h3 className="text-sm font-semibold font-['Outfit'] text-white">{cap.title}</h3>
                <p className="mt-1.5 text-xs text-white/55 leading-relaxed">{cap.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
