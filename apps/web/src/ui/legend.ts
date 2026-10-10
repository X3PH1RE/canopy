import type { ViewMode } from "../scene/model";
import { languageColors, viewRamps } from "../theme";

export interface LegendItem {
  label: string;
  color: string;
}

export function legendForViewMode(viewMode: ViewMode): LegendItem[] {
  if (viewMode === "language") {
    return [
      { label: "TypeScript", color: languageColors.typescript },
      { label: "JavaScript", color: languageColors.javascript },
      { label: "Python", color: languageColors.python },
      { label: "Go", color: languageColors.go },
      { label: "Java", color: languageColors.java },
      { label: "Markdown", color: languageColors.markdown },
      { label: "Other", color: languageColors.other },
    ];
  }

  if (viewMode === "churn") {
    return [
      { label: "Low churn", color: viewRamps.churn[0]! },
      { label: "Medium", color: viewRamps.churn[1]! },
      { label: "High churn", color: viewRamps.churn[2]! },
    ];
  }

  if (viewMode === "complexity") {
    return [
      { label: "Low complexity", color: viewRamps.complexity[0]! },
      { label: "Medium", color: viewRamps.complexity[1]! },
      { label: "High complexity", color: viewRamps.complexity[2]! },
    ];
  }

  return [
    { label: "Low risk", color: viewRamps.risk[0]! },
    { label: "Watch", color: viewRamps.risk[1]! },
    { label: "High risk", color: viewRamps.risk[2]! },
  ];
}
