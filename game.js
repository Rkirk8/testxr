const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

// Game Configuration
const GameConfig = {
  difficulty: {
    easy: { speed: 0.5, obstacleFrequency: 1, maxObstacles: 3 },
    medium: { speed: 1, obstacleFrequency: 2, maxObstacles: 5 },
    hard: { speed: 2, obstacleFrequency: 3, maxObstacles: 7 }
  },
  currentDifficulty: 'easy',
  score: 0,
  lives: 3
};

// Create the scene
const createScene = async function () {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(0.8, 0.9, 1);

  /* CAMERA 
  -------------------------------------------------*/
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 2,
    10,
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  camera.attachControl(canvas, true);

  /* ENABLE AR 
  -------------------------------------------------*/
  const xr = await scene.createDefaultXRExperienceAsync({
    uiOptions: {
      sessionMode: "immersive-ar",
      referenceSpaceType: "local-floor",
    },
    optionalFeatures: ["bounded-floor", "hand-tracking"]
  });

  /* LIGHTS
  ------------------------------------------------- */
  const hemisphericLight = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(1, 1, 0),
    scene
  );
  hemisphericLight.intensity = 0.7;

  /* ENVIRONMENT
  -------------------------------------------------*/
  const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10, height: 20}, scene);
  const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
  groundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.7, 0.5);
  ground.material = groundMaterial;

  /* OBSTACLE GENERATION UTILITIES
  -------------------------------------------------*/
  // Obstacle Types
  const obstacleTypes = [
    { 
      name: "duck", 
      dimensions: { height: 0.5, width: 2, depth: 1 },
      description: "Low obstacle to duck under"
    },
    { 
      name: "jump", 
      dimensions: { height: 0.25, width: 2, depth: 0.5 },
      description: "Small obstacle to jump over"
    },
    { 
      name: "stepLeft", 
      dimensions: { height: 1.5, width: 1, depth: 1 },
      description: "Obstacle to step left around"
    },
    { 
      name: "stepRight", 
      dimensions: { height: 1.5, width: 1, depth: 1 },
      description: "Obstacle to step right around"
    }
  ];

  // Material Colors
  const materialColors = [
    { name: "red", color: new BABYLON.Color3(1, 0, 0) },
    { name: "blue", color: new BABYLON.Color3(0, 0, 1) },
    { name: "green", color: new BABYLON.Color3(0, 1, 0) },
    { name: "purple", color: new BABYLON.Color3(0.5, 0, 0.5) }
  ];

  // Create obstacle material
  const createObstacleMaterial = (scene, color) => {
    const material = new BABYLON.StandardMaterial(`${color.name}Mat`, scene);
    material.diffuseColor = color.color;
    material.alpha = 0.7;
    return material;
  };

  // Obstacle generation function
  const generateObstacle = () => {
    // Randomly select obstacle type
    const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    
    // Randomly select material color
    const materialColor = materialColors[Math.floor(Math.random() * materialColors.length)];
    
    // Random horizontal position
    const xPosition = (Math.random() - 0.5) * 4; // Spread across -2 to 2 on x-axis
    
    // Create obstacle
    const obstacle = BABYLON.MeshBuilder.CreateBox(
      obstacleType.name + Date.now(), 
      obstacleType.dimensions, 
      scene
    );
    
    // Position obstacle
    obstacle.position = new BABYLON.Vector3(
      xPosition, 
      obstacleType.dimensions.height / 2, 
      20 // Start far back
    );
    
    // Apply material
    const obstacleMaterial = createObstacleMaterial(scene, materialColor);
    obstacle.material = obstacleMaterial;
    
    return obstacle;
  };

  // Obstacle management
  const activeObstacles = [];

  // Obstacle spawning function
  const spawnObstacles = () => {
    const maxObstacles = GameConfig.difficulty[GameConfig.currentDifficulty].maxObstacles;
    
    // Remove off-screen obstacles
    for (let i = activeObstacles.length - 1; i >= 0; i--) {
      if (activeObstacles[i].position.z < -5) {
        activeObstacles[i].dispose();
        activeObstacles.splice(i, 1);
      }
    }

    // Spawn new obstacles if below max
    while (activeObstacles.length < maxObstacles) {
      const newObstacle = generateObstacle();
      activeObstacles.push(newObstacle);
    }
  };

  // Animation for moving obstacles
  const animateObstacles = () => {
    activeObstacles.forEach((obstacle) => {
      // Move obstacle forward
      obstacle.position.z -= 0.1 * GameConfig.difficulty[GameConfig.currentDifficulty].speed;
    });
  };

  // Spawn initial obstacles
  spawnObstacles();

  /* GAME LOOP
  -------------------------------------------------*/
  scene.registerBeforeRender(() => {
    // Spawn and animate obstacles
    spawnObstacles();
    animateObstacles();

    // Proximity detection
    activeObstacles.forEach(obstacle => {
      if (Math.abs(obstacle.position.z) < 1) {
        obstacle.material.emissiveColor = new BABYLON.Color3(1, 1, 0);
      } else {
        obstacle.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
      }
    });
  });

  /* UI ELEMENTS 
  -------------------------------------------------*/
  const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
  
  // Score Display
  const scoreText = new BABYLON.GUI.TextBlock();
  scoreText.text = `Score: ${GameConfig.score}`;
  scoreText.color = "white";
  scoreText.fontSize = 24;
  scoreText.top = "-40%";
  scoreText.left = "-40%";
  advancedTexture.addControl(scoreText);

  // Lives Display
  const livesText = new BABYLON.GUI.TextBlock();
  livesText.text = `Lives: ${GameConfig.lives}`;
  livesText.color = "white";
  livesText.fontSize = 24;
  livesText.top = "-40%";
  livesText.left = "40%";
  advancedTexture.addControl(livesText);

  return scene;
};

// Render loop
createScene().then((sceneToRender) => {
  engine.runRenderLoop(() => sceneToRender.render());
});

// Responsive design
window.addEventListener("resize", function () {
  engine.resize();
});