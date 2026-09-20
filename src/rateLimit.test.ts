import { describe, it, expect } from "vitest";
import { clientIpKey, createRateLimiter, checkSubmitAccess } from "./rateLimit.js";

describe("clientIpKey", () => {
  it("keys IPv4 on the full address", () => {
    expect(clientIpKey("203.0.113.7")).toBe("203.0.113.7");
  });

  it("unwraps IPv4-mapped IPv6 to the bare IPv4 address", () => {
    expect(clientIpKey("::ffff:203.0.113.7")).toBe("203.0.113.7");
  });

  it("groups IPv6 to a /56 block", () => {
    const a = clientIpKey("2001:db8:abcd:0100:1111:2222:3333:4444");
    const b = clientIpKey("2001:db8:abcd:0155:9999:8888:7777:6666");
    const c = clientIpKey("2001:db8:abcd:0200:0:0:0:1");
    expect(a).toBe(b); // same /56 (0x0100 and 0x0155 share the high byte 0x01)
    expect(a).not.toBe(c); // different /56 (0x02 high byte)
  });

  it("strips an IPv6 zone id", () => {
    expect(clientIpKey("fe80::1%eth0")).toBe(clientIpKey("fe80::1"));
  });
});

describe("createRateLimiter (leaky bucket)", () => {
  it("allows a burst up to the per-minute rate, then rejects", () => {
    let now = 0;
    const limiter = createRateLimiter({ ratePerMin: 3, now: () => now });
    expect(limiter.tryConsume("ip")).toBe(true);
    expect(limiter.tryConsume("ip")).toBe(true);
    expect(limiter.tryConsume("ip")).toBe(true);
    expect(limiter.tryConsume("ip")).toBe(false);
  });

  it("leaks over time so capacity returns", () => {
    let now = 0;
    const limiter = createRateLimiter({ ratePerMin: 3, now: () => now });
    expect(limiter.tryConsume("ip")).toBe(true);
    expect(limiter.tryConsume("ip")).toBe(true);
    expect(limiter.tryConsume("ip")).toBe(true);
    expect(limiter.tryConsume("ip")).toBe(false);
    now += 20_000; // 20s at 3/min leaks 1 token
    expect(limiter.tryConsume("ip")).toBe(true);
    expect(limiter.tryConsume("ip")).toBe(false);
  });

  it("keeps separate buckets per key", () => {
    let now = 0;
    const limiter = createRateLimiter({ ratePerMin: 1, now: () => now });
    expect(limiter.tryConsume("a")).toBe(true);
    expect(limiter.tryConsume("a")).toBe(false);
    expect(limiter.tryConsume("b")).toBe(true);
  });
});

describe("checkSubmitAccess", () => {
  it("rate-limits when no password is configured", () => {
    let allowed = true;
    const consumeRate = () => allowed;
    expect(checkSubmitAccess({ submitPassword: "", providedPassword: "", consumeRate })).toEqual({ kind: "allow" });
    allowed = false;
    expect(checkSubmitAccess({ submitPassword: "", providedPassword: "", consumeRate })).toEqual({ kind: "rate-limited" });
  });

  it("requires a password when one is configured", () => {
    const consumeRate = () => true;
    expect(
      checkSubmitAccess({ submitPassword: "s3cret", providedPassword: "", consumeRate }),
    ).toEqual({ kind: "password-required" });
    expect(
      checkSubmitAccess({ submitPassword: "s3cret", providedPassword: "wrong", consumeRate }),
    ).toEqual({ kind: "password-required" });
  });

  it("bypasses the rate limit entirely with the correct password", () => {
    let consumed = false;
    const consumeRate = () => {
      consumed = true;
      return false;
    };
    expect(
      checkSubmitAccess({ submitPassword: "s3cret", providedPassword: "s3cret", consumeRate }),
    ).toEqual({ kind: "allow" });
    expect(consumed).toBe(false); // rate limiter never touched
  });
});
