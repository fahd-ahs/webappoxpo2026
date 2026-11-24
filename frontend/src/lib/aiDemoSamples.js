const EXPLAIN_SAMPLES = [
  {
    keywords: ['newton', 'force', 'motion', 'acceleration', 'f=ma', 'physics'],
    subject: 'Physics',
    response: [
      '## Concept Overview',
      "Newton's Second Law explains how the net force acting on an object changes its motion: heavier objects resist acceleration more, while stronger net forces produce greater acceleration in the force's direction.",
      '## Step-by-Step Explanation',
      '1. Identify every external force acting on the object (gravity, normal force, applied push, friction) and find the net unbalanced force `F_net`.',
      '2. Divide the net force by the object mass `m` to determine acceleration `a`.',
      '3. Acceleration always points in the exact same direction as `F_net`.',
      '## Worked Example',
      'A `4 kg` wooden block is pushed horizontally with `18 N` while experiencing `6 N` of kinetic friction.\n1. Net force: `F_net = 18 N - 6 N = 12 N`\n2. Acceleration: `a = F_net / m = 12 / 4 = 3 m/s²` in the direction of the push.',
      '## Important Formulas',
      '```text\nF_net = m × a\na = F_net / m\n1 Newton (N) = 1 kg·m/s²\n```',
      '## Key Takeaway',
      'Always resolve opposing forces into a single net force first before calculating acceleration with `F_net = ma`.',
    ].join('\n\n'),
  },
  {
    keywords: ['trig', 'sin', 'cos', 'tan', 'identit', 'math', 'quadratic'],
    subject: 'Mathematics',
    response: [
      '## Concept Overview',
      'Trigonometric identities are equations linking sine, cosine, and tangent that remain true for every valid angle, letting you simplify complex expressions cleanly.',
      '## Step-by-Step Explanation',
      '1. Picture any angle `θ` on the unit circle (`radius = 1`) with coordinates `(cos θ, sin θ)`.',
      '2. By the Pythagorean Theorem on that right triangle, `x² + y² = 1²`, giving the foundational Pythagorean identity.',
      '3. Divide that single equation by `cos²θ` or `sin²θ` to derive the tangent and cotangent forms without memorizing from scratch.',
      '## Worked Example',
      'Simplify `(1 - cos²θ) / sin θ` for `sin θ ≠ 0`:\n1. Substitute `1 - cos²θ = sin²θ`.\n2. Cancel one `sin θ`: `sin²θ / sin θ = sin θ`.',
      '## Important Formulas',
      '```text\nsin²θ + cos²θ = 1\n1 + tan²θ = sec²θ\ntan θ = sin θ / cos θ\n```',
      '## Key Takeaway',
      'Convert unfamiliar trig terms into `sin θ` and `cos θ` first—most Class 11 proofs collapse immediately afterward.',
    ].join('\n\n'),
  },
  {
    keywords: ['atom', 'orbital', 'quantum', 'electron', 'bond', 'chem', 'aufbau'],
    subject: 'Chemistry',
    response: [
      '## Concept Overview',
      'Quantum numbers act like an address system describing the energy level, orbital shape, spatial orientation, and spin of every electron inside an atom.',
      '## Step-by-Step Explanation',
      '1. Principal quantum number `n` sets the main energy shell (`1, 2, 3...`).',
      '2. Azimuthal quantum number `l` (`0` to `n - 1`) sets the subshell shape (`s, p, d, f`).',
      '3. Magnetic quantum number `m_l` (`-l` to `+l`) gives orbital orientation, while spin `m_s` (`+½` or `-½`) distinguishes two electrons sharing one orbital.',
      '## Worked Example',
      'How many electrons can occupy the `n = 3` shell?\n1. Use `2n² = 2 × 3² = 18` electrons.\n2. Subshells present: `3s` (2) + `3p` (6) + `3d` (10) = `18` total electrons.',
      '## Important Formulas',
      '```text\nMax electrons in shell n = 2n²\nl values = 0, 1, ..., (n - 1)\nOrbitals per subshell = 2l + 1\n```',
      '## Key Takeaway',
      'No two electrons in the same atom can share all four quantum numbers (Pauli Exclusion Principle).',
    ].join('\n\n'),
  },
];

const HINT_SEQUENCES = [
  {
    keywords: ['2x', '7x', 'quadratic', 'solve', 'prove', 'trig', 'math', 'vertex'],
    hints: [
      '**Step 1 Clue — Identify Coefficients & Strategy**\nNotice this is a standard quadratic `ax² + bx + c = 0` with `a = 2`, `b = -7`, and `c = 3`. Before using the full formula, check whether two integers multiply to `a × c = 6` and add up to `b = -7`. Which two integers work?',
      '**Step 2 Clue — Split the Middle Term**\nSince `(-6) × (-1) = 6` and `(-6) + (-1) = -7`, rewrite `-7x` as `-6x - x`:\n`2x² - 6x - x + 3 = 0`.\nNow group the first two terms and last two terms and factor out their common factors.',
      '**Step 3 Clue — Final Factoring Bridge**\nGrouping gives `2x(x - 3) - 1(x - 3) = 0`, which factors cleanly into `(2x - 1)(x - 3) = 0`. Set each factor equal to `0` to read off both roots!',
    ],
    walkthrough: [
      '## Concept Overview\nSolving `2x² - 7x + 3 = 0` by splitting the middle term.',
      '## Step-by-Step Explanation\n1. Compute `a × c = 2 × 3 = 6`.\n2. Choose `-6` and `-1` because `(-6) + (-1) = -7`.\n3. Factor by grouping: `2x(x - 3) - 1(x - 3) = (2x - 1)(x - 3) = 0`.',
      '## Key Takeaway\nThe two solutions are `x = 1/2` and `x = 3`.',
    ].join('\n\n'),
  },
  {
    keywords: ['block', 'kg', 'friction', 'accelerat', 'velocity', 'incline', 'physics', 'force'],
    hints: [
      '**Step 1 Clue — Draw Forces First**\nA `4 kg` block accelerating at `3 m/s²` requires a specific *net* force. Start by calculating `F_net = m × a` before accounting for the `2 N` opposing friction.',
      '**Step 2 Clue — Relate Applied Force & Friction**\nRemember `F_net = F_applied - F_friction`. You now know `F_net = 12 N` and `F_friction = 2 N`. Rearrange to isolate `F_applied`.',
      '**Step 3 Clue — Final Check**\nCheck units and direction: `F_applied = F_net + F_friction`. What value in Newtons (`N`) balances out both acceleration and friction?',
    ],
    walkthrough: [
      '## Concept Overview\nFinding applied force when acceleration and kinetic friction are known.',
      '## Step-by-Step Explanation\n1. `F_net = m × a = 4 kg × 3 m/s² = 12 N`.\n2. `F_applied = F_net + F_friction = 12 N + 2 N = 14 N`.',
      '## Key Takeaway\nThe applied push must be `14 N` to overcome `2 N` friction and still accelerate at `3 m/s²`.',
    ].join('\n\n'),
  },
];

const DEMO_QUIZZES = {
  Mathematics: {
    title: 'Trigonometry & Quadratics Practice (Demo)',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities & Equations',
    difficulty: 'medium',
    questions: [
      {
        id: 'demo-m1',
        question: 'Which expression is always equivalent to 1 - cos²θ?',
        options: [
          { key: 'A', text: 'sin²θ' },
          { key: 'B', text: 'tan²θ' },
          { key: 'C', text: 'sec²θ' },
          { key: 'D', text: '2 sin θ' },
        ],
        correct_key: 'A',
        explanation: 'From sin²θ + cos²θ = 1, subtracting cos²θ from both sides gives sin²θ.',
      },
      {
        id: 'demo-m2',
        question: 'For 2x² - 7x + 3 = 0, what is the sum of its roots?',
        options: [
          { key: 'A', text: '-7/2' },
          { key: 'B', text: '7/2' },
          { key: 'C', text: '3/2' },
          { key: 'D', text: '7' },
        ],
        correct_key: 'B',
        explanation: 'By Vieta’s formulas, sum of roots = -b/a = -(-7)/2 = 7/2.',
      },
      {
        id: 'demo-m3',
        question: 'What is the exact value of tan(45°) + cos(60°)?',
        options: [
          { key: 'A', text: '1.0' },
          { key: 'B', text: '1.5' },
          { key: 'C', text: '2.0' },
          { key: 'D', text: '0.5' },
        ],
        correct_key: 'B',
        explanation: 'tan(45°) = 1 and cos(60°) = 0.5, so their sum is 1.5.',
      },
      {
        id: 'demo-m4',
        question: 'If the discriminant b² - 4ac < 0, the quadratic equation has:',
        options: [
          { key: 'A', text: 'Two distinct real roots' },
          { key: 'B', text: 'One repeated real root' },
          { key: 'C', text: 'No real roots (complex conjugates)' },
          { key: 'D', text: 'Infinitely many roots' },
        ],
        correct_key: 'C',
        explanation: 'A negative discriminant puts a negative number inside the square root, yielding complex roots.',
      },
    ],
  },
  Physics: {
    title: 'Kinematics & Laws of Motion Practice (Demo)',
    subject: 'Physics',
    topic: 'Motion & Forces',
    difficulty: 'medium',
    questions: [
      {
        id: 'demo-p1',
        question: 'The slope of a velocity-time graph represents:',
        options: [
          { key: 'A', text: 'Displacement' },
          { key: 'B', text: 'Acceleration' },
          { key: 'C', text: 'Momentum' },
          { key: 'D', text: 'Work done' },
        ],
        correct_key: 'B',
        explanation: 'Slope = Δv / Δt, which is the definition of acceleration.',
      },
      {
        id: 'demo-p2',
        question: 'A 5 kg object experiences a net force of 20 N. What is its acceleration?',
        options: [
          { key: 'A', text: '0.25 m/s²' },
          { key: 'B', text: '4 m/s²' },
          { key: 'C', text: '15 m/s²' },
          { key: 'D', text: '100 m/s²' },
        ],
        correct_key: 'B',
        explanation: 'Using a = F_net / m = 20 N / 5 kg = 4 m/s².',
      },
      {
        id: 'demo-p3',
        question: 'At what launch angle (neglecting air resistance) is horizontal projectile range maximized?',
        options: [
          { key: 'A', text: '30°' },
          { key: 'B', text: '45°' },
          { key: 'C', text: '60°' },
          { key: 'D', text: '90°' },
        ],
        correct_key: 'B',
        explanation: 'Range R = u² sin(2θ)/g reaches its peak when sin(2θ) = 1, i.e., θ = 45°.',
      },
      {
        id: 'demo-p4',
        question: 'A car starts from rest with uniform acceleration 2 m/s². Distance covered in 4 s is:',
        options: [
          { key: 'A', text: '8 m' },
          { key: 'B', text: '12 m' },
          { key: 'C', text: '16 m' },
          { key: 'D', text: '32 m' },
        ],
        correct_key: 'C',
        explanation: 'Using s = ut + ½at² = 0 + ½(2)(4²) = 16 m.',
      },
    ],
  },
  Chemistry: {
    title: 'Atomic Structure & Bonding Practice (Demo)',
    subject: 'Chemistry',
    topic: 'Quantum Numbers & Orbitals',
    difficulty: 'medium',
    questions: [
      {
        id: 'demo-c1',
        question: 'What is the maximum number of electrons in the n = 3 shell?',
        options: [
          { key: 'A', text: '8' },
          { key: 'B', text: '18' },
          { key: 'C', text: '32' },
          { key: 'D', text: '10' },
        ],
        correct_key: 'B',
        explanation: 'Maximum shell capacity is 2n² = 2(3²) = 18 electrons.',
      },
      {
        id: 'demo-c2',
        question: 'Which quantum number determines the 3D shape of an atomic orbital?',
        options: [
          { key: 'A', text: 'Principal (n)' },
          { key: 'B', text: 'Azimuthal (l)' },
          { key: 'C', text: 'Magnetic (m_l)' },
          { key: 'D', text: 'Spin (m_s)' },
        ],
        correct_key: 'B',
        explanation: 'The azimuthal quantum number l (0=s, 1=p, 2=d, 3=f) defines orbital shape.',
      },
      {
        id: 'demo-c3',
        question: 'Which rule states that electrons fill lowest-energy orbitals first?',
        options: [
          { key: 'A', text: 'Hund’s Rule' },
          { key: 'B', text: 'Aufbau Principle' },
          { key: 'C', text: 'Pauli Exclusion Principle' },
          { key: 'D', text: 'Heisenberg Principle' },
        ],
        correct_key: 'B',
        explanation: 'Aufbau ("building up") principle orders orbitals from lowest to highest energy.',
      },
      {
        id: 'demo-c4',
        question: 'An ionic bond primarily forms through:',
        options: [
          { key: 'A', text: 'Equal sharing of electron pairs' },
          { key: 'B', text: 'Complete transfer of electrons between atoms' },
          { key: 'C', text: 'Delocalized sea of electrons' },
          { key: 'D', text: 'Weak dipole attractions' },
        ],
        correct_key: 'B',
        explanation: 'Ionic bonding occurs when a metal transfers valence electrons to a non-metal, creating electrostatic attraction.',
      },
    ],
  },
};

export function getDemoExplainResponse(prompt, subject = 'All Subjects') {
  const lower = `${prompt} ${subject}`.toLowerCase();
  const matched =
    EXPLAIN_SAMPLES.find((s) => s.keywords.some((k) => lower.includes(k))) ||
    EXPLAIN_SAMPLES[subject === 'Chemistry' ? 2 : subject === 'Mathematics' ? 1 : 0];
  return matched.response;
}

export function getDemoHintResponse(prompt, subject = 'All Subjects', hintStep = 1, revealWalkthrough = false) {
  const lower = `${prompt} ${subject}`.toLowerCase();
  const seq =
    HINT_SEQUENCES.find((s) => s.keywords.some((k) => lower.includes(k))) ||
    HINT_SEQUENCES[subject === 'Physics' ? 1 : 0];

  if (revealWalkthrough) {
    return seq.walkthrough;
  }
  const idx = Math.min(seq.hints.length - 1, Math.max(0, hintStep - 1));
  return seq.hints[idx];
}

export function getDemoQuiz(topic, subject = 'All Subjects', count = 4) {
  const key =
    subject === 'Physics' || /newton|kinematic|force|motion|energy/i.test(topic)
      ? 'Physics'
      : subject === 'Chemistry' || /atom|bond|quantum|mole|chem/i.test(topic)
        ? 'Chemistry'
        : 'Mathematics';

  const base = DEMO_QUIZZES[key];
  return {
    ...base,
    topic: topic || base.topic,
    title: topic ? `${topic} — Curated Demo Quiz` : base.title,
    questions: base.questions.slice(0, Math.min(base.questions.length, Math.max(2, count))),
  };
}

export function getDemoStudyPlan({ subject = 'All Subjects', dailyHours = 2 }) {
  const hrs = Number(dailyHours) || 2;
  const focusLabel = subject === 'All Subjects' ? 'Mathematics & Physics Priority' : `${subject} Focus`;
  const blockMins = Math.round((hrs * 60) / 2);

  return {
    title: `7-Day Academic Study Planner (${hrs}h/day · ${focusLabel})`,
    summary: `Curated sample schedule balancing upcoming deadlines, active chapters (Trigonometry, Laws of Motion, Chemical Bonding), and active recall quizzes within ${hrs} hours/day.`,
    days: [
      {
        day: 'Monday',
        focus_subject: subject === 'All Subjects' ? 'Mathematics' : subject,
        total_duration: `${hrs}h 00m`,
        priority: 'Complete Trigonometry Identities problem set',
        blocks: [
          {
            time_slot: `17:00 – ${17 + Math.floor(blockMins / 60)}:${String(blockMins % 60).padStart(2, '0')}`,
            subject: subject === 'All Subjects' ? 'Mathematics' : subject,
            topic: 'Trigonometric Ratios & Identities',
            duration: `${blockMins}m`,
            activity_type: 'Concept & Drills',
          },
          {
            time_slot: '18:30 – 19:30',
            subject: 'Physics',
            topic: "Newton's Second Law Numericals",
            duration: `${blockMins}m`,
            activity_type: 'Problem Solving',
          },
        ],
      },
      {
        day: 'Tuesday',
        focus_subject: subject === 'All Subjects' ? 'Physics' : subject,
        total_duration: `${hrs}h 00m`,
        priority: 'Draft Newton’s Laws lab report outline',
        blocks: [
          {
            time_slot: '17:00 – 18:00',
            subject: 'Physics',
            topic: 'Free-Body Diagrams & Friction',
            duration: `${blockMins}m`,
            activity_type: 'Lab Prep',
          },
          {
            time_slot: '18:30 – 19:30',
            subject: 'Chemistry',
            topic: 'Ionic vs. Covalent Bonding Notes',
            duration: `${blockMins}m`,
            activity_type: 'Active Notes',
          },
        ],
      },
      {
        day: 'Wednesday',
        focus_subject: 'Chemistry',
        total_duration: `${hrs}h 00m`,
        priority: 'Attempt Atomic Structure DPP Quiz',
        blocks: [
          {
            time_slot: '17:00 – 18:00',
            subject: 'Chemistry',
            topic: 'VSEPR Shapes & Hybridization',
            duration: `${blockMins}m`,
            activity_type: 'Concept Review',
          },
          {
            time_slot: '18:30 – 19:30',
            subject: 'Mathematics',
            topic: 'Sets & Relations DPP Recall',
            duration: `${blockMins}m`,
            activity_type: 'Timed Quiz',
          },
        ],
      },
      {
        day: 'Thursday',
        focus_subject: 'Computer Science',
        total_duration: `${hrs}h 00m`,
        priority: 'Practice algorithmic tracing & English essay review',
        blocks: [
          {
            time_slot: '17:00 – 18:00',
            subject: 'Computer Science',
            topic: 'Recursion & Complexity Basics',
            duration: `${blockMins}m`,
            activity_type: 'Code Practice',
          },
          {
            time_slot: '18:30 – 19:30',
            subject: 'English',
            topic: 'Analytical Writing Structure',
            duration: `${blockMins}m`,
            activity_type: 'Writing Drill',
          },
        ],
      },
      {
        day: 'Friday',
        focus_subject: 'Mathematics',
        total_duration: `${hrs}h 00m`,
        priority: 'Wrap up weekly assignments before weekend',
        blocks: [
          {
            time_slot: '17:00 – 18:00',
            subject: 'Mathematics',
            topic: 'Trigonometry Assignment Proofs',
            duration: `${blockMins}m`,
            activity_type: 'Assignment',
          },
          {
            time_slot: '18:30 – 19:30',
            subject: 'Physics',
            topic: 'Kinematics Equations Mixed Set',
            duration: `${blockMins}m`,
            activity_type: 'DPP Quiz',
          },
        ],
      },
      {
        day: 'Saturday',
        focus_subject: 'Physics',
        total_duration: `${hrs}h 00m`,
        priority: 'Full-chapter active recall & weak-spot cleanup',
        blocks: [
          {
            time_slot: '10:00 – 11:00',
            subject: 'Physics',
            topic: 'Kinematics + Laws of Motion Mock',
            duration: `${blockMins}m`,
            activity_type: 'Practice Test',
          },
          {
            time_slot: '11:30 – 12:30',
            subject: 'Chemistry',
            topic: 'Quantum Numbers Flash Review',
            duration: `${blockMins}m`,
            activity_type: 'Spaced Recall',
          },
        ],
      },
      {
        day: 'Sunday',
        focus_subject: 'All Subjects',
        total_duration: `${Math.max(1, Math.round(hrs * 0.75))}h 00m`,
        priority: 'Light consolidation & next-week goal setting',
        blocks: [
          {
            time_slot: '10:30 – 11:30',
            subject: 'Mathematics',
            topic: 'Preview Limits & Continuity',
            duration: '45m',
            activity_type: 'Preview',
          },
          {
            time_slot: '11:45 – 12:15',
            subject: 'English',
            topic: 'Weekly Summary & Todo Reset',
            duration: '30m',
            activity_type: 'Planning',
          },
        ],
      },
    ],
  };
}
