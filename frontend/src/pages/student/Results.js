import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#8b5cf6'];

export default function Results() {
  const [analytics, setAnalytics] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [resResults, resAnalytics] = await Promise.all([
          api.get('/results'),
          api.get('/results/analytics'),
        ]);
        setResults(resResults.data);
        setAnalytics(resAnalytics.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="glass-card h-48 shimmer-bg rounded-xl" />)}</div>;
  }

  const summary = analytics?.summary || {};
  const trend = analytics?.trend || [];
  const subjectPerf = analytics?.subject_performance || [];

  const radarData = subjectPerf.map(s => ({ subject: s.subject.replace('Computer ', 'CS').substring(0, 8), score: s.average, fullMark: 100 }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="glass-card p-3 text-xs">
          <p className="font-medium text-white/80">{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }} className="font-mono">{p.value}%</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      data-testid="results-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold font-['Outfit'] tracking-tight">Results & Analytics</h1>
        <p className="text-white/40 text-sm mt-1">Your academic performance overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={<Award />} label="Best Subject" value={summary.best_subject || '-'} color="emerald" />
        <SummaryCard icon={<AlertCircle />} label="Needs Work" value={summary.weakest_subject || '-'} color="amber" />
        <SummaryCard icon={<TrendingUp />} label="Highest Score" value={`${summary.highest_score || 0}%`} color="indigo" />
        <SummaryCard icon={<BarChart3 />} label="Overall Avg" value={`${summary.overall_average || 0}%`} color="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Trend Line Chart */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Score Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="exam" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6, fill: '#818cf8' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Radar */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" /> Subject Performance
          </h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-white/30 text-sm">No data</div>
          )}
        </div>

        {/* Subject Bar Chart */}
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="font-semibold text-sm mb-4">Subject-wise Average</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={subjectPerf}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="average" radius={[6, 6, 0, 0]}>
                {subjectPerf.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Results Table */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-sm mb-4 text-white">All Results</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-mono text-slate-400 border-b border-white/[0.08]">
                <th className="pb-3 font-medium pr-4">Exam</th>
                <th className="pb-3 font-medium pr-4">Subject</th>
                <th className="pb-3 font-medium pr-4">Score</th>
                <th className="pb-3 font-medium pr-4">Grade</th>
                <th className="pb-3 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {results.slice(0, 15).map((r, i) => (
                <tr key={r.id || i} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 pr-4 font-medium text-white whitespace-nowrap">{r.exam_name}</td>
                  <td className="py-3 pr-4 text-slate-300 whitespace-nowrap">{r.subject_name}</td>
                  <td className="py-3 pr-4 font-mono tabular-nums whitespace-nowrap">
                    <span className={r.percentage >= 80 ? 'text-emerald-400' : r.percentage >= 60 ? 'text-amber-400' : 'text-rose-400'}>
                      {r.marks_obtained}/{r.total_marks}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono font-semibold whitespace-nowrap">
                    <span className={
                      r.grade?.startsWith('A') ? 'text-emerald-400' :
                      r.grade === 'B+' || r.grade === 'B' ? 'text-amber-400' :
                      'text-rose-400'
                    }>{r.grade}</span>
                  </td>
                  <td className="py-3 text-slate-400 font-mono tabular-nums text-xs text-right whitespace-nowrap">{r.exam_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function SummaryCard({ icon, label, value, color }) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  };
  return (
    <div className={`glass-card p-4 border ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-4 h-4">{icon}</span>
        <span className="text-xs text-white/40">{label}</span>
      </div>
      <p className="text-lg font-bold font-mono">{value}</p>
    </div>
  );
}
