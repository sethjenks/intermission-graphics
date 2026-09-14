import type { Page } from "@playwright/test";

import { appControlSectionInventory } from "../src/app/app-acceptance-data";
import {
  getToolcraftApplicabilityRequirementId,
  getToolcraftControlApplicabilityCases,
  type ToolcraftControlApplicabilityCase,
} from "../src/app/app-acceptance";
import { appSchema } from "../src/app/app-schema";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import type { ToolcraftBrowserProofSession } from "./browser-proof-session";
import {
  scrollIsolineTarget,
  setIsolineSelect,
  setIsolineSwitch,
} from "./product-isoline-helpers";

export function getIsolineApplicabilityCases(
  target: string,
): ToolcraftControlApplicabilityCase[] {
  return getToolcraftControlApplicabilityCases({
    schema: appSchema,
    sectionInventory: appControlSectionInventory,
    target,
  });
}

async function setIsolineApplicabilitySelector(
  page: Page,
  applicabilityCase: ToolcraftControlApplicabilityCase,
): Promise<void> {
  const field = await scrollIsolineTarget(page, applicabilityCase.selectorTarget);

  switch (applicabilityCase.selectorControlType) {
    case "checkbox":
    case "switch":
      await setIsolineSwitch(field, Boolean(applicabilityCase.selectorValue));
      return;
    case "select":
      if (!applicabilityCase.selectorOptionLabel) {
        throw new Error(
          `Select applicability for ${applicabilityCase.selectorTarget} needs an option label.`,
        );
      }
      await setIsolineSelect(page, field, applicabilityCase.selectorOptionLabel);
      return;
    case "segmented":
      if (!applicabilityCase.selectorOptionLabel) {
        throw new Error(
          `Segmented applicability for ${applicabilityCase.selectorTarget} needs an option label.`,
        );
      }
      await field
        .getByText(applicabilityCase.selectorOptionLabel, { exact: true })
        .click();
      return;
    case "imagePicker":
    case "slider":
    case "tabs":
      throw new Error(
        `Isoline proofs do not set ${applicabilityCase.selectorControlType} selectors.`,
      );
    default: {
      const exhaustive: never = applicabilityCase.selectorControlType;
      throw new Error(`Unhandled applicability selector ${String(exhaustive)}.`);
    }
  }
}

export async function proveIsolineControlAcrossApplicabilityCases({
  page,
  run,
  session,
  target,
}: {
  page: Page;
  run: (requirementId: string) => Promise<void>;
  session: ToolcraftBrowserProofSession;
  target: string;
}): Promise<void> {
  const cases = getIsolineApplicabilityCases(target);

  if (cases.length === 0) {
    await run(target);
    return;
  }

  for (const applicabilityCase of cases) {
    await expectToolcraftControlApplicabilityState(
      session,
      session.controlAction(applicabilityCase.selectorTarget, async () => {
        await setIsolineApplicabilitySelector(page, applicabilityCase);
      }),
      applicabilityCase,
      { baseRequirementId: target },
    );

    if (applicabilityCase.expectation === "hidden") {
      continue;
    }

    await run(getToolcraftApplicabilityRequirementId(target, applicabilityCase));
  }
}
