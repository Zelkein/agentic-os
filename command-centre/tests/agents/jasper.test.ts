/**
 * Jasper (Orchestrator) Agent Tests
 *
 * Tests orchestrator workflows:
 * - Project coordination
 * - Priority management
 * - Team delegation
 * - Workflow analysis
 */

import { describe, it, expect } from "@jest/globals";
import { getDb } from "@/lib/db";
import { callLLMWithHistory } from "@/lib/llm-router";
import { v4 as uuidv4 } from "uuid";

describe("Jasper - Orchestrator Agent", () => {
  let db: any;
  let jasperId: string;

  beforeAll(() => {
    db = getDb();

    // Fetch Jasper agent (should be created as part of Phase 3)
    const agent = db
      .prepare(
        "SELECT id FROM agents WHERE name = 'Jasper' AND role = 'orchestrator'"
      )
      .get() as any;

    if (!agent) {
      throw new Error(
        "Jasper agent not found. Run initialization script to create agents."
      );
    }

    jasperId = agent.id;
  });

  describe("Project Coordination", () => {
    it("should provide coordination guidance for MEP projects", async () => {
      const jasper = db
        .prepare("SELECT * FROM agents WHERE id = ?")
        .get(jasperId) as any;

      const response = await callLLMWithHistory(
        jasper.llm_provider,
        jasper.llm_model,
        [
          {
            role: "user",
            content:
              "What's our process for MEP coordination? We have a 14-unit residential project starting coordination phase.",
          },
        ],
        jasper.system_prompt
      );

      expect(response.content).toBeTruthy();
      expect(response.content.toLowerCase()).toContain(
        "coordinate" || "coordination" || "process"
      );
      expect(response.tokens?.total).toBeGreaterThan(0);
      expect(response.costUsd).toBeGreaterThanOrEqual(0);
    });

    it("should handle priority decisions", async () => {
      const jasper = db
        .prepare("SELECT * FROM agents WHERE id = ?")
        .get(jasperId) as any;

      const response = await callLLMWithHistory(
        jasper.llm_provider,
        jasper.llm_model,
        [
          {
            role: "user",
            content:
              "I have MEP coordination conflicts and structural concerns on CPE L'Enfantillage. What should we address first?",
          },
        ],
        jasper.system_prompt
      );

      expect(response.content).toBeTruthy();
      expect(response.content.length).toBeGreaterThan(100);
      expect(response.modelUsed).toBeTruthy();
    });
  });

  describe("Team Delegation", () => {
    it("should recommend appropriate specialists for tasks", async () => {
      const jasper = db
        .prepare("SELECT * FROM agents WHERE id = ?")
        .get(jasperId) as any;

      const response = await callLLMWithHistory(
        jasper.llm_provider,
        jasper.llm_model,
        [
          {
            role: "user",
            content:
              "We need to perform HVAC load calculations for 18 units. Who should handle this and what process?",
          },
        ],
        jasper.system_prompt
      );

      expect(response.content).toBeTruthy();
      expect(
        response.content.toLowerCase().includes("hvac") ||
          response.content.toLowerCase().includes("calculation")
      ).toBeTruthy();
    });
  });

  describe("Workflow Analysis", () => {
    it("should analyze coordination → calculation → drawing workflow", async () => {
      const jasper = db
        .prepare("SELECT * FROM agents WHERE id = ?")
        .get(jasperId) as any;

      const response = await callLLMWithHistory(
        jasper.llm_provider,
        jasper.llm_model,
        [
          {
            role: "user",
            content:
              "Why is coordination → calculation → drawing the right order? What breaks if we skip steps?",
          },
        ],
        jasper.system_prompt
      );

      expect(response.content).toBeTruthy();
      expect(response.content.length).toBeGreaterThan(200);
    });
  });

  describe("Cost Tracking", () => {
    it("should track tokens and costs accurately", async () => {
      const jasper = db
        .prepare("SELECT * FROM agents WHERE id = ?")
        .get(jasperId) as any;

      const response = await callLLMWithHistory(
        jasper.llm_provider,
        jasper.llm_model,
        [
          {
            role: "user",
            content: "What is your role in this organization?",
          },
        ],
        jasper.system_prompt
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
