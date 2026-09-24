import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("guest privacy request copy separates acceptance from unconfirmed email delivery", () => {
  const english = JSON.parse(readFileSync(new URL("../../locales/en/data.json", import.meta.url), "utf8")) as { guestPrivacy: { intro: string; pending: string } };
  const polish = JSON.parse(readFileSync(new URL("../../locales/pl/data.json", import.meta.url), "utf8")) as { guestPrivacy: { intro: string; pending: string } };

  assert.match(english.guestPrivacy.intro, /may be sent/u);
  assert.match(english.guestPrivacy.pending, /Request recorded/u);
  assert.match(english.guestPrivacy.pending, /delivery is not confirmed/u);
  assert.match(polish.guestPrivacy.intro, /może zostać wysłany/u);
  assert.match(polish.guestPrivacy.pending, /Wniosek zapisano/u);
  assert.match(polish.guestPrivacy.pending, /Dostarczenie wiadomości nie jest potwierdzone/u);
});
