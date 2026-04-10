import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home landing page", () => {
  it("renders the stitched hero headline and primary CTA", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /desata\s+poder puro/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ver planes/i }),
    ).toBeInTheDocument();
  });
});
