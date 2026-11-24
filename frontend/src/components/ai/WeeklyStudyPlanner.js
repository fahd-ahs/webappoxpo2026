import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import FormattedTutorMessage from './FormattedTutorMessage';

const SUBJECT_COLORS = {
  Mathematics: '#6366f1',
  Physics: '#22d3ee',
  Chemistry: '#10b981',
  English: '#f59e0b',
  'Computer Science': '#8b5cf6',
  'All Subjects': '#818cf8',
};

export default function WeeklyStudyPlanner({ plan, fallbackMarkdown, compact = false }) {
  if (!plan || !Array.isArray(plan.days) || plan.days.length === 0) {
    return <FormattedTutorMessage content={fallbackMarkdown} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      data-testid="ai-weekly-planner"
      className="space-y-4"
    >
      {/* Planner Header */}
      <div className="rounded-xl bg-[#0a1020] border border-emerald-400/25 p-4 space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
          <span>7-Day Weekly Study Planner</span>
        </div>
        <h4 className="text-base font-bold font-['Outfit'] text-white">
          {plan.title || 'Personalized Weekly Study Plan'}
        </h4>
        {plan.summary && (
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{plan.summary}</p>
        )}
      </div>

      {/* Day-by-Day Grid */}
      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {plan.days.map((dayItem, idx) => {
          const focusColor = SUBJECT_COLORS[dayItem.focus_subject] || '#6366f1';

          return (
            <motion.div
              key={`${dayItem.day}-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="rounded-xl bg-[#0a1020] border border-white/[0.08] hover:border-white/[0.16] p-4 flex flex-col justify-between gap-3 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.07]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: focusColor }}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-bold font-['Outfit'] text-white">
                      {dayItem.day}
                    </span>
                    <span className="text-xs text-slate-400 truncate">
                      · {dayItem.focus_subject}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums text-cyan-300 shrink-0">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {dayItem.total_duration}
                  </span>
                </div>

                {/* Time Blocks */}
                <div className="mt-3 space-y-2">
                  {(dayItem.blocks || []).map((blk, bIdx) => {
                    const blkColor = SUBJECT_COLORS[blk.subject] || focusColor;
                    return (
                      <div
                        key={bIdx}
                        className="p-2.5 rounded-lg bg-[#11192f]/80 border border-white/[0.06] flex items-start gap-2.5"
                      >
                        <span
                          className="w-1 self-stretch rounded-full shrink-0"
                          style={{ backgroundColor: blkColor }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-slate-400">
                            <span>{blk.time_slot}</span>
                            <span className="text-slate-300">{blk.duration}</span>
                          </div>
                          <p className="text-xs sm:text-[13px] font-medium text-white mt-0.5 leading-snug">
                            {blk.topic}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {blk.subject} · {blk.activity_type}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Daily Priority */}
              {dayItem.priority && (
                <div className="pt-2.5 border-t border-white/[0.07] flex items-start gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="leading-snug">{dayItem.priority}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
