// Get the canvas element as a const
const canvas = document.getElementById("renderCanvas");
// Create the BABYLON 3D engine, and attach it to the canvas
const engine = new BABYLON.Engine(canvas, true);

// The createScene function
const createScene = async function () {
  // Create a new BABYLON scene, passing in the engine as an argument
  const scene = new BABYLON.Scene(engine);

  /* CAMERA
  ---------------------------------------------------------------------------------------------------- */
  // Add a camera and allow it to control the canvas
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 2.5,
    15,
    new BABYLON.Vector3(0, 0, 0),
    scene
  );
  camera.attachControl(canvas, true);

  /* LIGHTING
  ---------------------------------------------------------------------------------------------------- */
  // Add a light source to illuminate the scene
  const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 0.7;

  /* MESHES (representing interactive objects for fitness game)
  ---------------------------------------------------------------------------------------------------- */
  // Obstacle: Create a box representing an obstacle that the user will dodge
  const obstacle = BABYLON.MeshBuilder.CreateBox("obstacle", { size: 0.5 }, scene);
  const obstacleMat = new BABYLON.StandardMaterial("obstacleMat");
  obstacleMat.diffuseColor = new BABYLON.Color3(1, 0.6, 0); // Orange color
  obstacle.material = obstacleMat;
  obstacle.position.y = 0.5;
  obstacle.position.z = 1.5;

  // Create another object like a target or collectible for interaction (e.g., a ball)
  const ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 0.3 }, scene);
  const ballMat = new BABYLON.StandardMaterial("ballMat");
  ballMat.diffuseColor = new BABYLON.Color3(0, 1, 0); // Green color
  ball.material = ballMat;
  ball.position.x = 1.5;

  /* ANIMATION (simulate objects moving towards the user)
  ---------------------------------------------------------------------------------------------------- */
  // Animate the obstacle or objects in the game, e.g., moving towards the user
  scene.registerBeforeRender(function () {
    obstacle.position.z -= 0.05; // Moves the obstacle toward the user
    if (obstacle.position.z < -10) {
      obstacle.position.z = 1.5; // Reset obstacle to the starting position
    }
  });

  /* SOUNDS
  ---------------------------------------------------------------------------------------------------- */
  // Optional: Create sound effects for collisions or successful movements
  const dodgeSound = new BABYLON.Sound("dodgeSound", "sound/dodge.mp3", scene);

  /* ENABLE AR
  ---------------------------------------------------------------------------------------------------- */
  // Start a WebXR session for immersive AR
  const xr = await scene.createDefaultXRExperienceAsync({
    uiOptions: {
      sessionMode: "immersive-ar",
      referenceSpaceType: "local-floor", // Set to local-floor for a natural floor-level experience
    },
    optionalFeatures: true, // Enable optional features like hit-test, if needed
  });

  /* INTERACTION (simulating dodging and interaction)
  ---------------------------------------------------------------------------------------------------- */
  // STEP 1: Add interaction logic (e.g., detecting head movements to dodge)
  const handleDodge = () => {
    // This function could listen to VR head movements or gestures to simulate dodging
    const direction = Math.random() > 0.5 ? "left" : "right";
    if (direction === "left") {
      obstacle.position.x -= 0.5;
    } else {
      obstacle.position.x += 0.5;
    }
    // Play sound upon dodge
    dodgeSound.play();
  };

  // STEP 2: Listen for gestures or head movements in AR mode (e.g., dodging objects)
  // You can set up the action manager to listen for user interactions (e.g., clicking or moving)
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
      handleDodge(); // Trigger dodge when user taps (or make it gesture-based)
    }
  });

  /* PROGRESS & REWARDS (tracking progress in the game)
  ---------------------------------------------------------------------------------------------------- */
  let score = 0;
  const scoreText = new BABYLON.GUI.TextBlock();
  scoreText.text = "Score: 0";
  scoreText.color = "white";
  scoreText.fontSize = 24;
  scoreText.top = "10px";
  scoreText.left = "10px";
  BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI").addControl(scoreText);

  // Increase score on successful dodge or when an object is avoided
  scene.registerBeforeRender(function () {
    if (obstacle.position.x === 0) { // Example condition for successfully dodging
      score += 10; // Increase score
      scoreText.text = "Score: " + score;
    }
  });

  /* OPTIONAL FEATURE - ADDING A "LOW IMPACT" MODE
  ---------------------------------------------------------------------------------------------------- */
  // Allow users to switch to a low-impact mode, which slows down the game or reduces the intensity
  const lowImpactButton = BABYLON.GUI.Button.CreateSimpleButton("lowImpact", "Low Impact Mode");
  lowImpactButton.width = "200px";
  lowImpactButton.height = "40px";
  lowImpactButton.top = "100px";
  lowImpactButton.left = "10px";
  lowImpactButton.color = "white";
  lowImpactButton.background = "green";
  lowImpactButton.onPointerDownObservable.add(() => {
    obstacle.position.z *= 0.5; // Slow down the object for low-impact mode
  });

  BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI").addControl(lowImpactButton);

  // Return the scene
  return scene;
};

// Continually render the scene in an endless loop
createScene().then((sceneToRender) => {
  engine.runRenderLoop(() => sceneToRender.render());
});

// Resize event listener for responsive canvas
window.addEventListener("resize", function () {
  engine.resize();
});
