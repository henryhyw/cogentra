import { render, screen } from "@testing-library/react";

import { LandingView } from "@/components/marketing/landing-view";

describe("LandingView", () => {
  it("renders the product promise", () => {
    render(<LandingView />);
    expect(
      screen.getByText(/Turn submitted work into a defendable, asynchronous oral evidence workflow/i)
    ).toBeInTheDocument();
  });
});
