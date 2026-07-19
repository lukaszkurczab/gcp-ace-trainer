# Algorithms Stage 3 visual-state harness

This directory is an audit/test host, never a production route or entrypoint.
It reads the pinned bundled Algorithms artifact and supplies immutable
application-projection fixtures for P-01…P-15 and S-01…S-29. It has no MMKV
imports and no write capability. Run `npm run audit:algorithms-ui:fixtures` to
validate the packet before a manual capture session.
