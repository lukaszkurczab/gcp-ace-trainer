import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const React = require('react');
const { act, create } = require('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const presentation = require('./practiceSessionPresentation.ts');
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
function projection(kind = 'unanswered', ordinal = 1, sessionId = 'session') {
  return { session: { id: sessionId, configurationSnapshot: {}, itemOrder: [{ occurrenceId: 'occurrence-1', item: {} }, { occurrenceId: 'occurrence-2', item: {} }], currentItemIndex: ordinal - 1, actualLength: 2, modeId: 'certification-focus-practice', trackId: 'aws' }, question: { interaction: { type: 'choice_single' } }, questionPresentation: { variant: 'ordinary' }, occurrenceId: `occurrence-${ordinal}`, ordinal, total: 2, elapsedForegroundMs: 0, operation: { kind }, response: kind === 'feedback' ? { value: { type: 'choice_single', optionId: 'a' } } : null, feedback: null };
}
function fixture(initial = projection()) {
  let profile = {}, current = initial, command = deferred(), read = null, refresh, operation;
  let calls = 0, completeCalls = 0, replacements = [], spans = [];
  const api = {
    openCertificationPracticeSession: async () => ({ kind: 'ready', projection: current }),
    enterCertificationPracticeForeground: async () => {}, leaveCertificationPracticeForeground: async () => {},
    getCertificationPracticeProjection: async () => read ? read.promise : current,
    subscribeCertificationPracticeProjectionRefresh: fn => { refresh = fn; return () => { refresh = null; }; },
    subscribeCertificationPracticeOperation: (_id, fn) => { operation = fn; return () => { operation = null; }; },
    submitCertificationPracticeResponse: () => { calls++; return command.promise; },
    retryCertificationPracticeResponse: () => { calls++; return command.promise; },
    advanceCertificationPracticeSession: () => { calls++; return command.promise; },
    completeCertificationPracticeSession: () => { completeCalls++; return command.promise; },
  };
  const code = ts.transpileModule(readFileSync('src/features/practice/CertificationPracticeSessionScreen.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name === '../../application/certification') return api;
    if (name === '../../application/profileReadFence') return { captureProfileReadFence: () => { const expected = profile; return () => { if (expected !== profile) throw Error('profile changed'); }; } };
    if (name.endsWith('/startupTrace')) return { markStartup() {}, beginStartupSpan: stage => { const entry = { stage, ends: 0 }; spans.push(entry); return () => entry.ends++; } };
    if (name === '@react-navigation/native') return { usePreventRemove() {} };
    if (name === 'react-i18next') return { useTranslation: () => ({ t: text => text }) };
    if (name === 'react-native') return { AppState: { addEventListener: () => ({ remove() {} }) } };
    if (name === '../../application/operationalDiagnostics') return { describeOperationalFailure: (_cause, text) => text };
    if (name === '../../components') return { Screen: 'Screen', EmptyState: 'EmptyState', Button: 'Button' };
    if (name === '../../constants') return { ROUTES: { PRACTICE_SESSION: 'PracticeSession', RESULT: 'Result', PRACTICE_HUB: 'Hub' } };
    if (name === '../../tracks/certification') return { isCertificationPracticeModeId: () => true, getCertificationMode: () => ({ title: 'Practice' }) };
    if (name === '../../domain') return { getTrackRegistration: () => ({ familyId: 'certification' }) };
    if (name === './practiceSessionPresentation') return presentation;
    if (name === './PracticeSessionSurface') return { PracticeSessionSurface: 'Surface', PracticeSessionLoadingSkeleton: 'Skeleton' };
    if (name === './canonicalQuestionViewModel') return { toCanonicalQuestionViewModel: () => ({ itemId: 'item', prompt: '', interaction: { interactionType: 'choice_single', model: { renderer: { kind: 'choice', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] } } } }) };
    if (name === './sessionConfig') return { buildCertificationPracticeTarget: () => ({}) };
    return require(name);
  } });
  let tree, route = { key: 'route', params: { mode: 'certification-focus-practice', trackId: 'aws' } };
  const navigation = { replace: (...args) => replacements.push(args), navigate() {}, dispatch() {}, canGoBack: () => false };
  const element = () => React.createElement(module.exports.CertificationPracticeSessionScreen, { route, navigation });
  return {
    async mount() { await act(async () => { tree = create(element()); }); },
    surface: () => tree.root.findByType('Surface').props,
    error: () => tree.root.findAllByType('EmptyState')[0]?.props,
    calls: () => calls, completeCalls: () => completeCalls, replacements, spans,
    async select() { await act(async () => this.surface().onChoicePress('a')); },
    async press() { await act(async () => this.surface().onPrimaryAction()); },
    async periodic(next) { current = next; await act(async () => refresh?.({ sessionId: next.session.id })); },
    holdRead() { read = deferred(); },
    async resolveRead(next) { current = next; await act(async () => { read.resolve(next); }); read = null; },
    async resolveReadWithPeriodic(next) {
      await act(async () => {
        read.resolve(next);
        await Promise.resolve(); await Promise.resolve();
        current = { ...next, elapsedForegroundMs: 999 };
        refresh?.({ sessionId: next.session.id });
      }); read = null;
    },
    async rejectRead() { await act(async () => { read.reject(Error('read')); }); read = null; },
    async resolve(value) { await act(async () => command.resolve(value)); },
    async reject() { await act(async () => command.reject(Error('command'))); },
    setCurrent(next) { current = next; },
    async changeRoute(next = projection('unanswered', 1, 'new-session')) { current = next; command = deferred(); route = { key: 'new-route', params: { ...route.params } }; await act(async () => tree.update(element())); },
    oldCommand: () => command,
    changeProfile() { profile = {}; },
    async notify(next) { await act(async () => operation?.(next)); },
    async unmount() { await act(async () => tree.unmount()); },
  };
}

test('one Submit freezes real rendered surface and queued callbacks until post-command commit', async () => {
  const f = fixture(); await f.mount(); await f.select();
  const queued = f.surface();
  await act(async () => { queued.onPrimaryAction(); queued.onChoicePress('b'); queued.onPrimaryAction(); });
  assert.equal(f.calls(), 1);
  assert.equal(f.surface().phase, 'submitting_before_journal');
  assert.equal(f.surface().responseEditable, false);
  assert.equal(f.surface().primaryAction.loading, true);
  assert.deepEqual(Array.from(f.surface().question.responseControl.model.options.filter(option => option.state === 'selected').map(option => option.id)), ['a']);
  await f.periodic(projection());
  assert.equal(f.surface().phase, 'submitting_before_journal');
  f.holdRead(); await f.resolve();
  assert.equal(f.surface().phase, 'submitting_before_journal', 'settlement alone does not unlock');
  await f.resolveRead(projection('feedback'));
  assert.equal(f.surface().phase, 'feedback');
  assert.equal(f.surface().primaryAction.enabled, true);
  await act(async () => { queued.onPrimaryAction(); queued.onChoicePress('b'); });
  assert.equal(f.calls(), 1, 'a callback from the old unanswered result cannot resubmit');
  assert.ok(f.spans.every(span => span.ends === 1));
  await f.unmount();
});

test('ordinary Next remains advancing through a timer refresh and releases on next occurrence', async () => {
  const f = fixture(projection('feedback')); await f.mount(); await f.press();
  assert.equal(f.surface().phase, 'advancing');
  await f.periodic(projection('feedback'));
  assert.equal(f.surface().phase, 'advancing');
  f.holdRead(); await f.resolve();
  await f.resolveRead(projection('unanswered', 2));
  assert.equal(f.surface().position.label, '2 of 2');
  assert.equal(f.surface().phase, 'unanswered');
  assert.equal(f.surface().responseEditable, true);
  await f.unmount();
});

test('equivalent timer replacement of command projection can release without deadlock', async () => {
  const f = fixture(); await f.mount(); await f.select(); await f.press();
  f.holdRead(); await f.resolve();
  await f.resolveReadWithPeriodic(projection('feedback'));
  assert.equal(f.surface().phase, 'feedback');
  assert.equal(f.surface().primaryAction.enabled, true);
  await f.unmount();
});

test('canonical command failure exposes recovery; explicit projection failure shows error', async () => {
  const f = fixture(); await f.mount(); await f.select(); await f.press();
  const failed = projection('submit_journal_failed'); failed.operation.error = { allowedAction: 'reconcile' };
  f.setCurrent(failed); await f.reject();
  assert.equal(f.surface().phase, 'submit_outcome_unknown');
  assert.equal(f.surface().responseEditable, false);
  assert.equal(f.surface().retryLabel, 'Check saved response');
  await f.unmount();
  const g = fixture(); await g.mount(); await g.select(); await g.press(); g.holdRead(); await g.resolve(); await g.rejectRead();
  assert.match(g.error().description, /display your answer/);
  assert.ok(g.spans.every(span => span.ends === 1));
  await g.unmount();
});

test('stale route command and callbacks cannot publish, unlock a newer command, or navigate', async () => {
  const f = fixture(); await f.mount(); await f.select(); const stale = f.surface(); await f.press(); const old = f.oldCommand();
  await f.changeRoute(); await f.select(); await f.press();
  await act(async () => { old.resolve(); stale.onPrimaryAction(); stale.onChoicePress('b'); });
  assert.equal(f.calls(), 2);
  assert.equal(f.surface().phase, 'submitting_before_journal');
  assert.deepEqual(f.replacements, []);
  await f.unmount();
});

test('profile change and unmount ignore late results; final position renders completing', async () => {
  const f = fixture(projection('feedback', 2)); await f.mount(); await f.press();
  assert.equal(f.surface().phase, 'completing'); assert.equal(f.completeCalls(), 1);
  f.changeProfile(); await f.resolve({ kind: 'verified', value: { session: { id: 'session' } } });
  assert.deepEqual(f.replacements, []); await f.unmount();
  const g = fixture(projection('feedback', 2)); await g.mount(); await g.press(); await g.unmount();
  await g.resolve({ kind: 'verified', value: { session: { id: 'session' } } }); assert.deepEqual(g.replacements, []);
  const h = fixture(projection('feedback', 2)); await h.mount(); await h.press();
  await h.resolve({ kind: 'verified', value: { session: { id: 'session' } } });
  assert.equal(h.replacements.length, 1); assert.equal(h.replacements[0][0], 'Result'); assert.equal(h.replacements[0][1].sessionId, 'session'); await h.unmount();
});

test('coarse facade spans close on success and failure without changing command results', async () => {
  for (const failure of [null, 'checkpoint', 'answer', 'advance']) {
    const spans = [], effects = [], cause = Error('expected failure'), session = { id: 'private-session', trackId: 'aws', modeId: 'certification-focus-practice' };
    const stage = async name => { effects.push(name); if (failure === name) throw cause; return session; };
    const lifecycle = { submitPracticeResponse: () => stage('answer'), advancePracticeSession: () => stage('advance') };
    const code = ts.transpileModule(readFileSync('src/application/certification/certificationSessionFacade.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(code, { module, exports: module.exports, require: name => {
      if (name.endsWith('/startupTrace')) return { beginStartupSpan: label => { const span = { label, ends: 0 }; spans.push(span); return () => span.ends++; } };
      if (name === '../trainingLifecycle') return { getTrainingLifecycleUseCases: () => lifecycle, getForegroundSessionTimerFacade: () => ({ checkpointForResponseSave: () => stage('checkpoint') }) };
      if (name === '../learningReadModels') return { loadActiveTrainingSession: async () => session };
      if (name === '../../domain') return { getTrackRegistration: () => ({ familyId: 'certification' }) };
      return {};
    } });
    if (failure === 'advance') await assert.rejects(module.exports.advanceCertificationPracticeSession(), error => error === cause);
    else if (failure) await assert.rejects(module.exports.submitCertificationPracticeResponse({ type: 'choice_single', optionId: 'private-answer' }), error => error === cause);
    else {
      await module.exports.submitCertificationPracticeResponse({ type: 'choice_single', optionId: 'private-answer' });
      assert.equal(await module.exports.advanceCertificationPracticeSession(), session);
    }
    assert.ok(spans.every(span => span.ends === 1));
    assert.ok(spans.every(span => ['practice_response_checkpoint', 'practice_answer_command', 'practice_advance_command'].includes(span.label)));
    assert.ok(!JSON.stringify(spans).includes('private'));
    if (failure === 'checkpoint') assert.deepEqual(effects, ['checkpoint']);
  }
});


test('advance failure and final checkpoint failure retain their existing retry controls', async () => {
  const f = fixture(projection('feedback')); await f.mount(); await f.press();
  f.setCurrent(projection('advance_failed')); await f.reject();
  assert.equal(f.surface().phase, 'advance_failed');
  assert.equal(f.surface().primaryAction.enabled, true);
  assert.equal(f.surface().primaryAction.label, 'Try again');
  await f.unmount();
  const g = fixture(projection('feedback', 2)); await g.mount(); await g.press();
  await g.resolve({ kind: 'retry_final_checkpoint', expectedSessionId: 'session' });
  assert.equal(g.surface().retryLabel, 'Retry saving time');
  assert.equal(g.surface().primaryAction, undefined);
  assert.equal(g.surface().responseEditable, false);
  await g.unmount();
});

test('foreign post-command session or occurrence is ignored without unlocking', async () => {
  for (const foreign of [projection('feedback', 1, 'foreign'), projection('feedback', 2)]) {
    const f = fixture(); await f.mount(); await f.select(); await f.press();
    f.setCurrent(foreign); await f.resolve();
    assert.equal(f.surface().phase, 'submitting_before_journal');
    assert.equal(f.surface().position.label, '1 of 2');
    assert.equal(f.surface().responseEditable, false);
    await f.unmount();
  }
});


test('foreign completion result cannot navigate or clear the current completing action', async () => {
  const f = fixture(projection('feedback', 2)); await f.mount(); await f.press();
  await f.resolve({ kind: 'verified', value: { session: { id: 'foreign' } } });
  assert.deepEqual(f.replacements, []); assert.equal(f.surface().phase, 'completing');
  await f.unmount();
});


test('Next still performs fresh post-command read after periodic projection reaches its own target first', async () => {
  const f = fixture(projection('feedback')); await f.mount(); await f.press();
  await f.periodic(projection('unanswered', 2));
  assert.equal(f.surface().phase, 'advancing');
  assert.equal(f.surface().responseEditable, false);
  f.holdRead(); await f.resolve();
  assert.equal(f.surface().phase, 'advancing', 'periodic target and settlement cannot release pending');
  await f.resolveRead(projection('unanswered', 2));
  assert.equal(f.surface().phase, 'unanswered');
  assert.equal(f.surface().responseEditable, true);
  assert.equal(f.calls(), 1);
  assert.equal(f.spans.filter(span => span.stage === 'practice_command_projection').length, 1);
  await f.unmount();
});


test('Next rejects a periodic or command projection outside its captured exact next occurrence', async () => {
  for (const foreign of [{ ...projection('unanswered', 2), occurrenceId: 'foreign-occurrence' }, projection('unanswered', 3), projection('unanswered', 2, 'foreign-session')]) {
    const f = fixture(projection('feedback')); await f.mount(); await f.press();
    await f.periodic(foreign);
    f.setCurrent(foreign); await f.resolve();
    assert.equal(f.surface().phase, 'advancing');
    assert.equal(f.surface().responseEditable, false);
    assert.equal(f.calls(), 1);
    await f.unmount();
  }
});
