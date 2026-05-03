// src/lib/stores/beeStore.ts

import { writable } from "svelte/store";

interface BeePosition {
  x: number;
  y: number;
}

// Keyed by each bee's id prop — e.g. "wildbee", "honeybee"
export const beePositions = writable<Record<string, BeePosition>>({});