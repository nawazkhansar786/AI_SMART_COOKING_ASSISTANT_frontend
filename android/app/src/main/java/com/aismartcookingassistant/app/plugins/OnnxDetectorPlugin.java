
package com.aismartcookingassistant.app.plugins;

import android.content.res.AssetManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtSession;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.FloatBuffer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "OnnxDetector")
public class OnnxDetectorPlugin extends Plugin {

    private OrtEnvironment ortEnvironment;
    private OrtSession ortSession;

    private static final int INPUT_SIZE = 640;
    private static final float CONF_THRESHOLD = 0.30f;
    private static final float IOU_THRESHOLD = 0.45f;

    private static final String[] CLASS_NAMES = {
            "Cabbage",
            "Capsicum",
            "Carrot",
            "Cauliflower",
            "Chicken",
            "Chickpeas",
            "Chilli Pepper",
            "Egg",
            "Flour",
            "Garlic",
            "Ginger",
            "Lemon",
            "Lentils",
            "Okra",
            "Onion",
            "Potato",
            "Rice",
            "Spinach",
            "Sweet Corn",
            "Tomato",
            "Yogurt",
            "Cucumber"
    };

    @Override
    public void load() {
        super.load();

        try {
            ortEnvironment = OrtEnvironment.getEnvironment();

            String modelPath = copyAssetToInternalStorage(
                    "models/best_multiple.onnx",
                    "best_multiple.onnx"
            );

            ortSession = ortEnvironment.createSession(modelPath);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private String copyAssetToInternalStorage(
            String assetName,
            String outputName
    ) throws Exception {

        File outputFile =
                new File(getContext().getFilesDir(), outputName);

        if (!outputFile.exists()) {

            AssetManager assetManager =
                    getContext().getAssets();

            InputStream inputStream =
                    assetManager.open(assetName);

            FileOutputStream outputStream =
                    new FileOutputStream(outputFile);

            byte[] buffer = new byte[8192];
            int length;

            while ((length = inputStream.read(buffer)) > 0) {
                outputStream.write(buffer, 0, length);
            }

            inputStream.close();
            outputStream.close();
        }

        return outputFile.getAbsolutePath();
    }

    @PluginMethod
    public void testModel(PluginCall call) {

        try {

            if (ortSession == null) {
                call.reject("ONNX model is not loaded.");
                return;
            }

            JSObject result = new JSObject();

            result.put("loaded", true);
            result.put("model", "best_multiple.onnx");

            call.resolve(result);

        } catch (Exception e) {

            call.reject(
                    "Model test failed: " + e.getMessage()
            );
        }
    }

    @PluginMethod
    public void detect(PluginCall call) {

        try {

            if (ortSession == null) {
                call.reject("ONNX model is not loaded.");
                return;
            }

            String base64Image = call.getString("image");

            if (base64Image == null || base64Image.isEmpty()) {
                call.reject("No image provided.");
                return;
            }

            // Remove data URL prefix if present.
            if (base64Image.contains(",")) {
                base64Image =
                        base64Image.substring(
                                base64Image.indexOf(",") + 1
                        );
            }

            byte[] imageBytes =
                    Base64.decode(base64Image, Base64.DEFAULT);

            Bitmap originalBitmap =
                    BitmapFactory.decodeByteArray(
                            imageBytes,
                            0,
                            imageBytes.length
                    );

            if (originalBitmap == null) {
                call.reject("Could not decode image.");
                return;
            }

            int originalWidth = originalBitmap.getWidth();
            int originalHeight = originalBitmap.getHeight();

            // Resize to model input size.
            Bitmap resizedBitmap =
                    Bitmap.createScaledBitmap(
                            originalBitmap,
                            INPUT_SIZE,
                            INPUT_SIZE,
                            true
                    );

            float[] inputData =
                    bitmapToFloatArray(resizedBitmap);

            OnnxTensor inputTensor =
                    OnnxTensor.createTensor(
                            ortEnvironment,
                            FloatBuffer.wrap(inputData),
                            new long[]{
                                    1,
                                    3,
                                    INPUT_SIZE,
                                    INPUT_SIZE
                            }
                    );

            Map<String, OnnxTensor> inputs =
                    new HashMap<>();

            inputs.put("images", inputTensor);

            OrtSession.Result outputs =
                    ortSession.run(inputs);

            Object outputValue =
                    outputs.get(0).getValue();

            float[][][] output =
                    (float[][][]) outputValue;

            List<Detection> detections =
                    decodeOutput(
                            output,
                            originalWidth,
                            originalHeight
                    );

            detections =
                    applyNms(
                            detections,
                            IOU_THRESHOLD
                    );

            JSArray ingredients =
                    new JSArray();

            for (Detection detection : detections) {

                JSObject item =
                        new JSObject();

                item.put(
                        "name",
                        detection.className
                );

                item.put(
                        "class_id",
                        detection.classId
                );

                item.put(
                        "confidence",
                        Math.round(
                                detection.confidence * 10000.0
                        ) / 100.0
                );

                item.put(
                        "x1",
                        detection.x1
                );

                item.put(
                        "y1",
                        detection.y1
                );

                item.put(
                        "x2",
                        detection.x2
                );

                item.put(
                        "y2",
                        detection.y2
                );

                ingredients.put(item);
            }

            inputTensor.close();
            outputs.close();

            resizedBitmap.recycle();
            originalBitmap.recycle();

            JSObject result =
                    new JSObject();

            result.put(
                    "status",
                    "success"
            );

            result.put(
                    "model",
                    "multiple"
            );

            result.put(
                    "ingredients",
                    ingredients
            );

            result.put(
                    "count",
                    detections.size()
            );

            call.resolve(result);

        } catch (Exception e) {

            e.printStackTrace();

            call.reject(
                    "Detection failed: " +
                            e.getMessage()
            );
        }
    }

    private float[] bitmapToFloatArray(
            Bitmap bitmap
    ) {

        int width = bitmap.getWidth();
        int height = bitmap.getHeight();

        int planeSize = width * height;

        float[] data =
                new float[
                        3 * planeSize
                ];

        int[] pixels =
                new int[planeSize];

        bitmap.getPixels(
                pixels,
                0,
                width,
                0,
                0,
                width,
                height
        );

        for (int i = 0; i < planeSize; i++) {

            int pixel = pixels[i];

            float r =
                    ((pixel >> 16) & 0xFF) / 255.0f;

            float g =
                    ((pixel >> 8) & 0xFF) / 255.0f;

            float b =
                    (pixel & 0xFF) / 255.0f;

            data[i] = r;

            data[
                    planeSize + i
            ] = g;

            data[
                    2 * planeSize + i
            ] = b;
        }

        return data;
    }

    private List<Detection> decodeOutput(
            float[][][] output,
            int originalWidth,
            int originalHeight
    ) {

        List<Detection> detections =
                new ArrayList<>();

        /*
         * YOLO output:
         *
         * [1, 26, 8400]
         *
         * 4 box values +
         * 22 class scores.
         */

        int channels =
                output[0].length;

        int candidates =
                output[0][0].length;

        for (int i = 0; i < candidates; i++) {

            float cx =
                    output[0][0][i];

            float cy =
                    output[0][1][i];

            float width =
                    output[0][2][i];

            float height =
                    output[0][3][i];

            int bestClass = -1;

            float bestConfidence = 0.0f;

            for (
                    int classIndex = 0;
                    classIndex < CLASS_NAMES.length;
                    classIndex++
            ) {

                float confidence =
                        output[0][4 + classIndex][i];

                if (
                        confidence >
                        bestConfidence
                ) {

                    bestConfidence =
                            confidence;

                    bestClass =
                            classIndex;
                }
            }

            if (
                    bestClass < 0 ||
                    bestConfidence < CONF_THRESHOLD
            ) {
                continue;
            }

            float scaleX =
                    originalWidth /
                            (float) INPUT_SIZE;

            float scaleY =
                    originalHeight /
                            (float) INPUT_SIZE;

            float x1 =
                    (cx - width / 2.0f)
                            * scaleX;

            float y1 =
                    (cy - height / 2.0f)
                            * scaleY;

            float x2 =
                    (cx + width / 2.0f)
                            * scaleX;

            float y2 =
                    (cy + height / 2.0f)
                            * scaleY;

            x1 =
                    Math.max(
                            0,
                            Math.min(
                                    x1,
                                    originalWidth
                            )
                    );

            y1 =
                    Math.max(
                            0,
                            Math.min(
                                    y1,
                                    originalHeight
                            )
                    );

            x2 =
                    Math.max(
                            0,
                            Math.min(
                                    x2,
                                    originalWidth
                            )
                    );

            y2 =
                    Math.max(
                            0,
                            Math.min(
                                    y2,
                                    originalHeight
                            )
                    );

            detections.add(
                    new Detection(
                            bestClass,
                            CLASS_NAMES[bestClass],
                            bestConfidence,
                            x1,
                            y1,
                            x2,
                            y2
                    )
            );
        }

        return detections;
    }

    private List<Detection> applyNms(
            List<Detection> detections,
            float iouThreshold
    ) {

        Collections.sort(
                detections,
                new Comparator<Detection>() {
                    @Override
                    public int compare(
                            Detection a,
                            Detection b
                    ) {

                        return Float.compare(
                                b.confidence,
                                a.confidence
                        );
                    }
                }
        );

        List<Detection> result =
                new ArrayList<>();

        boolean[] removed =
                new boolean[detections.size()];

        for (int i = 0; i < detections.size(); i++) {

            if (removed[i]) {
                continue;
            }

            Detection current =
                    detections.get(i);

            result.add(current);

            for (
                    int j = i + 1;
                    j < detections.size();
                    j++
            ) {

                if (removed[j]) {
                    continue;
                }

                Detection other =
                        detections.get(j);

                // NMS only between the same class.
                if (
                        current.classId !=
                        other.classId
                ) {
                    continue;
                }

                if (
                        calculateIoU(
                                current,
                                other
                        ) > iouThreshold
                ) {

                    removed[j] = true;
                }
            }
        }

        return result;
    }

    private float calculateIoU(
            Detection a,
            Detection b
    ) {

        float left =
                Math.max(
                        a.x1,
                        b.x1
                );

        float top =
                Math.max(
                        a.y1,
                        b.y1
                );

        float right =
                Math.min(
                        a.x2,
                        b.x2
                );

        float bottom =
                Math.min(
                        a.y2,
                        b.y2
                );

        float intersectionWidth =
                Math.max(
                        0,
                        right - left
                );

        float intersectionHeight =
                Math.max(
                        0,
                        bottom - top
                );

        float intersection =
                intersectionWidth *
                        intersectionHeight;

        float areaA =
                Math.max(
                        0,
                        a.x2 - a.x1
                ) *
                        Math.max(
                                0,
                                a.y2 - a.y1
                        );

        float areaB =
                Math.max(
                        0,
                        b.x2 - b.x1
                ) *
                        Math.max(
                                0,
                                b.y2 - b.y1
                        );

        float union =
                areaA +
                        areaB -
                        intersection;

        if (union <= 0) {
            return 0;
        }

        return intersection / union;
    }

    private static class Detection {

        int classId;
        String className;
        float confidence;

        float x1;
        float y1;
        float x2;
        float y2;

        Detection(
                int classId,
                String className,
                float confidence,
                float x1,
                float y1,
                float x2,
                float y2
        ) {

            this.classId =
                    classId;

            this.className =
                    className;

            this.confidence =
                    confidence;

            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
        }
    }
}
