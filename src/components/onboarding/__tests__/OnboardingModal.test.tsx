import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingModal from "../OnboardingModal";

describe("OnboardingModal", () => {
  it("renders step 1 heading initially", () => {
    render(<OnboardingModal onComplete={vi.fn()} />);
    expect(screen.getByText(/let's get to know you/i)).toBeInTheDocument();
  });

  it("shows error when continuing with empty name", async () => {
    const user = userEvent.setup();
    render(<OnboardingModal onComplete={vi.fn()} />);
    await user.click(screen.getByText(/continue/i));
    expect(screen.getByRole("alert")).toHaveTextContent(/name/i);
  });

  it("advances to step 2 after entering a name", async () => {
    const user = userEvent.setup();
    render(<OnboardingModal onComplete={vi.fn()} />);
    await user.type(screen.getByLabelText(/your first name/i), "Aarav");
    await user.click(screen.getByText(/continue/i));
    expect(screen.getByText(/your exam journey/i)).toBeInTheDocument();
  });

  it("can go back from step 2 to step 1", async () => {
    const user = userEvent.setup();
    render(<OnboardingModal onComplete={vi.fn()} />);
    await user.type(screen.getByLabelText(/your first name/i), "Priya");
    await user.click(screen.getByText(/continue/i));
    await user.click(screen.getByText(/back/i));
    expect(screen.getByText(/let's get to know you/i)).toBeInTheDocument();
  });

  it("renders all exam type options in step 2", async () => {
    const user = userEvent.setup();
    render(<OnboardingModal onComplete={vi.fn()} />);
    await user.type(screen.getByLabelText(/your first name/i), "Rahul");
    await user.click(screen.getByText(/continue/i));
    ["JEE", "NEET", "CUET", "CAT", "GATE", "UPSC", "OTHER"].forEach((exam) => {
      expect(screen.getByText(exam)).toBeInTheDocument();
    });
  });

  it("selects an exam type and reflects aria-pressed", async () => {
    const user = userEvent.setup();
    render(<OnboardingModal onComplete={vi.fn()} />);
    await user.type(screen.getByLabelText(/your first name/i), "Sneha");
    await user.click(screen.getByText(/continue/i));
    const neetBtn = screen.getByRole("button", { name: "NEET" });
    await user.click(neetBtn);
    expect(neetBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onComplete with a valid profile when form is submitted", async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<OnboardingModal onComplete={onComplete} />);
    await user.type(screen.getByLabelText(/your first name/i), "Aarav");
    await user.click(screen.getByText(/continue/i));
    await user.click(screen.getByText(/start my journey/i));
    expect(onComplete).toHaveBeenCalledOnce();
    const profile = onComplete.mock.calls[0]?.[0];
    expect(profile.displayName).toBe("Aarav");
    expect(profile.id).toBeTruthy();
    expect(profile.createdAt).toBeTruthy();
  });

  it("has role=dialog with aria-modal=true", () => {
    render(<OnboardingModal onComplete={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("renders the progress bar steps", () => {
    render(<OnboardingModal onComplete={vi.fn()} />);
    expect(screen.getByLabelText(/step 1 completed/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/step 2 pending/i)).toBeInTheDocument();
  });
});
