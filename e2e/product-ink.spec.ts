import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";
import { openIsolineProofSession, setIsolineHexColor } from "./product-isoline-helpers";

test("browser: ink.line changes product output", async ({ page }) => {
  const session = await openIsolineProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("ink.line", async (field) => {
      await setIsolineHexColor(field, "#E8EEF7");
    }),
    { requirementId: "ink.line" },
  );
});
