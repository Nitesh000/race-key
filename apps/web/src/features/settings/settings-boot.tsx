"use client";

import { useEffect } from "react";
import { applySettings, getSettings } from "./store";

export function SettingsBoot() {
  useEffect(() => applySettings(getSettings()), []);
  return null;
}
