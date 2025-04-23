import { createWorker } from "tesseract.js";

const performOCR = async (imagePath) => {
  const worker = await createWorker();
  try {
    const {
      data: { text },
    } = await worker.recognize(imagePath, "eng");
    return text;
  } finally {
    await worker.terminate();
  }
};

export default performOCR;
