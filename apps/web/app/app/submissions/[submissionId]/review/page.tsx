import { ReviewWorkspace } from "@/components/reviewer/review-workspace";

export default async function ReviewPage({
  params
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  return <ReviewWorkspace submissionId={submissionId} />;
}
