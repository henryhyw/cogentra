import { SessionPlayer } from "@/components/student/session-player";

export default async function PublicSessionPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SessionPlayer token={token} />;
}
