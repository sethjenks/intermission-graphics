import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { proveIsolineControlAcrossApplicabilityCases } from "./product-isoline-applicability";
import { test } from "./toolcraft-product-test";
import {
  dragIsolineSlider,
  openIsolineProofSession,
  setIsolineSwitch,
} from "./product-isoline-helpers";

async function scrubAwayFromStart(page: import("@playwright/test").Page) {
  const scrubber = page.getByRole("slider", { name: "Playback position" });
  if (!(await scrubber.isVisible())) {
    await page
      .locator('[data-toolcraft-control-target="panels.timeline.extended"]')
      .getByRole("switch")
      .click();
  }
  await scrubber.press("Home");
  for (let step = 0; step < 8; step += 1) {
    await scrubber.press("ArrowRight");
  }
}

test("browser: motion.orbit changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await scrubAwayFromStart(page);
  let checked = false;

  await proveIsolineControlAcrossApplicabilityCases({
    page,
    session,
    target: "motion.orbit",
    run: async (requirementId) => {
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction("motion.orbit", async (field) => {
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
  await scrubAwayFromStart(page);
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
  await scrubAwayFromStart(page);
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
