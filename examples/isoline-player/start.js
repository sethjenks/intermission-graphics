const canvas = document.querySelector("#isoline");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("The Isoline example canvas is missing.");
}

const response = await fetch("./settings.json");
const settings = await response.json();
const player = window.IsolinePlayer.create(canvas, settings);

window.addEventListener("pagehide", () => player.destroy(), { once: true });
