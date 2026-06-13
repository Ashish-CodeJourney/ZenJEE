import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatView from "../ChatView";
import type { UserProfile } from "@/types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/hooks/useJournal", () => ({
  useJournal: () => ({ todayEntry: null, entries: [], isLoading: false }),
}));

const mockProfile: UserProfile = {
  id: "test-id",
  displayName: "Aarav",
  examType: "JEE",
  examDate: null,
  createdAt: "2024-01-01T00:00:00Z",
};

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ChatView", () => {
  it("renders welcome message with student name", () => {
    render(<ChatView profile={mockProfile} />);
    expect(screen.getByText(/Hi Aarav/i)).toBeInTheDocument();
  });

  it("renders starter prompt buttons", () => {
    render(<ChatView profile={mockProfile} />);
    expect(
      screen.getByText(/feeling really stressed about my upcoming exam/i)
    ).toBeInTheDocument();
  });

  it("renders the message input", () => {
    render(<ChatView profile={mockProfile} />);
    expect(screen.getByRole("textbox", { name: /message zenbot/i })).toBeInTheDocument();
  });

  it("send button is disabled when input is empty", () => {
    render(<ChatView profile={mockProfile} />);
    expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();
  });

  it("send button is enabled when input has text", async () => {
    const user = userEvent.setup();
    render(<ChatView profile={mockProfile} />);
    await user.type(screen.getByRole("textbox", { name: /message zenbot/i }), "Hello");
    expect(screen.getByRole("button", { name: /send message/i })).toBeEnabled();
  });

  it("sends message and displays reply", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: true, reply: "I hear you, take a breath." }),
    });

    const user = userEvent.setup();
    render(<ChatView profile={mockProfile} />);
    const input = screen.getByRole("textbox", { name: /message zenbot/i });
    await user.type(input, "I am stressed");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText("I am stressed")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("I hear you, take a breath.")).toBeInTheDocument();
    });
  });

  it("shows error message when API returns failure", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: false, error: "Service unavailable." }),
    });

    const user = userEvent.setup();
    render(<ChatView profile={mockProfile} />);
    await user.type(
      screen.getByRole("textbox", { name: /message zenbot/i }),
      "Help me please"
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Service unavailable.");
    });
  });

  it("clears conversation when New chat is clicked", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: true, reply: "Hello there." }),
    });

    const user = userEvent.setup();
    render(<ChatView profile={mockProfile} />);
    await user.type(
      screen.getByRole("textbox", { name: /message zenbot/i }),
      "Test message"
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => screen.getByText("Hello there."));
    await user.click(screen.getByRole("button", { name: /start a new conversation/i }));

    expect(screen.queryByText("Test message")).not.toBeInTheDocument();
  });

  it("clears input after sending", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: true, reply: "Got it." }),
    });

    const user = userEvent.setup();
    render(<ChatView profile={mockProfile} />);
    const input = screen.getByRole("textbox", { name: /message zenbot/i });
    await user.type(input, "Clear me");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });

  it("has accessible conversation log", () => {
    render(<ChatView profile={mockProfile} />);
    expect(screen.getByRole("log", { name: /conversation with zenbot/i })).toBeInTheDocument();
  });

  it("shows disclaimer footer", () => {
    render(<ChatView profile={mockProfile} />);
    expect(screen.getByText(/wellness aid/i)).toBeInTheDocument();
  });
});
