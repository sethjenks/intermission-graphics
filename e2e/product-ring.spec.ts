import { expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";
import { dragIsolineSlider, openIsolineProofSession } from "./product-isoline-helpers";

const sliderTargets = [
  "ring.innerRadius",
  "ring.outerRadius",
  "ring.rotation",
  "ring.lineCount",
  "ring.strokeWeight",
  "ring.harmonicCount",
  "ring.bulgeAmount",
  "ring.bulgeAngle",
  "ring.smoothness",
] as const;

for (const target of sliderTargets) {
  test(`browser: ${target} changes product output`, async ({ page }) => {
    const session = await openIsolineProofSession(page);
    if (target === "ring.harmonicCount") {
      await expectToolcraftDiscreteSliderMarkers(page, target);
    }
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (_field, currentPage) => {
        await dragIsolineSlider(currentPage, target, 0.85);
      }),
      { requirementId: target },
    );
  });
}
