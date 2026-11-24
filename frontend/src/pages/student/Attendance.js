import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { motion } from 'framer-motion';
import { ClipboardCheck, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';

export default function Attendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: d } = await api.get('/attendance');
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
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="glass-card h-32 shimmer-bg rounded-xl" />)}</div>;
  }

  const percentage = data?.percentage || 0;
  const total = data?.total || 0;
  const present = data?.present || 0;
  const absent = total - present;
  const records = data?.records || [];

  const gaugeColor = percentage >= 75 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 85;
  const offset = circumference - (percentage / 100) * circumference;

  // Calendar data
  const monthDays = {};
  records.forEach(r => {
    const date = r.date;
    monthDays[date] = r.is_present;
  });

  // Get current month's dates
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  return (
    <motion.div
      data-testid="attendance-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold font-['Outfit'] tracking-tight">Attendance</h1>
        <p className="text-white/40 text-sm mt-1">Track your attendance record</p>
      </div>

      {percentage < 75 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">Your attendance is below 75%. Minimum attendance is required for exam eligibility.</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circular Gauge */}
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <div className="relative w-48 h-48">
            <svg className="transform -rotate-90 w-48 h-48" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
              <circle
                cx="100" cy="100" r="85" fill="none"
                stroke={gaugeColor} strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold font-mono" style={{ color: gaugeColor }}>{percentage}%</span>
              <span className="text-xs text-white/40 mt-1">Attendance</span>
            </div>
          </div>
          <div className="flex gap-6 mt-4 text-center">
            <div>
              <p className="text-lg font-bold font-mono text-emerald-400">{present}</p>
              <p className="text-xs text-white/40">Present</p>
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-red-400">{absent}</p>
              <p className="text-xs text-white/40">Absent</p>
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-white/60">{total}</p>
              <p className="text-xs text-white/40">Total</p>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-cyan-400" />
            {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs text-white/30 py-2 font-mono">{d}</div>
            ))}
            {/* Empty cells for first day offset */}
            {[...Array(firstDay)].map((_, i) => (
              <div key={`empty-${i}`} className="h-10" />
            ))}
            {/* Days */}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const status = monthDays[dateStr];
              const isToday = day === now.getDate();

              return (
                <div
                  key={day}
                  className={`h-10 rounded-lg flex items-center justify-center text-xs font-mono relative transition-colors ${
                    status === true ? 'bg-emerald-500/20 text-emerald-400' :
                    status === false ? 'bg-red-500/20 text-red-400' :
                    'bg-white/[0.02] text-white/30'
                  } ${isToday ? 'ring-1 ring-indigo-500' : ''}`}
                >
                  {day}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-white/40">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/30" /> Present</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/30" /> Absent</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white/[0.06]" /> No record</span>
          </div>
        </div>
      </div>

      {/* Absent Days List */}
      {records.filter(r => !r.is_present).length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-semibold text-sm mb-3">Absent Days</h3>
          <div className="space-y-2">
            {records.filter(r => !r.is_present).slice(0, 10).map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-red-500/5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm font-mono text-white/60">{new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
