import { Check, Trash2 } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Dropzone from "../../components/Dropzone";
import IconButton from "../../components/IconButton";
import Modal from "../../components/Modal";
import { getSubmissionsByAssignmentId } from "../../data/mock";

export default function Submissions() {
  const { id = "" } = useParams();
  const [submissionRows, setSubmissionRows] = useState(getSubmissionsByAssignmentId(id));
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);

  const accepted = submissionRows.filter((submission) => submission.status === "accepted");
  const rejected = submissionRows.filter((submission) => submission.status === "rejected");
  const grouped = accepted.every((submission) => submission.caseId);
  const groupedCaseCount = new Set(accepted.map((submission) => submission.caseId).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-14 text-mute">
          Filenames must include the student ID. Example: 24-1039_Patel_Essay.pdf. Files without a valid ID will be rejected.
        </p>
      </Card>
      <Dropzone />

      <div className="space-y-3">
        <p className="text-12 uppercase tracking-widest text-mute">Accepted · {accepted.length}</p>
        <Card className="overflow-hidden" unstyled>
          <div className="grid grid-cols-[minmax(0,1.6fr)_120px_1fr_100px_120px_48px] gap-4 border-b border-line px-5 py-3 text-12 uppercase tracking-widest text-mute">
            <span>Filename</span>
            <span>Student ID</span>
            <span>Detected student</span>
            <span>Size</span>
            <span>Uploaded</span>
            <span />
          </div>
          {accepted.map((submission) => (
            <div
              className="grid grid-cols-[minmax(0,1.6fr)_120px_1fr_100px_120px_48px] gap-4 border-b border-line px-5 py-3 last:border-b-0"
              key={submission.id}
            >
              <p className="mono truncate text-13 text-ink">{submission.filename}</p>
              <Badge variant="ready">{submission.studentId ?? "—"}</Badge>
              <p className="text-13 text-ink">{submission.detectedStudent}</p>
              <p className="mono text-12 text-mute">{submission.size}</p>
              <p className="text-12 text-mute">{submission.uploadedAt}</p>
              <IconButton aria-label="Delete submission" onClick={() => setSubmissionToDelete(submission.id)}>
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          ))}
        </Card>
      </div>

      <div className="space-y-3">
        <p className="text-12 uppercase tracking-widest text-mute">Rejected · {rejected.length}</p>
        <Card className="overflow-hidden" unstyled>
          <div className="grid grid-cols-[minmax(0,1.6fr)_120px_1fr_100px_120px_1fr] gap-4 border-b border-line px-5 py-3 text-12 uppercase tracking-widest text-mute">
            <span>Filename</span>
            <span>Student ID</span>
            <span>Detected student</span>
            <span>Size</span>
            <span>Uploaded</span>
            <span>Reason</span>
          </div>
          {rejected.map((submission) => (
            <div
              className="grid grid-cols-[minmax(0,1.6fr)_120px_1fr_100px_120px_1fr] gap-4 border-b border-line border-l-2 border-l-danger px-5 py-3 last:border-b-0"
              key={submission.id}
            >
              <p className="mono truncate text-13 text-ink">{submission.filename}</p>
              <Badge variant="danger">{submission.studentId ?? "—"}</Badge>
              <p className="text-13 text-ink">{submission.detectedStudent ?? "Unmatched"}</p>
              <p className="mono text-12 text-mute">{submission.size}</p>
              <p className="text-12 text-mute">{submission.uploadedAt}</p>
              <p className="text-13 text-danger">{submission.reason}</p>
            </div>
          ))}
        </Card>
      </div>

      <div>
        {grouped ? (
          <div className="inline-flex items-center gap-2 text-13 text-forest">
            <Check className="h-4 w-4" />
            {accepted.length} submissions grouped into {groupedCaseCount} cases
          </div>
        ) : (
          <Button>Generate cases</Button>
        )}
      </div>

      <Modal
        footer={
          <>
            <Button onClick={() => setSubmissionToDelete(null)} variant="ghost">
              Cancel
            </Button>
            <Button
              onClick={() => {
                setSubmissionRows((current) => current.filter((item) => item.id !== submissionToDelete));
                setSubmissionToDelete(null);
              }}
              variant="danger"
            >
              Remove submission
            </Button>
          </>
        }
        isOpen={Boolean(submissionToDelete)}
        onClose={() => setSubmissionToDelete(null)}
        title="Remove submission?"
      >
        <p className="text-14 text-mute">This removes the file from the current review set.</p>
      </Modal>
    </div>
  );
}
