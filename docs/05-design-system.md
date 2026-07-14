# 05 — Design System

## Purpose

The interface is a calm, accessible focus lab. It makes the next training action, current track, response state, timer, and error state clear without using decorative performance claims.

## Required components

- Track and mode cards use the canonical labels. Algorithms cards are `Learn Approach`, `Guided Practice`, `Recognize Patterns`, `Contrast Practice`, `Weak Area Review`, `Independent Practice`, and `Interview Simulation`.
- Session setup shows requested and actual length. A shortened review clearly says why the compatible pool is smaller; it never implies unrelated fill content.
- Timer has elapsed-foreground and absolute-countdown variants, each readable by assistive technology.
- Choice controls expose selected, submitted-correct, submitted-partial, and submitted-incorrect states without relying only on colour.
- Ordering provides accessible move controls and visible ordering. Its feedback represents preserved adjacent relations, not exact-position score.
- Complexity controls render only the dimensions and accepted values declared by content; a UI must not assume time and space are always present.
- Feedback shows immediate `Reason`, a collapsed `Details` disclosure, and no side effect when Details opens.
- Certification navigator, flagging, answer-change controls, and section controls are rendered only when the track's `ExamExperienceProfile` permits them.

## Progress and copy

Use evidence, repeated mistakes, review due state, and next action. Do not show confidence collection or readiness, retention, or mastery percentages. Any visible metric must answer a concrete question, lead to a training decision, and have sufficient evidence.

## Errors and missing design

Missing content, unsupported payload, unknown ID, content-version mismatch, and storage failure are explicit error states with a recoverable action where one exists. They never collapse into a default item or answer.

Required visual and interaction design must exist before implementation. Missing design is a blocker, not permission to invent an alternative.
