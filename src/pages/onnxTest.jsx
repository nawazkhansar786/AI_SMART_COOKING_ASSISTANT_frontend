
import React, { useState } from "react";
import {
  testOnnxModel,
  detectWithOnnx,
} from "../services/onnx";

export default function OnnxTest() {

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {

    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setError("");

    const imageUrl =
      URL.createObjectURL(selectedFile);

    setPreview(imageUrl);
  };

  const fileToBase64 = (file) => {

    return new Promise((resolve, reject) => {

      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(
          new Error("Could not read image.")
        );
      };

      reader.readAsDataURL(file);
    });
  };

  const handleTestModel = async () => {

    setLoading(true);
    setResult(null);
    setError("");

    try {

      const response =
        await testOnnxModel();

      setResult(response);

    } catch (e) {

      setError(
        e?.message ||
        String(e)
      );

    } finally {

      setLoading(false);
    }
  };

  const handleDetect = async () => {

    if (!file) {

      setError(
        "Please select an image first."
      );

      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {

      const base64Image =
        await fileToBase64(file);

      const response =
        await detectWithOnnx(base64Image);

      setResult(response);

    } catch (e) {

      setError(
        e?.message ||
        String(e)
      );

    } finally {

      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "25px",
        fontFamily: "Arial",
        maxWidth: "700px",
        margin: "0 auto",
      }}
    >

      <h1>
        ONNX Model Test
      </h1>

      <p>
        Testing local Android model:
        <strong>
          {" "}best_multiple.onnx
        </strong>
      </p>

      <hr />

      <h2>
        1. Test Model Loading
      </h2>

      <button
        onClick={handleTestModel}
        disabled={loading}
        style={{
          padding: "12px 20px",
          fontSize: "16px",
          marginBottom: "20px",
        }}
      >
        {loading
          ? "Testing..."
          : "Test Model"}
      </button>

      <h2>
        2. Select Ingredient Image
      </h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />

      {preview && (
        <div
          style={{
            marginTop: "20px",
          }}
        >

          <p>
            Selected Image:
          </p>

          <img
            src={preview}
            alt="Selected ingredient"
            style={{
              width: "100%",
              maxWidth: "500px",
              borderRadius: "10px",
              border: "1px solid #ccc",
            }}
          />

        </div>
      )}

      <div
        style={{
          marginTop: "20px",
        }}
      >

        <button
          onClick={handleDetect}
          disabled={loading || !file}
          style={{
            padding: "14px 24px",
            fontSize: "17px",
            cursor:
              loading || !file
                ? "not-allowed"
                : "pointer",
          }}
        >
          {loading
            ? "Detecting..."
            : "Detect Ingredients"}
        </button>

      </div>

      {result && (
        <div
          style={{
            marginTop: "25px",
            padding: "15px",
            background: "#e8f5e9",
            borderRadius: "10px",
          }}
        >

          <h2>
            Detection Result
          </h2>

          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {JSON.stringify(
              result,
              null,
              2
            )}
          </pre>

        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: "25px",
            padding: "15px",
            background: "#ffebee",
            color: "#b71c1c",
            borderRadius: "10px",
          }}
        >

          <strong>
            ERROR:
          </strong>

          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {error}
          </pre>

        </div>
      )}

    </div>
  );
}
