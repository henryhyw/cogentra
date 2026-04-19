import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import IconButton from "../../components/IconButton";
import Modal from "../../components/Modal";
import Select from "../../components/Select";
import { getVerificationGoalsByAssignmentId } from "../../data/mock";

export default function Goals() {
  const { id = "" } = useParams();
  const [goals, setGoals] = useState(getVerificationGoalsByAssignmentId(id));
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-22 text-ink">Verification goals</h2>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setGoals((current) => [
          ...current,
          {
            id: `goal-new-${current.length + 1}`,
            assignmentId: id,
            priority: "Medium",
            text: "Add a new verification goal.",
          },
        ])}>
          Add goal
        </Button>
      </div>
      <div className="space-y-4">
        {goals.map((goal, index) => (
          <Card key={goal.id} unstyled>
            <div className="grid gap-4 px-5 py-4 md:grid-cols-[24px_32px_minmax(0,1fr)_180px_40px] md:items-start">
              <GripVertical className="mt-2 h-4 w-4 text-mute" />
              <span className="mono inline-flex h-8 w-8 items-center justify-center rounded-sm2 bg-hover text-13 text-ink">
                {index + 1}
              </span>
              <textarea
                className="min-h-[72px] w-full resize-none border-0 bg-transparent pt-1 text-15 text-ink focus:outline-none"
                onChange={(event) =>
                  setGoals((current) =>
                    current.map((item) => (item.id === goal.id ? { ...item, text: event.target.value } : item)),
                  )
                }
                value={goal.text}
              />
              <Select
                onChange={(event) =>
                  setGoals((current) =>
                    current.map((item) =>
                      item.id === goal.id
                        ? { ...item, priority: event.target.value as "High" | "Medium" | "Low" }
                        : item,
                    ),
                  )
                }
                options={[
                  { label: "Priority: High", value: "High" },
                  { label: "Priority: Medium", value: "Medium" },
                  { label: "Priority: Low", value: "Low" },
                ]}
                value={goal.priority}
              />
              <IconButton aria-label="Delete goal" onClick={() => setGoalToDelete(goal.id)}>
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          </Card>
        ))}
      </div>
      <Modal
        footer={
          <>
            <Button onClick={() => setGoalToDelete(null)} variant="ghost">
              Cancel
            </Button>
            <Button
              onClick={() => {
                setGoals((current) => current.filter((goal) => goal.id !== goalToDelete));
                setGoalToDelete(null);
              }}
              variant="danger"
            >
              Delete goal
            </Button>
          </>
        }
        isOpen={Boolean(goalToDelete)}
        onClose={() => setGoalToDelete(null)}
        title="Delete verification goal?"
      >
        <p className="text-14 text-mute">This removes the goal from the assignment setup.</p>
      </Modal>
    </div>
  );
}
