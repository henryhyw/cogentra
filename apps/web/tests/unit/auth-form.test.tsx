import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { AuthForm } from "@/components/auth/auth-form";

const push = vi.fn();
const apiPost = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push })
}));

vi.mock("@/lib/api", () => ({
  apiPost: (...args: unknown[]) => apiPost(...args)
}));

describe("AuthForm", () => {
  it("submits login credentials and redirects", async () => {
    apiPost.mockResolvedValue({});
    render(<AuthForm mode="login" />);
    fireEvent.click(screen.getByRole("button", { name: /continue to workspace/i }));
    await waitFor(() => expect(apiPost).toHaveBeenCalled());
    expect(push).toHaveBeenCalledWith("/app");
  });
});
