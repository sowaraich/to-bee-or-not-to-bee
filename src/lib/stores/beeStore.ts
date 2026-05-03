import { writable } from "svelte/store";

interface BeePosition {
  x: number;
  y: number;
}

export const beePositions = writable<Record<string, BeePosition>>({});
