import { describe, expect, it } from "vitest";
import {
  isDevAutoAdminEnabled,
  isLocalSupabaseUrl,
} from "@/lib/auth/local-dev-admin";

describe("isLocalSupabaseUrl", () => {
  it("accepts localhost and loopback hosts", () => {
    expect(isLocalSupabaseUrl("http://127.0.0.1:55321")).toBe(true);
    expect(isLocalSupabaseUrl("http://localhost:54321")).toBe(true);
    expect(isLocalSupabaseUrl("http://[::1]:54321")).toBe(true);
  });

  it("rejects cloud / missing urls", () => {
    expect(isLocalSupabaseUrl(undefined)).toBe(false);
    expect(isLocalSupabaseUrl("https://xyz.supabase.co")).toBe(false);
    expect(isLocalSupabaseUrl("not-a-url")).toBe(false);
  });
});

describe("isDevAutoAdminEnabled", () => {
  it("is on for local supabase outside production", () => {
    expect(
      isDevAutoAdminEnabled({
        nodeEnv: "development",
        supabaseUrl: "http://127.0.0.1:55321",
      })
    ).toBe(true);
  });

  it("is off in production even with local url", () => {
    expect(
      isDevAutoAdminEnabled({
        nodeEnv: "production",
        supabaseUrl: "http://127.0.0.1:55321",
      })
    ).toBe(false);
  });

  it("can be disabled with DEV_AUTO_ADMIN=0", () => {
    expect(
      isDevAutoAdminEnabled({
        nodeEnv: "development",
        supabaseUrl: "http://127.0.0.1:55321",
        devAutoAdmin: "0",
      })
    ).toBe(false);
  });

  it("is off for cloud supabase", () => {
    expect(
      isDevAutoAdminEnabled({
        nodeEnv: "development",
        supabaseUrl: "https://xyz.supabase.co",
      })
    ).toBe(false);
  });
});
