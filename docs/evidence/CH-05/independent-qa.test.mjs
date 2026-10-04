// Independent mounted-UI acceptance cases that complement the worker's CH-05 suite.
// The imported module owns the existing Vite/Playwright harness and controlled Firebase aliases.
import assert from "node:assert/strict";
import { test } from "node:test";
import { screen, privacyEntry, incidentEntry, incidentDetails, expect } from "../../../../patternly-web/scripts/admin-behavior.test.mjs";

test("CH-05 QA stale privacy list cannot publish after account change when fetch ignores abort", async (t) => {
  const { page, state, login, ready } = await screen(t);
  await login();
  await ready();
  const panel = page.locator(".admin-privacy-queue");
  const oldAccount = privacyEntry("received", 1);
  oldAccount.narrative = "OLD ACCOUNT PRIVATE REQUEST";
  const currentAccount = { ...privacyEntry("received", 2), requestId: "pr_22222222-2222-4222-8222-222222222222", narrative: "CURRENT ACCOUNT PRIVATE REQUEST" };
  state.privacy = [oldAccount];
  await page.evaluate(() => {
    const originalFetch = window.fetch;
    window.ch05QaListCalls = 0;
    window.ch05QaOldSignal = null;
    window.fetch = (input, options) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.endsWith("/v1/admin/privacy-requests")) {
        window.ch05QaListCalls += 1;
        if (window.ch05QaListCalls === 1) {
          window.ch05QaOldSignal = options.signal;
          return new Promise((resolve) => {
            window.ch05QaReleaseOldList = () => resolve(new Response(JSON.stringify({ requests: window.ch05QaOldRows }), { headers: { "content-type": "application/json" } }));
          });
        }
      }
      return originalFetch(input, options);
    };
  });
  await panel.getByRole("button", { name: "Odśwież wnioski" }).click();
  await expect.poll(() => page.evaluate(() => window.ch05QaListCalls)).toBe(1);
  await page.evaluate((rows) => { window.ch05QaOldRows = rows; }, [oldAccount]);

  state.privacy = [currentAccount];
  await page.evaluate(() => adminTestAuth.emit("second-admin@example.test"));
  await expect.poll(() => page.evaluate(() => window.ch05QaListCalls)).toBe(2);
  await expect(panel.getByText("Wniosków: 1")).toBeVisible();
  assert.equal(await page.evaluate(() => window.ch05QaOldSignal.aborted), true);
  await page.evaluate(() => window.ch05QaReleaseOldList());
  await page.waitForTimeout(50);

  await expect(panel.getByRole("button", { name: "Otwórz szczegóły" })).toHaveCount(1);
  await expect(panel.getByRole("button", { name: "Odśwież wnioski" })).toBeEnabled();
  await panel.getByRole("button", { name: "Otwórz szczegóły" }).click();
  await expect(panel.getByText("CURRENT ACCOUNT PRIVATE REQUEST")).toBeVisible();
  await expect(panel.getByText("OLD ACCOUNT PRIVATE REQUEST")).toHaveCount(0);
});

test("CH-05 QA export body released after incident revision change has no download effect", async (t) => {
  const { page, state, login, ready } = await screen(t);
  await login();
  await ready();
  const panel = page.locator(".admin-security-queue");
  const incident = incidentDetails({ ...incidentEntry({ authorityDecision: "required", revision: 2 }), authorityExportVersion: 1 });
  state.incidents = [incidentEntry(incident)];
  state.incidentDetails[incident.incidentId] = incident;
  await panel.getByRole("button", { name: "Odśwież incydenty" }).click();
  await panel.getByRole("button", { name: "Otwórz szczegóły" }).click();
  await panel.locator("summary").filter({ hasText: "Eksport i ręczny dowód dla UODO" }).click();
  await page.evaluate(() => {
    const originalFetch = window.fetch;
    const createObjectURL = URL.createObjectURL.bind(URL);
    window.ch05QaDownloadEffects = { blobs: 0, clicks: 0 };
    URL.createObjectURL = (...args) => { window.ch05QaDownloadEffects.blobs += 1; return createObjectURL(...args); };
    document.addEventListener("click", (event) => { if (event.target?.closest?.("a[download]")) window.ch05QaDownloadEffects.clicks += 1; }, true);
    window.ch05QaExportSignal = null;
    window.fetch = (input, options) => {
      const url = typeof input === "string" ? input : input.url;
      if (!url.includes("/authority-exports/")) return originalFetch(input, options);
      window.ch05QaExportSignal = options.signal;
      return Promise.resolve({ ok: true, status: 200, json: () => new Promise((resolve) => {
        window.ch05QaReleaseExportBody = () => resolve({ payload: "{\"exact\":true}", digest: "d".repeat(43), version: 1 });
      }) });
    };
  });
  await panel.getByRole("button", { name: "Pobierz eksport UODO (wersja 1)" }).click();
  await expect.poll(() => page.evaluate(() => Boolean(window.ch05QaExportSignal))).toBe(true);

  state.handler = async (route) => {
    if (route.request().method() !== "PATCH" || !new URL(route.request().url()).pathname.endsWith(`/${incident.incidentId}`)) return false;
    const updated = { ...incident, classification: "breach_confirmed", revision: incident.revision + 1 };
    state.incidentDetails[incident.incidentId] = updated;
    state.incidents = [incidentEntry(updated)];
    await route.fulfill({ json: { incident: updated } });
    return true;
  };
  const decisions = panel.locator(".admin-incident-operation").filter({ hasText: "Decyzje" });
  const classificationForm = decisions.getByRole("group", { name: "Klasyfikacja" });
  await classificationForm.getByLabel("Klasyfikacja").selectOption("breach_confirmed");
  await classificationForm.getByLabel("Uzasadnienie").fill("Klasyfikacja aktualizuje rewizję incydentu.");
  await classificationForm.getByRole("button", { name: "Zapisz klasyfikację" }).click();
  await expect.poll(() => page.evaluate(() => window.ch05QaExportSignal.aborted)).toBe(true);
  await panel.locator("summary").filter({ hasText: "Eksport i ręczny dowód dla UODO" }).click();
  await expect(panel.getByRole("button", { name: "Pobierz eksport UODO (wersja 1)" })).toBeEnabled();
  await page.evaluate(() => window.ch05QaReleaseExportBody());
  await page.waitForTimeout(50);

  assert.deepEqual(await page.evaluate(() => window.ch05QaDownloadEffects), { blobs: 0, clicks: 0 });
  await expect(panel.getByText("Pobrano dokładny eksport UODO, wersja 1.")).toHaveCount(0);
});

test("CH-05 QA timed-out dispatched notification stays uncertain and cannot be resent after pending read", async (t) => {
  const { page, state, login, ready } = await screen(t);
  await login();
  await ready();
  const panel = page.locator(".admin-security-queue");
  const recipientPseudonym = "recipient-0000000000000000";
  const deliveryId = "22222222-2222-4222-8222-222222222222";
  const incident = incidentDetails({
    ...incidentEntry({ subjectDecision: "required", subjectNotificationStatus: "prepared", revision: 1, nextAction: "send_subject_notification" }),
    preparedRecipients: [{ recipientPseudonym, snapshotVersion: 1 }],
    subjectNotifications: [],
  });
  state.incidents = [incidentEntry({ ...incident, nextAction: "send_subject_notification" })];
  state.incidentDetails[incident.incidentId] = incident;
  await panel.getByRole("button", { name: "Odśwież incydenty" }).click();
  await panel.getByRole("button", { name: "Otwórz szczegóły" }).click();
  await panel.locator("summary").filter({ hasText: "Zawiadomienie osób" }).click();
  await page.clock.install();
  await page.evaluate((id) => {
    const originalFetch = window.fetch;
    window.ch05QaDispatchedWrites = 0;
    window.ch05QaWriteSignal = null;
    window.fetch = (input, options) => {
      const url = typeof input === "string" ? input : input.url;
      if (options?.method === "PATCH" && url.endsWith(`/v1/admin/security-incidents/${id}`)) {
        window.ch05QaDispatchedWrites += 1;
        window.ch05QaWriteSignal = options.signal;
        return new Promise(() => {});
      }
      return originalFetch(input, options);
    };
  }, incident.incidentId);
  const send = panel.getByRole("button", { name: "Wyślij zawiadomienie — adresat 1" });
  await send.click();
  await expect.poll(() => page.evaluate(() => window.ch05QaDispatchedWrites)).toBe(1);
  await expect(panel.getByRole("button", { name: "Odśwież incydenty" })).toBeDisabled();
  await page.clock.runFor(12001);
  await expect(panel.getByRole("button", { name: "Odśwież incydenty" })).toBeEnabled();
  assert.equal(await page.evaluate(() => window.ch05QaWriteSignal.aborted), true);
  await expect(panel.getByRole("alert")).toContainText("Wynik doręczenia jest niepewny");

  const pending = incidentDetails({
    ...incidentEntry({ subjectDecision: "required", subjectNotificationStatus: "pending", revision: 2, nextAction: "send_subject_notification" }),
    preparedRecipients: incident.preparedRecipients,
    subjectNotifications: [{ recipientPseudonym, snapshotVersion: 1, status: "pending", deliveryId }],
  });
  state.incidents = [incidentEntry({ ...pending, nextAction: "send_subject_notification" })];
  state.incidentDetails[incident.incidentId] = pending;
  await panel.getByRole("button", { name: "Odśwież incydenty" }).click();
  await panel.getByRole("button", { name: "Otwórz szczegóły" }).click();
  await panel.locator("summary").filter({ hasText: "Zawiadomienie osób" }).click();
  await expect(panel.getByRole("button", { name: /Adresat 1: W trakcie wysyłki/u })).toBeDisabled();
  await expect(panel.getByRole("button", { name: "Sprawdź statusy doręczeń" })).toBeEnabled();
  assert.equal(await page.evaluate(() => window.ch05QaDispatchedWrites), 1);
});
