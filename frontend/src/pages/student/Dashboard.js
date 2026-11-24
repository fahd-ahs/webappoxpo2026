import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { toast } from 'sonner';
import {
  Zap, Flame, Trophy, ClipboardCheck, BarChart3, Calendar,
  Clock, ChevronRight, BookOpen, Bell, ArrowUpRight, Brain,
  CheckCircle, Sparkles, Award, X, Target, Compass
} from 'lucide-react';
import ProgressRing from '../../components/compass/ProgressRing';

const containerV = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

const itemV = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function buildWeeklyActivity(xpHistory = [], attendanceRecords = [], todos = []) {
  const today = new Date();
  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const iso = d.toISOString().split('T')[0];
    const shortDay = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayChar = shortDay.charAt(0);

    const dayXp = xpHistory
      .filter((e) => (e.created_at || '').startsWith(iso))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const dayTasks = todos.filter(
      (t) => (t.completed_at || '').startsWith(iso) || (t.created_at || '').startsWith(iso)
    ).length;

    const attRec = attendanceRecords.find((r) => r.date === iso);
    const presentBonus = attRec?.is_present ? 15 : 0;

    const score = dayXp + dayTasks * 10 + presentBonus;
    days.push({
      iso,
      shortDay,
      dayChar,
      xp: dayXp,
      tasks: dayTasks,
      present: attRec ? attRec.is_present : null,
      score,
      isToday: offset === 0,
    });
  }

  const maxScore = Math.max(...days.map((d) => d.score), 0);
  return {
    days: days.map((d) => ({
      ...d,
      heightPct: maxScore > 0 && d.score > 0 ? Math.max(14, Math.round((d.score / maxScore) * 100)) : 0,
    })),
    hasAnyActivity: maxScore > 0,
    totalWeekXp: days.reduce((sum, d) => sum + d.xp, 0),
    activeDays: days.filter((d) => d.score > 0).length,
  };
}

export default function Dashboard() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [todos, setTodos] = useState([]);
  const [xpHistory, setXpHistory] = useState([]);
  const [attSummary, setAttSummary] = useState({ records: [], present: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [hoveredDayIso, setHoveredDayIso] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [togglingTodoId, setTogglingTodoId] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      try {
        const endpoint = user?.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
        const [dashRes, todoRes, profileRes, attRes] = await Promise.all([
          api.get(endpoint),
          api.get('/todos').catch(() => ({ data: [] })),
          api.get('/profile').catch(() => ({ data: {} })),
          api.get('/attendance').catch(() => ({ data: { records: [], present: 0, total: 0 } })),
        ]);
        if (!active) return;
        setData(dashRes.data);
        setTodos(Array.isArray(todoRes.data) ? todoRes.data : []);
        setXpHistory(Array.isArray(profileRes.data?.xp_history) ? profileRes.data.xp_history : []);
        setAttSummary({
          records: Array.isArray(attRes.data?.records) ? attRes.data.records : [],
          present: attRes.data?.present || 0,
          total: attRes.data?.total || 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAll();
    return () => { active = false; };
  }, [user]);

  const weeklyActivity = useMemo(
    () => buildWeeklyActivity(xpHistory, attSummary.records, todos),
    [xpHistory, attSummary.records, todos]
  );

  const toggleTodoPriority = async (todo) => {
    if (togglingTodoId === todo.id) return;
    setTogglingTodoId(todo.id);
    const nextDone = !todo.is_completed;
    try {
      await api.patch(`/todos/${todo.id}`, {
        is_completed: nextDone,
        status: nextDone ? 'done' : 'todo',
      });
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, is_completed: nextDone, status: nextDone ? 'done' : 'todo' } : t))
      );
      if (nextDone) {
        toast.success('+5 XP earned for completing study task!');
        checkAuth?.();
      }
    } catch {
      toast.error('Could not update task status');
    } finally {
      setTogglingTodoId(null);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const xp = data?.xp_profile || { total_xp: 0, level: 1, streak: 0, level_title: 'Newcomer', badges: [] };
  const nextLevel = xp.next_level;
  const xpMax = nextLevel?.min_xp || xp.total_xp + 200;
  const prevLevelXp = (() => {
    const levels = [0, 200, 500, 1000, 2000, 3500, 5000];
    let prev = 0;
    for (const l of levels) {
      if (l < xpMax) prev = l;
    }
    return prev;
  })();
  const xpProgress = xpMax > prevLevelXp ? Math.min(100, Math.max(0, ((xp.total_xp - prevLevelXp) / (xpMax - prevLevelXp)) * 100)) : 100;
  const xpRemaining = nextLevel ? Math.max(0, nextLevel.min_xp - (xp.total_xp || 0)) : 0;

  const attPct = data?.attendance_percentage || 0;
  const completedTodosCount = todos.filter((t) => t.is_completed).length;
  const goalProgress = todos.length > 0 ? Math.round((completedTodosCount / todos.length) * 100) : 0;

  const subjectColors = {
    Mathematics: '#6366f1',
    Physics: '#22d3ee',
    Chemistry: '#10b981',
    English: '#f59e0b',
    'Computer Science': '#8b5cf6',
  };

  const derivedAchievements = [
    xp.streak >= 7 ? { label: `${xp.streak}-Day Streak`, tone: 'text-amber-300 border-amber-400/25 bg-amber-500/10' } : null,
    xp.total_xp >= 2000 ? { label: `Level ${xp.level} ${xp.level_title}`, tone: 'text-indigo-300 border-indigo-400/25 bg-indigo-500/10' } : null,
    attPct >= 75 ? { label: '75%+ Attendance', tone: 'text-emerald-300 border-emerald-400/25 bg-emerald-500/10' } : null,
    (data?.average_score || 0) >= 85 ? { label: 'Honors Average', tone: 'text-cyan-300 border-cyan-400/25 bg-cyan-500/10' } : null,
  ].filter(Boolean);

  const inspectedDay =
    weeklyActivity.days.find((d) => d.iso === hoveredDayIso) ||
    weeklyActivity.days[weeklyActivity.days.length - 1];

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      data-testid="student-dashboard"
      variants={containerV}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* 1. Personalised Greeting & Quick Actions */}
      <motion.section variants={itemV} className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-slate-400 mb-1.5">
            {user?.class_name ? `Class ${user.class_name}` : 'Student Workspace'}
            {user?.roll_number ? ` · Roll ${user.roll_number}` : ''}
            {` · ${todayFormatted}`}
          </p>
          <h1 className="text-[clamp(1.75rem,2.6vw,2.4rem)] font-bold font-['Outfit'] tracking-tight text-white [text-wrap:balance]">
            {getGreeting()}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Stay on top of today's classes, study tasks, and upcoming coursework.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/learning-compass')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#0f1628] hover:bg-[#161f36] border border-white/[0.1] text-xs sm:text-sm font-medium text-slate-100 transition-colors whitespace-nowrap"
          >
            <Compass className="w-4 h-4 text-indigo-400" aria-hidden="true" />
            <span>Learning Compass</span>
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dpp')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#0f1628] hover:bg-[#161f36] border border-white/[0.1] text-xs sm:text-sm font-medium text-slate-100 transition-colors whitespace-nowrap"
          >
            <Brain className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>Practice DPP Quiz</span>
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => window.dispatchEvent(new CustomEvent('schoolexpo:open-ai'))}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-500 text-xs sm:text-sm font-medium text-white transition-all shadow-lg whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>Ask AI Companion</span>
          </motion.button>
        </div>
      </motion.section>

      {/* 2. Four Visually Distinct Academic Visualizations */}
      <motion.section
        variants={itemV}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Card 1: Academic XP + Level Meter */}
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          data-testid="bento-xp-progress"
          onClick={() => navigate('/leaderboard')}
          className="rounded-2xl bg-[#0f1628] border border-white/[0.09] hover:border-indigo-400/35 p-5 text-left transition-colors group flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
              <span>Academic XP</span>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
              <CountUp end={xp.total_xp || 0} duration={1} separator="," />
            </p>
            <p className="text-xs text-indigo-300 mt-0.5">
              Level {xp.level} · {xp.level_title}
            </p>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 bg-[#1a233d] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(xpProgress)}%` }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
              />
            </div>
            <p className="text-[11px] font-mono tabular-nums text-slate-400">
              {nextLevel ? `${xpRemaining.toLocaleString()} XP to ${nextLevel.title}` : 'Max rank unlocked'}
            </p>
          </div>
        </motion.button>

        {/* Card 2: Attendance + Circular Gauge */}
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          data-testid="bento-attendance"
          onClick={() => navigate('/attendance')}
          className="rounded-2xl bg-[#0f1628] border border-white/[0.09] hover:border-emerald-400/35 p-5 text-left transition-colors group flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>Attendance</span>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
                <CountUp end={attPct} duration={1} decimals={1} suffix="%" />
              </p>
              <p className={`text-xs mt-1 ${attPct >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {attPct >= 75 ? 'On track' : 'Below 75% target'}
                {attSummary.total > 0 ? ` · ${attSummary.present}/${attSummary.total}d` : ''}
              </p>
            </div>
            <ProgressRing
              value={attPct}
              size={56}
              strokeWidth={5}
              color={attPct >= 75 ? '#10b981' : '#f43f5e'}
              label={`${Math.round(attPct)}%`}
            />
          </div>
        </motion.button>

        {/* Card 3: Examination Average + Mini Sparkline */}
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          data-testid="bento-avg-score"
          onClick={() => navigate('/results')}
          className="rounded-2xl bg-[#0f1628] border border-white/[0.09] hover:border-cyan-400/35 p-5 text-left transition-colors group flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
              <span>Exam Average</span>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
                <CountUp end={data?.average_score || 0} duration={1} decimals={1} suffix="%" />
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {(data?.recent_results || []).length} recent exams
              </p>
            </div>
            {(() => {
              const pts = [...(data?.recent_results || [])]
                .slice(0, 5)
                .reverse()
                .map((r) => Number(r.percentage || 0));
              if (pts.length < 2) return null;
              const min = Math.min(...pts, 50);
              const max = Math.max(...pts, 100);
              const range = Math.max(10, max - min);
              const w = 78;
              const h = 34;
              const pathD = pts
                .map((val, i) => {
                  const x = (i / (pts.length - 1)) * (w - 8) + 4;
                  const y = h - 5 - ((val - min) / range) * (h - 10);
                  return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(' ');
              return (
                <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0">
                  <motion.path
                    d={pathD}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
              );
            })()}
          </div>
        </motion.button>

        {/* Card 4: Class Rank + 7-Day Activity Pips */}
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          data-testid="bento-rank"
          onClick={() => navigate('/leaderboard')}
          className="rounded-2xl bg-[#0f1628] border border-white/[0.09] hover:border-amber-400/35 p-5 text-left transition-colors group flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>Class Rank</span>
            </span>
            <span data-testid="bento-streak" className="inline-flex items-center gap-1 font-mono text-amber-300">
              <Flame className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              {data?.streak || 0}d
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
              #<CountUp end={data?.leaderboard_rank || 0} duration={0.9} />
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Active {data?.streak || 0}-day study streak
            </p>
          </div>
          <div className="flex items-center gap-1.5" aria-label="Last 7 days activity">
            {weeklyActivity.days.map((d) => (
              <span
                key={d.iso}
                title={`${d.shortDay}: +${d.xp} XP`}
                className={`h-1.5 flex-1 rounded-full ${
                  d.score > 0
                    ? d.isToday
                      ? 'bg-cyan-400'
                      : 'bg-amber-400/80'
                    : 'bg-white/[0.08]'
                }`}
              />
            ))}
          </div>
        </motion.button>
      </motion.section>

      {/* 3. Main Asymmetric Workspace Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left 8 Columns: Weekly Activity, Schedule + Assignments, Performance */}
        <div className="xl:col-span-8 space-y-5">
          {/* Weekly Activity Visualization (Real Deterministic Data) */}
          <motion.section
            variants={itemV}
            data-testid="bento-study-activity"
            className="glass-card p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-base font-semibold font-['Outfit'] text-white">
                  7-Day Study Activity
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Computed from your logged XP events, completed tasks, and daily attendance
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                <span className="text-slate-400">
                  Active days: <strong className="text-white">{weeklyActivity.activeDays}/7</strong>
                </span>
                <span className="text-indigo-300">
                  +{weeklyActivity.totalWeekXp} XP this week
                </span>
              </div>
            </div>

            {!weeklyActivity.hasAnyActivity ? (
              <div className="py-8 text-center rounded-xl border border-dashed border-white/[0.1] bg-[#0a0f1d]">
                <Target className="w-7 h-7 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-300">No study activity logged in the last 7 days yet.</p>
                <p className="text-xs text-slate-400 mt-1 mb-3">
                  Complete a task or timed DPP quiz to start tracking your daily momentum.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/dpp')}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
                >
                  Open DPP Practice
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-36 pt-3">
                  {weeklyActivity.days.map((bar, idx) => {
                    const isFocused = inspectedDay?.iso === bar.iso;
                    return (
                      <button
                        key={bar.iso}
                        type="button"
                        onMouseEnter={() => setHoveredDayIso(bar.iso)}
                        onFocus={() => setHoveredDayIso(bar.iso)}
                        onClick={() => setHoveredDayIso(bar.iso)}
                        aria-label={`${bar.shortDay}: ${bar.xp} XP, ${bar.tasks} tasks`}
                        className="h-full flex flex-col items-center justify-end gap-2 group focus:outline-none"
                      >
                        <div className="w-full flex-1 flex items-end justify-center">
                          <motion.div
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ duration: 0.45, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                              height: bar.heightPct > 0 ? `${bar.heightPct}%` : '6px',
                              transformOrigin: 'bottom',
                            }}
                            className={`w-full max-w-[42px] rounded-t-lg transition-colors duration-150 ${
                              bar.heightPct === 0
                                ? 'bg-white/[0.06]'
                                : bar.isToday || isFocused
                                  ? 'bg-gradient-to-t from-indigo-600 to-cyan-400'
                                  : 'bg-indigo-500/45 group-hover:bg-indigo-400/75'
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[11px] font-mono ${
                            bar.isToday
                              ? 'text-cyan-400 font-semibold'
                              : isFocused
                                ? 'text-white'
                                : 'text-slate-400'
                          }`}
                        >
                          {bar.shortDay}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {inspectedDay && (
                  <div className="mt-4 pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                    <span className="font-mono text-slate-400">
                      {inspectedDay.isToday ? 'Today' : inspectedDay.shortDay} · {inspectedDay.iso}
                    </span>
                    <div className="flex items-center gap-4 font-mono tabular-nums">
                      <span className="text-indigo-300">+{inspectedDay.xp} XP</span>
                      <span>{inspectedDay.tasks} tasks</span>
                      {inspectedDay.present !== null && (
                        <span className={inspectedDay.present ? 'text-emerald-400' : 'text-rose-400'}>
                          {inspectedDay.present ? 'Present' : 'Absent'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.section>

          {/* Schedule & Upcoming Assignments Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Today's Schedule */}
            <motion.section variants={itemV} data-testid="bento-schedule" className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold font-['Outfit'] text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                  <span>Today's Schedule</span>
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/timeline')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                >
                  <span>Syllabus</span>
                  <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>

              {(data?.schedule || []).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-7 h-7 text-slate-500 mx-auto mb-2 opacity-50" />
                  <p className="text-slate-400 text-sm">No classes scheduled today</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(data?.schedule || []).slice(0, 5).map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => navigate('/timeline')}
                      className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-[#141c31]/70 hover:bg-[#19243f] border border-white/[0.05] transition-colors group"
                    >
                      <span className="text-xs font-mono tabular-nums text-slate-400 w-12 shrink-0">
                        {s.start_time}
                      </span>
                      <span
                        className="w-1 h-7 rounded-full shrink-0"
                        style={{ backgroundColor: subjectColors[s.subject_name] || '#6366f1' }}
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{s.subject_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                          {s.start_time}–{s.end_time} · {s.room}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}
            </motion.section>

            {/* Upcoming Assignments */}
            <motion.section variants={itemV} data-testid="bento-deadlines" className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold font-['Outfit'] text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                  <span>Upcoming Deadlines</span>
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/assignments')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>

              {(data?.upcoming_assignments || []).length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto mb-2 opacity-70" />
                  <p className="text-slate-300 text-sm">All caught up! No assignments due.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(data?.upcoming_assignments || []).slice(0, 4).map((a, i) => {
                    const daysLeft = Math.ceil((new Date(a.due_date) - new Date()) / (1000 * 60 * 60 * 24));
                    const urgencyClass =
                      daysLeft <= 1 ? 'text-rose-400' : daysLeft <= 3 ? 'text-amber-400' : 'text-slate-300';
                    const dueLabel = daysLeft <= 0 ? 'Today' : `${daysLeft}d left`;

                    return (
                      <button
                        key={a.id || i}
                        type="button"
                        onClick={() => navigate('/assignments')}
                        className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-[#141c31]/70 hover:bg-[#19243f] border border-white/[0.05] transition-colors"
                      >
                        <span
                          className="w-1 h-8 rounded-full shrink-0"
                          style={{ backgroundColor: a.subject_color || '#818cf8' }}
                          aria-hidden="true"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{a.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{a.subject_name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-xs font-mono tabular-nums flex items-center justify-end gap-1 ${urgencyClass}`}>
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            <span>{dueLabel}</span>
                          </p>
                          <p className="text-[10px] font-mono tabular-nums text-indigo-300">+{a.xp_reward} XP</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.section>
          </div>

          {/* Academic Performance Snapshot */}
          <motion.section variants={itemV} className="glass-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-semibold font-['Outfit'] text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                  <span>Academic Performance</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Recent exam scores across subjects</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/results')}
                className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
              >
                <span>Full Analytics</span>
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>

            {(data?.recent_results || []).length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No exam results recorded yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(data?.recent_results || []).slice(0, 3).map((res, idx) => (
                  <div
                    key={res.id || idx}
                    className="p-3.5 rounded-xl bg-[#141c31]/75 border border-white/[0.06] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-white truncate">{res.subject_name}</span>
                      <span className="text-xs font-mono text-emerald-400 shrink-0">{res.grade}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-slate-400">{res.exam_name}</span>
                      <span className="text-base font-bold font-mono tabular-nums text-white">{res.percentage}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1e2944] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${res.percentage || 0}%` }}
                        transition={{ duration: 0.7, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: subjectColors[res.subject_name] || '#6366f1' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        </div>

        {/* Right 4 Columns: Today's Study Priorities, XP & Achievements, AI Study Companion */}
        <div className="xl:col-span-4 space-y-5">
          {/* Today's Study Priorities (Interactive Todos) */}
          <motion.section variants={itemV} data-testid="bento-daily-goals" className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-semibold font-['Outfit'] text-white">
                  Today's Study Priorities
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Click a task to earn +5 XP</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/todos')}
                className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
              >
                <span>All tasks</span>
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>

            {todos.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-white/[0.1] rounded-xl">
                <p className="text-sm text-slate-300">No study tasks added yet</p>
                <button
                  type="button"
                  onClick={() => navigate('/todos')}
                  className="mt-2.5 text-xs font-medium text-indigo-400 hover:underline"
                >
                  Create your first task
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {todos.slice(0, 5).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={togglingTodoId === t.id}
                    onClick={() => toggleTodoPriority(t)}
                    className={`w-full text-left flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-colors ${
                      t.is_completed
                        ? 'bg-[#141c31]/40 border-white/[0.04]'
                        : 'bg-[#141c31]/80 border-white/[0.07] hover:border-indigo-400/35'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        t.is_completed
                          ? 'bg-indigo-500 text-white'
                          : 'border border-slate-500/70'
                      }`}
                    >
                      {t.is_completed && <CheckCircle className="w-3.5 h-3.5" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          t.is_completed ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}
                      >
                        {t.title}
                      </p>
                      {t.subject_tag && (
                        <p className="text-[11px] text-slate-400 truncate">{t.subject_tag}</p>
                      )}
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-indigo-300 shrink-0">+5 XP</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3.5 border-t border-white/[0.08]">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400">Daily Completion</span>
                <span className="font-mono tabular-nums text-white font-semibold">
                  {completedTodosCount}/{todos.length} ({goalProgress}%)
                </span>
              </div>
              <div className="h-1.5 bg-[#1e2944] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${goalProgress}%` }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                />
              </div>
            </div>
          </motion.section>

          {/* XP, Level & Achievements */}
          <motion.section variants={itemV} className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold font-['Outfit'] text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>XP & Achievements</span>
              </h2>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                History
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="progress-ring w-full h-full -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="6" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="none"
                    stroke="url(#dash-xp-grad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 32}
                    strokeDashoffset={2 * Math.PI * 32 * (1 - xpProgress / 100)}
                  />
                  <defs>
                    <linearGradient id="dash-xp-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-mono font-bold text-white">Lv {xp.level}</span>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{xp.level_title}</p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
                  {nextLevel
                    ? `${xpRemaining.toLocaleString()} XP to ${nextLevel.title}`
                    : 'Highest rank unlocked'}
                </p>
              </div>
            </div>

            {derivedAchievements.length > 0 && (
              <div className="pt-3 border-t border-white/[0.08] flex flex-wrap gap-2">
                {derivedAchievements.map((ach) => (
                  <span
                    key={ach.label}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium ${ach.tone}`}
                  >
                    {ach.label}
                  </span>
                ))}
              </div>
            )}
          </motion.section>

          {/* AI Study Companion Quick Access */}
          <motion.section
            variants={itemV}
            className="rounded-2xl p-5 bg-gradient-to-br from-indigo-950/75 via-[#0f1628] to-[#0f1628] border border-indigo-400/25 space-y-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-cyan-300">
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold font-['Outfit'] text-white">
                    AI Study Companion
                  </h2>
                  <p className="text-[11px] text-slate-400">Explain · Hint · Quiz · Plan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/ai-companion')}
                className="text-xs font-medium text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1"
              >
                <span>Open</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { label: "Explain Newton's 2nd Law simply", mode: 'explain', subject: 'Physics', tag: 'Explain' },
                { label: 'Guide me through 2x² - 7x + 3 = 0', mode: 'hint', subject: 'Mathematics', tag: 'Hint' },
                { label: 'Atomic Structure & Periodic Trends', mode: 'quiz', subject: 'Chemistry', tag: 'Quiz' },
                { label: 'Create my weekly study plan', mode: 'study-plan', subject: 'All Subjects', tag: 'Plan' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() =>
                    navigate('/ai-companion', {
                      state: {
                        mode: item.mode,
                        subject: item.subject,
                        prompt: item.label,
                        timestamp: Date.now(),
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0f1d]/80 hover:bg-indigo-500/15 border border-white/[0.08] hover:border-indigo-400/35 text-xs text-slate-200 flex items-center justify-between gap-2 transition-colors text-left"
                >
                  <span className="truncate">{item.label}</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono text-indigo-300">
                      {item.tag}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          </motion.section>
        </div>
      </div>

      {/* 4. Recent Announcements Band */}
      <motion.section variants={itemV} data-testid="bento-announcements" className="glass-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold font-['Outfit'] text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" aria-hidden="true" />
            <span>Recent Announcements</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">Click a notice to read full details</span>
        </div>

        {(data?.announcements || []).length === 0 ? (
          <div className="text-center py-6">
            <Bell className="w-7 h-7 text-slate-500 mx-auto mb-2 opacity-40" />
            <p className="text-slate-400 text-sm">No announcements</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {(data?.announcements || []).slice(0, 3).map((a, i) => {
              const isHigh = a.priority === 'HIGH';
              return (
                <button
                  key={a.id || i}
                  type="button"
                  onClick={() => setSelectedNotice(a)}
                  className="text-left p-4 rounded-xl bg-[#141c31]/75 hover:bg-[#19243f] border border-white/[0.07] hover:border-indigo-400/30 transition-colors flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[11px] font-mono ${
                          isHigh ? 'text-rose-400' : 'text-indigo-300'
                        }`}
                      >
                        {isHigh ? 'Urgent Notice' : 'Notice'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white truncate">{a.title}</p>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{a.content}</p>
                  </div>
                  <p className="text-[11px] text-slate-400">Posted by {a.author_name}</p>
                </button>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* Announcement Detail Modal */}
      <AnimatePresence>
        {selectedNotice && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotice(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto rounded-2xl bg-[#0f1628] border border-white/[0.12] p-6 shadow-2xl z-[90]"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className={`text-xs font-mono mb-1 ${selectedNotice.priority === 'HIGH' ? 'text-rose-400' : 'text-indigo-300'}`}>
                    {selectedNotice.priority === 'HIGH' ? 'Urgent Notice' : 'School Notice'}
                  </p>
                  <h3 className="text-lg font-semibold font-['Outfit'] text-white">
                    {selectedNotice.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNotice(null)}
                  aria-label="Close announcement"
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">{selectedNotice.content}</p>
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                <span>By {selectedNotice.author_name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedNotice(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-16 w-72 rounded-xl shimmer-bg" />
      <div className="h-28 rounded-2xl shimmer-bg" />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 space-y-5">
          <div className="h-56 rounded-2xl shimmer-bg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="h-64 rounded-2xl shimmer-bg" />
            <div className="h-64 rounded-2xl shimmer-bg" />
          </div>
        </div>
        <div className="xl:col-span-4 space-y-5">
          <div className="h-72 rounded-2xl shimmer-bg" />
          <div className="h-44 rounded-2xl shimmer-bg" />
        </div>
      </div>
    </div>
  );
}
