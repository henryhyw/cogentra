import { ArrowRight, Copy, FileUp, Settings2, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Card from "../../components/Card";
import ConfidenceDot from "../../components/ConfidenceDot";
import StatusPill from "../../components/StatusPill";
import {
  getAssignmentById,
  getCasesByAssignmentId,
  getVerificationGoalsByAssignmentId,
} from "../../data/mock";

export default function Overview() {
  const { id = "" } = useParams();
  const assignment = getAssignmentById(id);
  const caseRecords = getCasesByAssignmentId(id);
  const goals = getVerificationGoalsByAssignmentId(id);

  if (!assignment) {
    return null;
  }

  const attentionCases = caseRecords
    .filter((caseRecord) => caseRecord.status !== "ready" || caseRecord.confidence === "low")
    .slice(0, 5);

  const recentActivity = [
    "Submission processed — A. Patel · 2h ago",
    "Session completed — M. Chen · 3h ago",
    "Assignment understanding updated · 1d ago",
    "Cases grouped from new uploads · 1d ago",
    "Session settings revised · 2d ago",
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" unstyled>
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-16 font-medium text-ink">Where this stands</h2>
          </div>
          <div className="divide-y divide-line px-5 py-2 md:flex md:divide-x md:divide-y-0">
            <div className="space-y-2 py-4 md:flex-1 md:pr-6">
              <p className="text-13 text-mute">Cases</p>
              <p className="display num text-48 text-ink">{assignment.caseCount}</p>
              <p className="text-13 text-mute">
                {assignment.readyCaseCount} ready · {assignment.inProgressCaseCount} in progress · {assignment.pendingCaseCount} pending
              </p>
            </div>
            <div className="space-y-2 py-4 md:flex-1 md:px-6">
              <p className="text-13 text-mute">Submissions</p>
              <p className="display num text-48 text-ink">{assignment.submissionCount}</p>
              <p className="text-13 text-mute">
                {assignment.validSubmissionCount} valid · {assignment.rejectedSubmissionCount} rejected
              </p>
            </div>
            <div className="space-y-2 py-4 md:flex-1 md:pl-6">
              <p className="text-13 text-mute">Verification goals</p>
              <p className="display num text-48 text-ink">{goals.length}</p>
              <p className="text-13 text-mute">last edited 2d ago</p>
            </div>
          </div>
        </Card>
        <Card
          bodyClassName="space-y-3"
          header={<h2 className="text-16 font-medium text-ink">Quick actions</h2>}
        >
          {[
            { icon: FileUp, label: "Upload more submissions", to: `/assignments/${assignment.id}/submissions` },
            { icon: Sparkles, label: "Edit assignment understanding", to: `/assignments/${assignment.id}/understanding` },
            { icon: Settings2, label: "Adjust session settings", to: `/assignments/${assignment.id}/session-settings` },
            { icon: Copy, label: "Copy class session link", to: `/assignments/${assignment.id}` },
          ].map((item) => (
            <Link
              className="flex items-center justify-between rounded-md2 px-3 py-2 transition-colors duration-150 ease-out hover:bg-hover"
              key={item.label}
              to={item.to}
            >
              <span className="flex items-center gap-3 text-14 text-ink">
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
              <ArrowRight className="h-4 w-4 text-mute" />
            </Link>
          ))}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          bodyClassName="divide-y divide-line"
          header={<h2 className="text-16 font-medium text-ink">Cases needing attention</h2>}
        >
          {attentionCases.map((caseRecord) => (
            <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0" key={caseRecord.id}>
              <div className="space-y-1">
                <p className="text-14 font-medium text-ink">{caseRecord.studentName}</p>
                <p className="mono text-12 text-mute">{caseRecord.studentId}</p>
              </div>
              <div className="flex items-center gap-4">
                <StatusPill state={caseRecord.status} />
                {caseRecord.confidence ? (
                  <div className="flex items-center gap-2 text-12 text-mute">
                    <ConfidenceDot level={caseRecord.confidence} />
                    <span>{caseRecord.confidence}</span>
                  </div>
                ) : null}
                <Link className="text-13 text-linkBlue transition-colors duration-150 ease-out hover:text-ink" to={`/assignments/${assignment.id}/cases/${caseRecord.id}`}>
                  Review
                </Link>
              </div>
            </div>
          ))}
        </Card>
        <Card
          bodyClassName="space-y-4"
          header={<h2 className="text-16 font-medium text-ink">Recent activity</h2>}
        >
          {recentActivity.map((item) => (
            <div className="flex gap-3" key={item}>
              <span className="mt-1.5 h-2 w-2 rounded-full bg-mute" />
              <p className="text-13 text-ink">{item}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
