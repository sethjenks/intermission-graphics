import path from "node:path";

import { expect } from "@playwright/test";

import { expectToolcraftMediaLifecycle } from "./browser-state-evidence-helpers";
import { proveIsolineControlAcrossApplicabilityCases } from "./product-isoline-applicability";
import { test } from "./toolcraft-product-test";
import {
  openIsolineProofSession,
  scrollIsolineTarget,
} from "./product-isoline-helpers";

const BACKGROUND_IMAGE_FIXTURE = path.join(
  process.cwd(),
  "e2e/fixtures/isoline-background.png",
);

type FieldSnapshot = {
  image: {
    flipHorizontal: boolean;
    flipVertical: boolean;
    id: string;
    rotationDeg: number;
  } | null;
};

function fieldLifecycleIds(field: FieldSnapshot): string[] {
  if (!field.image) {
    return [];
  }
  return [
    [
      "image",
      field.image.rotationDeg,
      field.image.flipHorizontal,
      field.image.flipVertical,
    ].join(":"),
  ];
}

test("browser: appearance.backgroundImage upload lifecycle updates the field", async ({
  page,
}) => {
  const session = await openIsolineProofSession(page);
  await proveIsolineControlAcrossApplicabilityCases({
    page,
    session,
    target: "appearance.backgroundImage",
    run: async () => {
  const field = session.observe((root) => {
    const output = root.querySelector("[data-isoline-field]");
    const snapshot = JSON.parse(
      output?.getAttribute("data-isoline-field") ?? "{}",
    ) as FieldSnapshot;
    const itemIds = fieldLifecycleIds(snapshot);
    return {
      itemIds,
      outputSignature: itemIds[0] ?? "null",
    };
  });

  await expectToolcraftMediaLifecycle(
    field,
    session.controlAction("appearance.backgroundImage", async (control) => {
      const input = control.locator('input[type="file"]');
      await input.setInputFiles(BACKGROUND_IMAGE_FIXTURE);
      await control
        .page()
        .locator("[data-toolcraft-product-output]")
        .waitFor({ state: "visible" });
      await expect(
        control.page().locator("[data-toolcraft-product-output]"),
      ).toHaveAttribute("data-isoline-image", "ready");
    }),
    {
      itemIds: ["image:0:false:false"],
      outputSignature: "image:0:false:false",
    },
    { requirementId: "appearance.backgroundImage" },
  );

  await expectToolcraftMediaLifecycle(
    field,
    session.controlAction("appearance.backgroundImage", async (control) => {
      await control.getByRole("button", { name: "90° Right" }).click();
    }),
    {
      itemIds: ["image:90:false:false"],
      outputSignature: "image:90:false:false",
    },
    { requirementId: "appearance.backgroundImage" },
  );

  await expectToolcraftMediaLifecycle(
    field,
    session.controlAction("appearance.backgroundImage", async (control) => {
      await control.getByRole("button", { name: "Flip horizontal" }).click();
    }),
    {
      itemIds: ["image:90:true:false"],
      outputSignature: "image:90:true:false",
    },
    { requirementId: "appearance.backgroundImage" },
  );

  await expectToolcraftMediaLifecycle(
    field,
    session.controlAction("appearance.backgroundImage", async (control) => {
      await control.getByRole("button", { name: /Remove / }).click();
    }),
    {
      itemIds: [],
      outputSignature: "null",
    },
    { requirementId: "appearance.backgroundImage" },
  );

  await expectToolcraftMediaLifecycle(
    field,
    session.controlAction("appearance.backgroundImage", async (control) => {
      const input = control.locator('input[type="file"]');
      await input.setInputFiles(BACKGROUND_IMAGE_FIXTURE);
      await expect(
        control.page().locator("[data-toolcraft-product-output]"),
      ).toHaveAttribute("data-isoline-image", "ready");
    }),
    {
      itemIds: ["image:0:false:false"],
      outputSignature: "image:0:false:false",
    },
    { requirementId: "appearance.backgroundImage" },
  );

  await expectToolcraftMediaLifecycle(
    field,
    session.targetAction("appearance.backgroundImage", async (currentPage) => {
      await scrollIsolineTarget(currentPage, "appearance.backgroundImage");
      await currentPage.getByRole("button", { name: "Reset Background" }).click();
    }),
    {
      itemIds: [],
      outputSignature: "null",
    },
    { requirementId: "appearance.backgroundImage" },
  );
    },
  });
});
