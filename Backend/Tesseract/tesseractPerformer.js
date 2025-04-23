import performOCR from "./tesseract.js";

performOCR("images/sample.png")
  .then((text) => console.log(text))
  .catch((err) => console.error(err));
