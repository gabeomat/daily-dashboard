import { describe, expect, it } from "vitest";
import { buildDailyEntryPayload } from "@/hooks/useDailyEntries";
import { buildDailyMetricPayload } from "@/hooks/useDailyMetrics";

describe("persistence payload merging", () => {
  it("preserves saved Skool metrics when updating a single field", () => {
    const existingEntry = {
      id: "entry-1",
      date: "2026-03-17",
      mrr: 2560,
      retention: 93,
      members: 158,
      traffic: 17,
      discovery: 512,
      profile_activity: 20,
      group_activity: 67,
      one_thing: "Frame and market new training",
      biggest_win: "Shipped the training",
      biggest_bottleneck: "Traffic is low",
      real_priority: "Improve acquisition",
      created_at: "2026-03-17T00:00:00.000Z",
      updated_at: "2026-03-17T00:00:00.000Z",
    };

    const payload = buildDailyEntryPayload(existingEntry, {
      date: "2026-03-17",
      retention: 95,
    });

    expect(payload.retention).toBe(95);
    expect(payload.group_activity).toBe(67);
    expect(payload.mrr).toBe(2560);
    expect(payload.biggest_bottleneck).toBe("Traffic is low");
  });

  it("preserves saved ad metrics when updating a single field", () => {
    const existingMetric = {
      id: "metric-1",
      date: "2026-03-17",
      ad_spend: 74.5,
      t18: 2,
      t47: 1,
      t333: 0,
      created_at: "2026-03-17T00:00:00.000Z",
      updated_at: "2026-03-17T00:00:00.000Z",
    };

    const payload = buildDailyMetricPayload(existingMetric, {
      date: "2026-03-17",
      t47: 3,
    });

    expect(payload.t47).toBe(3);
    expect(payload.ad_spend).toBe(74.5);
    expect(payload.t18).toBe(2);
    expect(payload.t333).toBe(0);
  });
});
