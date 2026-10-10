export interface LoadingCopy {
  title: string;
  detail: string;
}

const STAGE_COPY: Record<string, LoadingCopy> = {
  queued: {
    title: "Planting the seed",
    detail: "Your repository is queued for a fresh city build.",
  },
  cloning: {
    title: "Taking a cutting",
    detail: "Fetching the repo without running its code.",
  },
  walking: {
    title: "Finding the paths",
    detail: "Filtering source files and skipping heavy growth.",
  },
  parsing: {
    title: "Reading the rings",
    detail: "Measuring files, functions, dependencies, and history.",
  },
  layout: {
    title: "Shaping the canopy",
    detail: "Arranging folders into districts and files into towers.",
  },
  done: {
    title: "Canopy grown",
    detail: "The city is ready to explore.",
  },
};

export function loadingCopyForStage(stage: string): LoadingCopy {
  return STAGE_COPY[stage] ?? {
    title: "Growing your city",
    detail: humanizeStage(stage),
  };
}

function humanizeStage(stage: string): string {
  const spaced = stage.replace(/[-_]+/g, " ").trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : "Working through the repo";
}
