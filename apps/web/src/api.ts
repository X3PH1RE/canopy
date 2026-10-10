import type { CityData } from "@canopy/shared";

export async function loadSampleCity(): Promise<CityData> {
  const response = await fetch("/samples/fake.json");

  if (!response.ok) {
    throw new Error(`Could not load sample city (${response.status})`);
  }

  return response.json() as Promise<CityData>;
}
