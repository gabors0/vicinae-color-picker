import { execFile } from "child_process";
import { promisify } from "util";
import { LocalStorage } from "@vicinae/api";

const execFileAsync = promisify(execFile);

export type Format = "hex" | "rgb" | "hsl";
export type PickedColor = { hex: string; pickedAt: number };

const HISTORY_KEY = "history";
const HISTORY_LIMIT = 50;

export class PickError extends Error {}

/**
 * Opens KWin's interactive screen picker. Resolves to "#RRGGBB", or null if the user cancelled.
 * Throws a PickError with a user-facing message when picking isn't possible.
 */
export async function pickColor(): Promise<string | null> {
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync("busctl", [
      "--user",
      "call",
      "org.kde.KWin",
      "/ColorPicker",
      "org.kde.kwin.ColorPicker",
      "pick",
    ]));
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { stderr?: string };
    if (err.code === "ENOENT") throw new PickError("busctl not found (it ships with systemd)");
    const stderr = err.stderr ?? "";
    if (/cancel/i.test(stderr)) return null;
    if (/ServiceUnknown|not activatable|No such object path|Unknown method/i.test(stderr)) {
      throw new PickError("KWin's color picker isn't available — this requires KDE Plasma");
    }
    throw new PickError(stderr.trim() || err.message);
  }
  // Output looks like "(u) 4279638042" — an unsigned ARGB integer
  const argb = Number(stdout.trim().split(/\s+/)[1]);
  if (!Number.isFinite(argb)) throw new PickError(`Unexpected reply from KWin: ${stdout.trim()}`);
  return "#" + (argb & 0xffffff).toString(16).padStart(6, "0").toUpperCase();
}

function toRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = toRgb(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, Math.round(l * 100)];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

export function formatColor(hex: string, format: Format): string {
  switch (format) {
    case "rgb":
      return `rgb(${toRgb(hex).join(", ")})`;
    case "hsl": {
      const [h, s, l] = toHsl(hex);
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
    default:
      return hex;
  }
}

export async function getHistory(): Promise<PickedColor[]> {
  const raw = await LocalStorage.getItem<string>(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveHistory(history: PickedColor[]): Promise<void> {
  await LocalStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)));
}

export async function addToHistory(hex: string): Promise<void> {
  const history = (await getHistory()).filter((c) => c.hex !== hex);
  await saveHistory([{ hex, pickedAt: Date.now() }, ...history]);
}
