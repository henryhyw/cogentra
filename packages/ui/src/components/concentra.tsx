"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Copy,
  Files,
  FileText,
  Link2,
  Mic,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  AudioWaveform,
} from "lucide-react";
import * as React from "react";

import { cn, formatRelativeDate, percentage } from "../lib/utils";
import {
  Badge,
  Button,
  Card,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  HoverCard,
  Input,
  Progress,
  ScrollArea,
  Separator,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipProvider,
} from "./primitives";

export function OverviewStatCard({
  label,
  value,
  detail,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  detail: string;
  accent?: "primary" | "success" | "warning";
}) {
  const accentMap = {
    primary: "from-sky-400/25 to-indigo-500/10 text-sky-200",
    success: "from-emerald-400/25 to-teal-500/10 text-emerald-200",
    warning: "from-amber-400/25 to-orange-500/10 text-amber-200",
  } as const;
  return (
    <Card className="overflow-hidden p-5">
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", accentMap[accent])} />
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold text-foreground">{value}</p>
        <Sparkles className="size-5 text-primary" />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "reviewed" || status === "ready" || status === "summary_ready"
      ? "success"
      : status === "needs_review" || status === "processing" || status === "in_progress"
        ? "warning"
        : status === "archived"
          ? "danger"
          : "neutral";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}

export function ConfidenceBadge({ value }: { value: number }) {
  const tone = value >= 0.85 ? "success" : value >= 0.7 ? "warning" : "danger";
  return <Badge tone={tone}>{percentage(value)} confidence</Badge>;
}

export function ArtifactCard({
  title,
  role,
  confidence,
  summary,
  actions,
}: {
  title: string;
  role: string;
  confidence: number;
  summary: string;
  actions?: React.ReactNode;
}) {
  return (
    <Card className="group relative p-4 transition hover:-translate-y-0.5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-white/5 text-primary">
              <FileText className="size-4" />
            </div>
            <div>
              <p className="font-medium text-foreground">{title}</p>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{role.replaceAll("_", " ")}</p>
            </div>
          </div>
          <ConfidenceBadge value={confidence} />
        </div>
        {actions}
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{summary}</p>
    </Card>
  );
}

export function ArtifactBoard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <Badge tone="primary">AI role map</Badge>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">{children}</div>
    </Card>
  );
}

export function UploadDropzone({
  title,
  description,
  onFiles,
}: {
  title: string;
  description: string;
  onFiles?: (files: FileList) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [active, setActive] = React.useState(false);
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setActive(false);
        if (event.dataTransfer.files?.length && onFiles) onFiles(event.dataTransfer.files);
      }}
      className={cn(
        "rounded-3xl border border-dashed p-6 transition",
        active ? "border-primary bg-primary/10" : "border-border/70 bg-white/5",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/5 text-primary">
            <UploadCloud className="size-5" />
          </div>
          <div>
            <p className="font-medium text-foreground">{title}</p>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            onChange={(event) => event.target.files && onFiles?.(event.target.files)}
          />
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            Choose Files
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProcessingTimeline({
  labels,
  currentIndex,
}: {
  labels: string[];
  currentIndex: number;
}) {
  return (
    <div className="space-y-3">
      {labels.map((label, index) => (
        <div key={label} className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-full border text-xs font-semibold",
              index <= currentIndex ? "border-primary bg-primary text-primary-foreground" : "border-border/70 text-muted-foreground",
            )}
          >
            {index + 1}
          </div>
          <div className="flex-1">
            <p className={cn("text-sm", index <= currentIndex ? "text-foreground" : "text-muted-foreground")}>{label}</p>
            <Progress value={Math.min(100, ((currentIndex + 1) / labels.length) * 100)} className={index === currentIndex ? "mt-2" : "hidden"} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function VerificationGoalChip({
  label,
  enabled = true,
  detail,
}: {
  label: string;
  enabled?: boolean;
  detail: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        enabled ? "border-primary/30 bg-primary/10 text-foreground" : "border-border/60 bg-white/5 text-muted-foreground",
      )}
    >
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-xs leading-5">{detail}</p>
    </div>
  );
}

export function FocusPointCard({
  title,
  status,
  summary,
  why,
  confidence,
  evidence,
}: {
  title: string;
  status: string;
  summary: string;
  why: string;
  confidence: number;
  evidence?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-foreground">{title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary}</p>
        </div>
        <div className="space-y-2 text-right">
          <StatusBadge status={status} />
          <ConfidenceBadge value={confidence} />
        </div>
      </div>
      <div className="mt-5 rounded-2xl bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Why It Matters</p>
        <p className="mt-2 text-sm leading-6 text-foreground/90">{why}</p>
      </div>
      {evidence ? <div className="mt-4">{evidence}</div> : null}
    </Card>
  );
}

export function QuestionCard({
  index,
  focusLabel,
  question,
  rationale,
  footer,
}: {
  index: number;
  focusLabel: string;
  question: string;
  rationale?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <Badge tone="primary">{focusLabel}</Badge>
          <p className="text-xl font-semibold leading-8 text-foreground">
            <span className="mr-2 text-muted-foreground">{index}.</span>
            {question}
          </p>
        </div>
      </div>
      {rationale ? <div className="mt-4">{rationale}</div> : null}
      {footer ? <div className="mt-5">{footer}</div> : null}
    </Card>
  );
}

export function ExplainabilityPopover({
  title = "Why this was generated",
  summary,
  children,
}: {
  title?: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <HoverCard
      trigger={
        <button className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-muted-foreground transition hover:bg-white/10">
          <Sparkles className="size-3" />
          Why this was generated
        </button>
      }
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary}</p>
      <Separator className="my-4 h-px" />
      {children}
    </HoverCard>
  );
}

export function EvidenceCard({
  title,
  finding,
  transcriptSnippet,
  submissionReference,
  whyItMatters,
  confidence,
}: {
  title: string;
  finding: string;
  transcriptSnippet: string;
  submissionReference: string;
  whyItMatters: string;
  confidence: number;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-foreground">{title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{finding}</p>
        </div>
        <ConfidenceBadge value={confidence} />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1.3fr,0.9fr]">
        <div className="rounded-2xl bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Transcript Snippet</p>
          <p className="mt-3 text-sm leading-6 text-foreground/90">{transcriptSnippet}</p>
        </div>
        <div className="space-y-3 rounded-2xl bg-white/5 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Submission Reference</p>
            <p className="mt-2 text-sm text-foreground">{submissionReference}</p>
          </div>
          <Separator className="h-px" />
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Why It Matters</p>
            <p className="mt-2 text-sm leading-6 text-foreground/90">{whyItMatters}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function InconsistencyCard({
  description,
  transcriptSnippet,
  reference,
  confidence,
}: {
  description: string;
  transcriptSnippet: string;
  reference: string;
  confidence: number;
}) {
  return (
    <Card className="border-warning/30 bg-warning/10 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-1 size-4 text-warning-foreground" />
          <div>
            <p className="font-medium text-foreground">{description}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{transcriptSnippet}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">Related written reference</p>
            <p className="mt-1 text-sm text-foreground/85">{reference}</p>
          </div>
        </div>
        <ConfidenceBadge value={confidence} />
      </div>
    </Card>
  );
}

export function TranscriptBlock({
  question,
  transcript,
  highlight,
}: {
  question: string;
  transcript: string;
  highlight?: string;
}) {
  const rendered = highlight ? transcript.replaceAll(highlight, `**${highlight}**`) : transcript;
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-foreground">{question}</p>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{rendered}</p>
    </Card>
  );
}

export function SubmissionPreviewPanel({
  title,
  sections,
}: {
  title: string;
  sections: { title: string; body: string }[];
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-lg font-semibold text-foreground">{title}</p>
        <Badge tone="neutral">Linked source view</Badge>
      </div>
      <ScrollArea className="max-h-[28rem] pr-4">
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm font-medium text-foreground">{section.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.body}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

export function SessionProgressHeader({
  title,
  questionIndex,
  questionCount,
  status,
}: {
  title: string;
  questionIndex: number;
  questionCount: number;
  status: string;
}) {
  const value = Math.round((questionIndex / Math.max(1, questionCount)) * 100);
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            Question {questionIndex} of {questionCount}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <div className="w-40">
            <Progress value={value} />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function RecorderControl({
  status,
  canRecord = true,
  onPrimary,
  primaryLabel,
}: {
  status: string;
  canRecord?: boolean;
  onPrimary?: () => void;
  primaryLabel: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-white/5">
          <Mic className={cn("size-6", status === "recording" ? "text-danger-foreground" : "text-primary")} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Recorder status</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{status}</p>
        </div>
        <Button disabled={!canRecord} onClick={onPrimary}>
          {primaryLabel}
        </Button>
      </div>
    </Card>
  );
}

export function PersistentControlBar({
  status,
  children,
}: {
  status: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-4 z-20">
      <Card className="flex flex-col gap-4 px-5 py-4 backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <AudioWaveform className="size-4 text-primary" />
          <span>{status}</span>
        </div>
        <div className="flex items-center gap-2">{children}</div>
      </Card>
    </div>
  );
}

export function SplitPaneLayout({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">{left}{right}</div>;
}

export function SessionLinkCell({
  link,
  onCopy,
}: {
  link: string;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <code className="rounded-xl bg-white/5 px-3 py-2 text-xs text-muted-foreground">{link}</code>
      <TooltipProvider>
        <Tooltip content="Copy session link">
          <button className="rounded-xl border border-border/70 p-2 text-muted-foreground transition hover:bg-white/5 hover:text-foreground" onClick={onCopy}>
            <Copy className="size-4" />
          </button>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function PreviewSummaryCell({
  summary,
  flags,
}: {
  summary: string;
  flags: { label: string; tone: string }[];
}) {
  return (
    <div className="space-y-2">
      <p className="max-w-sm text-sm leading-6 text-muted-foreground">{summary}</p>
      <div className="flex flex-wrap gap-2">
        {flags.map((flag) => (
          <Badge key={flag.label} tone={flag.tone === "warning" ? "warning" : flag.tone === "attention" ? "primary" : "neutral"}>
            {flag.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function BundlePreviewCard({
  student,
  family,
  fileCount,
  confidence,
  unresolved,
}: {
  student: string;
  family: string;
  fileCount: number;
  confidence: number;
  unresolved?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{student}</p>
          <p className="mt-1 text-sm text-muted-foreground">{family.replaceAll("_", " ")}</p>
        </div>
        {unresolved ? <Badge tone="warning">Needs mapping</Badge> : <ConfidenceBadge value={confidence} />}
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Files className="size-4" />
        {fileCount} files detected
      </div>
    </Card>
  );
}

export function InlineSearch({
  value,
  onChange,
  placeholder = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pl-10" />
    </div>
  );
}

export function ReviewMediaCard({
  audioUrl,
  videoUrl,
  title = "Session Capture",
  note,
}: {
  audioUrl?: string | null;
  videoUrl?: string | null;
  title?: string;
  note: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-foreground">{title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{note}</p>
        </div>
        <PlayCircle className="size-5 text-primary" />
      </div>
      {videoUrl ? (
        <div className="mt-5 space-y-3">
          <video controls className="w-full rounded-2xl border border-border/70 bg-black/50">
            <source src={videoUrl} />
          </video>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Audio and video capture were enabled for this session.
          </p>
        </div>
      ) : audioUrl ? (
        <div className="mt-5 space-y-3">
          <audio controls className="w-full">
            <source src={audioUrl} />
          </audio>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Audio-first capture with source replay available for reviewer verification.
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-border/70 bg-white/5 p-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            Deterministic demo transcript capture is active for this seeded case.
          </div>
        </div>
      )}
    </Card>
  );
}

export function CasesTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return <DataTable headers={headers} rows={rows} />;
}

export function LoadingSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}
