import { vi } from "vitest";

export const info = vi.fn();
export const warning = vi.fn();
export const debug = vi.fn();
export const group = vi.fn(async <T>(_name: string, fn: () => Promise<T>): Promise<T> => fn());
