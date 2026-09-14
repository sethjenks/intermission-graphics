import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";
import {
  dragIsolineSlider,
  openIsolineProofSession,
  orbitIsolineBackground,
} from "./product-isoline-helpers";

for (const target of ["space.bendX", "space.bendY", "space.depthZ"] as const) {
  test(`browser: ${target} changes product output`, async ({ page }) => {
    const session = await openIsolineProofSession(page);
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (_field, currentPage) => {
        await dragIsolineSlider(currentPage, target, 0.85);
      }),
      { requirementId: target },
    );
  });
}

test(
  "browser: orientation gizmo and Orbit tool share the rendered pose",
  async ({ page }) => {
    const session = await openIsolineProofSession(page);
    await expectToolcraftProductObservableToChange(
      session,
      session.targetAction("view.orbit", async (currentPage) => {
        await orbitIsolineBackground(currentPage);
      }),
      { requirementId: "view.orbit" },
    );
  },
);
