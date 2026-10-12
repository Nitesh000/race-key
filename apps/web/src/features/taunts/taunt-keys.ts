const digit = /^(?:Digit|Numpad)([1-9])$/;

export function createTauntKeys(onTaunt: (slot: number) => void) {
  let tabHeld = false;

  const intercept = (e: KeyboardEvent) => {
    if (e.code === "Tab" || e.key === "Tab") {
      if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return false;
      tabHeld = true;
      return true;
    }
    if (!tabHeld) return false;
    const m = digit.exec(e.code);
    if (!m) return false;
    if (!e.repeat) onTaunt(Number(m[1]));
    return true;
  };

  const release = (e: KeyboardEvent) => {
    if (e.code === "Tab" || e.key === "Tab") tabHeld = false;
  };
  const reset = () => {
    tabHeld = false;
  };

  return {
    intercept,
    attach() {
      window.addEventListener("keyup", release);
      window.addEventListener("blur", reset);
      document.addEventListener("visibilitychange", reset);
      return () => {
        window.removeEventListener("keyup", release);
        window.removeEventListener("blur", reset);
        document.removeEventListener("visibilitychange", reset);
      };
    },
    get held() {
      return tabHeld;
    },
  };
}
