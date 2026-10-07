import { spawn } from "child_process";
import { Clipboard } from "@vicinae/api";

/**
 * Copies text to the clipboard.
 *
 * On Wayland this goes through wl-copy instead of Clipboard.copy: Vicinae's data-control helper
 * (as of 0.29.1) deadlocks reading back its own selection, which leaves the clipboard unreadable and
 * makes every app that reads it — Klipper, Vicinae itself — stall on pipe timeouts.
 */
export async function copyText(text: string): Promise<void> {
  if (!process.env.WAYLAND_DISPLAY) return Clipboard.copy(text);

  await new Promise<void>((resolve, reject) => {
    // wl-copy forks a background process that serves the selection, then exits once it is set.
    // Detach it so that process survives this extension's worker exiting.
    const child = spawn("wl-copy", ["--", text], { detached: true, stdio: "ignore" });
    child.once("error", (error: NodeJS.ErrnoException) => {
      reject(new Error(error.code === "ENOENT" ? "wl-copy not found — install wl-clipboard" : error.message));
    });
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`wl-copy exited with code ${code}`));
    });
  });
}
