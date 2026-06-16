/**
 * Sensei (Coach) Agent Tests
 *
 * Tests coaching workflows:
 * - Work review and feedback
 * - Calculation validation
 * - Drawing coordination review
 * - Teaching and best practices
 */

import { describe, it, expect } from "@jest/globals";
import { getDb } from "@/lib/db";
import { callLLMWithHistory } from "@/lib/llm-router";

describe("Sensei - Coach Agent", () => {
  let db: any;
  let senseiId: string;

  beforeAll(() => {
    db = getDb();

    // Fetch Sensei agent (should be created as part of Phase 3)
    const agent = db
      .prepare(
        "SELECT id FROM agents WHERE name = 'Sensei' AND role = 'coach'"
      )
      .get() as any;

    if (!agent) {
      throw new Error(
        "Sensei agent not found. Run initialization script to create agents."
      );
    }

    senseiId = agent.id;
  });

  describe("Calculation Review", () => {
    it("should review and validate HVAC calculations", async () => {
      const sensei = db
        .prepare("SELECT * FROM agents WHERE id = ?")
        .get(senseiId) as any;

      const sampleCalc = `
HVAC LOAD CALCULATION
Project: 14-unit residential
Building: 5-story apartment building
Location: Quebec City
Climate Zone: Zone 5

Design Conditions:
- Heating: -25°C outdoor, 21°C indoor
- Cooling: +30°C outdoor, 24°C indoor
- Ventilation: 0.3 ACH fresh air

Total floor area: 8,400 m²
Per-unit: 600 m² average

Calculated loads:
- Peak heating: 280 kW
- Peak cooling: 150 kW
- Fresh air volume: 2,940 CFM

Equipment sizing:
- Boiler: 300 kW (with safety margin)
- Chiller: 170 kW
- Main AHU: 3,000 CFM
`;

      const response = await callLLMWithHistory(
        sensei.llm_provider,
        sensei.llm_model,
        [
          {
            role: "user",
            content: `Please review this HVAC calculation:\n\n${sampleCalc}\n\nIs this sizing correct? Are there any code compliance issues?`,
          },
        ],
        sensei.system_prompt
      );

      expect(response.content).toBeTruthy();
      expect(response.content.length).toBeGreaterThan(150);
      expect(
        response.content.toLowerCase().includes("review") ||
          response.content.toLowerCase().includes("correct") ||
          response.content.toLowerCase().includes("sizing")
      ).toBeTruthy();
    });

    it("should identify calculation errors", async () => {
      const sensei = db
        .prepare("SELECT * FROM agents WHERE id = ?")
        .get(senseiId) as any;

      const badCalc = `
HVAC Load: 1000 kW for 14 units
Equipment: 500 kW boiler
`;

      const response = await callLLMWithHistory(
        sensei.llm_provider,
        sensei.llm_model,
        [
          {
            role: "user",
            content: `Review this calculation:\n\n${badCalc}\n\nWhat's wrong here?`,
          },
        ],
        sensei.system_prompt
      );

      expect(response.content).toBeTruthy();
      // Sensei should identify the undersizing
      expect(
        response.content.toLowerCase().includes("undersized") ||
          response.content.toLowerCase().includes("insufficient") ||
          response.content.toLowerCase().includes("error") ||
          response.content.toLowerCase().includes("issue")
      ).toBeTruthy();
    });
  });

  describe("Process Teaching", () => {
    it("should teach MEP coordination process", async () => {
      const sensei = db
        .prepare("SELECT * FROM agents WHERE id = ?")
        .get(senseiId) as any;

      const response = await callLLMWithHistory(
        sensei.llm_provider,
        sensei.llm_model,
        [
          {
            role: "user",
            content:
              "Explain why we do coordination before calculation. What breaks if we skip it?",
          },
        ],
        sensei.system_prompt
      );

      expect(response.content).toBeTruthy();
      expect(response.content.length).toBeGreaterThan(200);
      expect(
        response.content.toLowerCase().includes("coordination") ||
          response.content.toLowerCase().includes("conflict") ||
          response.content.toLowerCase().includes("process")
      ).toBeTruthy();
    });

    it("should provide best practices guidance", async () => {
      const sensei = db
        .prepare("SELECT * FROM agents WHERE id = ?")
        .get(senseiId) as any;

      const response = await callLLMWithHistory(
        sensei.llm_provider,
        sensei.llm_model,
        [
          {
            role: "user",
            content:
              "What are the best practices for electrical load calculations in multi-unit residential?",
          },
        ],
        sensei.system_prompt
      );

      expect(response.content).toBeTruthy();
      expect(response.content.length).toBeGreaterThan(150);
    });
  });

  describe("Drawing Review", () => {
    it("should review drawing coordination", async () => {
      const sensei = db
        .prepare("SELECT * FROM agents WHERE id = ?")
        .get(senseiId) as any;

      const response = await callLLMWithHistory(
        sensei.llm_provider,
        sensei.llm_model,
        [
          {
            role: "user",
            content:
              "I have a mechanical drawing of ductwork in a 5-story building. What should I check for drawing coordination issues?",
          },
        ],
        sensei.system_prompt
      );

      expect(response.content).toBeTruthy();
      expect(response.content.length).toBeGreaterThan(100);
      expect(
        response.content.toLowerCase().includes("check") ||
          response.content.toLowerCase().includes("review") ||
          response.content.toLowerCase().includes("coordinate")
      ).toBeTruthy();
    });
  });

  describe("Feedback Quality", () => {
    it("should provide constructive and specific feedback", async () => {
      const sensei = db
        .prepare("SELECT * FROM agents WHERE id = ?")
        .get(senseiId) as any;

      const response = await callLLMWithHistory(
        sensei.llm_provider,
        sensei.llm_model,
        [
          {
            role: "user",
            content:
              "I sized the main chiller for 150 kW. The calculated peak cooling load is 140 kW. Is this right?",
          },
        ],
        sensei.system_prompt
      );

      expect(response.content).toBeTruthy();
      // Should provide specific technical feedback
      expect(
        response.content.toLowerCase().includes("margin") ||
          response.content.toLowerCase().includes("safety") ||
          response.content.toLowerCase().includes("correct") ||
          response.content.toLowerCase().includes("sized")
      ).toBeTruthy();
    });
  });

  describe("Cost Tracking", () => {
    it("should track tokens and costs accurately", async () => {
      const sensei = db
        .prepare("SELECT * FROM agents WHERE id = ?")
        .get(senseiId) as any;

      const response = await callLLMWithHistory(
        sensei.llm_provider,
        sensei.llm_model,
        [
          {
            role: "user",
            content: "What is your role in helping the team?",
          },
        ],
        sensei.system_prompt
      );

      expect(response.tokens?.prompt).toBeGreaterThan(0);
      expect(response.tokens?.completion).toBeGreaterThan(0);
      expect(response.tokens?.total).toBe(
        response.tokens!.prompt + response.tokens!.completion
      );
      expect(response.costUsd).toBeGreaterThanOrEqual(0);
    });
  });
});
