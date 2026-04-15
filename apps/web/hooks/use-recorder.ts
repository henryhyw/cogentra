"use client";

import { useEffect, useRef, useState } from "react";

type RecorderStatus = "idle" | "recording" | "ready" | "error";

export function useRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [previewUrl]);

  async function start() {
    try {
      setError(null);
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const nextBlob = new Blob(chunksRef.current, { type: "video/webm" });
        setBlob(nextBlob);
        const url = URL.createObjectURL(nextBlob);
        setPreviewUrl(url);
        setStatus("ready");
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus("recording");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Camera or microphone unavailable");
      setStatus("error");
    }
  }

  function stop() {
    mediaRecorderRef.current?.stop();
  }

  function reset() {
    setBlob(null);
    setPreviewUrl(null);
    setStatus("idle");
    setError(null);
  }

  return {
    supported: typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia,
    status,
    error,
    blob,
    previewUrl,
    start,
    stop,
    reset
  };
}
