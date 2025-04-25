import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sharp = require("sharp");

sharp("validIds/lL4gZtZIZMSGMKJDHXdIVkRKT9a2/1745537878281.jpg")
  .grayscale()
  .toFile("validIds/Converted.jpg")
  .then(() => console.log("Image resized!"))
  .catch((err) => console.error(err));
