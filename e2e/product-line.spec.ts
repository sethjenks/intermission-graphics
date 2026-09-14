import { readToolcraftBrowserObservation } from "./browser-proof-session";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { proveIsolineControlAcrossApplicabilityCases } from "./product-isoline-applicability";
import { test } from "./toolcraft-product-test";
import {
  dragIsolineSlider,
  openIsolineProofSession,
} from "./product-isoline-helpers";

test.setTimeout(120_000);

const conditionalSliderTargets = [
  "line.dashLength",
  "line.dashGap",
  "particles.count",
  "particles.size",
  "particles.spread",
  "particles.scatter",
  "particles.return",
  "particles.damping",
] as const;

test("browser: line.makeup changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Makeup", {
    requirementId: "line.makeup",
    target: "line.makeup",
  });
  for (const option of ["Dashed", "Particles", "Solid"]) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction("line.makeup", async (field) => {
        await field.getByText(option, { exact: true }).click();
      }),
      { requirementId: "line.makeup" },
    );
  }
});

for (const target of conditionalSliderTargets) {
  test(`browser: ${target} changes product output`, async ({ page }) => {
    const session = await openIsolineProofSession(page);
    await proveIsolineControlAcrossApplicabilityCases({
      page,
      session,
      target,
      run: async (requirementId) => {
        await expectToolcraftProductObservableToChange(
          session,
          session.controlAction(target, async (_field, currentPage) => {
            await dragIsolineSlider(currentPage, target, 0.8);
          }),
          { requirementId },
        );
      },
    });
  });
}

test("browser: line.thickness changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await proveIsolineControlAcrossApplicabilityCases({
    page,
    session,
    target: "line.thickness",
    run: async (requirementId) => {
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction("line.thickness", async (_field, currentPage) => {
          await dragIsolineSlider(currentPage, "line.thickness", 0.8);
        }),
        { requirementId },
      );

      const thickness = session.observe((root) => {
        const output = root.querySelector("[data-isoline-ink]");
        const ink = JSON.parse(output?.getAttribute("data-isoline-ink") ?? "{}") as {
          thickness?: number[];
        };
        return ink.thickness ?? [];
      });
      const applicabilitySuffix = requirementId.slice("line.thickness".length);
      const beforeLower = await readToolcraftBrowserObservation(thickness);
      await expectToolcraftCompoundControlPartOutcome(
        thickness,
        session.controlAction("line.thickness", async (field) => {
          await field.getByRole("slider").nth(0).press("Home");
        }),
        [0.2, beforeLower[1]!],
        {
          part: `rangeSlider.lower${applicabilitySuffix}`,
          requirementId: "line.thickness",
        },
      );
      const beforeUpper = await readToolcraftBrowserObservation(thickness);
      const upperAtMaximum = beforeUpper[1] === 8;
      await expectToolcraftCompoundControlPartOutcome(
        thickness,
        session.controlAction("line.thickness", async (field) => {
          await field
            .getByRole("slider")
            .nth(1)
            .press(upperAtMaximum ? "ArrowLeft" : "End");
        }),
        [beforeUpper[0]!, upperAtMaximum ? 7.95 : 8],
        {
          part: `rangeSlider.upper${applicabilitySuffix}`,
          requirementId: "line.thickness",
        },
      );
    },
  });
});

test("browser: line.widthProfile changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("line.widthProfile", async (field, currentPage) => {
      const graph = field.locator("svg").first();
      const box = await graph.boundingBox();
      if (!box) {
        throw new Error("Width profile graph has no layout box.");
      }
      await currentPage.mouse.move(
        box.x + box.width * 0.46,
        box.y + box.height * 0.38,
      );
      await currentPage.mouse.down();
      await currentPage.mouse.move(
        box.x + box.width * 0.6,
        box.y + box.height * 0.25,
        { steps: 6 },
      );
      await currentPage.mouse.up();
    }),
    { requirementId: "line.widthProfile" },
  );
});
