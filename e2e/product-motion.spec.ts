import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { proveIsolineControlAcrossApplicabilityCases } from "./product-isoline-applicability";
import { test } from "./toolcraft-product-test";
import {
  dragIsolineSlider,
  openIsolineProofSession,
  setIsolineSwitch,
} from "./product-isoline-helpers";

test("browser: motion.flow changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  let checked = false;

  await proveIsolineControlAcrossApplicabilityCases({
    page,
    session,
    target: "motion.flow",
    run: async (requirementId) => {
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction("motion.flow", async (field) => {
          await setIsolineSwitch(field, checked);
          checked = !checked;
        }),
        { requirementId },
      );
    },
  });
});

test("browser: motion.breathe changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  let checked = false;

  await proveIsolineControlAcrossApplicabilityCases({
    page,
    session,
    target: "motion.breathe",
    run: async (requirementId) => {
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction("motion.breathe", async (field) => {
          await setIsolineSwitch(field, checked);
          checked = !checked;
        }),
        { requirementId },
      );
    },
  });
});

test("browser: motion.speed changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await proveIsolineControlAcrossApplicabilityCases({
    page,
    session,
    target: "motion.speed",
    run: async (requirementId) => {
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction("motion.speed", async (_field, currentPage) => {
          await dragIsolineSlider(currentPage, "motion.speed", 0.85);
        }),
        { requirementId },
      );
    },
  });
});
