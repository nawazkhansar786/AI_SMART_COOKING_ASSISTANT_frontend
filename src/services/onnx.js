import { registerPlugin } from "@capacitor/core";

const OnnxDetector = registerPlugin("OnnxDetector");

export async function testOnnxModel() {
  return await OnnxDetector.testModel();
}

export async function detectWithOnnx(imageBase64) {
  if (!imageBase64) {
    throw new Error("No image provided.");
  }

  return await OnnxDetector.detect({
    image: imageBase64,
  });
}