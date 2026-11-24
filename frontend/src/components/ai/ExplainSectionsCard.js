import { BookOpen, ListOrdered, Lightbulb, Terminal, Sparkles } from 'lucide-react';
import FormattedTutorMessage from './FormattedTutorMessage';

const SECTION_STYLES = {
  'concept overview': {
    icon: BookOpen,
    accent: 'text-indigo-300',
    bg: 'bg-[#0a1020] border-white/[0.08]',
  },
  'step-by-step explanation': {
    icon: ListOrdered,
    accent: 'text-cyan-300',
    bg: 'bg-[#0a1020] border-white/[0.08]',
  },
  'worked example': {
    icon: Lightbulb,
    accent: 'text-amber-300',
    bg: 'bg-amber-500/[0.04] border-amber-400/20',
  },
  'important formulas': {
    icon: Terminal,
    accent: 'text-cyan-300',
    bg: 'bg-[#070b15] border-cyan-400/25',
  },
  'key takeaway': {
    icon: Sparkles,
    accent: 'text-emerald-300',
    bg: 'bg-emerald-500/[0.06] border-emerald-400/25',
  },
};

function parseExplainSections(content) {
  if (!content || typeof content !== 'string') return null;
  const lines = content.split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    const match = line.trim().match(/^##\s+(.+)$/);
    if (match) {
      if (current) sections.push(current);
      current = { title: match[1].trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) sections.push(current);

  if (sections.length < 2) return null;
  return sections.map((s) => ({
    title: s.title,
    body: s.body.join('\n').trim(),
  }));
}

export default function ExplainSectionsCard({ content }) {
  const sections = parseExplainSections(content);

  if (!sections) {
    return <FormattedTutorMessage content={content} />;
  }

  return (
    <div className="space-y-3" data-testid="ai-explain-sections">
      {sections.map((sec, idx) => {
        const key = sec.title.toLowerCase();
        const cfg = SECTION_STYLES[key] || {
          icon: BookOpen,
          accent: 'text-indigo-300',
          bg: 'bg-[#0a1020] border-white/[0.08]',
        };
        const Icon = cfg.icon;

        return (
          <div
            key={`${sec.title}-${idx}`}
            className={`rounded-xl border p-3.5 sm:p-4 space-y-2 ${cfg.bg}`}
          >
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 shrink-0 ${cfg.accent}`} aria-hidden="true" />
              <h4 className={`text-xs sm:text-sm font-semibold font-['Outfit'] tracking-tight ${cfg.accent}`}>
                {sec.title}
              </h4>
            </div>
            <FormattedTutorMessage content={sec.body} />
          </div>
        );
      })}
    </div>
  );
}
