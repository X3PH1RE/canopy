import type { CityData, FileNode } from "@canopy/shared";
import { languageColors, theme, viewRamps } from "../theme";

export type ViewMode = "language" | "churn" | "complexity" | "risk";

export interface BuildingVisual {
  color: string;
  roofColor: string;
  emissive: string;
  emissiveIntensity: number;
}

export function buildingHeight(loc: number): number {
  return Math.max(0.3, Math.log2(loc + 1) * 1.2);
}

export function fileCenter(file: FileNode): [number, number] {
  return [file.x, file.z];
}

export function fileById(files: FileNode[], id: number): FileNode | undefined {
  return files.find((file) => file.id === id);
}

export function sceneWorldSize(city: CityData): number {
  const maxExtent = city.files.reduce((extent, file) => {
    const xExtent = Math.max(Math.abs(file.x - file.w / 2), Math.abs(file.x + file.w / 2));
    const zExtent = Math.max(Math.abs(file.z - file.d / 2), Math.abs(file.z + file.d / 2));
    return Math.max(extent, xExtent, zExtent);
  }, 0);

  return Math.ceil(maxExtent * 2);
}

export function buildingVisual(file: FileNode, files: FileNode[], viewMode: ViewMode): BuildingVisual {
  if (viewMode === "language") {
    return {
      color: languageColors[file.language] ?? languageColors.other,
      roofColor: theme.roofGreen,
      emissive: "#000000",
      emissiveIntensity: 0,
    };
  }

  if (viewMode === "churn") {
    const rank = percentileFor(file, files, (item) => item.churn);
    return {
      color: rampColor(viewRamps.churn, rank),
      roofColor: theme.roofGreen,
      emissive: theme.gold,
      emissiveIntensity: rank * 0.42,
    };
  }

  if (viewMode === "complexity") {
    const rank = percentileFor(file, files, (item) => item.complexity);
    return {
      color: rampColor(viewRamps.complexity, rank),
      roofColor: theme.roofGreen,
      emissive: viewRamps.complexity[2],
      emissiveIntensity: rank * 0.24,
    };
  }

  const risk = Math.max(0, Math.min(1, file.risk));
  return {
    color: rampColor(viewRamps.risk, risk),
    roofColor: mixColor(theme.roofGreen, theme.dryRoof, risk),
    emissive: theme.rust,
    emissiveIntensity: risk * 0.5,
  };
}

function percentileFor(file: FileNode, files: FileNode[], metric: (file: FileNode) => number): number {
  if (files.length <= 1) {
    return 0;
  }

  const value = metric(file);
  const sorted = files.map(metric).sort((a, b) => a - b);
  const first = sorted.findIndex((item) => item === value);
  let last = first;
  for (let index = first + 1; index < sorted.length; index += 1) {
    if (sorted[index] !== value) {
      break;
    }
    last = index;
  }
  return ((first + last) / 2) / (files.length - 1);
}

function rampColor([low, middle, high]: string[], t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped <= 0.5) {
    return mixColor(low!, middle!, clamped * 2);
  }

  return mixColor(middle!, high!, (clamped - 0.5) * 2);
}

function mixColor(from: string, to: string, t: number): string {
  const fromRgb = hexToRgb(from);
  const toRgb = hexToRgb(to);
  return rgbToHex([
    Math.round(fromRgb[0] + (toRgb[0] - fromRgb[0]) * t),
    Math.round(fromRgb[1] + (toRgb[1] - fromRgb[1]) * t),
    Math.round(fromRgb[2] + (toRgb[2] - fromRgb[2]) * t),
  ]);
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, "0");
}
