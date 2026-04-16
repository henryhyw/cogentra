import { afterEach, describe, expect, it, vi } from "vitest";

import { uploadFile } from "../lib/api";

describe("uploadFile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not assume a JSON response body for signed PUT uploads", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => null,
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadFile(
      "https://storage.googleapis.com/upload",
      new Blob(["audio"]),
      "audio/webm",
      { "x-goog-meta-demo": "1" },
    );

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://storage.googleapis.com/upload",
      expect.objectContaining({
        method: "PUT",
        body: expect.any(Blob),
        headers: expect.any(Headers),
      }),
    );
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Content-Type")).toBe("audio/webm");
    expect(headers.get("x-goog-meta-demo")).toBe("1");
  });

  it("returns parsed JSON when the upload endpoint responds with JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => "application/json",
      },
      json: vi.fn().mockResolvedValue({ ok: true, storagePath: "demo/path" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      uploadFile("http://localhost:8000/api/uploads/abc", new Blob(["demo"]), "audio/webm"),
    ).resolves.toEqual({ ok: true, storagePath: "demo/path" });
  });
});
