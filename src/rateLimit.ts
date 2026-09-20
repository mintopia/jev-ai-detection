import { timingSafeEqual } from "node:crypto";

function expandIpv6(addr: string): number[] | null {
  const halves = addr.split("::");
  if (halves.length > 2) return null;

  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 ? (halves[1] ? halves[1].split(":") : []) : [];

  let groups: string[];
  if (halves.length === 2) {
    const missing = 8 - head.length - tail.length;
    if (missing < 0) return null;
    groups = [...head, ...Array<string>(missing).fill("0"), ...tail];
  } else {
    groups = head;
  }
  if (groups.length !== 8) return null;

  const nums = groups.map((g) => parseInt(g || "0", 16));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 0xffff)) return null;
  return nums;
}

// Bucket key for a client: IPv4 as its full address, IPv6 collapsed to its /56 block.
export function clientIpKey(ip: string): string {
  let addr = ip.trim().split("%")[0] ?? "";

  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(addr);
  if (mapped?.[1]) addr = mapped[1];

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(addr)) return addr;

  const nums = expandIpv6(addr);
  if (!nums) return addr;

  const [g0, g1, g2, g3] = nums as [number, number, number, number, ...number[]];
  const prefix = [g0, g1, g2, g3 & 0xff00].map((n) => n.toString(16)).join(":");
  return `${prefix}::/56`;
}

export interface RateLimiter {
  tryConsume(key: string): boolean;
}

interface RateLimiterOptions {
  ratePerMin: number;
  now?: () => number;
}

const FLOAT_TOLERANCE = 1e-9;

// Leaky bucket: capacity equals ratePerMin, draining ratePerMin tokens per minute.
export function createRateLimiter({ ratePerMin, now = Date.now }: RateLimiterOptions): RateLimiter {
  const buckets = new Map<string, { level: number; last: number }>();
  const capacity = ratePerMin;
  const perMs = ratePerMin / 60_000;
  const sweepIntervalMs = 60_000;
  let lastSweep = -Infinity;

  // Drop buckets that have fully drained; keeps the map bounded to recently-active keys.
  function sweep(t: number): void {
    if (t - lastSweep < sweepIntervalMs) return;
    lastSweep = t;
    for (const [key, b] of buckets) {
      if (b.level - (t - b.last) * perMs <= 0) buckets.delete(key);
    }
  }

  return {
    tryConsume(key) {
      const t = now();
      sweep(t);
      const bucket = buckets.get(key) ?? { level: 0, last: t };
      const leaked = (t - bucket.last) * perMs;
      const level = Math.max(0, bucket.level - leaked);

      if (level + 1 > capacity + FLOAT_TOLERANCE) {
        buckets.set(key, { level, last: t });
        return false;
      }
      buckets.set(key, { level: level + 1, last: t });
      return true;
    },
  };
}

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export type SubmitAccess =
  | { kind: "allow" }
  | { kind: "password-required" }
  | { kind: "rate-limited" };

interface SubmitAccessOptions {
  submitPassword: string;
  providedPassword: string;
  consumeRate: () => boolean;
}

export function checkSubmitAccess({
  submitPassword,
  providedPassword,
  consumeRate,
}: SubmitAccessOptions): SubmitAccess {
  if (submitPassword) {
    return constantTimeEqual(submitPassword, providedPassword)
      ? { kind: "allow" }
      : { kind: "password-required" };
  }
  return consumeRate() ? { kind: "allow" } : { kind: "rate-limited" };
}
