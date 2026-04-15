import { CaseDetail } from "@/components/app/case-detail";

export default async function CaseDetailPage({
  params
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return <CaseDetail caseId={caseId} />;
}
