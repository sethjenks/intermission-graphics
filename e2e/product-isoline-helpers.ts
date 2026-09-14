import { expect, type Locator, type Page } from "@playwright/test";

import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { dragToolcraftSliderByTarget } from "./performance-slider-helpers";

export const ISOLINE_OUTPUT_SELECTOR = "[data-toolcraft-product-output]";

export async function freezeIsolineMotion(page: Page): Promise<void> {
  const output = page.locator(ISOLINE_OUTPUT_SELECTOR);
  await expect(output).toHaveAttribute("data-webgl2-ready", "true");
  await expect(output).not.toHaveAttribute("data-motion-progress", "0.0000");
  await output.evaluate((node) => {
    node.dispatchEvent(new Event("isoline:freeze-motion"));
  });
  await expect(output).toHaveAttribute("data-motion-clock", "frozen");
}

export async function pauseIsolineTimeline(page: Page): Promise<void> {
  const pause = page.getByRole("button", { name: "Pause playback" });
  if (await pause.isVisible()) {
    await pause.click();
    await expect(page.getByRole("button", { name: /Play/ })).toBeVisible();
    return;
  }
  await freezeIsolineMotion(page);
}

export async function openIsolineProofSession(page: Page) {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await expect(page.locator(ISOLINE_OUTPUT_SELECTOR)).toHaveAttribute(
    "data-webgl2-ready",
    "true",
  );
  await freezeIsolineMotion(page);
  return session;
}

export async function scrollIsolineTarget(
  page: Page,
  target: string,
): Promise<Locator> {
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

export async function strumIsolineRing(page: Page): Promise<void> {
  const canvas = page.locator(ISOLINE_OUTPUT_SELECTOR);
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error("The Isoline canvas has no layout box.");
  }
  const startX = box.x + box.width * 0.68;
  const startY = box.y + box.height * 0.5;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, startY - box.height * 0.12, { steps: 8 });
  await page.mouse.up();
}

export async function orbitIsolineBackground(page: Page): Promise<void> {
  const canvas = page.locator(ISOLINE_OUTPUT_SELECTOR);
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error("The Isoline canvas has no layout box.");
  }
  const startX = box.x + box.width * 0.5;
  const startY = box.y + box.height * 0.5;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, startY + 160, { steps: 10 });
  await page.mouse.up();
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
  await expect(control).toHaveAttribute(
    "aria-checked",
    checked ? "true" : "false",
  );
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

export async function setIsolineHexColor(
  field: Locator,
  hex: string,
): Promise<void> {
  const input = field.getByRole("textbox", { name: /hex/i }).first();
  await expect(input).toBeVisible();
  await input.fill(hex);
  await input.press("Enter");
}
