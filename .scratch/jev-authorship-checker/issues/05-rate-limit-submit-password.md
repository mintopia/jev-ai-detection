# 05: Rate limiting + submit password

**What to build:** The app is safe to expose publicly: anyone can view results, but submitting new analyses is rate-limited for anonymous users and can be gated behind a shared password that, when supplied, lifts the limit.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] Viewing (`GET /` and `GET /r/:id`) is always open, no auth.
- [ ] Anonymous submissions are limited by a leaky-bucket rate limiter, configurable via `ANON_RATE_PER_MIN` (default 5).
- [ ] Rate-limit bucket key is the client IP: IPv4 as the full address, IPv6 grouped to a /56 block.
- [ ] `SUBMIT_PASSWORD`, when set, is required to submit; the form exposes a password field.
- [ ] A submitter with the correct password bypasses the rate limit entirely; blank/unset `SUBMIT_PASSWORD` means submission is open (still rate-limited).
- [ ] Over-limit submissions return a clear "rate limited, try again shortly" response, not a crash.
