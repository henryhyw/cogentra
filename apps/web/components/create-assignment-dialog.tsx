"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@concentra/ui";

import { api } from "@/lib/api";

const options = [
  { value: "report_essay", label: "Report / Essay" },
  { value: "presentation_slides", label: "Presentation / Slides" },
  { value: "technical_notebook", label: "Technical / Notebook" },
  { value: "mixed_submission", label: "Mixed Submission" },
];

export function CreateAssignmentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [family, setFamily] = useState(options[0]?.value ?? "report_essay");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      const assignment = await api.createAssignment({ title, family, description });
      toast.success("Assignment created");
      onOpenChange(false);
      onCreated?.();
      startTransition(() => {
        router.push(`/assignments/${assignment.id}`);
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create assignment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Assignment</DialogTitle>
          <DialogDescription>
            Start an assignment workspace, then add artifacts and import student submissions directly inside it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Assignment title</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Sustainability impact report" />
          </div>
          <div className="space-y-2">
            <Label>Assignment family</Label>
            <Select value={family} onValueChange={setFamily}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a family" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Short description</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional note for reviewers and import context."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button loading={loading} onClick={handleSubmit} disabled={!title.trim()}>
              Create assignment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
