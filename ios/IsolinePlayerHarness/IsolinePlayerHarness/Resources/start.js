const canvas = document.querySelector("#isoline");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("The Isoline host canvas is missing.");
}

const player = window.IsolinePlayer.create(canvas);

window.__isolinePlayer = player;
window.__isolineHost = Object.freeze({
  destroy: () => player.destroy(),
  loadSettings: (settings, requestId) =>
    player.loadSettings(settings, requestId),
  pause: () => player.pause(),
  resize: () => player.resize(),
  resume: () => player.resume(),
  setValues: (values, requestId) => player.setValues(values, requestId),
});
