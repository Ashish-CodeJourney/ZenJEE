import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AnalysisCard from "../AnalysisCard";
import type { JournalAnalysis } from "@/types";

const BASE_ANALYSIS: JournalAnalysis = {
  sentiment: "negative",
  sentimentIntensity: 0.7,
  stressTriggers: [
    { trigger: "Integration calculus", severity: "high", category: "academic" },
    { trigger: "Sleep deprivation", severity: "moderate", category: "physical" },
  ],
  emotionalPatterns: [{ pattern: "Catastrophising", frequency: "recurring" }],
  copingStrategies: [
    {
      id: "s1",
      title: "Take a walk",
      description: "A short walk resets your focus.",
      estimatedMinutes: 10,
      category: "physical",
      steps: ["Put on shoes", "Walk for 10 minutes", "Return refreshed"],
    },
  ],
  mindfulnessExercise: {
    id: "e1",
    title: "Box Breathing",
    description: "Calm your nervous system.",
    durationMinutes: 5,
    type: "breathing",
    instructions: ["Inhale 4", "Hold 4", "Exhale 4", "Hold 4"],
  },
  motivationalMessage: "You recognised you are struggling — that takes real courage.",
  crisisDetected: false,
  summary: "The student is experiencing high academic stress.",
};

describe("AnalysisCard", () => {
  it("renders the motivational message", () => {
    render(<AnalysisCard analysis={BASE_ANALYSIS} />);
    expect(
      screen.getByText(/You recognised you are struggling/i)
    ).toBeInTheDocument();
  });

  it("renders the summary", () => {
    render(<AnalysisCard analysis={BASE_ANALYSIS} />);
    expect(screen.getByText(/high academic stress/i)).toBeInTheDocument();
  });

  it("renders stress trigger badges", () => {
    render(<AnalysisCard analysis={BASE_ANALYSIS} />);
    expect(screen.getByText("Integration calculus")).toBeInTheDocument();
    expect(screen.getByText("Sleep deprivation")).toBeInTheDocument();
  });

  it("renders the mindfulness exercise title and instructions", () => {
    render(<AnalysisCard analysis={BASE_ANALYSIS} />);
    expect(screen.getByText("Box Breathing")).toBeInTheDocument();
    expect(screen.getByText("Inhale 4")).toBeInTheDocument();
  });

  it("renders coping strategy title", () => {
    render(<AnalysisCard analysis={BASE_ANALYSIS} />);
    expect(screen.getByText("Take a walk")).toBeInTheDocument();
  });

  it("expands coping strategy steps on click", async () => {
    const user = userEvent.setup();
    render(<AnalysisCard analysis={BASE_ANALYSIS} />);
    const summary = screen.getByText("Take a walk").closest("summary");
    expect(summary).not.toBeNull();
    if (summary) {
      await user.click(summary);
      expect(screen.getByText("Put on shoes")).toBeInTheDocument();
    }
  });

  it("does NOT render crisis banner when crisisDetected is false", () => {
    render(<AnalysisCard analysis={BASE_ANALYSIS} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renders crisis banner with hotlines when crisisDetected is true", () => {
    const crisisAnalysis: JournalAnalysis = {
      ...BASE_ANALYSIS,
      crisisDetected: true,
      motivationalMessage:
        "Please reach out: iCall – 9152987821 | Vandrevala Foundation – 1860-2662-345",
    };
    render(<AnalysisCard analysis={crisisAnalysis} />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("iCall");
    expect(alert).toHaveTextContent("Vandrevala Foundation");
    expect(alert).toHaveTextContent("NIMHANS");
  });

  it("renders exercise duration", () => {
    render(<AnalysisCard analysis={BASE_ANALYSIS} />);
    expect(screen.getByText("5 min")).toBeInTheDocument();
  });

  it("renders all exercise instruction steps", () => {
    render(<AnalysisCard analysis={BASE_ANALYSIS} />);
    // "Hold 4" appears twice in the instructions array, so use getAllByText
    expect(screen.getByText("Inhale 4")).toBeInTheDocument();
    expect(screen.getAllByText("Hold 4").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Exhale 4")).toBeInTheDocument();
  });
});
