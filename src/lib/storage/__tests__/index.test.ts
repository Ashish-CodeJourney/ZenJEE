import { describe, it, expect, vi } from "vitest";
import { storageGet, storageSet, storageRemove, storageClearAll } from "../index";
import type { UserProfile } from "@/types";

const mockProfile: UserProfile = {
  id: "test-id",
  displayName: "Aarav",
  examType: "JEE",
  examDate: "2025-04-15",
  createdAt: "2024-01-01T00:00:00Z",
};

describe("storageGet", () => {
  it("returns defaultValue when key is absent", () => {
    expect(storageGet("zenjee:profile", null)).toBeNull();
  });

  it("returns stored value after storageSet", () => {
    storageSet("zenjee:profile", mockProfile);
    expect(storageGet("zenjee:profile", null)).toEqual(mockProfile);
  });

  it("returns defaultValue when stored JSON is malformed", () => {
    vi.spyOn(window.localStorage, "getItem").mockReturnValueOnce("{invalid json}");
    expect(storageGet("zenjee:profile", null)).toBeNull();
  });
});

describe("storageSet", () => {
  it("persists arrays", () => {
    storageSet("zenjee:journal", []);
    expect(storageGet("zenjee:journal", [])).toEqual([]);
  });
});

describe("storageRemove", () => {
  it("removes a key so subsequent get returns default", () => {
    storageSet("zenjee:profile", mockProfile);
    storageRemove("zenjee:profile");
    expect(storageGet("zenjee:profile", null)).toBeNull();
  });
});

describe("storageClearAll", () => {
  it("clears all zenjee keys", () => {
    storageSet("zenjee:profile", mockProfile);
    storageSet("zenjee:journal", []);
    storageClearAll();
    expect(storageGet("zenjee:profile", null)).toBeNull();
    expect(storageGet("zenjee:journal", [])).toEqual([]);
  });
});
