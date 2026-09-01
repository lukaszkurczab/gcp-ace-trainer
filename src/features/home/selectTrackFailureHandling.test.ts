import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/home/SelectTrackScreen.tsx", "utf8");

test("track selection turns an active-track read rejection into an explicit retryable unavailable state", () => {
  assert.match(source, /const \[loadError, setLoadError\] = useState<string \| null>\(null\)/);
  assert.match(source, /getActiveTrackId\(\)[\s\S]*?\.catch\(\(\) => \{[\s\S]*?setLoadError\("We couldn't load your saved track\. Check your connection and try again\."\);[\s\S]*?setLoaded\(true\);/);
  assert.match(source, /testID="patternly:home:select-track:unavailable"/);
  assert.match(source, /testID="patternly:home:select-track:retry"/);
  assert.match(source, /setLoadRevision\(\(revision\) => revision \+ 1\)/);
  assert.match(source, /const showFooter = !loadError && /);
});

test("track selection retains the local choice and offers the same command again after a save rejection", () => {
  assert.match(source, /setIsSaving\(true\);\s*setSaveError\(null\);[\s\S]*?await saveActiveTrackId\(track\.id\);[\s\S]*?catch \{\s*setSaveError\("We couldn't save that track\. Your choice is still selected\. Try again\."\);[\s\S]*?finally \{\s*setIsSaving\(false\);/);
  assert.match(source, /testID="patternly:home:select-track:save-error"/);
  assert.match(source, /disabled=\{!loaded \|\| isSaving \|\| \(!onboarding && selectedTrackId === activeTrackId\)\}/);
  assert.match(source, /setSelectedTrackId\(track\.id\);\s*setSaveError\(null\);/);
  assert.doesNotMatch(source, /describeOperationalFailure/);
});
