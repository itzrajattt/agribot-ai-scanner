
/* ==========================================
   AGRIBOT AI - PLANT HEALTH SCANNER
   ========================================== */

// YOUR TRAINED AI MODEL
const MODEL_URL =
  "https://teachablemachine.withgoogle.com/models/Y1zv_OTiK/";

const imageInput = document.getElementById("plantImage");
const cameraBtn = document.getElementById("cameraBtn");
const galleryBtn = document.getElementById("galleryBtn");
const cameraInput = document.getElementById("cameraInput");
const preview = document.getElementById("preview");
const analyzeBtn = document.getElementById("analyzeBtn");
const result = document.getElementById("result");

let model = null;
let modelPromise = null;
let imageURL = null;
cameraBtn.addEventListener("click", () => {
  cameraInput.click();
});

galleryBtn.addEventListener("click", () => {
  imageInput.click();
});

// STEP 1: IMAGE UPLOAD AND PREVIEW

function handleImageChange(file) {
  if (imageURL) {
    URL.revokeObjectURL(imageURL);
    imageURL = null;
  }

  preview.hidden = true;
  preview.removeAttribute("src");

  if (!file) {
    result.textContent = "🌱 Please select a plant photo.";
    return;
  }

  if (!file.type.startsWith("image/")) {
    result.textContent = "⚠️ Please upload an image file.";
    return;
  }

  // Reset previous AI result when a new image is selected
  result.textContent = "🌱 New photo selected. Click Analyze Plant.";
 // Keep existing trained model loaded

  imageURL = URL.createObjectURL(file);

  preview.onload = function () {
    preview.hidden = false;
  };

  preview.onerror = function () {
    result.textContent = "❌ Image could not be opened.";
  };

  preview.src = imageURL;
  result.textContent =
    "✅ Photo selected! Click Analyze Plant.";
}

 // CAMERA PHOTO
cameraInput.addEventListener("change", function () {
  const file = cameraInput.files[0];
  if (file) {
    handleImageChange(file);
  }
});

// GALLERY PHOTO
imageInput.addEventListener("change", function () {
  const file = imageInput.files[0];
  if (file) {
    handleImageChange(file);
  }
});

// STEP 2: LOAD YOUR AI MODEL

async function loadModel() {
  if (model) return model;

  if (typeof tmImage === "undefined") {
    throw new Error("Teachable Machine library not loaded.");
  }

  if (!modelPromise) {
    modelPromise = tmImage.load(
      MODEL_URL + "model.json",
      MODEL_URL + "metadata.json"
    ).then(function (loadedModel) {
      model = loadedModel;
      return model;
    }).catch(function (error) {
      modelPromise = null;
      throw error;
    });
  }

  return modelPromise;
}

// STEP 3: ANALYZE PLANT PHOTO

analyzeBtn.addEventListener("click", async function () {

if (
  !imageURL ||
  !preview.complete ||
  !preview.naturalWidth
) {
  result.textContent = "⚠️ Capture or upload a valid leaf photo first.";
  return;
}

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "🔍 Analyzing...";
  result.textContent = "🌿 AI is analyzing your photo...";

  try {

    const aiModel = await loadModel();

    const predictions = await aiModel.predict(preview);

    // HIGHEST CONFIDENCE FIRST
    predictions.sort(function (a, b) {
      return b.probability - a.probability;
    });

    const best = predictions[0];

    const confidence =
      (best.probability * 100).toFixed(1);

    const category = best.className.toLowerCase();

    let advice = "";

    if (category.includes("healthy")) {
      advice =
        "🌿 The leaf appears healthy. Continue regular care.";
    }
    else if (category.includes("yellow")) {
      advice =
        "🍂 Yellowing detected. Check water, sunlight and nutrients.";
    }
    else if (
      category.includes("spot") ||
      category.includes("blight")
    ) {
      advice =
        "🟤 Spots detected. Inspect for possible plant stress or disease.";
    }
    else {
      advice =
        "🌱 Check the plant carefully for visible health problems.";
    }

    // DISPLAY RESULTS
    let output =
      "🌿 AGRIBOT AI ANALYSIS\n\n" +
      "Prediction: " + best.className + "\n" +
      "Confidence: " + confidence + "%\n\n" +
      "ALL PREDICTIONS:\n";

    predictions.forEach(function (item) {
      output +=
        item.className + ": " +
        (item.probability * 100).toFixed(1) +
        "%\n";
    });

    output += "\n" + advice;

    if (best.probability < 0.6) {
      output +=
        "\n\n⚠️ Low confidence. Try a clearer photo.";
    }

    output +=
      "\n\nNote: This AI result is not a confirmed plant disease diagnosis.";

    result.textContent = output;

  } catch (error) {

    console.error("AgriBot AI Error:", error);

    result.textContent =
      "❌ AI model could not load.\n" +
      "Check your internet connection and model URL.";

  } finally {

    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "✨ Analyze Plant";

  }
});
