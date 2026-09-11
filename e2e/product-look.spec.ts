import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";
import {
  dragIsolineSlider,
  openIsolineProofSession,
  setIsolineSelect,
} from "./product-isoline-helpers";

test("browser: look.preset changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  for (const label of ["Quiet", "Drift", "Dense", "Inverse", "Reference"]) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction("look.preset", async (field, currentPage) => {
        await setIsolineSelect(currentPage, field, label);
      }),
      { requirementId: "look.preset" },
    );
  }
});

test("browser: look.seed changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("look.seed", async (_field, currentPage) => {
      await dragIsolineSlider(currentPage, "look.seed", 0.85);
    }),
    { requirementId: "look.seed" },
  );
});

test("browser: look.randomize changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("look.randomize", async (field) => {
      await field.getByRole("button", { name: "Randomize" }).click();
    }),
    { requirementId: "look.randomize" },
  );
});
