import { expect, type Locator, type Page } from "@playwright/test";

import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { dragToolcraftSliderByTarget } from "./performance-slider-helpers";

export const ISOLINE_OUTPUT_SELECTOR = "[data-toolcraft-product-output]";
export const ISOLINE_CREAM = [246, 243, 238, 255] as const;
export const ISOLINE_BLUE = [43, 91, 219, 255] as const;
export const ISOLINE_EXPORT_BOUNDS = {
  height: 34 / 64,
  width: 34 / 64,
  x: 15 / 64,
  y: 12 / 64,
} as const;
export const ISOLINE_EXPORT_PIXELS = [
  { rgba: ISOLINE_CREAM, xRatio: 0.5, yRatio: 0.5 },
  { rgba: ISOLINE_BLUE, xRatio: 0.7, yRatio: 0.5 },
] as const;

export type IsolineTypeSnapshot = {
  color: string;
  fontId: string;
  fontSize: number;
  fontWeight: string;
  letterSpacing: string;
  lineHeight: string;
  opacity: number;
  showSubtitle: boolean;
  showTitle: boolean;
  subtitle: string;
  textCase: string;
  title: string;
};

export async function pauseIsolineTimeline(page: Page): Promise<void> {
  const pause = page.getByRole("button", { name: "Pause playback" });
  if (await pause.isVisible()) {
    await pause.click();
  }
  await expect(page.getByRole("button", { name: /Play/ })).toBeVisible();
}

export async function openIsolineProofSession(page: Page) {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await pauseIsolineTimeline(page);
  return session;
}

export async function scrollIsolineTarget(page: Page, target: string): Promise<Locator> {
  const field = await getToolcraftControlFieldByTarget(page, target);
  await field.scrollIntoViewIfNeeded();
  return field;
}

export async function dragIsolineSlider(
  page: Page,
  target: string,
  ratio: number,
): Promise<void> {
  await scrollIsolineTarget(page, target);
  await dragToolcraftSliderByTarget(page, target, ratio);
}

export async function setIsolineSwitch(
  field: Locator,
  checked: boolean,
): Promise<void> {
  const control = field.getByRole("switch");
  await expect(control).toBeVisible();
  const current = await control.getAttribute("aria-checked");
  if ((current === "true") !== checked) {
    await control.click();
  }
  await expect(control).toHaveAttribute("aria-checked", checked ? "true" : "false");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

export async function setIsolineSelect(
  page: Page,
  field: Locator,
  optionLabel: string,
): Promise<void> {
  await field.scrollIntoViewIfNeeded();
  const trigger = field.getByRole("combobox");
  await expect(trigger).toBeVisible();
  if ((await trigger.innerText()).trim() === optionLabel) {
    return;
  }
  await trigger.click();
  const option = page
    .locator('[data-slot="select-item"]')
    .filter({ hasText: new RegExp(`^${escapeRegExp(optionLabel)}$`, "u") })
    .first();
  await option.waitFor({ state: "attached" });
  await option.evaluate((node) => {
    if (node instanceof HTMLElement) {
      node.click();
    }
  });
  await expect(trigger).toContainText(optionLabel);
}

export async function setIsolineText(field: Locator, value: string): Promise<void> {
  const input = field.getByRole("textbox").first();
  await input.fill(value);
  await input.blur();
}

export async function openIsolineFontPopover(page: Page, field: Locator): Promise<void> {
  const trigger = field.locator('[data-slot="font-picker-family-field"] [data-slot="select-trigger"]');
  const footer = page.locator('[data-slot="font-picker-footer-slider"]').first();
  if (await footer.isVisible()) {
    return;
  }
  await trigger.click();
  if (await footer.isVisible({ timeout: 2_000 }).catch(() => false)) {
    return;
  }
  await trigger.click();
  await expect(footer).toBeVisible();
}

export async function setIsolineFontFooterSlider(
  page: Page,
  field: Locator,
  sliderIndex: 0 | 1,
  edge: "start" | "end",
): Promise<void> {
  await openIsolineFontPopover(page, field);
  const track = page.locator('[data-slot="font-picker-footer-slider"]').nth(sliderIndex);
  await expect(track).toBeVisible();
  const box = await track.boundingBox();
  if (!box) {
    throw new Error("Font picker footer slider has no layout box.");
  }
  await page.mouse.click(
    edge === "start" ? box.x + 3 : box.x + box.width - 3,
    box.y + box.height / 2,
  );
  await page.keyboard.press("Escape");
}

export async function setIsolineHexColor(field: Locator, hex: string): Promise<void> {
  const input = field.getByRole("textbox", { name: /hex/i });
  await expect(input).toBeVisible();
  await input.fill(hex);
  await input.press("Enter");
}

export async function downloadIsolineAction(
  page: Page,
  label: "Export PNG" | "Export Video",
) {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: label }).click();
  return downloadPromise;
}

export async function revealIsolineTimeline(page: Page): Promise<void> {
  const duration = page.getByRole("button", { name: "Edit timeline duration" });
  if (await duration.isVisible()) {
    return;
  }
  await page
    .locator('[data-toolcraft-control-target="panels.timeline.extended"]')
    .getByRole("switch")
    .click();
  await expect(duration).toBeVisible();
}

export async function setIsolineTimelineSeconds(page: Page, seconds: number): Promise<void> {
  await revealIsolineTimeline(page);
  await page.getByRole("button", { name: "Edit timeline duration" }).click();
  const durationEditor = page.getByRole("textbox", { name: "timeline duration" });
  await durationEditor.fill(`${seconds}s`);
  await durationEditor.press("Enter");
}

export async function readIsolineType(page: Page): Promise<IsolineTypeSnapshot> {
  const raw = await page.locator(ISOLINE_OUTPUT_SELECTOR).getAttribute("data-isoline-type");
  return raw
    ? (JSON.parse(raw) as IsolineTypeSnapshot)
    : {
        color: "",
        fontId: "",
        fontSize: 0,
        fontWeight: "",
        letterSpacing: "",
        lineHeight: "",
        opacity: 0,
        showSubtitle: false,
        showTitle: false,
        subtitle: "",
        textCase: "",
        title: "",
      };
}

export async function prepareExportProbe(page: Page): Promise<void> {
  const titleOn = page.locator('[data-toolcraft-control-target="type.showTitle"]');
  const subtitleOn = page.locator('[data-toolcraft-control-target="type.showSubtitle"]');
  await titleOn.scrollIntoViewIfNeeded();
  await setIsolineSwitch(titleOn, false);
  await setIsolineSwitch(subtitleOn, false);
  await dragIsolineSlider(page, "ring.strokeWeight", 0.98);
  await dragIsolineSlider(page, "ring.lineCount", 0.02);
}
