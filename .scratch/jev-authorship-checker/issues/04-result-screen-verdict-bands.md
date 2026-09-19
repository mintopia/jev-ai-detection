# 04: Result screen + verdict bands

**What to build:** The result page gives a full, honest read of the analysis: a three-way verdict, the confidence %, the full per-label breakdown, the text that was judged, and a caveat about what the number means.

**Blocked by:** 01.

**Status:** ready-for-agent

- [x] Three-way verdict band: `noul < 0.4` → No (human); `0.4–0.6` → Uncertain; `> 0.6` → Yes (AI). Raw AI-written % always shown.
- [x] Full per-label probability bars for the `which_ai` choice (e.g. claude 62%, gpt 20%, …).
- [x] Which-AI section shown only when the verdict is Yes or Uncertain; hidden on a human verdict.
- [x] The analyzed text snippet is displayed (HTML-escaped) alongside a link back to the source URL.
- [x] A short honesty note states that Jev's calibration holds across groups, not per individual answer.
