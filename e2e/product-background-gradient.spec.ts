import { readToolcraftBrowserObservation } from "./browser-proof-session";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { proveIsolineControlAcrossApplicabilityCases } from "./product-isoline-applicability";
import { test } from "./toolcraft-product-test";
import {
  openIsolineProofSession,
  setIsolineHexColor,
  setIsolineSelect,
} from "./product-isoline-helpers";

type GradientSnapshot = {
  angle: number;
  gradientType: string;
  stops: Array<{ color: string; opacity: number; position: string }>;
};

test("browser: appearance.backgroundGradient changes product output", async ({
  page,
}) => {
  const session = await openIsolineProofSession(page);
  await proveIsolineControlAcrossApplicabilityCases({
    page,
    session,
    target: "appearance.backgroundGradient",
    run: async (requirementId) => {
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction(
          "appearance.backgroundGradient",
          async (field, currentPage) => {
            await setIsolineSelect(currentPage, field, "Radial");
          },
        ),
        { requirementId },
      );

  const gradient = session.observe((root) => {
    const output = root.querySelector("[data-isoline-field]");
    const field = JSON.parse(
      output?.getAttribute("data-isoline-field") ?? "{}",
    ) as { gradient?: GradientSnapshot };
    if (!field.gradient) {
      throw new Error("The renderer did not publish its background gradient.");
    }
    return field.gradient;
  });

  const beforeType = await readToolcraftBrowserObservation(gradient);
  await expectToolcraftCompoundControlPartOutcome(
    gradient,
    session.controlAction("appearance.backgroundGradient", async (field, currentPage) => {
      await setIsolineSelect(currentPage, field, "Diamond");
    }),
    { ...beforeType, gradientType: "diamond" },
    {
      part: "gradient.gradientType",
      requirementId: "appearance.backgroundGradient",
    },
  );

  const beforeAngle = await readToolcraftBrowserObservation(gradient);
  await expectToolcraftCompoundControlPartOutcome(
    gradient,
    session.controlAction("appearance.backgroundGradient", async (field) => {
      const angle = field.getByRole("textbox", { name: "Gradient angle" });
      await angle.fill("200");
      await angle.press("Enter");
    }),
    { ...beforeAngle, angle: 200 },
    { part: "gradient.angle", requirementId: "appearance.backgroundGradient" },
  );

  const beforeColor = await readToolcraftBrowserObservation(gradient);
  const colorStops = beforeColor.stops.map((stop, index) =>
    index === 0 ? { ...stop, color: "#E85D75" } : stop,
  );
  await expectToolcraftCompoundControlPartOutcome(
    gradient,
    session.controlAction("appearance.backgroundGradient", async (field) => {
      await setIsolineHexColor(field, "#E85D75");
    }),
    { ...beforeColor, stops: colorStops },
    { part: "gradient.stops.color", requirementId: "appearance.backgroundGradient" },
  );

  const beforeOpacity = await readToolcraftBrowserObservation(gradient);
  const opacityStops = beforeOpacity.stops.map((stop, index) =>
    index === 0 ? { ...stop, opacity: 55 } : stop,
  );
  await expectToolcraftCompoundControlPartOutcome(
    gradient,
    session.controlAction("appearance.backgroundGradient", async (field) => {
      const opacity = field.getByRole("textbox", { name: "Stop 1 opacity" });
      await opacity.fill("55");
      await opacity.press("Enter");
    }),
    { ...beforeOpacity, stops: opacityStops },
    { part: "gradient.stops.opacity", requirementId: "appearance.backgroundGradient" },
  );

  const beforePosition = await readToolcraftBrowserObservation(gradient);
  const positionStops = beforePosition.stops.map((stop, index) =>
    index === 1 ? { ...stop, position: "35%" } : stop,
  );
  await expectToolcraftCompoundControlPartOutcome(
    gradient,
    session.controlAction("appearance.backgroundGradient", async (field) => {
      const position = field.getByRole("textbox", { name: "Stop 2 position" });
      await position.fill("35");
      await position.press("Enter");
    }),
    { ...beforePosition, stops: positionStops },
    {
      part: "gradient.stops.position",
      requirementId: "appearance.backgroundGradient",
    },
  );
    },
  });
});
