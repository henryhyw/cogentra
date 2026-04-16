"use client";

import { CheckCircle2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Card, EmptyState } from "@concentra/ui";

import { api } from "@/lib/api";

export default function SessionCompletePage() {
  const params = useParams<{ sessionToken: string }>();
  const sessionToken = params.sessionToken;
  const sessionQuery = useQuery({
    queryKey: ["session-complete", sessionToken],
    queryFn: () => api.session(sessionToken),
  });

  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-3xl">
        {sessionQuery.data ? (
          <Card className="p-8 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 text-success-foreground">
              <CheckCircle2 className="size-8" />
            </div>
            <p className="mt-6 text-3xl font-semibold text-foreground">Session submitted</p>
            <p className="mt-3 text-base text-muted-foreground">
              Your responses for <span className="text-foreground">{sessionQuery.data.assignment.title}</span> have been submitted successfully.
            </p>
            <p className="mt-5 text-sm text-muted-foreground">
              You can close this page. Your reviewer now has the submitted responses in their review workspace.
            </p>
          </Card>
        ) : (
          <EmptyState
            title="Session complete"
            description="Your responses were submitted. You can safely close this page."
          />
        )}
      </div>
    </div>
  );
}
