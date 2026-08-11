import { describe, expect, test, vi } from "vitest";
import {
  BrowserToolBridge,
  BrowserToolBridgeError,
} from "../../src/lib/browser-tool-bridge.js";

describe("BrowserToolBridge", () => {
  test("forwards a tool request and resolves it with the extension result", async () => {
    const send = vi.fn();
    const bridge = new BrowserToolBridge();
    bridge.register("44444444-4444-4444-8444-444444444444", send);

    const resultPromise = bridge.request(
      "44444444-4444-4444-8444-444444444444",
      "get_page_context",
      {},
    );

    const [call] = send.mock.calls[0] ?? [];
    expect(call).toMatchObject({ name: "get_page_context", arguments: {} });
    expect(
      bridge.resolve(
        "44444444-4444-4444-8444-444444444444",
        call.requestId,
        "get_page_context",
        { title: "Bakbak" },
      ),
    ).toBe(true);
    await expect(resultPromise).resolves.toEqual({ title: "Bakbak" });
  });

  test("rejects a request for a closed session", async () => {
    const bridge = new BrowserToolBridge();

    await expect(
      bridge.request(
        "55555555-5555-4555-8555-555555555555",
        "get_page_context",
        {},
      ),
    ).rejects.toEqual(expect.objectContaining<Partial<BrowserToolBridgeError>>({
      code: "session_not_found",
    }));
  });

  test("rejects in-flight work when the extension session closes", async () => {
    const bridge = new BrowserToolBridge();
    bridge.register("66666666-6666-4666-8666-666666666666", vi.fn());

    const resultPromise = bridge.request(
      "66666666-6666-4666-8666-666666666666",
      "get_page_context",
      {},
    );
    bridge.unregister("66666666-6666-4666-8666-666666666666");

    await expect(resultPromise).rejects.toEqual(
      expect.objectContaining<Partial<BrowserToolBridgeError>>({
        code: "session_closed",
      }),
    );
  });
});
