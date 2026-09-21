import assert from "node:assert/strict";
import test from "node:test";
import { validateAccountSettingsPayload } from "../src/lib/account-settings-validation.ts";

test("accepts and trims a valid display name", () => {
  assert.deepEqual(validateAccountSettingsPayload({ name: "  Htet Ko Oo  " }), {
    ok: true,
    name: "Htet Ko Oo",
  });
});

test("rejects non-object account settings payloads", () => {
  assert.deepEqual(validateAccountSettingsPayload(null), {
    ok: false,
    error: "Invalid request body.",
  });
  assert.deepEqual(validateAccountSettingsPayload([]), {
    ok: false,
    error: "Invalid request body.",
  });
});

test("rejects attempts to change protected account fields", () => {
  assert.deepEqual(
    validateAccountSettingsPayload({ name: "Student One", role: "ADMIN" }),
    { ok: false, error: "Unexpected field: role." },
  );
});

test("requires a string display name", () => {
  assert.deepEqual(validateAccountSettingsPayload({ name: 123 }), {
    ok: false,
    error: "Name is required.",
  });
});

test("enforces display name length after trimming", () => {
  assert.equal(validateAccountSettingsPayload({ name: " A " }).ok, false);
  assert.equal(validateAccountSettingsPayload({ name: "A".repeat(81) }).ok, false);
});
