import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Award, AlertTriangle, TrendingUp, ArrowUpRight,
  BookOpen, CheckCircle2, Brain, RefreshCw, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip
} from 'recharts';
import api from '../../lib/api';
import ProgressRing from '../../components/compass/ProgressRing';
import SubjectMapCanvas from '../../components/compass/SubjectMapCanvas';
import { buildLearningCompassData } from '../../lib/learningCompass';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#0c1324] border border-white/[0.12] px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-white mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="font-mono tabular-nums" style={{ color: entry.color || '#22d3ee' }}>
          {entry.name}: {entry.value}%
        </p>
      ))}
    </div>
  );
}

export default function LearningCompass() {
  const navigate = useNavigate();

  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  const loadCompassData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subjRes, chapRes, resRes, analyticsRes, dppRes, asgRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/timeline'),
        api.get('/results'),
        api.get('/results/analytics'),
        api.get('/dpp'),
        api.get('/assignments'),
      ]);
      const payload = {
        subjects: subjRes.data || [],
        chapters: chapRes.data || [],
        results: resRes.data || [],
        analytics: analyticsRes.data || null,
        dppSets: dppRes.data || [],
        assignments: asgRes.data || [],
      };
      setRawData(payload);

      // Default select first subject that has chapters (e.g. Mathematics)
      setSelectedSubjectId((prev) => {
        if (prev && payload.subjects.some((s) => s.id === prev)) return prev;
        const firstWithChapters = payload.subjects.find((s) =>
          payload.chapters.some((c) => c.subject_id === s.id)
        );
        return firstWithChapters?.id || payload.subjects[0]?.id || null;
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Could not load your Learning Compass data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompassData();
  }, [loadCompassData]);

  const compass = useMemo(() => {
    if (!rawData) return null;
    return buildLearningCompassData(rawData);
  }, [rawData]);

  const activeSubjectModel = useMemo(() => {
    if (!compass?.subjectModels?.length) return null;
    return (
      compass.subjectModels.find((s) => s.id === selectedSubjectId) ||
      compass.subjectModels[0]
    );
  }, [compass, selectedSubjectId]);

  const radarData = useMemo(() => {
    if (!compass?.subjectModels?.length) return [];
    return compass.subjectModels
      .filter((s) => s.hasCurriculum || s.hasAssessmentData)
      .map((s) => ({
        subject: s.name.length > 12 ? s.name.slice(0, 10) : s.name,
        examAvg: s.examAverage ?? 0,
        syllabusPct: s.syllabusCompletion ?? 0,
      }));
  }, [compass]);

  const examChartData = useMemo(() => {
    if (!activeSubjectModel) return [];
    if (activeSubjectModel.examResults?.length > 0) {
      return activeSubjectModel.examResults.map((r) => ({
        exam: r.exam_name,
        score: r.percentage,
        date: r.exam_date,
      }));
    }
    return [];
  }, [activeSubjectModel]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-14 w-72 rounded-xl shimmer-bg" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 h-72 rounded-2xl shimmer-bg" />
          <div className="lg:col-span-5 h-72 rounded-2xl shimmer-bg" />
        </div>
        <div className="h-96 rounded-2xl shimmer-bg" />
      </div>
    );
  }

  if (error || !compass) {
    return (
      <div className="rounded-2xl bg-[#0f1628] border border-rose-400/25 p-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <h2 className="text-lg font-semibold font-['Outfit'] text-white">
          Unable to load Learning Compass
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">{error}</p>
        <button
          type="button"
          onClick={loadCompassData}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const { overview, subjectModels, insights } = compass;

  return (
    <motion.div
      data-testid="learning-compass-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* 1. Header & Primary Recommended Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 mb-1.5">
            <Compass className="w-4 h-4" aria-hidden="true" />
            <span>Academic Navigation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] tracking-tight text-white">
            Learning Compass
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track chapter progression, topic mastery, exam trends, and practice performance across your subjects.
          </p>
        </div>

        <button
          type="button"
          data-testid="compass-primary-cta"
          onClick={() =>
            navigate(overview.recommendedAction.to, {
              state: overview.recommendedAction.state || undefined,
            })
          }
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-500 text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-2 shadow-lg transition-all whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-cyan-200" aria-hidden="true" />
          <span>{overview.recommendedAction.ctaLabel}</span>
          <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* 2. Overall Academic Navigation Overview */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Left 7 Cols: Overall Mastery Dial + Subject Progress Breakdown */}
        <div className="xl:col-span-7 rounded-2xl bg-[#0f1628] border border-white/[0.08] p-5 sm:p-6 flex flex-col justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <ProgressRing
              value={overview.overallSyllabusPct}
              size={118}
              strokeWidth={9}
              color="#22d3ee"
              label={`${overview.overallSyllabusPct}%`}
              sublabel="Topics Done"
            />
            <div className="space-y-3 flex-1">
              <div>
                <h2 className="text-lg font-bold font-['Outfit'] text-white">
                  Overall Curriculum Position
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Computed directly from your completed curriculum topics, graded exams, and DPP attempts.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <p className="text-lg sm:text-xl font-bold font-mono tabular-nums text-white">
                    {overview.completedChapters}/{overview.totalChapters}
                  </p>
                  <p className="text-xs text-slate-400">Chapters Done</p>
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold font-mono tabular-nums text-white">
                    {overview.overallExamAvg !== null ? `${overview.overallExamAvg}%` : '—'}
                  </p>
                  <p className="text-xs text-slate-400">Exam Average</p>
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold font-mono tabular-nums text-white">
                    {overview.overallDppAvg !== null
                      ? `${overview.overallDppAvg}%`
                      : `${overview.dppAttemptedCount}/${overview.dppTotalCount}`}
                  </p>
                  <p className="text-xs text-slate-400">
                    {overview.overallDppAvg !== null ? 'DPP Average' : 'DPPs Attempted'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Subject-Wise Progress Bars (Clickable to switch map) */}
          <div className="pt-4 border-t border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Subject-Wise Progress Overview</span>
              <span>Select a subject to inspect its learning map</span>
            </div>

            <div className="space-y-2.5">
              {subjectModels.map((subj) => {
                const isSelected = activeSubjectModel?.id === subj.id;
                const progressPct = subj.syllabusCompletion;
                return (
                  <button
                    key={subj.id}
                    type="button"
                    data-testid={`overview-subject-${subj.id}`}
                    onClick={() => setSelectedSubjectId(subj.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-500/12 border-indigo-400/40'
                        : 'bg-[#0a0f1e]/80 border-white/[0.06] hover:border-white/[0.14]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: subj.color || '#6366f1' }}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium text-white">{subj.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-slate-400">
                        <span>
                          {subj.examAverage !== null ? `Exam ${subj.examAverage}%` : 'No exams yet'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-200 font-semibold">
                          {progressPct !== null ? `${progressPct}% syllabus` : 'No chapters yet'}
                        </span>
                      </div>
                    </div>

                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct ?? 0}%` }}
                        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: subj.color || '#6366f1' }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Subject Balance Radar Visualization */}
        <div className="xl:col-span-5 rounded-2xl bg-[#0f1628] border border-white/[0.08] p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h2 className="text-base font-semibold font-['Outfit'] text-white">
                Mastery Balance Radar
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparing Exam Performance vs. Syllabus Completion
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 shrink-0">
              <span className="text-cyan-300">● Exam %</span>
              <span className="text-indigo-300">● Syllabus %</span>
            </div>
          </div>

          {radarData.length >= 3 ? (
            <div className="w-full h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="rgba(148,163,184,0.16)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#cbd5e1', fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Radar
                    name="Exam Avg"
                    dataKey="examAvg"
                    stroke="#22d3ee"
                    fill="#22d3ee"
                    fillOpacity={0.18}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Syllabus"
                    dataKey="syllabusPct"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.16}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <Compass className="w-8 h-8 text-slate-500 mb-2" />
              <p className="text-sm text-slate-300">More subject activity needed</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                At least 3 subjects with recorded chapters or exam marks are required to plot the mastery radar.
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-white/[0.08] text-xs text-slate-400 flex items-center justify-between">
            <span>Practice sets status</span>
            <span className="font-mono tabular-nums text-slate-200">
              {overview.dppAttemptedCount} of {overview.dppTotalCount} DPP completed
            </span>
          </div>
        </div>
      </section>

      {/* 3. Key Diagnostic Strip */}
      <section className="rounded-2xl bg-[#0f1628] border border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
        <div className="p-5">
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span>Strongest Subject</span>
          </p>
          <p className="text-lg font-bold font-['Outfit'] text-white">
            {overview.strongestSubject ? overview.strongestSubject.name : 'Needs data'}
          </p>
          <p className="text-xs font-mono tabular-nums text-emerald-300 mt-1">
            {overview.strongestSubject?.examAverage !== null && overview.strongestSubject
              ? `${overview.strongestSubject.examAverage}% exam average`
              : 'Complete exams to rank'}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>Subject Requiring Attention</span>
          </p>
          <p className="text-lg font-bold font-['Outfit'] text-white">
            {overview.subjectRequiringAttention
              ? overview.subjectRequiringAttention.name
              : 'All subjects steady'}
          </p>
          <p className="text-xs text-slate-400 mt-1 leading-snug">
            {overview.attentionSummaryReason || 'No low-score flags detected yet'}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
            <span>Examination Trend</span>
          </p>
          <p className="text-lg font-bold font-['Outfit'] text-white">
            {insights.examTrendSummary.headline}
          </p>
          <p className="text-xs text-slate-400 mt-1 leading-snug">
            {insights.examTrendSummary.detail}
          </p>
        </div>

        <div className="p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
              <Brain className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
              <span>Recommended Next Action</span>
            </p>
            <p className="text-sm font-semibold text-white leading-snug">
              {overview.recommendedAction.title}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate(overview.recommendedAction.to, {
                state: overview.recommendedAction.state || undefined,
              })
            }
            className="mt-2 text-xs font-medium text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1 self-start"
          >
            <span>{overview.recommendedAction.ctaLabel}</span>
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* 4. Interactive Visual Learning Map */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold font-['Outfit'] tracking-tight text-white">
              Visual Learning Map
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Switch subjects to navigate chapter completion, topic mastery, and linked quizzes.
            </p>
          </div>

          {/* Interactive Subject Switcher Tabs */}
          <div
            role="tablist"
            aria-label="Subject learning map selector"
            className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0f1628] border border-white/[0.08] overflow-x-auto max-w-full"
          >
            {subjectModels.map((subj) => {
              const active = activeSubjectModel?.id === subj.id;
              return (
                <button
                  key={subj.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-testid={`compass-tab-${subj.id}`}
                  onClick={() => setSelectedSubjectId(subj.id)}
                  className={`relative px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="compassSubjectTab"
                      className="absolute inset-0 rounded-lg bg-indigo-500/20 border border-indigo-400/40"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: subj.color || '#6366f1' }}
                      aria-hidden="true"
                    />
                    <span>{subj.name}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeSubjectModel && (
            <SubjectMapCanvas key={activeSubjectModel.id} subjectModel={activeSubjectModel} />
          )}
        </AnimatePresence>
      </section>

      {/* 5. Your Learning Insights & Subject Examination Chart */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Your Learning Insights */}
        <div
          data-testid="learning-insights-panel"
          className="xl:col-span-7 rounded-2xl bg-[#0f1628] border border-white/[0.08] p-5 sm:p-6 space-y-5"
        >
          <div>
            <h2 className="text-lg font-bold font-['Outfit'] text-white">
              Your Learning Insights
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Deterministic analysis derived strictly from your syllabus, examination records, and DPP activity.
            </p>
          </div>

          <div className="divide-y divide-white/[0.07]">
            <InsightRow
              icon={Award}
              iconColor="text-emerald-400"
              label="Your strongest subject"
              value={
                insights.strongestSubject
                  ? `${insights.strongestSubject.name}${
                      insights.strongestSubject.examAverage !== null
                        ? ` (${insights.strongestSubject.examAverage}% avg)`
                        : ''
                    }`
                  : 'More assessment activity needed'
              }
              detail={
                insights.strongestSubject
                  ? `${insights.strongestSubject.completedChaptersCount}/${insights.strongestSubject.totalChapters} chapters completed · ${insights.strongestSubject.examResults.length} exams graded.`
                  : 'Complete your first graded assessment to unlock subject strength ranking.'
              }
            />

            <InsightRow
              icon={CheckCircle2}
              iconColor="text-cyan-400"
              label="Most recently completed chapter"
              value={
                insights.recentlyCompletedChapter
                  ? `${insights.recentlyCompletedChapter.name} · ${insights.recentlyCompletedChapter.subject_name}`
                  : 'No completed chapters recorded yet'
              }
              detail={
                insights.recentlyCompletedChapter
                  ? `${insights.recentlyCompletedChapter.completedTopics}/${insights.recentlyCompletedChapter.totalTopics} topics mastered (100%).`
                  : 'Finish all topics in an active chapter to mark your first milestone.'
              }
            />

            <InsightRow
              icon={AlertTriangle}
              iconColor="text-amber-400"
              label="Chapters requiring revision"
              value={
                insights.chaptersRequiringRevision.length > 0
                  ? insights.chaptersRequiringRevision
                      .map((c) => `${c.name} (${c.subject_name})`)
                      .join(', ')
                  : 'No low-score revision flags yet'
              }
              detail={
                insights.chaptersRequiringRevision.length > 0
                  ? insights.chaptersRequiringRevision[0].attentionReason
                  : 'More DPP practice scores or graded chapter work is needed before flagging specific chapters for revision.'
              }
            />

            <InsightRow
              icon={TrendingUp}
              iconColor="text-indigo-400"
              label="Your recent examination trend"
              value={insights.examTrendSummary.headline}
              detail={insights.examTrendSummary.detail}
            />

            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-cyan-400 shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <p className="text-xs text-slate-400">Your next suggested learning action</p>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {insights.recommendedAction.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {insights.recommendedAction.reason}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate(insights.recommendedAction.to, {
                    state: insights.recommendedAction.state || undefined,
                  })
                }
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
              >
                <span>{insights.recommendedAction.ctaLabel}</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Subject Examination Trajectory */}
        <div className="xl:col-span-5 rounded-2xl bg-[#0f1628] border border-white/[0.08] p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold font-['Outfit'] text-white">
              {activeSubjectModel?.name || 'Subject'} Examination Trajectory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological test scores for the currently selected subject
            </p>
          </div>

          {examChartData.length > 0 ? (
            <>
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={examChartData}>
                    <defs>
                      <linearGradient id="compassExamGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={activeSubjectModel?.color || '#6366f1'} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={activeSubjectModel?.color || '#6366f1'} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                    <XAxis dataKey="exam" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="score"
                      name={activeSubjectModel?.name || 'Score'}
                      stroke={activeSubjectModel?.color || '#6366f1'}
                      strokeWidth={2.5}
                      fill="url(#compassExamGrad)"
                      dot={{ r: 4, fill: activeSubjectModel?.color || '#6366f1' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="text-slate-400">
                  Latest: <strong className="text-white">{activeSubjectModel.latestExamScore}%</strong>
                </span>
                {activeSubjectModel.examTrendDelta !== null && (
                  <span
                    className={
                      activeSubjectModel.examTrendDelta >= 0 ? 'text-emerald-300' : 'text-amber-300'
                    }
                  >
                    {activeSubjectModel.examTrendDelta >= 0 ? '+' : ''}
                    {activeSubjectModel.examTrendDelta}% overall change
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="h-[240px] flex flex-col items-center justify-center text-center rounded-xl bg-[#0a0f1e] border border-dashed border-white/[0.08] px-4">
              <TrendingUp className="w-7 h-7 text-slate-500 mb-2" />
              <p className="text-sm text-slate-300">
                No examination results recorded for {activeSubjectModel?.name}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Assessment scores will plot here once graded exams are published.
              </p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}

function InsightRow({ icon: Icon, iconColor, label, value, detail }) {
  return (
    <div className="py-3.5 first:pt-0 flex items-start gap-3">
      <Icon className={`w-4 h-4 shrink-0 mt-1 ${iconColor}`} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}
