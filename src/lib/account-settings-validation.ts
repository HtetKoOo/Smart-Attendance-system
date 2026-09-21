const ALLOWED_KEYS = new Set(["name"]);

export type AccountSettingsValidationResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

export function validateAccountSettingsPayload(
  body: unknown,
): AccountSettingsValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Invalid request body." };
  }

  const payload = body as Record<string, unknown>;
  const unexpectedKey = Object.keys(payload).find(
    (key) => !ALLOWED_KEYS.has(key),
  );
  if (unexpectedKey) {
    return { ok: false, error: `Unexpected field: ${unexpectedKey}.` };
  }

  if (typeof payload.name !== "string") {
    return { ok: false, error: "Name is required." };
  }

  const name = payload.name.trim();
  if (name.length < 2 || name.length > 80) {
    return { ok: false, error: "Name must be between 2 and 80 characters." };
  }

  return { ok: true, name };
}
