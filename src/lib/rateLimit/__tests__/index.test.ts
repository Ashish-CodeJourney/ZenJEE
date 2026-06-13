import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit, getClientIp } from "../index";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows first request", () => {
    const result = checkRateLimit("ip-1", 5, 60_000);
    expect(result.allowed).toBe(true);
  });

  it("allows requests up to the limit", () => {
    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit("ip-2", 5, 60_000);
      expect(r.allowed).toBe(true);
    }
  });

  it("blocks requests exceeding the limit", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("ip-3", 5, 60_000);
    const result = checkRateLimit("ip-3", 5, 60_000);
    expect(result.allowed).toBe(false);
  });

  it("resets after the window expires", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("ip-4", 5, 60_000);
    vi.advanceTimersByTime(61_000);
    const result = checkRateLimit("ip-4", 5, 60_000);
    expect(result.allowed).toBe(true);
  });

  it("returns retryAfterMs when blocked", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("ip-5", 5, 60_000);
    const result = checkRateLimit("ip-5", 5, 60_000);
    if (!result.allowed) {
      expect(result.retryAfterMs).toBeGreaterThan(0);
    }
  });
});

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for header", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "9.8.7.6" },
    });
    expect(getClientIp(req)).toBe("9.8.7.6");
  });

  it("returns 'unknown' when no IP header present", () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("unknown");
  });
});
