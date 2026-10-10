export const PROXIMITY_DWELL_MS = 250;
export const PROXIMITY_RELEASE_MS = 300;
export const PROXIMITY_MAX_SPEED = 5.5;

export interface ProximityState {
  candidateId: number | null;
  candidateSinceMs: number | null;
  activeId: number | null;
  releaseSinceMs: number | null;
}

export interface ProximityInput {
  nearestId: number | null;
  nowMs: number;
  speed: number;
}

export function initialProximityState(): ProximityState {
  return {
    candidateId: null,
    candidateSinceMs: null,
    activeId: null,
    releaseSinceMs: null,
  };
}

export function updateProximity(state: ProximityState, input: ProximityInput): ProximityState {
  const next: ProximityState = { ...state };
  const canActivate = input.nearestId !== null && input.speed <= PROXIMITY_MAX_SPEED;

  if (!canActivate) {
    next.candidateId = null;
    next.candidateSinceMs = null;
    return updateRelease(next, input);
  }

  if (next.candidateId !== input.nearestId) {
    next.candidateId = input.nearestId;
    next.candidateSinceMs = input.nowMs;
  }

  next.releaseSinceMs = null;

  if (
    next.activeId !== input.nearestId &&
    next.candidateSinceMs !== null &&
    input.nowMs - next.candidateSinceMs >= PROXIMITY_DWELL_MS
  ) {
    next.activeId = input.nearestId;
  }

  return next;
}

function updateRelease(state: ProximityState, input: ProximityInput): ProximityState {
  const next: ProximityState = { ...state };

  if (next.activeId === null) {
    next.releaseSinceMs = null;
    return next;
  }

  if (next.releaseSinceMs === null) {
    next.releaseSinceMs = input.nowMs;
    return next;
  }

  if (input.nowMs - next.releaseSinceMs >= PROXIMITY_RELEASE_MS) {
    next.activeId = null;
    next.releaseSinceMs = null;
  }

  return next;
}
