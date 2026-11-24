function normalizeText(str = '') {
  return String(str).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
}

function matchesChapterKeywords(chapterName = '', targetTitle = '') {
  const chWords = normalizeText(chapterName)
    .split(/\s+/)
    .filter((w) => w.length >= 4);
  const titleNorm = normalizeText(targetTitle);
  return chWords.some((word) => titleNorm.includes(word));
}

export function buildLearningCompassData({
  subjects = [],
  chapters = [],
  results = [],
  analytics = null,
  dppSets = [],
  assignments = [],
}) {
  const orderedSubjects = Array.isArray(subjects) ? subjects : [];
  const allChapters = Array.isArray(chapters) ? chapters : [];
  const allResults = Array.isArray(results) ? results : [];
  const allDpp = Array.isArray(dppSets) ? dppSets : [];
  const allAssignments = Array.isArray(assignments) ? assignments : [];

  const subjectAnalyticsMap = {};
  (analytics?.subject_performance || []).forEach((item) => {
    subjectAnalyticsMap[item.subject] = item;
  });

  const subjectModels = orderedSubjects.map((subj) => {
    const subjChapters = allChapters
      .filter((c) => c.subject_id === subj.id || c.subject_name === subj.name)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    const subjResults = allResults
      .filter((r) => r.subject_id === subj.id || r.subject_name === subj.name)
      .sort((a, b) => String(a.exam_date || '').localeCompare(String(b.exam_date || '')));

    const subjDpp = allDpp.filter(
      (d) => d.subject_id === subj.id || d.subject_name === subj.name
    );
    const attemptedDpp = subjDpp.filter((d) => d.attempted && d.last_attempt);

    const subjAssignments = allAssignments.filter(
      (a) => a.subject_id === subj.id || a.subject_name === subj.name
    );

    const examAverage =
      subjectAnalyticsMap[subj.name]?.average ??
      (subjResults.length > 0
        ? Math.round(
            (subjResults.reduce((acc, r) => acc + Number(r.percentage || 0), 0) /
              subjResults.length) *
              10
          ) / 10
        : null);

    const latestExamScore =
      subjResults.length > 0 ? Number(subjResults[subjResults.length - 1].percentage) : null;
    const examTrendDelta =
      subjResults.length >= 2
        ? Math.round(
            (Number(subjResults[subjResults.length - 1].percentage) -
              Number(subjResults[0].percentage)) *
              10
          ) / 10
        : null;

    const dppAverage =
      attemptedDpp.length > 0
        ? Math.round(
            (attemptedDpp.reduce((acc, d) => {
              const tot = d.last_attempt?.total_marks || 1;
              return acc + ((d.last_attempt?.score || 0) / tot) * 100;
            }, 0) /
              attemptedDpp.length) *
              10
          ) / 10
        : null;

    let totalTopics = 0;
    let completedTopics = 0;
    let ongoingTopics = 0;

    const enrichedChapters = subjChapters.map((ch) => {
      const topics = Array.isArray(ch.topics) ? ch.topics : [];
      const tTotal = topics.length;
      const tCompleted = topics.filter((t) => t.status === 'completed').length;
      const tOngoing = topics.filter((t) => t.status === 'ongoing').length;
      const tUpcoming = Math.max(0, tTotal - tCompleted - tOngoing);
      const progress =
        typeof ch.progress === 'number'
          ? ch.progress
          : tTotal > 0
            ? Math.round((tCompleted / tTotal) * 100)
            : 0;

      totalTopics += tTotal;
      completedTopics += tCompleted;
      ongoingTopics += tOngoing;

      const matchedDpp = subjDpp.filter((d) => matchesChapterKeywords(ch.name, d.title));
      const matchedAssignments = subjAssignments.filter((a) =>
        matchesChapterKeywords(ch.name, a.title)
      );

      // Deterministic Needs Attention check strictly grounded in real performance data
      const lowDpp = matchedDpp.find(
        (d) =>
          d.attempted &&
          d.last_attempt?.total_marks > 0 &&
          (d.last_attempt.score / d.last_attempt.total_marks) * 100 < 70
      );
      const overdueAssignment = matchedAssignments.find((a) => a.user_status === 'overdue');
      const lowGradedAssignment = matchedAssignments.find(
        (a) =>
          a.submission?.status === 'graded' &&
          a.max_marks > 0 &&
          (a.submission.marks_obtained / a.max_marks) * 100 < 70
      );
      const lowExamOnActiveChapter =
        examAverage !== null && examAverage < 75 && ch.status !== 'upcoming';

      let attentionReason = null;
      if (lowDpp) {
        const pct = Math.round(
          (lowDpp.last_attempt.score / lowDpp.last_attempt.total_marks) * 100
        );
        attentionReason = `DPP practice score is ${pct}% (${lowDpp.last_attempt.score}/${lowDpp.last_attempt.total_marks})`;
      } else if (overdueAssignment) {
        attentionReason = `Assignment "${overdueAssignment.title}" is overdue`;
      } else if (lowGradedAssignment) {
        const pct = Math.round(
          (lowGradedAssignment.submission.marks_obtained / lowGradedAssignment.max_marks) * 100
        );
        attentionReason = `Graded coursework score is ${pct}%`;
      } else if (lowExamOnActiveChapter) {
        attentionReason = `Subject exam average is ${examAverage}% (below 75% target)`;
      }

      const needsAttention = Boolean(attentionReason);
      const baseStatus =
        ch.status === 'completed' || progress === 100
          ? 'completed'
          : ch.status === 'ongoing' || tOngoing > 0 || (tCompleted > 0 && tCompleted < tTotal)
            ? 'in-progress'
            : 'not-started';

      const displayStatus = needsAttention ? 'needs-attention' : baseStatus;

      return {
        ...ch,
        topics,
        totalTopics: tTotal,
        completedTopics: tCompleted,
        ongoingTopics: tOngoing,
        upcomingTopics: tUpcoming,
        progress,
        baseStatus,
        displayStatus,
        needsAttention,
        attentionReason,
        matchedDpp,
        matchedAssignments,
      };
    });

    const completedChaptersCount = enrichedChapters.filter(
      (c) => c.baseStatus === 'completed'
    ).length;
    const inProgressChaptersCount = enrichedChapters.filter(
      (c) => c.baseStatus === 'in-progress'
    ).length;
    const attentionChaptersCount = enrichedChapters.filter((c) => c.needsAttention).length;

    const syllabusCompletion =
      totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : null;

    const hasCurriculum = enrichedChapters.length > 0;
    const hasAssessmentData = examAverage !== null || dppAverage !== null;

    return {
      ...subj,
      chapters: enrichedChapters,
      totalChapters: enrichedChapters.length,
      completedChaptersCount,
      inProgressChaptersCount,
      attentionChaptersCount,
      totalTopics,
      completedTopics,
      ongoingTopics,
      syllabusCompletion,
      examResults: subjResults,
      examAverage,
      latestExamScore,
      examTrendDelta,
      dppSets: subjDpp,
      attemptedDppCount: attemptedDpp.length,
      dppAverage,
      assignments: subjAssignments,
      hasCurriculum,
      hasAssessmentData,
    };
  });

  // Global aggregate metrics
  const allEnrichedChapters = subjectModels.flatMap((s) => s.chapters);
  const totalChapters = allEnrichedChapters.length;
  const completedChapters = allEnrichedChapters.filter((c) => c.baseStatus === 'completed').length;
  const totalTopics = allEnrichedChapters.reduce((acc, c) => acc + c.totalTopics, 0);
  const completedTopics = allEnrichedChapters.reduce((acc, c) => acc + c.completedTopics, 0);
  const overallSyllabusPct =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const overallExamAvg =
    typeof analytics?.summary?.overall_average === 'number'
      ? analytics.summary.overall_average
      : allResults.length > 0
        ? Math.round(
            (allResults.reduce((acc, r) => acc + Number(r.percentage || 0), 0) /
              allResults.length) *
              10
          ) / 10
        : null;

  const dppAttemptedAll = allDpp.filter((d) => d.attempted && d.last_attempt);
  const overallDppAvg =
    dppAttemptedAll.length > 0
      ? Math.round(
          (dppAttemptedAll.reduce((acc, d) => {
            const tot = d.last_attempt?.total_marks || 1;
            return acc + ((d.last_attempt?.score || 0) / tot) * 100;
          }, 0) /
            dppAttemptedAll.length) *
            10
        ) / 10
      : null;

  // Deterministic Strongest Subject
  const testedSubjects = subjectModels.filter((s) => s.examAverage !== null);
  const strongestSubject =
    testedSubjects.length > 0
      ? [...testedSubjects].sort((a, b) => {
          if (b.examAverage !== a.examAverage) return b.examAverage - a.examAverage;
          return (b.syllabusCompletion || 0) - (a.syllabusCompletion || 0);
        })[0]
      : subjectModels.find((s) => s.hasCurriculum) || null;

  // Deterministic Subject Requiring Attention
  const subjectsWithWork = subjectModels.filter((s) => s.hasCurriculum || s.hasAssessmentData);
  let subjectRequiringAttention = null;
  let attentionSummaryReason = '';

  const flaggedSubjects = subjectsWithWork.filter(
    (s) =>
      s.attentionChaptersCount > 0 ||
      (s.examAverage !== null && s.examAverage < 75) ||
      (s.examTrendDelta !== null && s.examTrendDelta < 0)
  );

  if (flaggedSubjects.length > 0) {
    subjectRequiringAttention = [...flaggedSubjects].sort(
      (a, b) => (a.examAverage ?? 100) - (b.examAverage ?? 100)
    )[0];
    const chWithIssue = subjectRequiringAttention.chapters.find((c) => c.needsAttention);
    attentionSummaryReason = chWithIssue
      ? chWithIssue.attentionReason
      : `Exam average is ${subjectRequiringAttention.examAverage}%`;
  } else if (testedSubjects.length > 0) {
    const lowestTested = [...testedSubjects].sort(
      (a, b) => (a.examAverage ?? 100) - (b.examAverage ?? 100)
    )[0];
    subjectRequiringAttention = lowestTested;
    const remaining = lowestTested.totalChapters - lowestTested.completedChaptersCount;
    attentionSummaryReason =
      remaining > 0
        ? `Lowest exam average among tested subjects (${lowestTested.examAverage}%) with ${remaining} chapter${remaining === 1 ? '' : 's'} remaining`
        : `Lowest exam average among tested subjects (${lowestTested.examAverage}%)`;
  }

  // Most Recently Completed Chapter (latest order_index among completed chapters)
  const completedChaptersList = allEnrichedChapters.filter((c) => c.baseStatus === 'completed');
  const recentlyCompletedChapter =
    completedChaptersList.length > 0
      ? completedChaptersList[completedChaptersList.length - 1]
      : null;

  // Chapters requiring revision (real performance flags)
  const chaptersRequiringRevision = allEnrichedChapters.filter((c) => c.needsAttention);

  // Chronological Examination Trend
  const examsChronological = [...allResults].sort((a, b) =>
    String(a.exam_date || '').localeCompare(String(b.exam_date || ''))
  );
  let examTrendSummary = {
    hasTrend: false,
    direction: 'insufficient',
    delta: 0,
    headline: 'More examination records needed',
    detail: 'At least two graded exams are required to calculate a trend.',
  };
  if (examsChronological.length >= 2) {
    // Group by exam_name order of appearance
    const examBuckets = [];
    const byName = new Map();
    examsChronological.forEach((r) => {
      if (!byName.has(r.exam_name)) {
        const entry = { name: r.exam_name, scores: [] };
        byName.set(r.exam_name, entry);
        examBuckets.push(entry);
      }
      byName.get(r.exam_name).scores.push(Number(r.percentage || 0));
    });

    if (examBuckets.length >= 2) {
      const firstAvg =
        examBuckets[0].scores.reduce((a, b) => a + b, 0) / examBuckets[0].scores.length;
      const lastAvg =
        examBuckets[examBuckets.length - 1].scores.reduce((a, b) => a + b, 0) /
        examBuckets[examBuckets.length - 1].scores.length;
      const delta = Math.round((lastAvg - firstAvg) * 10) / 10;
      examTrendSummary = {
        hasTrend: true,
        direction: delta > 1 ? 'improving' : delta < -1 ? 'declining' : 'steady',
        delta,
        headline:
          delta > 1
            ? `Up +${delta}% across recent exams`
            : delta < -1
              ? `Down ${delta}% across recent exams`
              : `Steady (${delta >= 0 ? `+${delta}` : delta}%) across recent exams`,
        detail: `Moved from ${Math.round(firstAvg * 10) / 10}% in ${examBuckets[0].name} to ${Math.round(lastAvg * 10) / 10}% in ${examBuckets[examBuckets.length - 1].name}.`,
      };
    } else {
      examTrendSummary = {
        hasTrend: true,
        direction: 'steady',
        delta: 0,
        headline: `${examsChronological[0].exam_name}: ${overallExamAvg}% average`,
        detail: 'Complete another exam cycle to measure progression over time.',
      };
    }
  }

  // Recommended Next Learning Action (deterministic priority order)
  const overdueOrPendingAsg = allAssignments.find(
    (a) => a.user_status === 'overdue' || a.user_status === 'posted'
  );
  const unattemptedDpp = allDpp.find((d) => !d.attempted);
  const activeChapter =
    (subjectRequiringAttention?.chapters || []).find((c) => c.baseStatus === 'in-progress') ||
    allEnrichedChapters.find((c) => c.baseStatus === 'in-progress');
  const activeTopic =
    activeChapter?.topics?.find((t) => t.status === 'ongoing') ||
    activeChapter?.topics?.[0] ||
    null;

  let recommendedAction;
  if (chaptersRequiringRevision.length > 0) {
    const ch = chaptersRequiringRevision[0];
    recommendedAction = {
      title: `Revise ${ch.name} (${ch.subject_name})`,
      reason: ch.attentionReason,
      ctaLabel: 'Review with AI Tutor',
      to: '/ai-companion',
      state: {
        mode: 'explain',
        subject: ch.subject_name,
        prompt: `Help me revise ${ch.name} in ${ch.subject_name} with key concepts and practice examples.`,
        timestamp: Date.now(),
      },
    };
  } else if (unattemptedDpp) {
    recommendedAction = {
      title: `Take ${unattemptedDpp.title}`,
      reason: `Practice quiz in ${unattemptedDpp.subject_name} has not been attempted yet (+${unattemptedDpp.xp_reward} XP).`,
      ctaLabel: 'Start DPP Practice',
      to: '/dpp',
      state: null,
    };
  } else if (activeChapter && activeTopic) {
    recommendedAction = {
      title: `Continue ${activeTopic.name}`,
      reason: `Active topic inside ${activeChapter.name} (${activeChapter.subject_name}).`,
      ctaLabel: 'Explore Topic with Nova',
      to: '/ai-companion',
      state: {
        mode: 'explain',
        subject: activeChapter.subject_name,
        prompt: `Explain ${activeTopic.name} from ${activeChapter.name} step by step.`,
        timestamp: Date.now(),
      },
    };
  } else if (overdueOrPendingAsg) {
    recommendedAction = {
      title: `Complete ${overdueOrPendingAsg.title}`,
      reason: `Pending ${overdueOrPendingAsg.subject_name} assignment due ${new Date(
        overdueOrPendingAsg.due_date
      ).toLocaleDateString()}.`,
      ctaLabel: 'Go to Assignments',
      to: '/assignments',
      state: null,
    };
  } else {
    recommendedAction = {
      title: 'Generate a practice quiz on your current chapter',
      reason: 'Keep momentum strong with active recall across your subjects.',
      ctaLabel: 'Open AI Companion',
      to: '/ai-companion',
      state: { mode: 'quiz', timestamp: Date.now() },
    };
  }

  return {
    subjectModels,
    overview: {
      totalChapters,
      completedChapters,
      totalTopics,
      completedTopics,
      overallSyllabusPct,
      overallExamAvg,
      dppAttemptedCount: dppAttemptedAll.length,
      dppTotalCount: allDpp.length,
      overallDppAvg,
      strongestSubject,
      subjectRequiringAttention,
      attentionSummaryReason,
      recommendedAction,
    },
    insights: {
      strongestSubject,
      recentlyCompletedChapter,
      chaptersRequiringRevision,
      examTrendSummary,
      recommendedAction,
    },
  };
}
