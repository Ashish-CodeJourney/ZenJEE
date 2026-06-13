import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MindfulnessView from "../MindfulnessView";

describe("MindfulnessView", () => {
  it("renders the page heading", () => {
    render(<MindfulnessView />);
    expect(screen.getByRole("heading", { name: /mindfulness library/i })).toBeInTheDocument();
  });

  it("renders all exercise cards", () => {
    render(<MindfulnessView />);
    expect(screen.getByText("Box Breathing")).toBeInTheDocument();
    expect(screen.getByText("5-4-3-2-1 Grounding")).toBeInTheDocument();
    expect(screen.getByText("Quick Body Scan")).toBeInTheDocument();
    expect(screen.getByText("2-Minute Confidence Reset")).toBeInTheDocument();
    expect(screen.getByText("Success Visualisation")).toBeInTheDocument();
    expect(screen.getByText("4-7-8 Breathing")).toBeInTheDocument();
  });

  it("shows exercise instructions when Start is clicked", async () => {
    const user = userEvent.setup();
    render(<MindfulnessView />);
    const startButtons = screen.getAllByText(/start exercise/i);
    await user.click(startButtons[0]!);
    // Box Breathing first instruction
    expect(
      screen.getByText(/sit comfortably with your back straight/i)
    ).toBeInTheDocument();
  });

  it("collapses instructions when Close is clicked", async () => {
    const user = userEvent.setup();
    render(<MindfulnessView />);
    const startButtons = screen.getAllByText(/start exercise/i);
    await user.click(startButtons[0]!);
    const closeBtn = screen.getByText(/^close$/i);
    await user.click(closeBtn);
    expect(
      screen.queryByText(/sit comfortably with your back straight/i)
    ).not.toBeInTheDocument();
  });

  it("marks exercise as done and shows badge", async () => {
    const user = userEvent.setup();
    render(<MindfulnessView />);
    const startButtons = screen.getAllByText(/start exercise/i);
    await user.click(startButtons[0]!);
    const markDone = screen.getByText(/mark as done/i);
    await user.click(markDone);
    expect(screen.getByText(/done today/i)).toBeInTheDocument();
  });

  it("filters exercises by type", async () => {
    const user = userEvent.setup();
    render(<MindfulnessView />);
    const breathingFilter = screen.getByRole("button", { name: /^breathing$/i });
    await user.click(breathingFilter);
    // Box Breathing and 4-7-8 are breathing; Body Scan is meditation
    expect(screen.getByText("Box Breathing")).toBeInTheDocument();
    expect(screen.getByText("4-7-8 Breathing")).toBeInTheDocument();
    expect(screen.queryByText("Quick Body Scan")).not.toBeInTheDocument();
  });

  it("shows all exercises when All filter is active", async () => {
    const user = userEvent.setup();
    render(<MindfulnessView />);
    // Switch to breathing then back to all
    await user.click(screen.getByRole("button", { name: /^breathing$/i }));
    await user.click(screen.getByRole("button", { name: /^all$/i }));
    expect(screen.getByText("Quick Body Scan")).toBeInTheDocument();
  });

  it("filter buttons have aria-pressed reflecting active state", async () => {
    const user = userEvent.setup();
    render(<MindfulnessView />);
    const allBtn = screen.getByRole("button", { name: /^all$/i });
    expect(allBtn).toHaveAttribute("aria-pressed", "true");
    const breathingBtn = screen.getByRole("button", { name: /^breathing$/i });
    await user.click(breathingBtn);
    expect(breathingBtn).toHaveAttribute("aria-pressed", "true");
    expect(allBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("shows duration for each exercise", () => {
    render(<MindfulnessView />);
    expect(screen.getByText("5 min")).toBeInTheDocument(); // Box Breathing
    expect(screen.getByText("3 min")).toBeInTheDocument(); // 5-4-3-2-1
  });
});
