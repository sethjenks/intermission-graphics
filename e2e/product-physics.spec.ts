import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";
import {
  dragIsolineSlider,
  openIsolineProofSession,
  strumIsolineRing,
} from "./product-isoline-helpers";

for (const target of [
  "physics.strength",
  "physics.radius",
  "physics.waveSpeed",
  "physics.damping",
  "physics.return",
] as const) {
  test(`browser: ${target} changes product output`, async ({ page }) => {
    const session = await openIsolineProofSession(page);
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (_field, currentPage) => {
        await dragIsolineSlider(currentPage, target, 0.82);
        await strumIsolineRing(currentPage);
      }),
      { requirementId: target },
    );
  });
}

test("browser: Strum tool deforms the line field and settles", async ({
  page,
}) => {
  const session = await openIsolineProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.targetAction("physics.strength", async (currentPage) => {
      await strumIsolineRing(currentPage);
    }),
    { requirementId: "interaction.strum" },
  );
});
