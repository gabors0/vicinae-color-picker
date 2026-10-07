import { useEffect, useState } from "react";
import { Action, ActionPanel, closeMainWindow, Icon, List, showToast, Toast } from "@vicinae/api";
import { copyText } from "./clipboard";
import { addToHistory, formatColor, getHistory, pickColor, PickedColor, PickError, saveHistory } from "./color";

// Stand-in for Action.CopyToClipboard, which goes through Vicinae's clipboard — see copyText
function CopyAction({ title, content }: { title: string; content: string }) {
  const copy = async () => {
    try {
      await copyText(content);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await showToast({ style: Toast.Style.Failure, title: "Copy failed", message });
      return;
    }
    await closeMainWindow();
  };
  return <Action title={title} icon={Icon.CopyClipboard} onAction={copy} />;
}

export default function ColorHistory() {
  const [history, setHistory] = useState<PickedColor[]>();

  const reload = () => getHistory().then(setHistory);
  useEffect(() => {
    reload();
  }, []);

  const update = async (next: PickedColor[]) => {
    await saveHistory(next);
    setHistory(next);
  };

  const pickNew = async () => {
    let hex: string | null;
    try {
      hex = await pickColor();
    } catch (error) {
      const message = error instanceof PickError ? error.message : String(error);
      await showToast({ style: Toast.Style.Failure, title: "Color pick failed", message });
      return;
    }
    if (!hex) return;
    await addToHistory(hex);
    await reload();
    await showToast({ style: Toast.Style.Success, title: `Picked ${hex}` });
  };

  const pickAction = <Action title="Pick New Color" icon={Icon.EyeDropper} onAction={pickNew} />;

  return (
    <List isLoading={history === undefined} searchBarPlaceholder="Search picked colors">
      {history?.length === 0 && (
        <List.EmptyView title="No colors picked yet" actions={<ActionPanel>{pickAction}</ActionPanel>} />
      )}
      {history?.map((color) => (
        <List.Item
          key={color.hex}
          title={color.hex}
          subtitle={`${formatColor(color.hex, "rgb")}  ·  ${formatColor(color.hex, "hsl")}`}
          icon={{ source: Icon.CircleFilled, tintColor: color.hex }}
          accessories={[{ text: new Date(color.pickedAt) }]}
          actions={
            <ActionPanel>
              <CopyAction title="Copy HEX" content={color.hex} />
              <CopyAction title="Copy RGB" content={formatColor(color.hex, "rgb")} />
              <CopyAction title="Copy HSL" content={formatColor(color.hex, "hsl")} />
              {pickAction}
              <Action
                title="Remove"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={{ modifiers: ["ctrl"], key: "x" }}
                onAction={() => update(history.filter((c) => c.hex !== color.hex))}
              />
              <Action
                title="Clear History"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={{ modifiers: ["ctrl", "shift"], key: "x" }}
                onAction={() => update([])}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
