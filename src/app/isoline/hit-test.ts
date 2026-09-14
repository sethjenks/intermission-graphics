export const ISOLINE_CAMERA_FOV = Math.PI / 4;

export type IsolineObjectHitGeometry = {
  bulgeAmount: number;
  cameraPosition: readonly [number, number, number];
  innerRadius: number;
  outerRadius: number;
};

function isolineObjectScreenRadii(
  geometry: IsolineObjectHitGeometry,
): { inner: number; outer: number } {
  const distance = Math.max(
    0.2,
    Math.hypot(
      geometry.cameraPosition[0],
      geometry.cameraPosition[1],
      geometry.cameraPosition[2],
    ),
  );
  const worldToCanvas = 1 / (2 * distance * Math.tan(ISOLINE_CAMERA_FOV / 2));
  const deform = 1 + Math.max(0, geometry.bulgeAmount);
  return {
    inner: Math.max(0.015, geometry.innerRadius * worldToCanvas * 0.7),
    outer: Math.min(
      0.48,
      geometry.outerRadius * deform * worldToCanvas * 1.25,
    ),
  };
}

export function isolinePointerHitsObject(
  clientX: number,
  clientY: number,
  bounds: Pick<DOMRect, "height" | "left" | "top" | "width">,
  geometry: IsolineObjectHitGeometry,
): boolean {
  const x = (clientX - bounds.left) / Math.max(1, bounds.width) - 0.5;
  const y = (clientY - bounds.top) / Math.max(1, bounds.height) - 0.5;
  const radius = Math.hypot(x, y);
  const band = isolineObjectScreenRadii(geometry);
  return radius >= band.inner && radius <= band.outer;
}
