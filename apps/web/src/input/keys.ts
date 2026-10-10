import { useEffect, useState } from "react";

export interface KeySnapshot {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  boost: boolean;
  toggleFly: boolean;
  expand: boolean;
  escape: boolean;
  space: boolean;
  digit: 1 | 2 | 3 | 4 | null;
  yawLeft: boolean;
  yawRight: boolean;
}

interface EditableLike {
  tagName?: string;
  isContentEditable?: boolean;
  getAttribute?: (name: string) => string | null;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as EditableLike | null;
  if (!element) {
    return false;
  }

  const tagName = element.tagName?.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    element.isContentEditable === true ||
    element.getAttribute?.("role") === "textbox"
  );
}

export function createKeyTracker() {
  const pressed = new Set<string>();

  return {
    press(key: string) {
      pressed.add(normalizeKey(key));
    },
    release(key: string) {
      pressed.delete(normalizeKey(key));
    },
    clear() {
      pressed.clear();
    },
    snapshot(): KeySnapshot {
      return snapshotPressed(pressed);
    },
  };
}

export function useKeyControls(enabled = true): KeySnapshot {
  const [snapshot, setSnapshot] = useState<KeySnapshot>(() => snapshotPressed(new Set()));

  useEffect(() => {
    if (!enabled || typeof document === "undefined" || typeof window === "undefined") {
      return undefined;
    }

    const tracker = createKeyTracker();
    const update = () => setSnapshot(tracker.snapshot());

    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }
      tracker.press(event.key);
      update();
    }

    function handleKeyUp(event: KeyboardEvent) {
      tracker.release(event.key);
      update();
    }

    function handleBlur() {
      tracker.clear();
      update();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [enabled]);

  return snapshot;
}

function snapshotPressed(pressed: Set<string>): KeySnapshot {
  return {
    forward: pressed.has("w"),
    backward: pressed.has("s"),
    left: pressed.has("a"),
    right: pressed.has("d"),
    up: pressed.has("q"),
    down: pressed.has("e"),
    boost: pressed.has("shift"),
    toggleFly: pressed.has("f"),
    expand: pressed.has("enter"),
    escape: pressed.has("escape"),
    space: pressed.has(" "),
    digit: digitFromPressed(pressed),
    yawLeft: pressed.has("arrowleft"),
    yawRight: pressed.has("arrowright"),
  };
}

function digitFromPressed(pressed: Set<string>): 1 | 2 | 3 | 4 | null {
  if (pressed.has("1")) return 1;
  if (pressed.has("2")) return 2;
  if (pressed.has("3")) return 3;
  if (pressed.has("4")) return 4;
  return null;
}

function normalizeKey(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key.toLowerCase();
}
