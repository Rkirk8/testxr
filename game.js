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

  /* MATERIALS
  -------------------------------------------------*/
  const materialColors = [
    { name: "red", color: new BABYLON.Color3(1, 0, 0) },
    { name: "blue", color: new BABYLON.Color3(0, 0, 1) },
    { name: "green", color: new BABYLON.Color3(0, 1, 0) },
    { name: "purple", color: new BABYLON.Color3(0.5, 0, 0.5) }
  ];

  /* OBSTACLE TYPES
  -------------------------------------------------*/
  const obstacleTypes = [
    { 
      name: "duck", 
      height: 0.5, 
      width: 3, 
      depth: 1, 
      xPositions: [0.2, 0.27, -0.2],
      description: "Low obstacle to duck under"
    },
    { 
      name: "stepLeft", 
      height: 3, 
      width: 3, 
      depth: 1, 
      xPositions: [1, 1.45],
      description: "Obstacle to step left around"
    },
    { 
      name: "stepRight", 
      height: 3, 
      width: 3, 
      depth: 1, 
      xPositions: [-1, -1.45],
      description: "Obstacle to step right around"
    }
  ];

  /* OBSTACLE MANAGEMENT CLASS
  -------------------------------------------------*/
  class ObstacleManager {
    constructor(scene) {
      this.scene = scene;
      this.obstacles = [];
      this.currentZPosition = 20;
      this.zSpacing = 2.5;
      this.maxObstacles = GameConfig.difficulty[GameConfig.currentDifficulty].maxObstacles;
    }

    getRandomItem(array) {
      return array[Math.floor(Math.random() * array.length)];
    }

    createObstacleMaterial(color) {
      const material = new BABYLON.StandardMaterial(`${color.name}Mat`, this.scene);
      material.diffuseColor = color.color;
      material.alpha = 0.7;
      return material;
    }

    createObstacle() {
      // Randomly select an obstacle type
      const type = this.getRandomItem(obstacleTypes);
      const materialColor = this.getRandomItem(materialColors);
      
      const name = `${type.name}${Date.now()}`;
      const xPosition = this.getRandomItem(type.xPositions);
      
      // Create obstacle
      const obstacle = BABYLON.MeshBuilder.CreateBox(name, {
        height: type.height,
        width: type.width,
        depth: type.depth
      }, this.scene);
      
      // Position and material
      obstacle.position = new BABYLON.Vector3(xPosition, type.height / 2, this.currentZPosition);
      obstacle.material = this.createObstacleMaterial(materialColor);
      obstacle.checkCollisions = true;

      // Z-axis animation
      const zAnimation = new BABYLON.Animation(
        `zMovement${name}`, 
        "position.z", 
        30, 
        BABYLON.Animation.ANIMATIONTYPE_FLOAT, 
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      const zKeyFrames = [
        { frame: 0, value: this.currentZPosition },
        { frame: 100, value: this.currentZPosition - 20 },
        { frame: 200, value: this.currentZPosition }
      ];

      zAnimation.setKeys(zKeyFrames);
      this.scene.beginDirectAnimation(
        obstacle, 
        [zAnimation], 
        0, 
        200, 
        true, 
        GameConfig.difficulty[GameConfig.currentDifficulty].speed
      );

      this.obstacles.push(obstacle);
      this.currentZPosition += this.zSpacing;

      // Remove old obstacles
      this.cleanupObstacles();
    }

    cleanupObstacles() {
      this.obstacles = this.obstacles.filter(obstacle => {
        if (obstacle.position.z < -10) {
          obstacle.dispose();
          return false;
        }
        return true;
      });
    }

    startContinuousGeneration() {
      // Generate initial set of obstacles
      for (let i = 0; i < 5; i++) {
        this.createObstacle();
      }

      // Continuously generate obstacles
      setInterval(() => {
        this.createObstacle();
      }, 2000);
    }
  }

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

  // Initialize and start obstacle generation
  const obstacleManager = new ObstacleManager(scene);
  obstacleManager.startContinuousGeneration();

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