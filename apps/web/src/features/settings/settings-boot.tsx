"use client";

import { useEffect } from "react";
import {
  applySettings,
  getSettings,
  updateSettings,
  type CaretStyle,
  type LanePattern,
} from "./store";

export function SettingsBoot({ equipped }: { equipped?: { caret: string; lane: string } }) {
  const caret = equipped?.caret as CaretStyle | undefined;
  const lane = equipped?.lane as LanePattern | undefined;
  useEffect(() => {
    const s = getSettings();
    if (caret && lane && (s.caret !== caret || s.lane !== lane)) updateSettings({ caret, lane });
    else applySettings(s);
  }, [caret, lane]);
  return null;
}
