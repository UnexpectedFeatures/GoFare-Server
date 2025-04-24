import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sharp = require("sharp");

sharp("Images/sample2.jpg")
  .grayscale()
  .toFile("Images/Converted.png")
  .then(() => console.log("Image resized!"))
  .catch((err) => console.error(err));
