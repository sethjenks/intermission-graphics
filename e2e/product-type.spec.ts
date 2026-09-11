import { expect } from "@playwright/test";

import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { proveIsolineControlAcrossApplicabilityCases } from "./product-isoline-applicability";
import { test } from "./toolcraft-product-test";
import {
  openIsolineProofSession,
  readIsolineType,
  openIsolineFontPopover,
  setIsolineFontFooterSlider,
  setIsolineHexColor,
  setIsolineSelect,
  setIsolineSwitch,
  setIsolineText,
  type IsolineTypeSnapshot,
} from "./product-isoline-helpers";

test("browser: type.title changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await proveIsolineControlAcrossApplicabilityCases({
    page,
    session,
    target: "type.title",
    run: async (requirementId) => {
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction("type.title", async (field) => {
          await setIsolineText(field, "LANES");
        }),
        { requirementId },
      );
    },
  });
});

test("browser: type.subtitle changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await proveIsolineControlAcrossApplicabilityCases({
    page,
    session,
    target: "type.subtitle",
    run: async (requirementId) => {
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction("type.subtitle", async (field) => {
          await setIsolineText(field, "NEAR AND FAR");
        }),
        { requirementId },
      );
    },
  });
});

test("browser: type.showTitle changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  let checked = false;
  await proveIsolineControlAcrossApplicabilityCases({
    page,
    session,
    target: "type.showTitle",
    run: async (requirementId) => {
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction("type.showTitle", async (field) => {
          await setIsolineSwitch(field, checked);
          checked = !checked;
        }),
        { requirementId },
      );
    },
  });
});

test("browser: type.showSubtitle changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  let checked = false;
  await proveIsolineControlAcrossApplicabilityCases({
    page,
    session,
    target: "type.showSubtitle",
    run: async (requirementId) => {
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction("type.showSubtitle", async (field) => {
          await setIsolineSwitch(field, checked);
          checked = !checked;
        }),
        { requirementId },
      );
    },
  });
});

test("browser: type.font changes product output", async ({ page }) => {
  test.setTimeout(90_000);
  const session = await openIsolineProofSession(page);
  const observeType = session.observe((root) => {
    const raw = root
      .querySelector("[data-toolcraft-product-output]")
      ?.getAttribute("data-isoline-type");
    return raw ? (JSON.parse(raw) as IsolineTypeSnapshot) : {};
  });

  const nextType = async (patch: Partial<IsolineTypeSnapshot>): Promise<IsolineTypeSnapshot> => ({
    ...(await readIsolineType(page)),
    ...patch,
  });

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("type.font", async (field) => {
      const size = field.getByRole("textbox", { name: "Font size" });
      await size.fill("32");
      await size.press("Enter");
    }),
    { requirementId: "type.font" },
  );

  await expectToolcraftCompoundControlPartOutcome(
    observeType,
    session.controlAction("type.font", async (field) => {
      await openIsolineFontPopover(page, field);
      const fontList = page.locator('[data-slot="font-picker-list"]');
      await fontList.waitFor({ state: "attached" });
      await fontList.locator("button").nth(1).evaluate((node) => {
        if (node instanceof HTMLElement) {
          node.click();
        }
      });
    }),
    await nextType({ fontId: "geist" }),
    { part: "fontPicker.fontId", requirementId: "type.font" },
  );

  await expectToolcraftCompoundControlPartOutcome(
    observeType,
    session.controlAction("type.font", async (field) => {
      await setIsolineSelect(
        page,
        field.locator('[data-slot="font-picker-weight-field"]'),
        "700",
      );
    }),
    await nextType({ fontWeight: "700" }),
    { part: "fontPicker.fontWeight", requirementId: "type.font" },
  );

  await expectToolcraftCompoundControlPartOutcome(
    observeType,
    session.controlAction("type.font", async (field) => {
      const size = field.getByRole("textbox", { name: "Font size" });
      await size.fill("28");
      await size.press("Enter");
    }),
    await nextType({ fontSize: 28 }),
    { part: "fontPicker.fontSize", requirementId: "type.font" },
  );

  await expectToolcraftCompoundControlPartOutcome(
    observeType,
    session.controlAction("type.font", async (field) => {
      await setIsolineFontFooterSlider(page, field, 0, "start");
    }),
    await nextType({ letterSpacing: "tighter" }),
    { part: "fontPicker.letterSpacing", requirementId: "type.font" },
  );

  await expectToolcraftCompoundControlPartOutcome(
    observeType,
    session.controlAction("type.font", async (field) => {
      await setIsolineFontFooterSlider(page, field, 1, "end");
    }),
    await nextType({ lineHeight: "loose" }),
    { part: "fontPicker.lineHeight", requirementId: "type.font" },
  );

  await expectToolcraftCompoundControlPartOutcome(
    observeType,
    session.controlAction("type.font", async (field) => {
      await setIsolineSelect(
        page,
        field.locator('[data-slot="font-picker-text-case-field"]'),
        "Lowercase",
      );
    }),
    await nextType({ textCase: "lowercase" }),
    { part: "fontPicker.textCase", requirementId: "type.font" },
  );

  await expectToolcraftCompoundControlPartOutcome(
    observeType,
    session.controlAction("type.font", async (field) => {
      await setIsolineHexColor(field, "#111318");
    }),
    await nextType({ color: "#111318" }),
    { part: "fontPicker.color", requirementId: "type.font" },
  );

  await expectToolcraftCompoundControlPartOutcome(
    observeType,
    session.controlAction("type.font", async (field) => {
      const opacity = field.getByRole("textbox", { name: "Color opacity" });
      await opacity.fill("40");
      await opacity.press("Enter");
    }),
    await nextType({ opacity: 40 }),
    { part: "fontPicker.opacity", requirementId: "type.font" },
  );

  expect((await readIsolineType(page)).title).toBe("TWOLANESS");
});
