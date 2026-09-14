import * as React from "react";
import {
  useToolcraftMediaPresentationUrls,
  useToolcraftSelector,
} from "@/toolcraft/runtime/react";

import { ISOLINE_BACKGROUND_IMAGE_TARGET } from "./constants";

export function useIsolineBackgroundImage() {
  const mediaAssets = useToolcraftSelector((state) => state.mediaAssets);
  const images = React.useMemo(
    () =>
      mediaAssets.filter(
        (
          asset,
        ): asset is Extract<typeof asset, { assetKind: "image" }> =>
          asset.sourceTarget === ISOLINE_BACKGROUND_IMAGE_TARGET &&
          asset.assetKind === "image" &&
          asset.lifecycle === "ready",
      ),
    [mediaAssets],
  );
  const urls = useToolcraftMediaPresentationUrls(images);
  const asset = images[0];
  return {
    asset,
    url: asset ? urls.get(asset.id) : undefined,
  };
}
