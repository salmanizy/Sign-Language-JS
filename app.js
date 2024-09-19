// Access the video element and canvas
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const gestureText = document.getElementById('gesture');

// Load the handpose model
async function loadHandposeModel() {
  const model = await handpose.load();
  detectHands(model);
  alert("Handpose model loaded.");
}

// Set up webcam access
async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

// Detect hands and classify gestures
async function detectHands(model) {
  canvas.width = video.width;
  canvas.height = video.height;

  // Create a loop for hand detection
  async function detect() {
    const predictions = await model.estimateHands(video);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (predictions.length > 0) {
      const landmarks = predictions[0].landmarks;

      // Draw landmarks on canvas
      for (let i = 0; i < landmarks.length; i++) {
        const [x, y] = landmarks[i];
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'green';
        ctx.fill();
      }

      // Recognize gesture
      const gesture = recognizeGesture(landmarks);
      gestureText.textContent = `Detected Gesture: ${gesture}`;
    }

    requestAnimationFrame(detect);
  }

  detect();
}

// Recognize gesture based on landmarks
function recognizeGesture(landmarks) {
  const thumbTip = landmarks[4];  // Thumb tip
  const indexTip = landmarks[8];  // Index finger tip
  const middleTip = landmarks[12]; // Middle finger tip
  const ringTip = landmarks[16];   // Ring finger tip
  const pinkyTip = landmarks[20];  // Pinky finger tip

  // Calculate distances between thumb and other fingers
  const distanceThumbIndex = calculateDistance(thumbTip, indexTip);
  const distanceThumbMiddle = calculateDistance(thumbTip, middleTip);
  const distanceThumbRing = calculateDistance(thumbTip, ringTip);
  const distanceThumbPinky = calculateDistance(thumbTip, pinkyTip);

  // Count how many fingers are extended (finger tip is higher than MCP joint)
  const extendedFingers = countExtendedFingers(landmarks);

  if (extendedFingers === 1) {
    return 'One';
  } else if (extendedFingers === 2) {
    return 'Two';
  } else if (extendedFingers === 3) {
    return 'Three';
  } else if (extendedFingers === 4) {
    return 'Four';
  } else if (extendedFingers > 4) {
    return 'Five';
  } else if (extendedFingers < 1) {
    return 'Quite';
  }

  // Detect OK gesture (thumb close to index finger)
  if (distanceThumbIndex < 30 && distanceThumbMiddle > 50 && distanceThumbRing > 50 && distanceThumbPinky > 50) {
    return 'OK';
  }

  return 'Unknown gesture';
}

// Calculate Euclidean distance between two points
function calculateDistance(point1, point2) {
  return Math.sqrt(
    Math.pow(point1[0] - point2[0], 2) +
    Math.pow(point1[1] - point2[1], 2)
  );
}

// Count extended fingers
function countExtendedFingers(landmarks) {
  let count = 0;

  // Check if the tip of each finger is above the MCP joint (landmarks[i])
  // Thumb is different since it’s positioned differently
  const isThumbFingerExtended = landmarks[4][0] > landmarks[2][0];
  const isIndexFingerExtended = landmarks[8][1] < landmarks[7][1];  // Index tip is above the joint
  const isMiddleFingerExtended = landmarks[12][1] < landmarks[11][1]; // Middle tip is above joint
  const isRingFingerExtended = landmarks[16][1] < landmarks[15][1]; // Ring tip is above joint
  const isPinkyFingerExtended = landmarks[20][1] < landmarks[19][1]; // Pinky tip is above joint

  if (isThumbFingerExtended) count++;
  if (isIndexFingerExtended) count++;
  if (isMiddleFingerExtended) count++;
  if (isRingFingerExtended) count++;
  if (isPinkyFingerExtended) count++;

  return count;
}

// Start the video and load the model
setupCamera().then(() => {
  loadHandposeModel();
});
