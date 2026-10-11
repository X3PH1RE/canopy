import type { ViewMode } from "../scene/model";
import { languageColors, viewRamps } from "../theme";

export interface LegendItem {
  label: string;
  color: string;
  info: string;
}

export function legendForViewMode(viewMode: ViewMode): LegendItem[] {
  if (viewMode === "language") {
    return [
      { label: "TypeScript", color: languageColors.typescript, info: "Buildings in teal are TypeScript files (.ts, .tsx)." },
      { label: "JavaScript", color: languageColors.javascript, info: "Buildings in yellow are JavaScript files (.js, .jsx, .mjs)." },
      { label: "Python", color: languageColors.python, info: "Buildings in blue are Python files (.py)." },
      { label: "Go", color: languageColors.go, info: "Buildings in light teal are Go files (.go)." },
      { label: "Java", color: languageColors.java, info: "Buildings in orange are Java files (.java)." },
      { label: "Markdown", color: languageColors.markdown, info: "Buildings in lavender are Markdown docs (.md). They add context but no runtime logic." },
      { label: "Other", color: languageColors.other, info: "Sand-coloured buildings are source files in languages Canopy does not colour separately." },
    ];
  }

  if (viewMode === "churn") {
    return [
      { label: "Low churn", color: viewRamps.churn[0]!, info: "Rarely changed in the last 90 days. Pale cream: stable, settled code." },
      { label: "Medium", color: viewRamps.churn[1]!, info: "Changed a moderate number of times in the last 90 days. Amber glow." },
      { label: "High churn", color: viewRamps.churn[2]!, info: "Changed often in the last 90 days. Hot orange glow: active areas where bugs and merge conflicts tend to appear." },
    ];
  }

  if (viewMode === "complexity") {
    return [
      { label: "Low complexity", color: viewRamps.complexity[0]!, info: "Simple control flow: few branches, loops and conditions per function. Easy to read and test." },
      { label: "Medium", color: viewRamps.complexity[1]!, info: "A fair amount of branching. Still manageable, but worth keeping an eye on." },
      { label: "High complexity", color: viewRamps.complexity[2]!, info: "Deeply branched, hard-to-follow logic. Purple glow: candidates for splitting up or simplifying." },
    ];
  }

  return [
    { label: "Low risk", color: viewRamps.risk[0]!, info: "Low risk score: calm, small or stable files that few people need to worry about." },
    { label: "Watch", color: viewRamps.risk[1]!, info: "Mid-range risk. Score blends recent churn (40%), complexity (35%) and size (25%), so something is elevated." },
    { label: "High risk", color: viewRamps.risk[2]!, info: "Top of the risk score: large, complex files that also change a lot. Red glow: review and test these first." },
  ];
}
