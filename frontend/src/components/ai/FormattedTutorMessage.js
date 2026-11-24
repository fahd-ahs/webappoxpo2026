import React from 'react';

function renderInline(text, keyPrefix = 'in') {
  if (!text) return null;
  const parts = [];
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;
  let idx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`${keyPrefix}-c-${idx++}`}
          className="px-1.5 py-0.5 rounded-md bg-[#080c17] border border-cyan-400/20 font-mono text-[12px] text-cyan-300"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`${keyPrefix}-b-${idx++}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`${keyPrefix}-i-${idx++}`} className="italic text-slate-200">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export default function FormattedTutorMessage({ content }) {
  if (!content) return null;

  // Split by fenced code/formula blocks first
  const segments = String(content).split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2.5 text-[13.5px] leading-relaxed text-slate-200">
      {segments.map((segment, segIdx) => {
        if (segment.startsWith('```') && segment.endsWith('```')) {
          const inner = segment.slice(3, -3).replace(/^[a-zA-Z0-9_-]+\n/, '');
          return (
            <pre
              key={`seg-${segIdx}`}
              className="p-3 rounded-xl bg-[#080c17] border border-cyan-400/20 overflow-x-auto font-mono text-xs text-cyan-200 leading-relaxed"
            >
              <code>{inner.trim()}</code>
            </pre>
          );
        }

        const lines = segment.split('\n');
        const blocks = [];
        let listBuffer = null;

        const flushList = () => {
          if (!listBuffer) return;
          if (listBuffer.type === 'ol') {
            blocks.push(
              <ol
                key={`ol-${segIdx}-${blocks.length}`}
                className="space-y-1.5 pl-4 list-decimal marker:text-indigo-400 marker:font-mono marker:text-xs"
              >
                {listBuffer.items.map((item, idx) => (
                  <li key={idx} className="pl-1 text-slate-200">
                    {renderInline(item, `ol-${segIdx}-${idx}`)}
                  </li>
                ))}
              </ol>
            );
          } else {
            blocks.push(
              <ul
                key={`ul-${segIdx}-${blocks.length}`}
                className="space-y-1.5 pl-4 list-disc marker:text-cyan-400"
              >
                {listBuffer.items.map((item, idx) => (
                  <li key={idx} className="pl-1 text-slate-200">
                    {renderInline(item, `ul-${segIdx}-${idx}`)}
                  </li>
                ))}
              </ul>
            );
          }
          listBuffer = null;
        };

        lines.forEach((rawLine, lineIdx) => {
          const line = rawLine.trimEnd();
          const trimmed = line.trim();

          if (!trimmed) {
            flushList();
            return;
          }

          if (/^---+$/.test(trimmed)) {
            flushList();
            blocks.push(
              <hr key={`hr-${segIdx}-${lineIdx}`} className="border-white/[0.08] my-2" />
            );
            return;
          }

          const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
          if (headingMatch) {
            flushList();
            const level = headingMatch[1].length;
            const headingText = headingMatch[2];
            blocks.push(
              <h4
                key={`h-${segIdx}-${lineIdx}`}
                className={`font-['Outfit'] font-semibold tracking-tight text-white ${
                  level <= 2 ? 'text-[15px] pt-1 text-cyan-200' : 'text-[13.5px] text-indigo-200'
                }`}
              >
                {renderInline(headingText, `h-${segIdx}-${lineIdx}`)}
              </h4>
            );
            return;
          }

          const olMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
          if (olMatch) {
            if (!listBuffer || listBuffer.type !== 'ol') {
              flushList();
              listBuffer = { type: 'ol', items: [] };
            }
            listBuffer.items.push(olMatch[1]);
            return;
          }

          const ulMatch = trimmed.match(/^[-*•]\s+(.+)$/);
          if (ulMatch) {
            if (!listBuffer || listBuffer.type !== 'ul') {
              flushList();
              listBuffer = { type: 'ul', items: [] };
            }
            listBuffer.items.push(ulMatch[1]);
            return;
          }

          if (trimmed.startsWith('>')) {
            flushList();
            blocks.push(
              <blockquote
                key={`bq-${segIdx}-${lineIdx}`}
                className="border-l-2 border-indigo-400/60 pl-3 py-1 bg-indigo-500/5 rounded-r-lg text-slate-300 text-[13px]"
              >
                {renderInline(trimmed.slice(1).trim(), `bq-${segIdx}-${lineIdx}`)}
              </blockquote>
            );
            return;
          }

          flushList();
          blocks.push(
            <p key={`p-${segIdx}-${lineIdx}`} className="text-slate-200">
              {renderInline(trimmed, `p-${segIdx}-${lineIdx}`)}
            </p>
          );
        });

        flushList();
        return <React.Fragment key={`seg-${segIdx}`}>{blocks}</React.Fragment>;
      })}
    </div>
  );
}
