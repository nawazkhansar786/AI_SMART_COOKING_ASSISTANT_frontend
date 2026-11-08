import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, API_BASE } from "../services/api";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Carrot,
  Image as ImageIcon,
  Info,
  Loader2,
  ScanSearch,
  Soup,
  Target,
  Upload,
  Users
} from "lucide-react";

export default function IngredientDetection() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [persons, setPersons] = useState(2);
  const [error, setError] = useState("");

  // Recipe popup
  const [showPersonPopup, setShowPersonPopup] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Live camera
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // =========================================================
  // IMAGE SELECTION
  // =========================================================

  const setSelectedImage = (selectedFile) => {
    setFile(selectedFile || null);
    setResult(null);
    setError("");

    if (selectedFile) {
      const imageUrl = URL.createObjectURL(selectedFile);
      setPreview(imageUrl);
    } else {
      setPreview("");
    }
  };

  // =========================================================
  // GALLERY / FILE PICKER
  // =========================================================

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      setSelectedImage(selectedFile);
    }
  };

  // =========================================================
  // STOP CAMERA
  // =========================================================

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
  };

  // =========================================================
  // OPEN LIVE CAMERA
  // =========================================================

  const openCamera = async () => {
    try {
      setCameraError("");
      setError("");

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError(
          "Live camera is not supported by this browser."
        );
        return;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });

        streamRef.current = null;
      }

      setCameraOpen(true);

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
          },
          audio: false,
        });

      streamRef.current = stream;

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.play().catch((playError) => {
            console.log(
              "Camera video play error:",
              playError
            );
          });
        }
      }, 100);
    } catch (err) {
      console.error("Camera error:", err);

      setCameraOpen(false);

      if (err?.name === "NotAllowedError") {
        setCameraError(
          "Camera permission was denied. Please allow camera permission in your browser/device settings."
        );
      } else if (err?.name === "NotFoundError") {
        setCameraError(
          "No camera was found on this device."
        );
      } else if (err?.name === "NotReadableError") {
        setCameraError(
          "The camera is already being used by another application."
        );
      } else if (err?.name === "SecurityError") {
        setCameraError(
          "Camera access was blocked by the browser security policy. Please use the HTTPS website and allow camera permission."
        );
      } else {
        setCameraError(
          "Unable to open camera. Please check camera permission and try again."
        );
      }
    }
  };

  // =========================================================
  // CAPTURE PHOTO FROM CAMERA
  // =========================================================

  const capturePhoto = () => {
    if (!videoRef.current) {
      setCameraError(
        "Camera is not ready yet. Please wait a moment."
      );
      return;
    }

    const video = videoRef.current;

    if (!video.videoWidth || !video.videoHeight) {
      setCameraError(
        "Camera is still starting. Please wait a moment and try again."
      );
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError(
        "Unable to capture camera image."
      );
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError(
            "Could not capture image."
          );
          return;
        }

        const capturedFile = new File(
          [blob],
          `camera-${Date.now()}.jpg`,
          {
            type: "image/jpeg",
          }
        );

        setSelectedImage(capturedFile);
        stopCamera();
      },
      "image/jpeg",
      0.92
    );
  };

  // =========================================================
  // PERSONS
  // ONLY 2 TO 20
  // =========================================================

  const handlePersonsChange = (e) => {
    const value = Number(e.target.value);

    if (value >= 2 && value <= 20) {
      setPersons(value);
    }
  };

  // =========================================================
  // RESULT IMAGE URL
  // =========================================================

  const getResultImageUrl = () => {
    if (!result?.image) {
      return "";
    }

    if (
      result.image.startsWith("http://") ||
      result.image.startsWith("https://")
    ) {
      return result.image;
    }

    return `${API_BASE}${result.image}`;
  };

  // =========================================================
  // DETECT INGREDIENTS
  // =========================================================

  const detect = async () => {
    if (!file) {
      setError(
        "Please select or capture an ingredient image."
      );
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();

      formData.append("image", file);

      console.log(
        "Starting online YOLO ingredient detection..."
      );

      const detectionResult = await apiFetch(
        "/detect",
        {
          method: "POST",
          body: formData,
        }
      );

      console.log(
        "Backend detection result:",
        detectionResult
      );

      setResult(detectionResult);
    } catch (e) {
      console.error(
        "Online ingredient detection error:",
        e
      );

      setError(
        e?.message ||
          "Ingredient detection failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  // =========================================================
  // OPEN PERSON POPUP
  // =========================================================

  const handleGetRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setPersons(2);
    setShowPersonPopup(true);
    setError("");
  };

  // =========================================================
  // CANCEL
  // =========================================================

  const handleCancelRecipe = () => {
    setShowPersonPopup(false);
    setSelectedRecipe(null);
  };

  // =========================================================
  // CONTINUE TO RECIPE
  // UPDATED: PASS COMPLETE RECIPE OBJECT
  // =========================================================

  const handleContinueRecipe = () => {
    if (!selectedRecipe) {
      setError("Please select a recipe first.");
      return;
    }

    const recipeName =
      selectedRecipe?.recipe_name ||
      selectedRecipe?.name ||
      "";

    if (!recipeName.trim()) {
      setError("Recipe name is missing.");
      return;
    }

    // Keep persons between 2 and 20
    const selectedPersons = Math.min(
      20,
      Math.max(2, Number(persons) || 2)
    );

    // Check whether complete recipe details are available
    const hasRecipeDetails =
      Array.isArray(selectedRecipe.ingredients) &&
      selectedRecipe.ingredients.length > 0 &&
      (
        (
          Array.isArray(selectedRecipe.steps) &&
          selectedRecipe.steps.length > 0
        ) ||
        (
          Array.isArray(selectedRecipe.instructions) &&
          selectedRecipe.instructions.length > 0
        )
      );

    // Preserve complete recipe data
    const recipePayload = {
      ...selectedRecipe,

      recipe_name: recipeName,

      source:
        selectedRecipe.source ||
        selectedRecipe.recipe_source ||
        (hasRecipeDetails ? "gemini" : "csv"),
    };

    // Save complete recipe for refresh and navigation
    try {
      sessionStorage.setItem(
        "selectedCookingRecipe",
        JSON.stringify(recipePayload)
      );

      console.log(
        "Complete recipe saved:",
        recipePayload
      );
    } catch (storageError) {
      console.warn(
        "Could not save selected recipe:",
        storageError
      );
    }

    setShowPersonPopup(false);

    // Navigate with complete recipe object
    navigate(
      `/pakistani_recipe/${encodeURIComponent(
        recipeName
      )}?persons=${selectedPersons}`,
      {
        state: {
          recipe: recipePayload,
        },
      }
    );
  };

  // =========================================================
  // DATA
  // =========================================================

  const detectedIngredients =
    result?.ingredients || [];

  const recipes =
    result?.recipes || [];

  const resultImageUrl =
    getResultImageUrl();

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="dashboard-container">

      {/* PAGE HEADER */}

      <section className="welcome">

        <span className="eyebrow">
          <ScanSearch size={14} /> Computer Vision
        </span>

        <h1>
          Ingredient Detection
        </h1>

        <p>
          Upload an image or use your camera to
          detect ingredients automatically using AI.
        </p>

      </section>

      {/* IMAGE UPLOAD / CAMERA */}

      <div className="upload-card">

        <h2>
          <Upload size={22} color="#c2410c" /> Select Ingredient Image
        </h2>

        <p>
          Choose an image from your device or
          capture ingredients directly using your camera.
        </p>

        {/* IMAGE SOURCE BUTTONS */}

        <div className="image-source-buttons">

          <button
            type="button"
            className="image-source-btn camera-btn"
            onClick={openCamera}
          >
            <span className="image-source-icon">
              <Camera size={24} />
            </span>

            <span>
              Live Camera
            </span>
          </button>

          <label className="image-source-btn gallery-btn">

            <span className="image-source-icon">
              <ImageIcon size={24} />
            </span>

            <span>
              Choose Image
            </span>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              hidden
            />

          </label>

        </div>

        {/* ORIGINAL IMAGE PREVIEW */}

        {preview && (

          <div className="detection-image-container">

            <h3>
              <ImageIcon size={16} /> Selected Image
            </h3>

            <img
              className="preview"
              src={preview}
              alt="Selected ingredient"
            />

          </div>

        )}

        {/* DETECT BUTTON */}

        <button
          type="button"
          className="primary"
          onClick={detect}
          disabled={busy || !file}
        >
          {busy ? (
            <>
              <Loader2 size={18} className="spin" />
              Detecting…
            </>
          ) : (
            <>
              <ScanSearch size={18} />
              Detect Ingredients
            </>
          )}
        </button>

      </div>

      {/* CAMERA MODAL */}

      {cameraOpen && (

        <div className="camera-modal">

          <div className="camera-modal-box">

            <h2>
              <Camera size={22} color="#c2410c" /> Live Camera
            </h2>

            <p>
              Position the ingredients inside the camera.
            </p>

            <div className="camera-preview">

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
              />

            </div>

            {cameraError && (
              <div className="error">
                <AlertCircle size={18} />
                {cameraError}
              </div>
            )}

            <div className="camera-actions">

              <button
                type="button"
                className="primary"
                onClick={capturePhoto}
              >
                <Camera size={18} /> Capture Photo
              </button>

              <button
                type="button"
                className="secondary"
                onClick={stopCamera}
              >
                Close Camera
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ERROR */}

      {error && (

        <div className="error">
          <AlertCircle size={18} /> {error}
        </div>

      )}

      {/* RESULTS */}

      {result && (

        <>

          {/* DETECTION RESULT */}

          <section className="detection-result">

            <div className="ingredient-section-header">

              <h2>
                <ImageIcon size={22} color="#c2410c" />
                Detection Result
              </h2>

              <p>
                The selected image was processed
                by the online AI detection model.
              </p>

            </div>

            {/* ORIGINAL IMAGE */}

            <div className="detection-image-container">

              <h3>
                Original Image
              </h3>

              <img
                className="detection-result-image"
                src={preview}
                alt="Original ingredient image"
              />

            </div>

            {/* YOLO ANNOTATED IMAGE */}

            {resultImageUrl && (

              <div className="detection-image-container">

                <h3>
                  <Target size={16} />
                  AI Detection With Bounding Boxes
                </h3>

                <img
                  className="detection-result-image"
                  src={resultImageUrl}
                  alt="AI ingredient detection with bounding boxes"
                />

              </div>

            )}

          </section>

          {/* DETECTED INGREDIENTS */}

          <section className="detected-ingredients-section">

            <div className="ingredient-section-header">

              <h2>
                <Carrot size={22} color="#c2410c" />
                Detected Ingredients
              </h2>

              <p>
                These ingredients were detected
                by the online AI model.
              </p>

            </div>

            {detectedIngredients.length > 0 ? (

              <div className="detected-ingredients-grid">

                {detectedIngredients.map(
                  (ingredient, index) => {

                    const name =
                      ingredient?.name ||
                      ingredient?.class_name ||
                      ingredient?.class ||
                      "Unknown";

                    const confidenceValue =
                      Number(
                        ingredient?.confidence ??
                        ingredient?.conf ??
                        0
                      );

                    const confidence =
                      confidenceValue <= 1
                        ? confidenceValue * 100
                        : confidenceValue;

                    return (

                      <div
                        className="detected-ingredient-card"
                        key={`${name}-${index}`}
                      >

                        <div className="detected-ingredient-name">
                          {name}
                        </div>

                        <div className="detected-ingredient-confidence">

                          Confidence:{" "}

                          <strong>
                            {confidence.toFixed(1)}%
                          </strong>

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            ) : (

              <div className="error">
                No ingredients were detected.
              </div>

            )}

          </section>

          {/* RECOMMENDED FOODS */}

          <section>

            <div className="ingredient-section-header">

              <h2>
                <Soup size={22} color="#c2410c" />
                Recommended Foods
              </h2>

              <p>
                Recipes recommended using the
                detected ingredients.
              </p>

            </div>

            {/* DETECTED INGREDIENT SUMMARY */}

            <div className="upload-card">

              <h3>
                <Carrot size={18} color="#c2410c" />
                Detected Ingredients
              </h3>

              <p>

                <strong>
                  Ingredients:
                </strong>{" "}

                {detectedIngredients
                  .map(
                    (item) =>
                      item?.name ||
                      item?.class_name ||
                      item?.class
                  )
                  .filter(Boolean)
                  .join(", ") ||
                  "No ingredients"}

              </p>

            </div>

            {/* RECIPE CARDS */}

            {recipes.length > 0 ? (

              <div className="detected-ingredients-grid">

                {recipes.map(
                  (recipe, index) => {

                    const recipeName =
                      recipe?.recipe_name ||
                      recipe?.name ||
                      "Unknown Recipe";

                    const score =
                      Number(
                        recipe?.score ??
                        recipe?.match_score ??
                        0
                      );

                    const matched =
                      recipe?.matched_ingredients ??
                      recipe?.matched ??
                      0;

                    const total =
                      recipe?.total_ingredients ??
                      recipe?.total ??
                      0;

                    let recommended =
                      recipe?.recommended_ingredients ||
                      [];

                    if (typeof recommended === "string") {
                      recommended = recommended
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean);
                    }

                    let combination =
                      recipe?.combination ||
                      recipe?.best_combination ||
                      "";

                    if (Array.isArray(combination)) {
                      combination = combination.join(", ");
                    }

                    return (

                      <div
                        className="detected-ingredient-card"
                        key={`${recipeName}-${index}`}
                      >

                        <div className="detected-ingredient-name">
                          {recipeName}
                        </div>

                        <div className="detected-ingredient-confidence">

                          <strong>
                            Match Score:
                          </strong>{" "}

                          {score.toFixed(1)}%

                        </div>

                        <div className="detected-ingredient-confidence">

                          <strong>
                            Matched:
                          </strong>{" "}

                          {matched} / {total}

                        </div>

                        {recommended.length > 0 && (

                          <div className="detected-ingredient-confidence">

                            <strong>
                              Additional Ingredients:
                            </strong>{" "}

                            {recommended.join(", ")}

                          </div>

                        )}

                        {combination && (

                          <div className="detected-ingredient-confidence">

                            <strong>
                              Combination:
                            </strong>{" "}

                            {combination}

                          </div>

                        )}

                        <button
                          type="button"
                          className="primary"
                          onClick={() => handleGetRecipe(recipe)}
                        >
                          Get Recipe <ArrowRight size={16} />
                        </button>

                      </div>

                    );
                  }
                )}

              </div>

            ) : (

              <div className="upload-card">

                <h3>
                  <Info size={18} color="#c2410c" />
                  No Recipes Found
                </h3>

                <p>
                  The AI detected the ingredients,
                  but no matching recipes were returned
                  by the backend.
                </p>

              </div>

            )}

          </section>

          {/* PERSON POPUP */}

          {showPersonPopup && selectedRecipe && (

            <div className="person-popup-overlay">

              <div className="person-popup">

                <div className="person-popup-icon">
                  <Users size={24} />
                </div>

                <h2>
                  Select Persons
                </h2>

                <p>
                  How many people are you cooking for?
                </p>

                <div className="selected-recipe-name">

                  <strong>
                    Recipe:
                  </strong>{" "}

                  {selectedRecipe?.recipe_name ||
                    selectedRecipe?.name}

                </div>

                <div className="person-input-group">

                  <label htmlFor="detect-persons">
                    Number of Persons
                  </label>

                  <select
                    id="detect-persons"
                    value={persons}
                    onChange={handlePersonsChange}
                  >
                    {Array.from({ length: 19 }, (_, index) => index + 2).map((value) => (
                      <option key={value} value={value}>{value} persons</option>
                    ))}
                  </select>

                  <small>
                    Select between 2 and 20 persons.
                  </small>

                </div>

                <div className="person-popup-actions">

                  <button
                    type="button"
                    className="person-cancel-btn"
                    onClick={handleCancelRecipe}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="primary"
                    onClick={handleContinueRecipe}
                  >
                    Continue
                  </button>

                </div>

              </div>

            </div>

          )}

        </>

      )}

    </main>
  );
}
