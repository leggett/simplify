import createPrescriptedScene from "./PrescriptedScene.js";

export default createPrescriptedScene("win", {
  images: [
    { key: "zeus", url: "sprites/zeus.png" },
    { key: "perseus", url: "sprites/perseus.png" },
    { key: "sister-idle", url: "sprites/sister-idle.png" },
    { key: "sister-ne-idle", url: "sprites/sister-no-eye.png" },
  ],
  sprites: [
    { key: "perseus", x: 80, y: 100 },
    { key: "sister-ne-idle", name: "sis0", x: 70, y: 70 },
    { key: "sister-idle", name: "sis1", x: 80, y: 70 },
    { key: "sister-ne-idle", name: "sis2", x: 90, y: 70 },
  ],
  bgImage: "sprites/end-bg.png",
  actions: [
    {
      type: "wait",
      delay: 1000,
    },
    {
      type: "dialog",
      text: "We made it sisters!",
      speaker: "",
      y: 260,
    },
    {
      type: "dialog",
      text: "But are we truly safe?",
      speaker: "",
      y: 260,
    },
    {
      type: "wait",
      delay: 3000,
    },
    {
      type: "move",
      sprite: "sis0",
      time: 300,
      x: 200,
      y: 70,
    },
    {
      type: "move",
      sprite: "sis1",
      time: 300,
      x: 200,
      y: 70,
    },
    {
      type: "move",
      sprite: "sis2",
      time: 300,
      x: 200,
      y: 70,
    },
    {
      type: "wait",
      delay: 2000,
    },
    {
      type: "move",
      sprite: "perseus",
      time: 1000,
      x: 80,
      y: 70,
    },
    {
      type: "wait",
      delay: 3000,
    },
  ],
  next: "menu",
});
