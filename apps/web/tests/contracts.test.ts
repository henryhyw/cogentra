import { assignmentSchema, resultSchema } from "@concentra/schemas";
import { describe, expect, it } from "vitest";

describe("Concentra schemas", () => {
  it("accepts an assignment summary payload", () => {
    const assignment = assignmentSchema.parse({
      id: "assignment_demo",
      title: "Demo assignment",
      family: "report_essay",
      description: "",
      status: "ready",
      createdBy: "user_demo",
      createdAt: "2026-04-16T00:00:00Z",
      updatedAt: "2026-04-16T00:00:00Z",
      sessionDefaults: {
        questionCount: 6,
        answerDurationSeconds: 120,
        allowRerecord: true,
        responseMode: "audio_only",
      },
      verificationGoals: [],
      aiSummary: "Demo summary",
      aiSummaryConfidence: 0.9,
      assignmentUnderstanding: {
        assignmentSummary: "Demo summary",
        assignmentFamily: "report_essay",
        verificationGoals: [],
        expectedSubmissionCharacteristics: [],
        defensibleAreas: [],
        verificationDimensions: [],
        preferredQuestionTypes: [],
        avoidQuestionTypes: [],
        reviewerFocusAdvice: [],
        explainability: {
          why: "seed",
          referencedSources: [],
          modelConfidence: 0.8,
          signals: [],
        },
      },
      artifactCount: 1,
      caseCount: 2,
      completedSessionCount: 1,
      pendingReviewCount: 1,
    });

    expect(assignment.title).toBe("Demo assignment");
  });

  it("accepts a result payload", () => {
    const result = resultSchema.parse({
      executiveSummary: "Summary",
      reviewPriority: "medium",
      recommendedAction: "Follow-up clarification suggested",
      focusPointStatuses: [],
      evidenceCards: [],
      inconsistencies: [],
      perQuestionBreakdown: [],
      finalReviewerNote: "",
      reviewedAt: null,
      reviewedBy: null,
    });

    expect(result.reviewPriority).toBe("medium");
  });
});
