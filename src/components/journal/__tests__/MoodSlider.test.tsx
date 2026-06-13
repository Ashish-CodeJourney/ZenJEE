import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MoodSlider from "../MoodSlider";

describe("MoodSlider", () => {
  it("renders a range input with correct min/max", () => {
    render(<MoodSlider value={5} onChange={vi.fn()} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("min", "1");
    expect(slider).toHaveAttribute("max", "10");
  });

  it("displays the current mood label", () => {
    render(<MoodSlider value={5} onChange={vi.fn()} />);
    // score 5 = "calm"
    expect(screen.getByText(/calm/i)).toBeInTheDocument();
  });

  it("displays the correct label for overwhelmed (score 1)", () => {
    render(<MoodSlider value={1} onChange={vi.fn()} />);
    expect(screen.getByText(/overwhelmed/i)).toBeInTheDocument();
  });

  it("displays the correct label for excellent (score 10)", () => {
    render(<MoodSlider value={10} onChange={vi.fn()} />);
    expect(screen.getByText(/excellent/i)).toBeInTheDocument();
  });

  it("calls onChange when slider value changes", () => {
    const onChange = vi.fn();
    render(<MoodSlider value={5} onChange={onChange} />);
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "7" } });
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it("is disabled when disabled prop is true", () => {
    render(<MoodSlider value={5} onChange={vi.fn()} disabled />);
    expect(screen.getByRole("slider")).toBeDisabled();
  });

  it("has accessible aria attributes", () => {
    render(<MoodSlider value={6} onChange={vi.fn()} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuenow", "6");
    expect(slider).toHaveAttribute("aria-valuemin", "1");
    expect(slider).toHaveAttribute("aria-valuemax", "10");
  });

  it("has an accessible label", () => {
    render(<MoodSlider value={5} onChange={vi.fn()} />);
    expect(screen.getByLabelText(/how are you feeling/i)).toBeInTheDocument();
  });
});
