import { describe, expect, it } from "vitest";
import {
  defaultLocale,
  getSupportedLocale,
  isSupportedLocale,
  localeCodes,
} from "@/lib/i18n/locales";

describe("locale routing helpers", () => {
  it("recognizes supported locale codes", () => {
    expect(isSupportedLocale("hi")).toBe(true);
    expect(isSupportedLocale("en")).toBe(true);
  });

  it("rejects unknown or non-locale path segments", () => {
    expect(isSupportedLocale("api")).toBe(false);
    expect(isSupportedLocale("")).toBe(false);
    expect(isSupportedLocale("xx")).toBe(false);
  });

  it("exposes every locale code and includes the default", () => {
    expect(localeCodes).toContain(defaultLocale);
    expect(localeCodes.every((code) => isSupportedLocale(code))).toBe(true);
  });

  it("falls back to the default locale for unknown codes", () => {
    expect(getSupportedLocale("zz").code).toBe(defaultLocale);
  });
});
