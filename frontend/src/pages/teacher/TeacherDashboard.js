import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { motion } from 'framer-motion';
import {
  Users, BookOpen, BarChart3, Trophy, Clock, AlertCircle, ArrowUpRight, ClipboardCheck
} from 'lucide-react';

const containerVariants = { animate: { transition: { staggerChildren: 0.06 } } };
const cardVariants = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: d } = await api.get('/dashboard/teacher');
        setData(d);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="glass-card h-32 shimmer-bg rounded-xl" />)}</div>;
  }

  return (
    <motion.div
      data-testid="teacher-dashboard"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={cardVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] tracking-tight text-white">
            Teacher Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Overview of Class 11-A performance, grading, and attendance</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/teacher/attendance')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0f1628] hover:bg-[#161f36] border border-white/[0.1] text-xs sm:text-sm font-medium text-slate-100 transition-colors"
          >
            <ClipboardCheck className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>Mark Attendance</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/teacher/assignments')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs sm:text-sm font-medium text-white transition-colors"
          >
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            <span>Manage Assignments</span>
          </button>
        </div>
      </motion.div>

      {/* Overview Strip */}
      <motion.div
        variants={cardVariants}
        className="rounded-2xl bg-[#0f1628] border border-white/[0.09] grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] overflow-hidden"
      >
        <button
          type="button"
          onClick={() => navigate('/teacher/attendance')}
          className="p-5 text-left hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Users className="w-4 h-4 text-indigo-400" aria-hidden="true" />
            <span>Total Students</span>
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-white">{data?.total_students || 0}</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/teacher/assignments')}
          className="p-5 text-left hover:bg-white/[0.03] transition-colors border-l lg:border-l-0 border-white/[0.08]"
        >
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span>Pending Grading</span>
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-300">{data?.pending_grading || 0}</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/teacher/assignments')}
          className="p-5 text-left hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <BookOpen className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>Assignments</span>
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-white">{data?.recent_assignments?.length || 0}</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/leaderboard')}
          className="p-5 text-left hover:bg-white/[0.03] transition-colors border-l lg:border-l-0 border-white/[0.08]"
        >
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Trophy className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span>Top Performers</span>
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-white">{data?.top_students?.length || 0}</p>
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Averages */}
        <motion.div variants={cardVariants} className="glass-card p-5 sm:p-6">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-white">
            <BarChart3 className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>Class Averages by Subject</span>
          </h3>
          {(data?.class_averages || []).length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No exam data recorded yet</p>
          ) : (
            <div className="space-y-3.5">
              {(data?.class_averages || []).map((ca, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-slate-300 w-32 truncate">{ca.subject}</span>
                  <div className="flex-1 h-2 bg-[#1e2944] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${ca.average}%`,
                        background: ca.average >= 80 ? '#10b981' : ca.average >= 60 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <span className="text-sm font-mono tabular-nums text-slate-300 w-12 text-right">{ca.average}%</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Top Students */}
        <motion.div variants={cardVariants} className="glass-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-white">
              <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>Top Students by XP</span>
            </h3>
            <button
              type="button"
              onClick={() => navigate('/leaderboard')}
              className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Leaderboard</span>
              <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>
          {(data?.top_students || []).length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No students yet</p>
          ) : (
            <div className="space-y-2.5">
              {(data?.top_students || []).map((s, i) => (
                <div key={s.id || i} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#141c31]/75 border border-white/[0.05]">
                  <span className="text-xs font-bold font-mono text-slate-400 w-6">#{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/35 to-cyan-400/35 flex items-center justify-center text-xs font-bold text-white">
                    {s.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.class_name}</p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-indigo-300">{s.total_xp} XP</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Assignments */}
        <motion.div variants={cardVariants} className="glass-card p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-white">
              <BookOpen className="w-4 h-4 text-indigo-400" aria-hidden="true" />
              <span>Recent Assignments</span>
            </h3>
            <button
              type="button"
              onClick={() => navigate('/teacher/assignments')}
              className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Open Manager</span>
              <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>
          <div className="space-y-2">
            {(data?.recent_assignments || []).map((a, i) => (
              <button
                key={a.id || i}
                type="button"
                onClick={() => navigate('/teacher/assignments')}
                className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-[#141c31]/75 hover:bg-[#19243f] border border-white/[0.05] transition-colors"
              >
                <div className="w-1 h-8 rounded-full shrink-0" style={{ background: a.subject_color || '#6366f1' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{a.title}</p>
                  <p className="text-xs text-slate-400">{a.subject_name}</p>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-400 flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {new Date(a.due_date).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
