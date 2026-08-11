import { describe, expect, test } from "vitest";
import { browserToolRequestSchema } from "../../src/lib/voice.js";

describe("browserToolRequestSchema", () => {
  test("forwards dynamic fields as browser tool arguments", () => {
    const request = browserToolRequestSchema.parse({
      session_id: "11111111-1111-4111-8111-111111111111",
      tool_name: "focus_elements",
      element_ids: "bakbak-section-1,bakbak-section-2",
    });

    expect(request.arguments).toEqual({
      element_ids: "bakbak-section-1,bakbak-section-2",
    });
  });

  test("merges a static action into browser tool arguments", () => {
    const request = browserToolRequestSchema.parse({
      session_id: "22222222-2222-4222-8222-222222222222",
      tool_name: "browser_action",
      action: "scroll_to_bottom",
    });

    expect(request.arguments).toEqual({ action: "scroll_to_bottom" });
  });
});
