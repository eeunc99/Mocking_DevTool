import { create } from "zustand";
import { endpointKey } from "./endpoint-key";

export type Endpoint = { method: string; path: string; query?: string[]; active?: boolean };

export { endpointKey };

function defaultBodyFor(ep: Endpoint): string {
  const params = [...ep.path.matchAll(/:(\w+)/g)].map((m) => m[1]);
  const obj: Record<string, string> = {};
  for (const p of params) obj[p] = `{{params.${p}}}`;
  for (const q of ep.query ?? []) obj[q] = `{{query.${q}}}`;
  if (params.length === 0 && (ep.query ?? []).length === 0) obj.message = "OK";
  return JSON.stringify(obj, null, 2);
}

export type Settings = { host: string; port: number };
export type ResponseOverrides = { status?: number; delay?: number };

type EditorStore = {
  endpoints: Endpoint[];
  selectedKey: string;
  bodies: Record<string, string>;
  overrides: Record<string, ResponseOverrides>;
  loaded: boolean;
  settings: Settings;
  load: () => Promise<void>;
  addEndpoint: (ep: Endpoint) => Promise<void>;
  removeEndpoint: (ep: Endpoint) => Promise<void>;
  setActive: (ep: Endpoint, active: boolean) => Promise<void>;
  select: (key: string) => void;
  setResponseBody: (v: string) => void;
  setResponseOverrides: (v: ResponseOverrides) => void;
  saveSettings: (s: Settings) => Promise<void>;
};

export const useEditorStore = create<EditorStore>((set) => ({
  endpoints: [],
  selectedKey: "",
  bodies: {},
  overrides: {},
  loaded: false,
  settings: { host: "localhost", port: 3000 },

  load: async () => {
    const [endpoints, config, settings] = await Promise.all([
      fetch("/api/endpoints").then((r) => r.json()) as Promise<Endpoint[]>,
      fetch("/api/config").then((r) => r.json()) as Promise<
        Record<string, { body: string; status?: number; delay?: number }>
      >,
      fetch("/api/settings").then((r) => r.json()) as Promise<Settings>,
    ]);
    const bodies: Record<string, string> = {};
    const overrides: Record<string, ResponseOverrides> = {};
    for (const ep of endpoints) {
      const key = endpointKey(ep);
      bodies[key] = config[key]?.body ?? defaultBodyFor(ep);
      overrides[key] = { status: config[key]?.status, delay: config[key]?.delay };
    }
    set({
      endpoints,
      bodies,
      overrides,
      settings,
      selectedKey: endpoints[0] ? endpointKey(endpoints[0]) : "",
      loaded: true,
    });
  },

  saveSettings: async (settings) => {
    const saved: Settings = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    }).then((r) => r.json());
    set({ settings: saved });
  },

  addEndpoint: async (ep) => {
    const endpoints: Endpoint[] = await fetch("/api/endpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ep),
    }).then((r) => r.json());
    const key = endpointKey(ep);
    set((state) => ({
      endpoints,
      bodies: { ...state.bodies, [key]: state.bodies[key] ?? defaultBodyFor(ep) },
      overrides: { ...state.overrides, [key]: state.overrides[key] ?? {} },
      selectedKey: key,
    }));
  },

  removeEndpoint: async (ep) => {
    const endpoints: Endpoint[] = await fetch("/api/endpoints", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ep),
    }).then((r) => r.json());
    set((state) => {
      const key = endpointKey(ep);
      const wasSelected = state.selectedKey === key;
      return {
        endpoints,
        selectedKey: wasSelected ? (endpoints[0] ? endpointKey(endpoints[0]) : "") : state.selectedKey,
      };
    });
  },

  setActive: async (ep, active) => {
    const endpoints: Endpoint[] = await fetch("/api/endpoints", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ep, active }),
    }).then((r) => r.json());
    set({ endpoints });
  },

  select: (key) => set({ selectedKey: key }),
  setResponseBody: (v) =>
    set((state) => ({ bodies: { ...state.bodies, [state.selectedKey]: v } })),
  setResponseOverrides: (v) =>
    set((state) => ({
      overrides: { ...state.overrides, [state.selectedKey]: { ...state.overrides[state.selectedKey], ...v } },
    })),
}));
