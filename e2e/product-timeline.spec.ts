import { expectToolcraftStandardTimelinePlayback } from "./browser-standard-timeline-evidence";
import { test } from "./toolcraft-product-test";
import { ISOLINE_OUTPUT_SELECTOR, openIsolineProofSession } from "./product-isoline-helpers";

test("browser: timeline playback controls drive rendered output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await expectToolcraftStandardTimelinePlayback(session, {
    markerSelector: ISOLINE_OUTPUT_SELECTOR,
    requirementId: "timeline.playback",
  });
});
