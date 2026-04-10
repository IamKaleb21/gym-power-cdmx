import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home landing page", () => {
  it("renders the stitched hero headline and primary CTA", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /unleash raw power/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /join the tribe/i }),
    ).toBeInTheDocument();
  });
});
