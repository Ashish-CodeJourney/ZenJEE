import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "../Dashboard";
import type { UserProfile, JournalEntry } from "@/types";

// ---------------------------------------------------------------------------
// Mock useJournal so Dashboard is testable without real localStorage
// ---------------------------------------------------------------------------

const mockEntries: JournalEntry[] = [
  {
    id: "1",
    date: new Date().toISOString().split("T")[0]!,
    content: "Feeling good today",
    moodScore: 7,
    moodLabel: "focused",
    tags: [],
    analysis: {
      sentiment: "positive",
      sentimentIntensity: 0.6,
      stressTriggers: [{ trigger: "Mock pressure", severity: "mild", category: "academic" }],
      emotionalPatterns: [],
      copingStrategies: [],
      mindfulnessExercise: {
        id: "e1",
        title: "Box Breathing",
        description: "desc",
        durationMinutes: 5,
        type: "breathing",
        instructions: [],
      },
      motivationalMessage: "Great work!",
      crisisDetected: false,
      summary: "Positive entry",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

vi.mock("@/hooks/useJournal", () => ({
  useJournal: () => ({
    entries: mockEntries,
    todayEntry: mockEntries[0],
    isLoading: false,
  }),
}));

const mockProfile: UserProfile = {
  id: "test-id",
  displayName: "Aarav",
  examType: "JEE",
  examDate: "2027-04-15", // far future so daysLeft > 0 always
  createdAt: "2024-01-01T00:00:00Z",
};

describe("Dashboard", () => {
  it("renders a greeting with the student name", () => {
    render(<Dashboard profile={mockProfile} onNavigate={vi.fn()} />);
    expect(screen.getByText(/Aarav/)).toBeInTheDocument();
  });

  it("shows exam countdown when examDate is set", () => {
    render(<Dashboard profile={mockProfile} onNavigate={vi.fn()} />);
    // The <p> tag renders a unified string: "JEE in X days"
    expect(screen.getByText(/JEE in \d+ days/i)).toBeInTheDocument();
  });

  it("shows total entries count stat card", () => {
    render(<Dashboard profile={mockProfile} onNavigate={vi.fn()} />);
    // "Entries" label uniquely identifies the stat card
    expect(screen.getByText("Entries")).toBeInTheDocument();
  });

  it("shows quick action buttons", () => {
    render(<Dashboard profile={mockProfile} onNavigate={vi.fn()} />);
    expect(screen.getByText(/talk to zenbot/i)).toBeInTheDocument();
    expect(screen.getByText(/mindfulness/i)).toBeInTheDocument();
  });

  it("navigates to journal when Write button is clicked", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<Dashboard profile={mockProfile} onNavigate={onNavigate} />);
    await user.click(screen.getByText(/edit journal/i));
    expect(onNavigate).toHaveBeenCalledWith("journal");
  });

  it("navigates to chat when ZenBot button is clicked", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<Dashboard profile={mockProfile} onNavigate={onNavigate} />);
    await user.click(screen.getByText(/talk to zenbot/i));
    expect(onNavigate).toHaveBeenCalledWith("chat");
  });

  it("navigates to mindfulness when Mindfulness button is clicked", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<Dashboard profile={mockProfile} onNavigate={onNavigate} />);
    await user.click(screen.getByText(/mindfulness/i));
    expect(onNavigate).toHaveBeenCalledWith("mindfulness");
  });

  it("shows stress triggers when analysis data exists", () => {
    render(<Dashboard profile={mockProfile} onNavigate={vi.fn()} />);
    expect(screen.getByText("Mock pressure")).toBeInTheDocument();
  });

  it("shows journalled today message when todayEntry exists", () => {
    render(<Dashboard profile={mockProfile} onNavigate={vi.fn()} />);
    expect(screen.getByText(/you've journalled today/i)).toBeInTheDocument();
  });
});
