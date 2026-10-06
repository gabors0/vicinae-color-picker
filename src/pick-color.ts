import { Clipboard, closeMainWindow, getPreferenceValues, showHUD } from "@vicinae/api";
import { addToHistory, formatColor, Format, pickColor, PickError } from "./color";

export default async function PickColor() {
  await closeMainWindow();
  // Give the launcher time to disappear before the picker grabs the pointer
  await new Promise((resolve) => setTimeout(resolve, 200));

  let hex: string | null;
  try {
    hex = await pickColor();
  } catch (error) {
    await showHUD(error instanceof PickError ? error.message : "Color pick failed");
    return;
  }
  if (!hex) {
    await showHUD("Color pick cancelled");
    return;
  }

  const { format } = getPreferenceValues<{ format: Format }>();
  const value = formatColor(hex, format);
  await Clipboard.copy(value);
  await addToHistory(hex);
  await showHUD(`Copied ${value}`);
}
