import createPrescriptedScene from "./PrescriptedScene.js";

export default createPrescriptedScene("lose", {
  images: [
    { key: "sister-idle", url: "sprites/sister-idle.png" },
    { key: "sister-ne-idle", url: "sprites/sister-no-eye.png" },
    { key: "perseus", url: "sprites/perseus.png" },
  ],
  sprites: [
    { key: "sister-ne-idle", name: "sis0", x: 70, y: 25 },
    { key: "sister-ne-idle", name: "sis1", x: 80, y: 25 },
    { key: "sister-ne-idle", name: "sis2", x: 90, y: 25 },
    { key: "perseus", x: 80, y: 100 },
  ],
  bgImage: "sprites/lose-bg.png",
  actions: [
    {
      type: "wait",
      delay: 1000,
    },
    {
      type: "dialog",
      text: "Where is the eye?!?",
      speaker: "",
      y: 195,
    },
    {
      type: "move",
      sprite: "perseus",
      time: 1000,
      x: 80,
      y: 70,
    },
    {
      type: "dialog",
      text: "Perseus: I have your eye.",
      speaker: "",
      y: 260,
    },
    {
      type: "dialog",
      text: "Perseus: Now tell me where Medusa is...",
      speaker: "",
      y: 260,
    },
  ],
  next: "menu",
});
