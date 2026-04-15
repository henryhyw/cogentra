"use client";

import { create } from "zustand";
import type { ArtifactKind, AssignmentFamily } from "@oralv/types";

interface DraftFile {
  file: File;
  kind: ArtifactKind;
}

interface IntakeState {
  title: string;
  description: string;
  courseName: string;
  assignmentFamily: AssignmentFamily;
  files: DraftFile[];
  setMeta: (payload: {
    title: string;
    description: string;
    courseName: string;
    assignmentFamily: AssignmentFamily;
  }) => void;
  addFiles: (payload: DraftFile[]) => void;
  updateKind: (filename: string, kind: ArtifactKind) => void;
  reset: () => void;
}

export const useIntakeStore = create<IntakeState>((set) => ({
  title: "",
  description: "",
  courseName: "",
  assignmentFamily: "report",
  files: [],
  setMeta: (payload) => set(payload),
  addFiles: (payload) => set((state) => ({ files: [...state.files, ...payload] })),
  updateKind: (filename, kind) =>
    set((state) => ({
      files: state.files.map((item) => (item.file.name === filename ? { ...item, kind } : item))
    })),
  reset: () =>
    set({
      title: "",
      description: "",
      courseName: "",
      assignmentFamily: "report",
      files: []
    })
}));
