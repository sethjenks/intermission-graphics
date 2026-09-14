import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { proveIsolineControlAcrossApplicabilityCases } from "./product-isoline-applicability";
import { test } from "./toolcraft-product-test";
import {
  openIsolineProofSession,
  setIsolineHexColor,
  setIsolineSwitch,
} from "./product-isoline-helpers";

test("browser: export.includeBackground changes product output", async ({
  page,
}) => {
  const session = await openIsolineProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("export.includeBackground", async (field) => {
      await setIsolineSwitch(field, false);
    }),
    { requirementId: "export.includeBackground" },
  );
});

test("browser: appearance.backgroundFill changes product output", async ({
  page,
}) => {
  const session = await openIsolineProofSession(page);
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Type", {
    requirementId: "appearance.backgroundFill",
    target: "appearance.backgroundFill",
  });
  for (const option of ["Gradient", "Image", "Solid"]) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction("appearance.backgroundFill", async (field) => {
        await field.getByText(option, { exact: true }).click();
      }),
      { requirementId: "appearance.backgroundFill" },
    );
  }
});

test("browser: appearance.background changes product output", async ({
  page,
}) => {
  const session = await openIsolineProofSession(page);
  await proveIsolineControlAcrossApplicabilityCases({
    page,
    session,
    target: "appearance.background",
    run: async (requirementId) => {
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction("appearance.background", async (field) => {
          await setIsolineHexColor(field, "#111318");
        }),
        { requirementId },
      );
    },
  });
});
