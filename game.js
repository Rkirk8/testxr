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
  lives: 3,
  isGameOver: false
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
      // Stop creating obstacles if game is over
      if (GameConfig.isGameOver) return;

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

      this.obstacles.push(obstacle);
      this.currentZPosition += this.zSpacing;

      // Remove old obstacles
      this.cleanupObstacles();

      return obstacle;
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

    updateObstaclePositions() {
      // Stop moving obstacles if game is over
      if (GameConfig.isGameOver) return;

      const speed = GameConfig.difficulty[GameConfig.currentDifficulty].speed;
      
      this.obstacles.forEach(obstacle => {
        // Move obstacle forward
        obstacle.position.z -= 0.1 * speed;

        // Check for collision or passing
        if (obstacle.position.z < 1 && obstacle.position.z > 0) {
          // Close proximity
          obstacle.material.emissiveColor = new BABYLON.Color3(1, 1, 0);

          // Potential collision detection logic can be added here
          if (obstacle.position.z < 0.5) {
            this.handleCollision(obstacle);
          }
        } else {
          obstacle.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
        }
      });

      // Cleanup and potentially spawn new obstacles
      this.cleanupObstacles();
      if (this.obstacles.length < this.maxObstacles) {
        this.createObstacle();
      }
    }

    handleCollision(obstacle) {
      // Reduce lives
      GameConfig.lives--;
      
      // Update lives display
      livesText.text = `Lives: ${GameConfig.lives}`;

      // Remove the obstacle that caused the collision
      const index = this.obstacles.indexOf(obstacle);
      if (index > -1) {
        this.obstacles[index].dispose();
        this.obstacles.splice(index, 1);
      }

      // Check for game over
      if (GameConfig.lives <= 0) {
        this.gameOver();
      }
    }

    gameOver() {
      GameConfig.isGameOver = true;

      // Create game over text
      const gameOverText = new BABYLON.GUI.TextBlock();
      gameOverText.text = "GAME OVER";
      gameOverText.color = "red";
      gameOverText.fontSize = 48;
      advancedTexture.addControl(gameOverText);

      // Optional: Add restart button
      const restartButton = BABYLON.GUI.Button.CreateSimpleButton("restartButton", "Restart");
      restartButton.width = "200px";
      restartButton.height = "60px";
      restartButton.color = "white";
      restartButton.background = "green";
      restartButton.onPointerUpObservable.add(() => {
        this.restartGame();
      });
      advancedTexture.addControl(restartButton);
    }

    restartGame() {
      // Reset game configuration
      GameConfig.lives = 3;
      GameConfig.score = 0;
      GameConfig.isGameOver = false;

      // Clear existing obstacles
      this.obstacles.forEach(obstacle => obstacle.dispose());
      this.obstacles = [];

      // Reset UI
      livesText.text = `Lives: ${GameConfig.lives}`;
      scoreText.text = `Score: ${GameConfig.score}`;

      // Remove game over elements
      advancedTexture.removeControl(gameOverText);
      advancedTexture.removeControl(restartButton);

      // Restart obstacle generation
      this.currentZPosition = 20;
      this.startContinuousGeneration();
    }

    startContinuousGeneration() {
      // Generate initial set of obstacles
      for (let i = 0; i < 5; i++) {
        this.createObstacle();
      }
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

  // Initialize obstacle generation
  const obstacleManager = new ObstacleManager(scene);
  obstacleManager.startContinuousGeneration();

  // Game loop for obstacle movement
  scene.registerBeforeRender(() => {
    obstacleManager.updateObstaclePositions();
  });

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