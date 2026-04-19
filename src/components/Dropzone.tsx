import { UploadCloud } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/cn";
import Button from "./Button";

type DropzoneProps = {
  title?: string;
  description?: string;
  buttonLabel?: string;
  className?: string;
};

export default function Dropzone({
  buttonLabel = "Choose files",
  className,
  description = "PDF, DOCX, MD, TXT up to 20MB each",
  title = "Drop files here or click to upload",
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl2 border-2 border-dashed border-line bg-surface p-8 text-center transition-colors duration-150 ease-out",
        isDragging && "border-forest bg-forestSoft",
        className,
      )}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
    >
      <div className="flex flex-col items-center gap-3">
        <UploadCloud className="h-7 w-7 text-forest" />
        <div className="space-y-1">
          <p className="text-15 font-medium text-ink">{title}</p>
          <p className="text-13 text-mute">{description}</p>
        </div>
        <Button size="md" variant="secondary">
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
