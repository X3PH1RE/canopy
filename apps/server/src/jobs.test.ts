import { describe, expect, it } from "vitest";
import { createJobQueue } from "./jobs";

describe("job queue errors", () => {
  it("turns git network failures into a user-facing message", async () => {
    const queue = createJobQueue(async () => {
      throw new Error(
        "Cloning into 'C:\\Users\\ashwi\\OneDrive\\Desktop\\canopy\\apps\\server\\apps\\server\\cache\\repos\\X3PH1RE__canopy'...\n" +
          "fatal: unable to access 'https://github.com/X3PH1RE/canopy.git/': Failed to connect to github.com port 443 after 568 ms: Couldn't connect to server",
      );
    });

    const started = queue.start("https://github.com/X3PH1RE/canopy");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(queue.get(started.id)).toMatchObject({
      status: "error",
      stage: "error",
      error:
        "Could not reach GitHub while cloning the repository. Check your internet connection, then try again.",
    });
    expect(queue.get(started.id)?.error).not.toContain("Cloning into");
  });
});
