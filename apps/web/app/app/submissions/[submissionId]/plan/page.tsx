import { PlanEditor } from "@/components/reviewer/plan-editor";

export default async function PlanPage({
  params
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  return <PlanEditor submissionId={submissionId} />;
}
