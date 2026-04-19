export type User = {
  id: string;
  name: string;
  email: string;
  role: "Reviewer" | "Lead reviewer" | "Admin";
  avatarInitials: string;
};

export type AssignmentStatus = "draft" | "active" | "complete" | "archived";
export type CaseStatus =
  | "awaiting_submission"
  | "session_pending"
  | "session_in_progress"
  | "processing"
  | "ready"
  | "rejected";
export type ConfidenceLevel = "high" | "medium" | "low";
export type ArtifactType = "Brief" | "Rubric" | "Reference" | "Example";
export type QuestionStyle = "Conversational" | "Probing" | "Strict";
export type EvidenceStrength = "strong" | "partial" | "weak";
export type NotificationType = "session_completed" | "submission_processed" | "assignment_processed";

export type Assignment = {
  id: string;
  name: string;
  course: string;
  description: string;
  status: AssignmentStatus;
  submissionCount: number;
  validSubmissionCount: number;
  rejectedSubmissionCount: number;
  caseCount: number;
  readyCaseCount: number;
  inProgressCaseCount: number;
  pendingCaseCount: number;
  archivedAt?: string;
  createdAt: string;
  lastActivityAt: string;
};

export type Artifact = {
  id: string;
  assignmentId: string;
  name: string;
  size: string;
  type: ArtifactType;
  uploadedAt: string;
};

export type AssignmentUnderstanding = {
  assignmentId: string;
  summary: string[];
  keyConcepts: string[];
  expectedEvidence: string[];
};

export type VerificationGoal = {
  id: string;
  assignmentId: string;
  text: string;
  priority: "High" | "Medium" | "Low";
};

export type SessionSettings = {
  assignmentId: string;
  durationTargetMin: 5 | 8 | 12 | 15;
  questionCount: 4 | 6 | 7 | 8;
  questionStyle: QuestionStyle;
  language: string;
  allowSkip: boolean;
  requireCamera: boolean;
  releaseAt: string;
  expiry: "24h" | "3 days" | "7 days" | "No expiry";
  sampleQuestion: string;
};

export type Submission = {
  id: string;
  assignmentId: string;
  filename: string;
  studentId: string | null;
  detectedStudent: string | null;
  size: string;
  uploadedAt: string;
  status: "accepted" | "rejected";
  reason?: string;
  caseId?: string;
};

export type SourceHighlight = {
  text: string;
  evidenceIds: string[];
  transcriptRef: string;
};

export type SubmissionDocSection = {
  id: string;
  title: string;
  pageLabel: string;
  paragraphs: string[];
  highlights?: SourceHighlight[];
};

export type SubmissionDoc = {
  id: string;
  caseId: string;
  name: string;
  kind: "Essay" | "Draft";
  sections: SubmissionDocSection[];
};

export type TranscriptTurn = {
  id: string;
  questionNumber: number;
  startSec: number;
  endSec: number;
  question: string;
  answer: string;
  highlight?: string;
  evidenceIds: string[];
};

export type FocusPoint = {
  id: string;
  title: string;
  level: ConfidenceLevel;
  summary: string;
  evidenceIds: string[];
  questionNumbers: number[];
  needsAttention: boolean;
  listMeta: string;
};

export type EvidenceItem = {
  id: string;
  focusPointId: string;
  index: number;
  strength: EvidenceStrength;
  transcriptTurnId: string;
  sourceDocId: string;
  sourceSectionId: string;
  transcriptRefLabel: string;
  sourceRefLabel: string;
  answerHighlight: string;
  sourceHighlight: string;
  sourceExcerpt: string;
  sourceCaption: string;
};

export type CaseRecord = {
  id: string;
  assignmentId: string;
  studentName: string;
  studentId: string;
  status: CaseStatus;
  confidence?: ConfidenceLevel;
  submittedFilesCount: number;
  lastActivityAt: string;
  reviewed?: boolean;
  sessionToken: string;
  sessionDurationSec?: number;
  questionCount?: number;
  focusPoints?: FocusPoint[];
  evidence?: EvidenceItem[];
  transcript?: TranscriptTurn[];
  submissionDocs?: SubmissionDoc[];
};

export type Notification = {
  id: string;
  type: NotificationType;
  read: boolean;
  assignmentId: string;
  assignmentName: string;
  studentName?: string;
  caseId?: string;
  detail: string;
  timeAgo: string;
};

export const showcaseAssignmentId = "assign-justice";
export const showcaseCaseId = "case-aarav-patel";
export const showcaseSessionToken = "session-aarav-24-1039";

export const users: User[] = [
  {
    id: "user-olivia-shaw",
    name: "Olivia Shaw",
    email: "olivia.shaw@harvard.edu",
    role: "Lead reviewer",
    avatarInitials: "OS",
  },
];

export const assignments: Assignment[] = [
  {
    id: showcaseAssignmentId,
    name: "Research Essay — Theories of Justice",
    course: "PHIL 210 · Fall 2026",
    description: "Compare two theories of justice and defend a position with sustained textual evidence.",
    status: "active",
    submissionCount: 24,
    validSubmissionCount: 22,
    rejectedSubmissionCount: 2,
    caseCount: 18,
    readyCaseCount: 9,
    inProgressCaseCount: 5,
    pendingCaseCount: 4,
    createdAt: "Nov 3",
    lastActivityAt: "2h ago",
  },
  {
    id: "assign-policy-brief",
    name: "Policy Brief — Urban Heat Response",
    course: "GOV 134 · Spring 2026",
    description: "Students argue for a targeted municipal intervention using comparative evidence.",
    status: "draft",
    submissionCount: 0,
    validSubmissionCount: 0,
    rejectedSubmissionCount: 0,
    caseCount: 0,
    readyCaseCount: 0,
    inProgressCaseCount: 0,
    pendingCaseCount: 0,
    createdAt: "Apr 18",
    lastActivityAt: "Just now",
  },
  {
    id: "assign-climate-hearing",
    name: "Climate Hearing Reflection",
    course: "GEN ED 113 · Spring 2026",
    description: "Reflect on witness framing, evidence choices, and policy tradeoffs in a mock hearing.",
    status: "active",
    submissionCount: 16,
    validSubmissionCount: 15,
    rejectedSubmissionCount: 1,
    caseCount: 12,
    readyCaseCount: 7,
    inProgressCaseCount: 3,
    pendingCaseCount: 2,
    createdAt: "Mar 27",
    lastActivityAt: "5h ago",
  },
  {
    id: "assign-market-analysis",
    name: "Market Analysis Memo",
    course: "ECON 145 · Winter 2026",
    description: "Students interpret market structure, incentives, and pricing decisions in a short memo.",
    status: "active",
    submissionCount: 31,
    validSubmissionCount: 29,
    rejectedSubmissionCount: 2,
    caseCount: 26,
    readyCaseCount: 14,
    inProgressCaseCount: 8,
    pendingCaseCount: 4,
    createdAt: "Feb 11",
    lastActivityAt: "1d ago",
  },
  {
    id: "assign-capstone-complete",
    name: "Capstone Reflection Interview",
    course: "EDUC 402 · Fall 2025",
    description: "Final reflective oral verification for practicum capstone submissions.",
    status: "complete",
    submissionCount: 18,
    validSubmissionCount: 18,
    rejectedSubmissionCount: 0,
    caseCount: 18,
    readyCaseCount: 18,
    inProgressCaseCount: 0,
    pendingCaseCount: 0,
    createdAt: "Dec 1",
    lastActivityAt: "3d ago",
  },
  {
    id: "assign-archived-ethics",
    name: "Applied Ethics Position Paper",
    course: "PHIL 118 · Fall 2025",
    description: "Archived assignment from last term used for calibration and exemplar training.",
    status: "archived",
    submissionCount: 20,
    validSubmissionCount: 19,
    rejectedSubmissionCount: 1,
    caseCount: 19,
    readyCaseCount: 19,
    inProgressCaseCount: 0,
    pendingCaseCount: 0,
    archivedAt: "Jan 12",
    createdAt: "Sep 9",
    lastActivityAt: "Archived Jan 12",
  },
];

export const artifacts: Artifact[] = [
  {
    id: "artifact-justice-brief",
    assignmentId: showcaseAssignmentId,
    name: "brief.pdf",
    size: "182KB",
    type: "Brief",
    uploadedAt: "Nov 3 · 9:10 AM",
  },
  {
    id: "artifact-justice-rubric",
    assignmentId: showcaseAssignmentId,
    name: "rubric.docx",
    size: "48KB",
    type: "Rubric",
    uploadedAt: "Nov 3 · 9:12 AM",
  },
  {
    id: "artifact-justice-reference",
    assignmentId: showcaseAssignmentId,
    name: "seminar-notes.md",
    size: "21KB",
    type: "Reference",
    uploadedAt: "Nov 3 · 9:16 AM",
  },
  {
    id: "artifact-justice-example",
    assignmentId: showcaseAssignmentId,
    name: "annotated-example.pdf",
    size: "311KB",
    type: "Example",
    uploadedAt: "Nov 3 · 9:18 AM",
  },
  {
    id: "artifact-policy-brief",
    assignmentId: "assign-policy-brief",
    name: "assignment-brief.pdf",
    size: "126KB",
    type: "Brief",
    uploadedAt: "Apr 18 · 4:20 PM",
  },
  {
    id: "artifact-policy-rubric",
    assignmentId: "assign-policy-brief",
    name: "rubric.pdf",
    size: "52KB",
    type: "Rubric",
    uploadedAt: "Apr 18 · 4:24 PM",
  },
  {
    id: "artifact-climate-brief",
    assignmentId: "assign-climate-hearing",
    name: "hearing-prompt.pdf",
    size: "94KB",
    type: "Brief",
    uploadedAt: "Mar 27 · 11:08 AM",
  },
];

export const understanding: AssignmentUnderstanding[] = [
  {
    assignmentId: showcaseAssignmentId,
    summary: [
      "This assignment asks students to defend a clear thesis about justice rather than merely compare positions. The strongest submissions should explain why one framework offers a better account of fairness in practice, and they should show how that framework handles at least one meaningful objection.",
      "Congentra identified Rawls' original position, the distinction between procedural and substantive justice, and the use of counter-examples as the central conceptual terrain. Reviewers should expect students to move beyond memorized definitions and to explain why these ideas matter to their own argument structure.",
      "The rubric emphasizes original articulation, disciplined use of sources, and the student's ability to connect specific citations to their reasoning. Oral verification should therefore test ownership of phrasing, the logic behind selected evidence, and the limits the student acknowledges in the conclusion.",
    ],
    keyConcepts: [
      "Original position",
      "Veil of ignorance",
      "Procedural justice",
      "Substantive justice",
      "Counter-example",
      "Normative justification",
    ],
    expectedEvidence: [
      "Direct explanation of the student's thesis without reading from the page",
      "Discussion of at least one cited passage and why it was chosen",
      "A concrete example used to stress-test the argument",
      "Acknowledgement of the argument's limits or strongest objection",
    ],
  },
  {
    assignmentId: "assign-climate-hearing",
    summary: [
      "Students were asked to reflect on a mock public hearing about urban heat mitigation. The assignment values concise policy reasoning, the ability to distinguish expert testimony from public comment, and clear explanation of tradeoffs between cost, speed, and equity.",
      "The system detected three concepts that matter most for verification: policy feasibility, evidence selection, and stakeholder prioritization. Reviewers should probe whether students understand why they elevated some witnesses over others and whether their recommendation matches the evidence they cite.",
    ],
    keyConcepts: [
      "Policy feasibility",
      "Municipal authority",
      "Equity tradeoffs",
      "Public testimony",
      "Heat vulnerability",
    ],
    expectedEvidence: [
      "Explanation of a preferred intervention in the student's own words",
      "A clear account of which testimony mattered most and why",
      "Recognition of implementation constraints",
    ],
  },
];

export const verificationGoals: VerificationGoal[] = [
  {
    id: "goal-justice-1",
    assignmentId: showcaseAssignmentId,
    text: "Confirm the student can explain their central thesis in their own words.",
    priority: "High",
  },
  {
    id: "goal-justice-2",
    assignmentId: showcaseAssignmentId,
    text: "Probe their understanding of Rawls' original position beyond textbook phrasing.",
    priority: "High",
  },
  {
    id: "goal-justice-3",
    assignmentId: showcaseAssignmentId,
    text: "Verify that claims tied to specific citations are genuinely theirs.",
    priority: "High",
  },
  {
    id: "goal-justice-4",
    assignmentId: showcaseAssignmentId,
    text: "Check reasoning behind their chosen counter-example.",
    priority: "Medium",
  },
  {
    id: "goal-justice-5",
    assignmentId: showcaseAssignmentId,
    text: "Assess whether the conclusion accurately reflects the limits of the argument.",
    priority: "Medium",
  },
  {
    id: "goal-climate-1",
    assignmentId: "assign-climate-hearing",
    text: "Test whether the student can justify their policy recommendation without relying on summary notes.",
    priority: "High",
  },
  {
    id: "goal-climate-2",
    assignmentId: "assign-climate-hearing",
    text: "Confirm they can distinguish evidentiary weight between witness types.",
    priority: "Medium",
  },
  {
    id: "goal-climate-3",
    assignmentId: "assign-climate-hearing",
    text: "Probe the tradeoff they considered most difficult in the final recommendation.",
    priority: "Medium",
  },
];

export const sessionSettings: SessionSettings[] = [
  {
    assignmentId: showcaseAssignmentId,
    durationTargetMin: 8,
    questionCount: 7,
    questionStyle: "Probing",
    language: "English",
    allowSkip: true,
    requireCamera: true,
    releaseAt: "2026-11-05T09:00",
    expiry: "7 days",
    sampleQuestion:
      "In your own words, what is the hinge of your argument, and what would have to change for that argument to fail?",
  },
  {
    assignmentId: "assign-climate-hearing",
    durationTargetMin: 5,
    questionCount: 6,
    questionStyle: "Conversational",
    language: "English",
    allowSkip: false,
    requireCamera: false,
    releaseAt: "2026-03-29T12:00",
    expiry: "3 days",
    sampleQuestion:
      "Which witness most changed your view of the policy options, and what did that testimony make newly visible to you?",
  },
  {
    assignmentId: "assign-policy-brief",
    durationTargetMin: 12,
    questionCount: 8,
    questionStyle: "Strict",
    language: "English",
    allowSkip: false,
    requireCamera: true,
    releaseAt: "2026-04-21T09:00",
    expiry: "24h",
    sampleQuestion:
      "Where does your policy recommendation rely on an assumption that a skeptical reader could reasonably reject?",
  },
];

const caseRoster = [
  { caseId: showcaseCaseId, studentName: "Aarav Patel", studentId: "24-1039", submittedFilesCount: 2 },
  { caseId: "case-maya-chen", studentName: "Maya Chen", studentId: "24-1047", submittedFilesCount: 1 },
  { caseId: "case-liam-walker", studentName: "Liam Walker", studentId: "24-1051", submittedFilesCount: 1 },
  { caseId: "case-sofia-alvarez", studentName: "Sofia Alvarez", studentId: "24-1060", submittedFilesCount: 1 },
  { caseId: "case-daniel-ortiz", studentName: "Daniel Ortiz", studentId: "24-1068", submittedFilesCount: 1 },
  { caseId: "case-priya-menon", studentName: "Priya Menon", studentId: "24-1074", submittedFilesCount: 1 },
  { caseId: "case-owen-brooks", studentName: "Owen Brooks", studentId: "24-1086", submittedFilesCount: 2 },
  { caseId: "case-elena-rossi", studentName: "Elena Rossi", studentId: "24-1091", submittedFilesCount: 1 },
  { caseId: "case-leila-hassan", studentName: "Leila Hassan", studentId: "24-1102", submittedFilesCount: 1 },
  { caseId: "case-harper-singh", studentName: "Harper Singh", studentId: "24-1110", submittedFilesCount: 2 },
  { caseId: "case-jonas-park", studentName: "Jonas Park", studentId: "24-1116", submittedFilesCount: 1 },
  { caseId: "case-grace-liu", studentName: "Grace Liu", studentId: "24-1121", submittedFilesCount: 1 },
  { caseId: "case-ben-carter", studentName: "Ben Carter", studentId: "24-1134", submittedFilesCount: 1 },
  { caseId: "case-aisha-rahman", studentName: "Aisha Rahman", studentId: "24-1140", submittedFilesCount: 1 },
  { caseId: "case-noah-kim", studentName: "Noah Kim", studentId: "24-1148", submittedFilesCount: 1 },
  { caseId: "case-mateo-rivera", studentName: "Mateo Rivera", studentId: "24-1152", submittedFilesCount: 1 },
  { caseId: "case-chloe-bennett", studentName: "Chloe Bennett", studentId: "24-1161", submittedFilesCount: 2 },
  { caseId: "case-isla-thompson", studentName: "Isla Thompson", studentId: "24-1173", submittedFilesCount: 1 },
];

export const submissions: Submission[] = [
  ...caseRoster.flatMap((student) => {
    const fileNames =
      student.submittedFilesCount === 2
        ? [
            `${student.studentId}_${student.studentName.split(" ")[1]}_Essay.pdf`,
            `${student.studentId}_${student.studentName.split(" ")[1]}_Draft.docx`,
          ]
        : [`${student.studentId}_${student.studentName.split(" ")[1]}_Essay.pdf`];

    return fileNames.map((filename, index) => ({
      id: `submission-${filename.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      assignmentId: showcaseAssignmentId,
      filename,
      studentId: student.studentId,
      detectedStudent: student.studentName,
      size: index === 0 ? "248KB" : "61KB",
      uploadedAt: index === 0 ? "Today · 8:42 AM" : "Today · 8:46 AM",
      status: "accepted" as const,
      caseId: student.caseId,
    }));
  }),
  {
    id: "submission-rejected-1",
    assignmentId: showcaseAssignmentId,
    filename: "Patel_final_v2.pdf",
    studentId: null,
    detectedStudent: null,
    size: "206KB",
    uploadedAt: "Today · 9:02 AM",
    status: "rejected",
    reason: "No student ID in filename",
  },
  {
    id: "submission-rejected-2",
    assignmentId: showcaseAssignmentId,
    filename: "24-1047_Chen_Essay_FINAL.pdf",
    studentId: "24-1047",
    detectedStudent: "Maya Chen",
    size: "254KB",
    uploadedAt: "Today · 9:18 AM",
    status: "rejected",
    reason: "Duplicate submission",
  },
];

const aaravTranscript: TranscriptTurn[] = [
  {
    id: "turn-q1",
    questionNumber: 1,
    startSec: 42,
    endSec: 98,
    question: "Before we go into the citations, state your thesis in your own words. What are you trying to prove about justice in this essay?",
    answer:
      "My claim is that Rawls is most useful when justice is treated as a procedure for arranging fair starting conditions, not as a promise that outcomes will look equal in every case. I argue that this matters because a fair procedure can justify unequal results without turning every difference into an injustice. In the essay I keep contrasting a rule for deciding versus a picture of what society must finally look like.",
    highlight: "a fair procedure can justify unequal results without turning every difference into an injustice",
    evidenceIds: ["evidence-f1-1", "evidence-f1-2"],
  },
  {
    id: "turn-q2",
    questionNumber: 2,
    startSec: 106,
    endSec: 176,
    question: "You write about the original position early on. What does that thought experiment actually do for your argument, beyond defining the term?",
    answer:
      "I use it as a test for which principles we would accept if we could not protect our current advantages. It forces the argument to begin from uncertainty, which is why I say it disciplines self-interest rather than erasing it. That matters for my thesis because the point is not that everyone becomes identical behind the veil, but that the rule we choose has to be defensible from more than one social position.",
    highlight: "it disciplines self-interest rather than erasing it",
    evidenceIds: ["evidence-f2-1", "evidence-f2-2", "evidence-f5-2"],
  },
  {
    id: "turn-q3",
    questionNumber: 3,
    startSec: 192,
    endSec: 263,
    question: "In section two you move from definition to example. Why did you choose the scholarship funding example instead of a healthcare example or tax example?",
    answer:
      "The scholarship case let me show a difference between equal access to a competition and equal outcomes after the competition. I needed an example where the rules could be fair even if the distribution was uneven, because that is where the procedural point becomes visible. A healthcare case would have dragged in need-based arguments too quickly, and then the essay would be about desert and scarcity instead of procedure.",
    highlight: "the rules could be fair even if the distribution was uneven",
    evidenceIds: ["evidence-f1-3", "evidence-f4-2", "evidence-f5-1"],
  },
  {
    id: "turn-q4",
    questionNumber: 4,
    startSec: 275,
    endSec: 349,
    question: "Walk me through the counter-example you use against a purely outcome-based view. Why does that example matter to your reasoning?",
    answer:
      "I describe two classrooms that end with the same grade distribution, but one gets there through opaque favoritism and the other through a public standard applied consistently. The point is that identical outcomes cannot settle the justice question by themselves, because we still care how those outcomes were produced. That example keeps the essay from collapsing fairness into a snapshot.",
    highlight: "identical outcomes cannot settle the justice question by themselves",
    evidenceIds: ["evidence-f3-1", "evidence-f3-2"],
  },
  {
    id: "turn-q5",
    questionNumber: 5,
    startSec: 366,
    endSec: 438,
    question: "In section three you cite Freeman on institutional design. Tell me why that citation is there and what work it does in your argument.",
    answer:
      "I use Freeman to support the claim that procedures are not neutral containers; they shape what counts as a fair claim in the first place. The citation is supposed to bridge my own language about public rules with a more formal account of institutions. I was less precise there than I wanted to be, and in the oral version I can say more clearly that I am borrowing the institutional frame, not the exact wording.",
    highlight: "I was less precise there than I wanted to be",
    evidenceIds: ["evidence-f4-1", "evidence-f4-3"],
  },
  {
    id: "turn-q6",
    questionNumber: 6,
    startSec: 455,
    endSec: 524,
    question: "What is the strongest limitation of your argument? Where does Rawls stop being enough for you?",
    answer:
      "Rawls gives me a strong test for fair rules, but he is thinner on what to do once historical inequalities distort who can actually benefit from those rules. That is why my conclusion says procedure is necessary but not always sufficient. If I revised the paper, I would add a paragraph about when corrective measures become part of a fair procedure rather than an exception to it.",
    highlight: "procedure is necessary but not always sufficient",
    evidenceIds: ["evidence-f2-3", "evidence-f3-3", "evidence-f5-3"],
  },
  {
    id: "turn-q7",
    questionNumber: 7,
    startSec: 536,
    endSec: 582,
    question: "Give me your conclusion without reading it. What should a reviewer remember after hearing your argument?",
    answer:
      "They should remember that justice is not only a picture of who ends up with what. My essay argues that we judge fairness by asking whether people could accept the rule that organized the decision, especially when they do not know where they will land within it. That is why I end by saying just institutions need principled procedures and a willingness to revise them when patterned disadvantages block genuine access.",
    highlight: "just institutions need principled procedures and a willingness to revise them",
    evidenceIds: ["evidence-f1-2", "evidence-f5-1", "evidence-f5-3"],
  },
];

const aaravFocusPoints: FocusPoint[] = [
  {
    id: "focus-1",
    title: "Central thesis — original articulation",
    level: "high",
    summary:
      "Aarav articulates his thesis without leaning on textbook phrasing. He reframed the claim twice when prompted, and both reframings preserved the original argument structure. The defense of his distinction between procedure and outcome was confident and self-generated.",
    evidenceIds: ["evidence-f1-1", "evidence-f1-2", "evidence-f1-3"],
    questionNumbers: [1, 3, 7],
    needsAttention: false,
    listMeta: "3 evidence · 2m 14s",
  },
  {
    id: "focus-2",
    title: "Rawls' original position — depth beyond textbook",
    level: "medium",
    summary:
      "The student moves beyond a memorized definition and explains the original position as a constraint on advantaged reasoning. He links the concept back to the rule-selection logic of the paper, though the account still leans on familiar classroom language in places.",
    evidenceIds: ["evidence-f2-1", "evidence-f2-2", "evidence-f2-3"],
    questionNumbers: [2, 6],
    needsAttention: false,
    listMeta: "3 evidence · 3m 05s",
  },
  {
    id: "focus-3",
    title: "Counter-example reasoning",
    level: "high",
    summary:
      "Aarav gives a clean explanation of why the classroom comparison matters. He uses the counter-example to separate outcome parity from procedural legitimacy, and he carries that distinction into the limit case he names later in the session.",
    evidenceIds: ["evidence-f3-1", "evidence-f3-2", "evidence-f3-3"],
    questionNumbers: [4, 6],
    needsAttention: false,
    listMeta: "3 evidence · 4m 01s",
  },
  {
    id: "focus-4",
    title: "Citation ownership — §3",
    level: "low",
    summary:
      "This is the weakest area in the case. The student can describe the function of the Freeman citation, but he also admits the written passage is less precise than intended. The oral answer suggests ownership of the surrounding argument, but the wording in the essay may still warrant closer review.",
    evidenceIds: ["evidence-f4-1", "evidence-f4-2", "evidence-f4-3"],
    questionNumbers: [3, 5],
    needsAttention: true,
    listMeta: "3 evidence · 5m 30s",
  },
  {
    id: "focus-5",
    title: "Conclusion — synthesis and limits",
    level: "medium",
    summary:
      "The conclusion holds together conceptually and returns to the paper's main distinction. Aarav clearly states that fair procedure is necessary but not sufficient, although the implications of that concession could have been developed more fully in the written ending.",
    evidenceIds: ["evidence-f5-1", "evidence-f5-2", "evidence-f5-3"],
    questionNumbers: [2, 3, 7],
    needsAttention: true,
    listMeta: "3 evidence · 8m 27s",
  },
];

const aaravSubmissionDocs: SubmissionDoc[] = [
  {
    id: "doc-aarav-essay",
    caseId: showcaseCaseId,
    name: "Essay.pdf",
    kind: "Essay",
    sections: [
      {
        id: "essay-sec-1",
        title: "§1 Introduction",
        pageLabel: "p.1",
        paragraphs: [
          "Debates about justice often move too quickly from visible inequality to the conclusion that unequal outcomes must be unjust. This essay argues that Rawls offers a more persuasive starting point when justice is treated as a problem of fair procedures rather than a guarantee of mirrored results.",
          "The value of the original position is not that it imagines a world without difference. Its value is that it asks what rules people could defend when they do not know which place in society they themselves will occupy. That test does not eliminate disagreement, but it does discipline the kinds of advantages a person can simply assume for themself.",
          "For that reason, a just institution should be evaluated first by whether its governing procedures could be publicly justified to differently situated participants. Outcomes still matter, but they should be read through the legitimacy of the rules that produced them.",
        ],
        highlights: [
          {
            text: "a just institution should be evaluated first by whether its governing procedures could be publicly justified",
            evidenceIds: ["evidence-f1-1", "evidence-f1-2"],
            transcriptRef: "Q1 · 01:12–01:48",
          },
        ],
      },
      {
        id: "essay-sec-2",
        title: "§2 Rawls, procedure, and the counter-example",
        pageLabel: "p.2",
        paragraphs: [
          "The original position matters because it asks which principles remain defensible when one cannot tailor those principles to a known social advantage. In that sense the veil of ignorance does not erase self-interest; it places self-interest under conditions of uncertainty that force broader justification.",
          "A scholarship allocation example makes this visible. Two students may finish with different outcomes, yet the result can still be fair if the underlying standard is public, relevant to the stated purpose, and equally knowable in advance. The justice question is therefore not exhausted by the final distribution.",
          "This becomes clearer when compared with a counter-example. Imagine two classrooms that end with the same grade distribution, but one arrived there through hidden favoritism while the other used announced criteria. Equal outcomes do not rescue the first classroom from injustice because procedure remains morally legible even when the pattern looks similar.",
        ],
        highlights: [
          {
            text: "the veil of ignorance does not erase self-interest; it places self-interest under conditions of uncertainty",
            evidenceIds: ["evidence-f2-1", "evidence-f2-2"],
            transcriptRef: "Q2 · 01:46–02:56",
          },
          {
            text: "Equal outcomes do not rescue the first classroom from injustice because procedure remains morally legible",
            evidenceIds: ["evidence-f3-1", "evidence-f3-2"],
            transcriptRef: "Q4 · 04:35–05:49",
          },
          {
            text: "the result can still be fair if the underlying standard is public, relevant to the stated purpose, and equally knowable in advance",
            evidenceIds: ["evidence-f1-3", "evidence-f5-1"],
            transcriptRef: "Q3 · 03:12–04:23",
          },
        ],
      },
      {
        id: "essay-sec-3",
        title: "§3 Institutional form and conclusion",
        pageLabel: "p.3",
        paragraphs: [
          "As Samuel Freeman notes, institutions do not merely apply principles from the outside; they shape what kinds of claims can be recognized as fair claims at all. That institutional dimension matters because the legitimacy of a procedure depends on more than a neutral rulebook.",
          "Still, procedure is not always sufficient. Historical exclusion can distort who is genuinely able to benefit from a formally fair process, which means that procedural justice sometimes requires corrective design rather than simple neutrality.",
          "Rawls is therefore most persuasive when read as a framework for publicly defensible rule-making. A just order needs principled procedures, but it must also revise those procedures when patterned disadvantage prevents equal standing within them.",
        ],
        highlights: [
          {
            text: "institutions do not merely apply principles from the outside; they shape what kinds of claims can be recognized as fair claims at all",
            evidenceIds: ["evidence-f4-1", "evidence-f4-3"],
            transcriptRef: "Q5 · 06:06–07:18",
          },
          {
            text: "procedure is not always sufficient",
            evidenceIds: ["evidence-f2-3", "evidence-f5-3"],
            transcriptRef: "Q6 · 07:35–08:44",
          },
          {
            text: "it must also revise those procedures when patterned disadvantage prevents equal standing within them",
            evidenceIds: ["evidence-f5-3"],
            transcriptRef: "Q7 · 08:56–09:42",
          },
        ],
      },
    ],
  },
  {
    id: "doc-aarav-draft",
    caseId: showcaseCaseId,
    name: "Draft.docx",
    kind: "Draft",
    sections: [
      {
        id: "draft-sec-1",
        title: "Outline notes",
        pageLabel: "p.1",
        paragraphs: [
          "Need to keep thesis on procedure vs outcome. Avoid sounding like equality never matters.",
          "Scholarship example works because it shows fairness before distribution. Maybe mention healthcare as something I am not taking up.",
          "Freeman section needs cleaner wording. Say institution shapes fair claims, not only outcomes.",
        ],
      },
    ],
  },
];

const aaravEvidence: EvidenceItem[] = [
  {
    id: "evidence-f1-1",
    focusPointId: "focus-1",
    index: 1,
    strength: "strong",
    transcriptTurnId: "turn-q1",
    sourceDocId: "doc-aarav-essay",
    sourceSectionId: "essay-sec-1",
    transcriptRefLabel: "TRANSCRIPT · Q1 · 00:42–01:38",
    sourceRefLabel: "SOURCE · Essay.pdf · p.1 §1",
    answerHighlight: "a fair procedure can justify unequal results without turning every difference into an injustice",
    sourceHighlight: "a just institution should be evaluated first by whether its governing procedures could be publicly justified",
    sourceExcerpt:
      "For that reason, a just institution should be evaluated first by whether its governing procedures could be publicly justified to differently situated participants.",
    sourceCaption: "Links to transcript 01:12",
  },
  {
    id: "evidence-f1-2",
    focusPointId: "focus-1",
    index: 2,
    strength: "strong",
    transcriptTurnId: "turn-q7",
    sourceDocId: "doc-aarav-essay",
    sourceSectionId: "essay-sec-1",
    transcriptRefLabel: "TRANSCRIPT · Q7 · 08:56–09:42",
    sourceRefLabel: "SOURCE · Essay.pdf · p.1 §1",
    answerHighlight: "just institutions need principled procedures and a willingness to revise them",
    sourceHighlight: "a just institution should be evaluated first by whether its governing procedures could be publicly justified",
    sourceExcerpt:
      "For that reason, a just institution should be evaluated first by whether its governing procedures could be publicly justified to differently situated participants.",
    sourceCaption: "Links to transcript 09:11",
  },
  {
    id: "evidence-f1-3",
    focusPointId: "focus-1",
    index: 3,
    strength: "partial",
    transcriptTurnId: "turn-q3",
    sourceDocId: "doc-aarav-essay",
    sourceSectionId: "essay-sec-2",
    transcriptRefLabel: "TRANSCRIPT · Q3 · 03:12–04:23",
    sourceRefLabel: "SOURCE · Essay.pdf · p.2 §2",
    answerHighlight: "the rules could be fair even if the distribution was uneven",
    sourceHighlight:
      "the result can still be fair if the underlying standard is public, relevant to the stated purpose, and equally knowable in advance",
    sourceExcerpt:
      "Two students may finish with different outcomes, yet the result can still be fair if the underlying standard is public, relevant to the stated purpose, and equally knowable in advance.",
    sourceCaption: "Links to transcript 03:37",
  },
  {
    id: "evidence-f2-1",
    focusPointId: "focus-2",
    index: 1,
    strength: "strong",
    transcriptTurnId: "turn-q2",
    sourceDocId: "doc-aarav-essay",
    sourceSectionId: "essay-sec-2",
    transcriptRefLabel: "TRANSCRIPT · Q2 · 01:46–02:56",
    sourceRefLabel: "SOURCE · Essay.pdf · p.2 §2",
    answerHighlight: "it disciplines self-interest rather than erasing it",
    sourceHighlight:
      "the veil of ignorance does not erase self-interest; it places self-interest under conditions of uncertainty",
    sourceExcerpt:
      "In that sense the veil of ignorance does not erase self-interest; it places self-interest under conditions of uncertainty that force broader justification.",
    sourceCaption: "Links to transcript 02:14",
  },
  {
    id: "evidence-f2-2",
    focusPointId: "focus-2",
    index: 2,
    strength: "partial",
    transcriptTurnId: "turn-q2",
    sourceDocId: "doc-aarav-draft",
    sourceSectionId: "draft-sec-1",
    transcriptRefLabel: "TRANSCRIPT · Q2 · 01:46–02:56",
    sourceRefLabel: "SOURCE · Draft.docx · p.1 notes",
    answerHighlight: "the rule we choose has to be defensible from more than one social position",
    sourceHighlight: "Need to keep thesis on procedure vs outcome",
    sourceExcerpt:
      "Need to keep thesis on procedure vs outcome. Avoid sounding like equality never matters.",
    sourceCaption: "Links to transcript 02:34",
  },
  {
    id: "evidence-f2-3",
    focusPointId: "focus-2",
    index: 3,
    strength: "partial",
    transcriptTurnId: "turn-q6",
    sourceDocId: "doc-aarav-essay",
    sourceSectionId: "essay-sec-3",
    transcriptRefLabel: "TRANSCRIPT · Q6 · 07:35–08:44",
    sourceRefLabel: "SOURCE · Essay.pdf · p.3 §3",
    answerHighlight: "procedure is necessary but not always sufficient",
    sourceHighlight: "procedure is not always sufficient",
    sourceExcerpt:
      "Still, procedure is not always sufficient. Historical exclusion can distort who is genuinely able to benefit from a formally fair process.",
    sourceCaption: "Links to transcript 08:02",
  },
  {
    id: "evidence-f3-1",
    focusPointId: "focus-3",
    index: 1,
    strength: "strong",
    transcriptTurnId: "turn-q4",
    sourceDocId: "doc-aarav-essay",
    sourceSectionId: "essay-sec-2",
    transcriptRefLabel: "TRANSCRIPT · Q4 · 04:35–05:49",
    sourceRefLabel: "SOURCE · Essay.pdf · p.2 §2",
    answerHighlight: "identical outcomes cannot settle the justice question by themselves",
    sourceHighlight: "Equal outcomes do not rescue the first classroom from injustice",
    sourceExcerpt:
      "Equal outcomes do not rescue the first classroom from injustice because procedure remains morally legible even when the pattern looks similar.",
    sourceCaption: "Links to transcript 05:08",
  },
  {
    id: "evidence-f3-2",
    focusPointId: "focus-3",
    index: 2,
    strength: "strong",
    transcriptTurnId: "turn-q4",
    sourceDocId: "doc-aarav-essay",
    sourceSectionId: "essay-sec-2",
    transcriptRefLabel: "TRANSCRIPT · Q4 · 04:35–05:49",
    sourceRefLabel: "SOURCE · Essay.pdf · p.2 §2",
    answerHighlight: "we still care how those outcomes were produced",
    sourceHighlight: "procedure remains morally legible even when the pattern looks similar",
    sourceExcerpt:
      "Imagine two classrooms that end with the same grade distribution, but one arrived there through hidden favoritism while the other used announced criteria.",
    sourceCaption: "Links to transcript 04:54",
  },
  {
    id: "evidence-f3-3",
    focusPointId: "focus-3",
    index: 3,
    strength: "partial",
    transcriptTurnId: "turn-q6",
    sourceDocId: "doc-aarav-essay",
    sourceSectionId: "essay-sec-3",
    transcriptRefLabel: "TRANSCRIPT · Q6 · 07:35–08:44",
    sourceRefLabel: "SOURCE · Essay.pdf · p.3 §3",
    answerHighlight: "I would add a paragraph about when corrective measures become part of a fair procedure",
    sourceHighlight: "procedure is not always sufficient",
    sourceExcerpt:
      "Historical exclusion can distort who is genuinely able to benefit from a formally fair process, which means that procedural justice sometimes requires corrective design rather than simple neutrality.",
    sourceCaption: "Links to transcript 08:19",
  },
  {
    id: "evidence-f4-1",
    focusPointId: "focus-4",
    index: 1,
    strength: "weak",
    transcriptTurnId: "turn-q5",
    sourceDocId: "doc-aarav-essay",
    sourceSectionId: "essay-sec-3",
    transcriptRefLabel: "TRANSCRIPT · Q5 · 06:06–07:18",
    sourceRefLabel: "SOURCE · Essay.pdf · p.3 §3",
    answerHighlight: "I was less precise there than I wanted to be",
    sourceHighlight:
      "institutions do not merely apply principles from the outside; they shape what kinds of claims can be recognized as fair claims at all",
    sourceExcerpt:
      "As Samuel Freeman notes, institutions do not merely apply principles from the outside; they shape what kinds of claims can be recognized as fair claims at all.",
    sourceCaption: "Links to transcript 06:41",
  },
  {
    id: "evidence-f4-2",
    focusPointId: "focus-4",
    index: 2,
    strength: "partial",
    transcriptTurnId: "turn-q3",
    sourceDocId: "doc-aarav-draft",
    sourceSectionId: "draft-sec-1",
    transcriptRefLabel: "TRANSCRIPT · Q3 · 03:12–04:23",
    sourceRefLabel: "SOURCE · Draft.docx · p.1 notes",
    answerHighlight: "A healthcare case would have dragged in need-based arguments too quickly",
    sourceHighlight: "Scholarship example works because it shows fairness before distribution",
    sourceExcerpt:
      "Scholarship example works because it shows fairness before distribution. Maybe mention healthcare as something I am not taking up.",
    sourceCaption: "Links to transcript 03:44",
  },
  {
    id: "evidence-f4-3",
    focusPointId: "focus-4",
    index: 3,
    strength: "weak",
    transcriptTurnId: "turn-q5",
    sourceDocId: "doc-aarav-draft",
    sourceSectionId: "draft-sec-1",
    transcriptRefLabel: "TRANSCRIPT · Q5 · 06:06–07:18",
    sourceRefLabel: "SOURCE · Draft.docx · p.1 notes",
    answerHighlight: "I am borrowing the institutional frame, not the exact wording",
    sourceHighlight: "Freeman section needs cleaner wording",
    sourceExcerpt:
      "Freeman section needs cleaner wording. Say institution shapes fair claims, not only outcomes.",
    sourceCaption: "Links to transcript 07:02",
  },
  {
    id: "evidence-f5-1",
    focusPointId: "focus-5",
    index: 1,
    strength: "strong",
    transcriptTurnId: "turn-q3",
    sourceDocId: "doc-aarav-essay",
    sourceSectionId: "essay-sec-2",
    transcriptRefLabel: "TRANSCRIPT · Q3 · 03:12–04:23",
    sourceRefLabel: "SOURCE · Essay.pdf · p.2 §2",
    answerHighlight: "the rules could be fair even if the distribution was uneven",
    sourceHighlight: "the result can still be fair if the underlying standard is public",
    sourceExcerpt:
      "Two students may finish with different outcomes, yet the result can still be fair if the underlying standard is public, relevant to the stated purpose, and equally knowable in advance.",
    sourceCaption: "Links to transcript 03:37",
  },
  {
    id: "evidence-f5-2",
    focusPointId: "focus-5",
    index: 2,
    strength: "partial",
    transcriptTurnId: "turn-q2",
    sourceDocId: "doc-aarav-essay",
    sourceSectionId: "essay-sec-2",
    transcriptRefLabel: "TRANSCRIPT · Q2 · 01:46–02:56",
    sourceRefLabel: "SOURCE · Essay.pdf · p.2 §2",
    answerHighlight: "the rule we choose has to be defensible from more than one social position",
    sourceHighlight: "one cannot tailor those principles to a known social advantage",
    sourceExcerpt:
      "The original position matters because it asks which principles remain defensible when one cannot tailor those principles to a known social advantage.",
    sourceCaption: "Links to transcript 02:28",
  },
  {
    id: "evidence-f5-3",
    focusPointId: "focus-5",
    index: 3,
    strength: "strong",
    transcriptTurnId: "turn-q7",
    sourceDocId: "doc-aarav-essay",
    sourceSectionId: "essay-sec-3",
    transcriptRefLabel: "TRANSCRIPT · Q7 · 08:56–09:42",
    sourceRefLabel: "SOURCE · Essay.pdf · p.3 §3",
    answerHighlight: "just institutions need principled procedures and a willingness to revise them",
    sourceHighlight:
      "it must also revise those procedures when patterned disadvantage prevents equal standing within them",
    sourceExcerpt:
      "A just order needs principled procedures, but it must also revise those procedures when patterned disadvantage prevents equal standing within them.",
    sourceCaption: "Links to transcript 09:23",
  },
];

export const cases: CaseRecord[] = [
  {
    id: showcaseCaseId,
    assignmentId: showcaseAssignmentId,
    studentName: "Aarav Patel",
    studentId: "24-1039",
    status: "ready",
    confidence: "high",
    submittedFilesCount: 2,
    lastActivityAt: "24m ago",
    reviewed: false,
    sessionToken: showcaseSessionToken,
    sessionDurationSec: 582,
    questionCount: 7,
    focusPoints: aaravFocusPoints,
    evidence: aaravEvidence,
    transcript: aaravTranscript,
    submissionDocs: aaravSubmissionDocs,
  },
  {
    id: "case-maya-chen",
    assignmentId: showcaseAssignmentId,
    studentName: "Maya Chen",
    studentId: "24-1047",
    status: "ready",
    confidence: "medium",
    submittedFilesCount: 1,
    lastActivityAt: "3h ago",
    sessionToken: "session-maya-24-1047",
  },
  {
    id: "case-liam-walker",
    assignmentId: showcaseAssignmentId,
    studentName: "Liam Walker",
    studentId: "24-1051",
    status: "ready",
    confidence: "high",
    submittedFilesCount: 1,
    lastActivityAt: "4h ago",
    sessionToken: "session-liam-24-1051",
  },
  {
    id: "case-sofia-alvarez",
    assignmentId: showcaseAssignmentId,
    studentName: "Sofia Alvarez",
    studentId: "24-1060",
    status: "ready",
    confidence: "medium",
    submittedFilesCount: 1,
    lastActivityAt: "5h ago",
    sessionToken: "session-sofia-24-1060",
  },
  {
    id: "case-daniel-ortiz",
    assignmentId: showcaseAssignmentId,
    studentName: "Daniel Ortiz",
    studentId: "24-1068",
    status: "ready",
    confidence: "low",
    submittedFilesCount: 1,
    lastActivityAt: "6h ago",
    sessionToken: "session-daniel-24-1068",
  },
  {
    id: "case-priya-menon",
    assignmentId: showcaseAssignmentId,
    studentName: "Priya Menon",
    studentId: "24-1074",
    status: "ready",
    confidence: "high",
    submittedFilesCount: 1,
    lastActivityAt: "7h ago",
    sessionToken: "session-priya-24-1074",
  },
  {
    id: "case-owen-brooks",
    assignmentId: showcaseAssignmentId,
    studentName: "Owen Brooks",
    studentId: "24-1086",
    status: "ready",
    confidence: "medium",
    submittedFilesCount: 2,
    lastActivityAt: "8h ago",
    sessionToken: "session-owen-24-1086",
  },
  {
    id: "case-elena-rossi",
    assignmentId: showcaseAssignmentId,
    studentName: "Elena Rossi",
    studentId: "24-1091",
    status: "ready",
    confidence: "high",
    submittedFilesCount: 1,
    lastActivityAt: "9h ago",
    sessionToken: "session-elena-24-1091",
  },
  {
    id: "case-leila-hassan",
    assignmentId: showcaseAssignmentId,
    studentName: "Leila Hassan",
    studentId: "24-1102",
    status: "ready",
    confidence: "medium",
    submittedFilesCount: 1,
    lastActivityAt: "10h ago",
    sessionToken: "session-leila-24-1102",
  },
  {
    id: "case-harper-singh",
    assignmentId: showcaseAssignmentId,
    studentName: "Harper Singh",
    studentId: "24-1110",
    status: "session_in_progress",
    submittedFilesCount: 2,
    lastActivityAt: "14m ago",
    sessionToken: "session-harper-24-1110",
  },
  {
    id: "case-jonas-park",
    assignmentId: showcaseAssignmentId,
    studentName: "Jonas Park",
    studentId: "24-1116",
    status: "session_pending",
    submittedFilesCount: 1,
    lastActivityAt: "1h ago",
    sessionToken: "session-jonas-24-1116",
  },
  {
    id: "case-grace-liu",
    assignmentId: showcaseAssignmentId,
    studentName: "Grace Liu",
    studentId: "24-1121",
    status: "session_in_progress",
    submittedFilesCount: 1,
    lastActivityAt: "42m ago",
    sessionToken: "session-grace-24-1121",
  },
  {
    id: "case-ben-carter",
    assignmentId: showcaseAssignmentId,
    studentName: "Ben Carter",
    studentId: "24-1134",
    status: "processing",
    submittedFilesCount: 1,
    lastActivityAt: "19m ago",
    sessionToken: "session-ben-24-1134",
  },
  {
    id: "case-aisha-rahman",
    assignmentId: showcaseAssignmentId,
    studentName: "Aisha Rahman",
    studentId: "24-1140",
    status: "session_pending",
    submittedFilesCount: 1,
    lastActivityAt: "2h ago",
    sessionToken: "session-aisha-24-1140",
  },
  {
    id: "case-noah-kim",
    assignmentId: showcaseAssignmentId,
    studentName: "Noah Kim",
    studentId: "24-1148",
    status: "awaiting_submission",
    submittedFilesCount: 1,
    lastActivityAt: "Today",
    sessionToken: "session-noah-24-1148",
  },
  {
    id: "case-mateo-rivera",
    assignmentId: showcaseAssignmentId,
    studentName: "Mateo Rivera",
    studentId: "24-1152",
    status: "awaiting_submission",
    submittedFilesCount: 1,
    lastActivityAt: "Today",
    sessionToken: "session-mateo-24-1152",
  },
  {
    id: "case-chloe-bennett",
    assignmentId: showcaseAssignmentId,
    studentName: "Chloe Bennett",
    studentId: "24-1161",
    status: "awaiting_submission",
    submittedFilesCount: 2,
    lastActivityAt: "Today",
    sessionToken: "session-chloe-24-1161",
  },
  {
    id: "case-isla-thompson",
    assignmentId: showcaseAssignmentId,
    studentName: "Isla Thompson",
    studentId: "24-1173",
    status: "awaiting_submission",
    submittedFilesCount: 1,
    lastActivityAt: "Today",
    sessionToken: "session-isla-24-1173",
  },
];

export const notifications: Notification[] = [
  {
    id: "notif-1",
    type: "session_completed",
    read: false,
    assignmentId: showcaseAssignmentId,
    assignmentName: "Theories of Justice",
    studentName: "Maya Chen",
    caseId: "case-maya-chen",
    detail: "Maya Chen completed her session for Theories of Justice.",
    timeAgo: "3h ago",
  },
  {
    id: "notif-2",
    type: "submission_processed",
    read: false,
    assignmentId: showcaseAssignmentId,
    assignmentName: "Theories of Justice",
    detail: "Submission processed for Theories of Justice — 4 cases created.",
    timeAgo: "4h ago",
  },
  {
    id: "notif-3",
    type: "assignment_processed",
    read: true,
    assignmentId: "assign-climate-hearing",
    assignmentName: "Climate Hearing Reflection",
    detail: "Assignment Climate Hearing Reflection finished processing.",
    timeAgo: "8h ago",
  },
  {
    id: "notif-4",
    type: "session_completed",
    read: false,
    assignmentId: showcaseAssignmentId,
    assignmentName: "Theories of Justice",
    studentName: "Aarav Patel",
    caseId: showcaseCaseId,
    detail: "Aarav Patel completed her session for Theories of Justice.",
    timeAgo: "24m ago",
  },
  {
    id: "notif-5",
    type: "session_completed",
    read: true,
    assignmentId: "assign-market-analysis",
    assignmentName: "Market Analysis Memo",
    studentName: "Ben Carter",
    detail: "Ben Carter completed his session for Market Analysis Memo.",
    timeAgo: "1d ago",
  },
  {
    id: "notif-6",
    type: "submission_processed",
    read: true,
    assignmentId: "assign-market-analysis",
    assignmentName: "Market Analysis Memo",
    detail: "Submission processed for Market Analysis Memo — 6 cases created.",
    timeAgo: "1d ago",
  },
  {
    id: "notif-7",
    type: "assignment_processed",
    read: true,
    assignmentId: showcaseAssignmentId,
    assignmentName: "Theories of Justice",
    detail: "Assignment Theories of Justice finished processing.",
    timeAgo: "2d ago",
  },
  {
    id: "notif-8",
    type: "session_completed",
    read: false,
    assignmentId: "assign-climate-hearing",
    assignmentName: "Climate Hearing Reflection",
    studentName: "Daniel Ortiz",
    detail: "Daniel Ortiz completed his session for Climate Hearing Reflection.",
    timeAgo: "2h ago",
  },
  {
    id: "notif-9",
    type: "submission_processed",
    read: true,
    assignmentId: "assign-capstone-complete",
    assignmentName: "Capstone Reflection Interview",
    detail: "Submission processed for Capstone Reflection Interview — 18 cases created.",
    timeAgo: "3d ago",
  },
  {
    id: "notif-10",
    type: "assignment_processed",
    read: false,
    assignmentId: "assign-policy-brief",
    assignmentName: "Policy Brief — Urban Heat Response",
    detail: "Assignment Policy Brief — Urban Heat Response finished processing.",
    timeAgo: "12m ago",
  },
];

export const studentSessionQuestions = aaravTranscript.map((turn) => ({
  id: turn.id,
  questionNumber: turn.questionNumber,
  prompt: turn.question,
  durationHint: "About 90 seconds",
  preview: turn.question,
}));

export const reviewerUser = users[0];

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
}

export function formatTimestamp(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function getAssignmentById(id: string) {
  return assignments.find((assignment) => assignment.id === id);
}

export function getArtifactsByAssignmentId(assignmentId: string) {
  return artifacts.filter((artifact) => artifact.assignmentId === assignmentId);
}

export function getUnderstandingByAssignmentId(assignmentId: string) {
  return understanding.find((entry) => entry.assignmentId === assignmentId);
}

export function getVerificationGoalsByAssignmentId(assignmentId: string) {
  return verificationGoals.filter((goal) => goal.assignmentId === assignmentId);
}

export function getSessionSettingsByAssignmentId(assignmentId: string) {
  return sessionSettings.find((entry) => entry.assignmentId === assignmentId);
}

export function getSubmissionsByAssignmentId(assignmentId: string) {
  return submissions.filter((submission) => submission.assignmentId === assignmentId);
}

export function getCasesByAssignmentId(assignmentId: string) {
  return cases.filter((caseRecord) => caseRecord.assignmentId === assignmentId);
}

export function getCaseById(caseId: string) {
  return cases.find((caseRecord) => caseRecord.id === caseId);
}
