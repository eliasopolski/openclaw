// Feishu plugin module implements monitor mocks behavior.
import { createChannelIngressQueueForTests } from "openclaw/plugin-sdk/plugin-state-test-runtime";
import { vi } from "vitest";
import type { PluginRuntime } from "../runtime-api.js";

type FeishuRuntimeMock = {
  channel: {
    debounce: Pick<
      PluginRuntime["channel"]["debounce"],
      "resolveInboundDebounceMs" | "createInboundDebouncer"
    >;
    text: Pick<PluginRuntime["channel"]["text"], "hasControlCommand">;
  };
  state: Pick<PluginRuntime["state"], "openChannelIngressQueue">;
};

export function createFeishuClientMockModule(): {
  createFeishuWSClient: () => { start: () => void; close: () => void };
  createEventDispatcher: () => { register: () => void };
} {
  return {
    createFeishuWSClient: vi.fn(() => ({ start: vi.fn(), close: vi.fn() })),
    createEventDispatcher: vi.fn(() => ({ register: vi.fn() })),
  };
}

export function createFeishuRuntimeMockModule(params: { stateDir?: string } = {}): {
  getFeishuRuntime: () => FeishuRuntimeMock;
} {
  const resolveInboundDebounceMs = (() =>
    0) as PluginRuntime["channel"]["debounce"]["resolveInboundDebounceMs"];
  const createInboundDebouncer = (() => ({
    enqueue: async () => {},
    flushKey: async () => {},
    cancelKey: () => false,
  })) as PluginRuntime["channel"]["debounce"]["createInboundDebouncer"];
  const hasControlCommand = (() => false) as PluginRuntime["channel"]["text"]["hasControlCommand"];
  const openChannelIngressQueue: PluginRuntime["state"]["openChannelIngressQueue"] = (options) =>
    createChannelIngressQueueForTests({
      ...options,
      channelId: "feishu",
      ...(params.stateDir ? { stateDir: params.stateDir } : {}),
    });

  return {
    getFeishuRuntime: () => ({
      channel: {
        debounce: {
          resolveInboundDebounceMs,
          createInboundDebouncer,
        },
        text: { hasControlCommand },
      },
      state: { openChannelIngressQueue },
    }),
  };
}
