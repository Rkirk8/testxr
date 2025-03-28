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
  isGameOver: false,
  isGameStarted: false
};

// Create the scene
const createScene = async function () {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(0.8, 0.9, 1);

  /* CAMERA */
  const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2, 10, new BABYLON.Vector3(0, 1, 0), scene);
  camera.attachControl(canvas, true);

  /* PLAYER */
  const playerMesh = BABYLON.MeshBuilder.CreateBox("playerMesh", { height: 1.7, width: 0.5, depth: 0.5 }, scene);
  playerMesh.isVisible = false;
  playerMesh.checkCollisions = true;

  /* LIGHT */
  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);
  light.intensity = 0.7;

  /* OBSTACLE MANAGEMENT */
  class ObstacleManager {
    constructor(scene, playerMesh) {
      this.scene = scene;
      this.playerMesh = playerMesh;
      this.obstacles = [];
      this.currentZPosition = 20;
      this.zSpacing = 2.5;
      this.maxObstacles = GameConfig.difficulty[GameConfig.currentDifficulty].maxObstacles;
    }

    getRandomItem(array) {
      return array[Math.floor(Math.random() * array.length)];
    }

    createObstacle() {
      if (!GameConfig.isGameStarted || GameConfig.isGameOver) return null;

      const xPosition = this.getRandomItem([0.2, -0.2]);
      const obstacle = BABYLON.MeshBuilder.CreateBox("obstacle", { height: 1, width: 1, depth: 1 }, this.scene);
      obstacle.position = new BABYLON.Vector3(xPosition, 0.5, this.currentZPosition);
      obstacle.material = new BABYLON.StandardMaterial("obstacleMaterial", this.scene);
      obstacle.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
      obstacle.checkCollisions = true;
      this.obstacles.push(obstacle);

      this.currentZPosition += this.zSpacing;

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
      if (!GameConfig.isGameStarted || GameConfig.isGameOver) return;

      const speed = GameConfig.difficulty[GameConfig.currentDifficulty].speed;
      
      this.obstacles.forEach(obstacle => {
        obstacle.position.z -= 0.1 * speed;
        if (this.checkCollision(obstacle)) {
          this.handleCollision(obstacle);
        }
      });

      this.cleanupObstacles();
      if (this.obstacles.length < this.maxObstacles) {
        this.createObstacle();
      }
    }

    checkCollision(obstacle) {
      return this.playerMesh.intersectsMesh(obstacle, true);
    }

    handleCollision(obstacle) {
      GameConfig.lives--;
      livesText.text = `Lives: ${GameConfig.lives}`;
      obstacle.dispose();
      if (GameConfig.lives <= 0) {
        this.gameOver();
      }
    }

    gameOver() {
      GameConfig.isGameOver = true;
      GameConfig.isGameStarted = false;

      const gameOverText = new BABYLON.GUI.TextBlock();
      gameOverText.text = "GAME OVER";
      gameOverText.color = "red";
      gameOverText.fontSize = 48;
      advancedTexture.addControl(gameOverText);

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
      GameConfig.lives = 3;
      GameConfig.isGameOver = false;
      GameConfig.isGameStarted = false;
      this.obstacles.forEach(obstacle => obstacle.dispose());
      this.obstacles = [];

      livesText.text = `Lives: ${GameConfig.lives}`;
      advancedTexture.removeControl(gameOverText);
      advancedTexture.removeControl(restartButton);
      advancedTexture.addControl(startButton);
    }
  }

  /* UI ELEMENTS */
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

  // Start Button
  const startButton = BABYLON.GUI.Button.CreateSimpleButton("startButton", "START GAME");
  startButton.width = "300px";
  startButton.height = "100px";
  startButton.color = "white";
  startButton.background = "green";
  startButton.onPointerUpObservable.add(() => {
    advancedTexture.removeControl(startButton);
    GameConfig.isGameStarted = true;
    const obstacleManager = new ObstacleManager(scene, playerMesh);
    obstacleManager.startContinuousGeneration();

    scene.registerBeforeRender(() => {
      obstacleManager.updateObstaclePositions();
    });
  });

  advancedTexture.addControl(startButton);

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
