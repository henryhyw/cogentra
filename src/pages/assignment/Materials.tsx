import { Check, FileText, MoreHorizontal } from "lucide-react";
import { useParams } from "react-router-dom";
import Badge from "../../components/Badge";
import Card from "../../components/Card";
import Dropzone from "../../components/Dropzone";
import IconButton from "../../components/IconButton";
import { getArtifactsByAssignmentId } from "../../data/mock";

export default function Materials() {
  const { id = "" } = useParams();
  const assignmentArtifacts = getArtifactsByAssignmentId(id);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_320px]">
      <div className="space-y-6">
        <Card
          bodyClassName="space-y-6"
          header={<h2 className="text-16 font-medium text-ink">Assignment materials</h2>}
        >
          <Dropzone />
          <div className="grid gap-4 sm:grid-cols-2">
            {assignmentArtifacts.slice(0, 3).map((artifact) => (
              <Card className="h-[180px]" key={artifact.id} unstyled>
                <div className="flex h-full flex-col justify-between px-5 py-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <FileText className="h-5 w-5 text-mute" />
                      <IconButton aria-label="More options">
                        <MoreHorizontal className="h-4 w-4" />
                      </IconButton>
                    </div>
                    <div className="space-y-1">
                      <p className="text-15 font-medium text-ink">{artifact.name}</p>
                      <p className="mono text-12 text-mute">{artifact.size}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="ready">{artifact.type}</Badge>
                    <p className="text-12 text-mute">{artifact.uploadedAt}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
      <Card
        bodyClassName="space-y-4"
        header={<h2 className="text-16 font-medium text-ink">What Congentra reads</h2>}
      >
        <p className="text-13 text-mute">
          Congentra reads the assignment materials as a single context bundle before generating verification questions.
        </p>
        <div className="space-y-3">
          {[
            "Extracts key concepts",
            "Identifies rubric criteria",
            "Flags missing context",
          ].map((item) => (
            <div className="flex items-center gap-3" key={item}>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-forestSoft text-forest">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span className="text-13 text-ink">{item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
