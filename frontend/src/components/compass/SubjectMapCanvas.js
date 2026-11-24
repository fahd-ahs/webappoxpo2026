import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Clock, Circle, AlertTriangle, ChevronDown, ChevronRight,
  Sparkles, Brain, BookOpen, Compass, ArrowUpRight
} from 'lucide-react';
import ProgressRing from './ProgressRing';

const STATUS_META = {
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    textColor: 'text-emerald-300',
    nodeRing: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300',
    cardBorder: 'border-emerald-400/25 hover:border-emerald-400/45',
    ringColor: '#10b981',
  },
  'in-progress': {
    label: 'In Progress',
    icon: Clock,
    textColor: 'text-cyan-300',
    nodeRing: 'border-cyan-400/70 bg-cyan-500/15 text-cyan-300',
    cardBorder: 'border-cyan-400/30 hover:border-cyan-400/50',
    ringColor: '#22d3ee',
  },
  'not-started': {
    label: 'Not Started',
    icon: Circle,
    textColor: 'text-slate-400',
    nodeRing: 'border-slate-600/70 bg-[#11192f] text-slate-400',
    cardBorder: 'border-white/[0.08] hover:border-white/[0.16]',
    ringColor: '#64748b',
  },
  'needs-attention': {
    label: 'Needs Attention',
    icon: AlertTriangle,
    textColor: 'text-amber-300',
    nodeRing: 'border-amber-400/70 bg-amber-500/15 text-amber-300',
    cardBorder: 'border-amber-400/35 hover:border-amber-400/60',
    ringColor: '#f59e0b',
  },
};

const TOPIC_STATUS_META = {
  completed: { label: 'Mastered', icon: CheckCircle2, color: 'text-emerald-300' },
  ongoing: { label: 'In Progress', icon: Clock, color: 'text-cyan-300' },
  upcoming: { label: 'Not Started', icon: Circle, color: 'text-slate-500' },
};

export default function SubjectMapCanvas({ subjectModel }) {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedMap, setExpandedMap] = useState({});
  const [hoveredChapterId, setHoveredChapterId] = useState(null);

  // Auto-expand active or needs-attention chapter whenever subject changes
  useEffect(() => {
    setStatusFilter('all');
    if (!subjectModel?.chapters?.length) {
      setExpandedMap({});
      setHoveredChapterId(null);
      return;
    }
    const defaultOpen =
      subjectModel.chapters.find((c) => c.displayStatus === 'needs-attention') ||
      subjectModel.chapters.find((c) => c.displayStatus === 'in-progress') ||
      subjectModel.chapters[0];
    setExpandedMap(defaultOpen ? { [defaultOpen.id]: true } : {});
    setHoveredChapterId(defaultOpen?.id || null);
  }, [subjectModel?.id, subjectModel?.chapters]);

  if (!subjectModel) return null;

  const chapters = subjectModel.chapters || [];
  const filteredChapters =
    statusFilter === 'all'
      ? chapters
      : chapters.filter((c) => c.displayStatus === statusFilter);

  const inspectedChapter =
    chapters.find((c) => c.id === hoveredChapterId) || chapters[0] || null;

  const toggleExpand = (chapterId) => {
    setExpandedMap((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
    setHoveredChapterId(chapterId);
  };

  return (
    <motion.div
      key={subjectModel.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      data-testid={`compass-subject-map-${subjectModel.id}`}
      className="space-y-6"
    >
      {/* Subject Telemetry Banner */}
      <div className="rounded-2xl bg-[#0f1628] border border-white/[0.08] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <ProgressRing
            value={subjectModel.syllabusCompletion ?? 0}
            size={84}
            strokeWidth={7}
            color={subjectModel.color || '#6366f1'}
            label={
              subjectModel.syllabusCompletion !== null
                ? `${subjectModel.syllabusCompletion}%`
                : '—'
            }
            sublabel="Syllabus"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-1">
              <span>Subject Learning Map</span>
              <span aria-hidden="true">·</span>
              <span>
                {subjectModel.totalChapters} chapter{subjectModel.totalChapters === 1 ? '' : 's'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {subjectModel.completedTopics}/{subjectModel.totalTopics} topics completed
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-['Outfit'] tracking-tight text-white">
              {subjectModel.name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {subjectModel.examAverage !== null
                ? `Exam average ${subjectModel.examAverage}% across ${subjectModel.examResults.length} assessments`
                : 'No graded exams recorded for this subject yet'}
              {subjectModel.dppAverage !== null
                ? ` · DPP score ${subjectModel.dppAverage}%`
                : subjectModel.dppSets.length > 0
                  ? ` · ${subjectModel.dppSets.length} DPP quiz ready`
                  : ''}
            </p>
          </div>
        </div>

        {/* Status Filter Controls */}
        {chapters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#090e1b] border border-white/[0.07]">
            {[
              { id: 'all', label: 'All' },
              { id: 'completed', label: 'Completed' },
              { id: 'in-progress', label: 'In Progress' },
              { id: 'not-started', label: 'Not Started' },
              { id: 'needs-attention', label: 'Needs Attention' },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-indigo-500/20 text-white border border-indigo-400/35'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty Subject State (e.g. English / CS when no chapters seeded) */}
      {!subjectModel.hasCurriculum ? (
        <div className="rounded-2xl bg-[#0f1628] border border-white/[0.08] p-8 sm:p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/12 border border-indigo-400/25 flex items-center justify-center mx-auto text-indigo-300">
            <Compass className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="text-base font-semibold font-['Outfit'] text-white">
              No chapters published for {subjectModel.name} yet
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Once curriculum chapters, exam marks, or DPP practice sets are logged for {subjectModel.name}, your chapter route and topic mastery map will appear here automatically.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate('/ai-companion', {
                  state: {
                    mode: 'explain',
                    subject: subjectModel.name,
                    timestamp: Date.now(),
                  },
                })
              }
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Study {subjectModel.name} with Nova</span>
            </button>
          </div>
        </div>
      ) : filteredChapters.length === 0 ? (
        <div className="rounded-2xl bg-[#0f1628] border border-white/[0.08] p-8 text-center">
          <p className="text-sm text-slate-300">
            No chapters in {subjectModel.name} match the selected status filter.
          </p>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className="mt-3 px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-white transition-colors"
          >
            Show All Chapters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Interactive Chapter Node Path (8 cols) */}
          <div className="xl:col-span-8 relative">
            {/* Vertical Progression Spine */}
            <div
              aria-hidden="true"
              className="hidden sm:block absolute left-6 top-8 bottom-8 w-[2px] bg-gradient-to-b from-emerald-400/50 via-cyan-400/40 to-slate-700/40"
            />

            <div className="space-y-4">
              {filteredChapters.map((ch, idx) => {
                const meta = STATUS_META[ch.displayStatus] || STATUS_META['not-started'];
                const StatusIcon = meta.icon;
                const expanded = Boolean(expandedMap[ch.id]);

                return (
                  <motion.div
                    key={ch.id}
                    layout
                    onMouseEnter={() => setHoveredChapterId(ch.id)}
                    className="relative sm:pl-16"
                  >
                    {/* Node Marker on Spine */}
                    <div
                      aria-hidden="true"
                      className={`hidden sm:flex absolute left-1.5 top-6 w-9 h-9 rounded-xl border items-center justify-center font-mono text-xs font-bold z-10 transition-colors ${meta.nodeRing}`}
                    >
                      {String(ch.order_index || idx + 1).padStart(2, '0')}
                    </div>

                    {/* Chapter Interactive Card */}
                    <div
                      className={`rounded-2xl bg-[#0f1628] border transition-colors overflow-hidden ${meta.cardBorder}`}
                    >
                      <button
                        type="button"
                        data-testid={`compass-chapter-${ch.id}`}
                        aria-expanded={expanded}
                        onClick={() => toggleExpand(ch.id)}
                        className="w-full p-4 sm:p-5 text-left flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <ProgressRing
                            value={ch.progress}
                            size={54}
                            strokeWidth={5}
                            color={meta.ringColor}
                            label={`${ch.progress}%`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                              <span className={`inline-flex items-center gap-1 font-medium ${meta.textColor}`}>
                                <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>{meta.label}</span>
                              </span>
                              <span className="text-slate-600" aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums text-slate-400">
                                {ch.completedTopics}/{ch.totalTopics} topics completed
                              </span>
                              {ch.ongoingTopics > 0 && (
                                <>
                                  <span className="text-slate-600" aria-hidden="true">·</span>
                                  <span className="text-cyan-300 font-mono tabular-nums">
                                    {ch.ongoingTopics} active
                                  </span>
                                </>
                              )}
                            </div>

                            <h4 className="text-base font-semibold font-['Outfit'] text-white truncate">
                              {ch.name}
                            </h4>

                            {ch.needsAttention && ch.attentionReason && (
                              <p className="text-xs text-amber-300 mt-1">
                                {ch.attentionReason}
                              </p>
                            )}

                            {/* Linear Progress Indicator */}
                            <div className="mt-3 max-w-md h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${ch.progress}%` }}
                                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: meta.ringColor }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-auto">
                          <span className="text-xs text-slate-400 hidden md:inline">
                            {expanded ? 'Hide topics' : 'Inspect topics'}
                          </span>
                          {expanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Topic List */}
                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="border-t border-white/[0.08] bg-[#0a0f1e]/75 px-4 sm:px-5 py-4 space-y-2.5"
                          >
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                              <span>Chapter Topics</span>
                              <span className="font-mono tabular-nums">
                                {ch.totalTopics} total
                              </span>
                            </div>

                            <div className="divide-y divide-white/[0.06]">
                              {(ch.topics || []).map((topic, tIdx) => {
                                const tMeta =
                                  TOPIC_STATUS_META[topic.status] || TOPIC_STATUS_META.upcoming;
                                const TIcon = tMeta.icon;
                                return (
                                  <div
                                    key={topic.id || tIdx}
                                    className="py-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 group"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <TIcon
                                        className={`w-4 h-4 shrink-0 ${tMeta.color}`}
                                        aria-hidden="true"
                                      />
                                      <span className="text-sm text-slate-200 truncate">
                                        {topic.name}
                                      </span>
                                      <span className={`text-[11px] font-mono shrink-0 ${tMeta.color}`}>
                                        · {tMeta.label}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          navigate('/ai-companion', {
                                            state: {
                                              mode: 'explain',
                                              subject: subjectModel.name,
                                              prompt: `Explain "${topic.name}" from ${ch.name} simply with examples.`,
                                              timestamp: Date.now(),
                                            },
                                          })
                                        }
                                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-indigo-500/20 text-[11px] font-medium text-slate-300 hover:text-indigo-200 transition-colors"
                                      >
                                        Explain
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          navigate('/ai-companion', {
                                            state: {
                                              mode: 'quiz',
                                              subject: subjectModel.name,
                                              prompt: `${topic.name} (${ch.name})`,
                                              timestamp: Date.now(),
                                            },
                                          })
                                        }
                                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-cyan-500/20 text-[11px] font-medium text-slate-300 hover:text-cyan-200 transition-colors"
                                      >
                                        Quiz
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right 4 Columns: Live Hover / Chapter Telemetry Inspector */}
          <div className="xl:col-span-4 rounded-2xl bg-[#0f1628] border border-white/[0.08] p-5 space-y-5 xl:sticky xl:top-20">
            {inspectedChapter ? (
              <>
                <div>
                  <p className="text-xs text-slate-400">Chapter Navigator Detail</p>
                  <h4 className="text-lg font-bold font-['Outfit'] text-white mt-0.5">
                    {inspectedChapter.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {subjectModel.name} · Unit {String(inspectedChapter.order_index || 1).padStart(2, '0')}
                  </p>
                </div>

                {/* Topic Breakdown Bar */}
                <div className="space-y-2 pt-3 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Topic Mastery Split</span>
                    <span className="font-mono tabular-nums text-white font-semibold">
                      {inspectedChapter.progress}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="py-2.5 px-2 rounded-xl bg-[#0a0f1e]">
                      <p className="text-base font-bold font-mono tabular-nums text-emerald-300">
                        {inspectedChapter.completedTopics}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Completed</p>
                    </div>
                    <div className="py-2.5 px-2 rounded-xl bg-[#0a0f1e]">
                      <p className="text-base font-bold font-mono tabular-nums text-cyan-300">
                        {inspectedChapter.ongoingTopics}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Active</p>
                    </div>
                    <div className="py-2.5 px-2 rounded-xl bg-[#0a0f1e]">
                      <p className="text-base font-bold font-mono tabular-nums text-slate-300">
                        {inspectedChapter.upcomingTopics}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Upcoming</p>
                    </div>
                  </div>
                </div>

                {/* Linked DPP Practice */}
                <div className="space-y-2 pt-3 border-t border-white/[0.08]">
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
                    <span>Linked Practice Quizzes (DPP)</span>
                  </p>
                  {inspectedChapter.matchedDpp?.length > 0 ? (
                    inspectedChapter.matchedDpp.map((dpp) => (
                      <button
                        key={dpp.id}
                        type="button"
                        onClick={() => navigate('/dpp')}
                        className="w-full p-3 rounded-xl bg-[#0a0f1e] hover:bg-[#141d34] border border-white/[0.07] text-left flex items-center justify-between gap-2 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">{dpp.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            {dpp.attempted && dpp.last_attempt
                              ? `Scored ${dpp.last_attempt.score}/${dpp.last_attempt.total_marks}`
                              : `Not attempted yet · +${dpp.xp_reward} XP`}
                          </p>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">
                      No dedicated DPP set linked directly to this chapter yet.
                    </p>
                  )}
                </div>

                {/* Linked Assignments */}
                <div className="space-y-2 pt-3 border-t border-white/[0.08]">
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                    <span>Related Coursework</span>
                  </p>
                  {inspectedChapter.matchedAssignments?.length > 0 ? (
                    inspectedChapter.matchedAssignments.map((asg) => (
                      <button
                        key={asg.id}
                        type="button"
                        onClick={() => navigate('/assignments')}
                        className="w-full p-3 rounded-xl bg-[#0a0f1e] hover:bg-[#141d34] border border-white/[0.07] text-left flex items-center justify-between gap-2 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">{asg.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono capitalize">
                            {asg.submission?.status === 'graded'
                              ? `Graded: ${asg.submission.marks_obtained}/${asg.max_marks}`
                              : asg.user_status || 'Pending'}
                          </p>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">
                      No assignments linked directly to this chapter.
                    </p>
                  )}
                </div>

                {/* Quick AI Companion Deep Dive */}
                <button
                  type="button"
                  onClick={() =>
                    navigate('/ai-companion', {
                      state: {
                        mode: inspectedChapter.displayStatus === 'completed' ? 'quiz' : 'explain',
                        subject: subjectModel.name,
                        prompt:
                          inspectedChapter.displayStatus === 'completed'
                            ? inspectedChapter.name
                            : `Walk me through the core concepts of ${inspectedChapter.name} in ${subjectModel.name}.`,
                        timestamp: Date.now(),
                      },
                    })
                  }
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {inspectedChapter.displayStatus === 'completed'
                      ? `Quiz Yourself on ${inspectedChapter.name}`
                      : `Study ${inspectedChapter.name} with Nova`}
                  </span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </motion.div>
  );
}
