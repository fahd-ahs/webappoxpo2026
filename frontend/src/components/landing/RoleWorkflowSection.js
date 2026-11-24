import { GraduationCap, PenTool, Check, ArrowRight } from 'lucide-react';

const STUDENT_BENEFITS = [
  'See today’s classes, due dates, and daily study goals in one view',
  'Earn XP and build streaks from assignments, todos, and timed DPPs',
  'Listen to Studycast subject episodes with saved listening progress',
  'Download GST fee invoices as PDFs and collaborate in subject chat rooms',
];

const TEACHER_BENEFITS = [
  'Publish new assignments with custom marks, due dates, and XP rewards',
  'Review student submissions and return marks with written feedback',
  'Mark daily class attendance for the entire roster in seconds',
  'Monitor class subject averages and top XP performers from one dashboard',
];

export default function RoleWorkflowSection({ onDemoSelect }) {
  return (
    <section id="workflow" className="py-20 lg:py-28 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-mono tracking-wider text-[#818cf8] mb-3">
            Role-Aware Workspace
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold font-['Outfit'] tracking-tight text-white [text-wrap:balance]">
            Designed for how students study and how teachers guide them
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Column */}
          <div className="bg-[#111318] border border-white/[0.08] rounded-xl p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-9 h-9 rounded-lg bg-[#6366f1]/15 border border-[#6366f1]/25 flex items-center justify-center text-[#818cf8]">
                  <GraduationCap className="w-4 h-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold font-['Outfit'] text-white">For Students</h3>
                  <p className="text-xs text-white/45">Stay organized and track real progress</p>
                </div>
              </div>
              <ul className="space-y-3.5">
                {STUDENT_BENEFITS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/70 leading-relaxed">
                    <Check className="w-4 h-4 text-[#22d3ee] mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {onDemoSelect && (
              <div className="pt-4 border-t border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => onDemoSelect('student')}
                  className="inline-flex items-center gap-2 text-xs font-medium text-[#818cf8] hover:text-white transition-colors"
                >
                  <span>Load Student Demo Credentials</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {/* Teacher Column */}
          <div className="bg-[#111318] border border-white/[0.08] rounded-xl p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-9 h-9 rounded-lg bg-[#22d3ee]/15 border border-[#22d3ee]/25 flex items-center justify-center text-[#22d3ee]">
                  <PenTool className="w-4 h-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold font-['Outfit'] text-white">For Teachers</h3>
                  <p className="text-xs text-white/45">Manage coursework and attendance effortlessly</p>
                </div>
              </div>
              <ul className="space-y-3.5">
                {TEACHER_BENEFITS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/70 leading-relaxed">
                    <Check className="w-4 h-4 text-[#818cf8] mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {onDemoSelect && (
              <div className="pt-4 border-t border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => onDemoSelect('teacher')}
                  className="inline-flex items-center gap-2 text-xs font-medium text-[#22d3ee] hover:text-white transition-colors"
                >
                  <span>Load Teacher Demo Credentials</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
