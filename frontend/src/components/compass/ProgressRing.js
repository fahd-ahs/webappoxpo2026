import { motion } from 'framer-motion';

export default function ProgressRing({
  value = 0,
  size = 88,
  strokeWidth = 7,
  color = '#6366f1',
  trackColor = 'rgba(148, 163, 184, 0.14)',
  label = null,
  sublabel = null,
}) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="font-mono font-bold tabular-nums text-white leading-none text-sm sm:text-base">
          {label !== null ? label : `${clamped}%`}
        </span>
        {sublabel && (
          <span className="text-[10px] font-mono text-slate-400 mt-1 leading-none">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
