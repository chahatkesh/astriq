export type KundliDraftContext = {
  subjectName?: string;
  birthDate?: string;
  birthTime?: string;
  placeName?: string;
  latitude?: string;
  longitude?: string;
  timeZone?: string;
  timezoneOffsetMinutes?: string;
};

export function encodeDraftContext(draft: KundliDraftContext) {
  const payload = JSON.stringify(draft);
  return encodeBase64Url(payload);
}

export function decodeDraftContext(
  token: string | null | undefined,
): KundliDraftContext | null {
  if (!token) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(token)) as KundliDraftContext;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function encodeBase64Url(input: string) {
  if (typeof btoa === "function") {
    const bytes = new TextEncoder().encode(input);
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }

    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  return Buffer.from(input, "utf8").toString("base64url");
}

function decodeBase64Url(input: string) {
  if (typeof atob === "function") {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  return Buffer.from(input, "base64url").toString("utf8");
}
