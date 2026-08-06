/**
 * Marketing team member — The Scheduler (deterministic editorial calendar).
 *
 * Produces a weekly posting plan from topic seeds + per-platform cadence rules.
 * Pure and deterministic; no LLM, no I/O.
 */
export type MarketingPlatform = "x" | "instagram" | "linkedin" | "facebook" | "tiktok";

export interface CalendarRule {
  platform: MarketingPlatform;
  /** Weekly post count target. */
  postsPerWeek: number;
  /** Preferred local-time slots (HH:MM). */
  bestSlots: string[];
}

export const DEFAULT_CALENDAR_RULES: CalendarRule[] = [
  { platform: "x", postsPerWeek: 5, bestSlots: ["09:00", "12:00", "18:00"] },
  { platform: "instagram", postsPerWeek: 4, bestSlots: ["10:00", "19:00"] },
  { platform: "linkedin", postsPerWeek: 3, bestSlots: ["08:30", "12:30"] },
  { platform: "facebook", postsPerWeek: 3, bestSlots: ["11:00", "20:00"] },
  { platform: "tiktok", postsPerWeek: 2, bestSlots: ["12:00", "21:00"] },
];

export interface CalendarSlot {
  platform: MarketingPlatform;
  dayOfWeek: number; // 1=Mon .. 7=Sun
  time: string;
}

export interface ScheduledPost {
  id: string;
  platform: MarketingPlatform;
  dayOfWeek: number;
  time: string;
  topic: string; // from the topic seeds (deterministic rotation)
  status: "planned";
}

/** Distribute topic seeds across the weekly plan by simple round-robin. */
export function buildCalendar(
  weekStart: string, // ISO date of Monday
  topicSeeds: string[],
  rules: CalendarRule[] = DEFAULT_CALENDAR_RULES
): { slots: CalendarSlot[]; posts: ScheduledPost[] } {
  const slots: CalendarSlot[] = [];
  for (const rule of rules) {
    for (let i = 0; i < rule.postsPerWeek; i++) {
      const day = (i % 7) + 1; // spread across days
      const time = rule.bestSlots[i % rule.bestSlots.length] ?? "09:00";
      slots.push({ platform: rule.platform, dayOfWeek: day, time });
    }
  }

  const posts: ScheduledPost[] = slots.map((slot, idx) => {
    const topic = topicSeeds.length > 0 ? (topicSeeds[idx % topicSeeds.length] ?? "general") : "general";
    return {
      id: `post-${weekStart}-${slot.platform}-${idx}`,
      platform: slot.platform,
      dayOfWeek: slot.dayOfWeek,
      time: slot.time,
      topic,
      status: "planned",
    };
  });

  return { slots, posts };
}
