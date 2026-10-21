/**
 * JUNGLE ESCAPE - Core Game Engine & Master Loop
 * Integrates Three.js 3D rendering, third-person camera chase, physics,
 * game state machine, collision processing, and progression.
 */

class JungleEscapeGame {
  constructor() {
    this.canvas = document.getElementById('three-canvas');
    this.state = 'LOADING'; // LOADING, MAIN_MENU, PLAYING, PAUSED, GAME_OVER

    // Progression & Metrics
    this.distanceTraveled = 0;
    this.score = 0;
    this.coins = 0;
    this.currentSpeed = CONSTANTS.SPEED_INITIAL;

    // Time tracking
    this.lastTime = performance.now();
    this.gameTime = 0;

    // Camera shake effect
    this.camShakeIntensity = 0;

    // Initialize 3D Engine
    this.initThree();

    // Instantiate Game Systems
    this.trackManager = new TrackManager(this.scene);
    this.player = new Player(this.scene);
    this.obstacleManager = new ObstacleManager(this.scene);
    this.collectibleManager = new CollectibleManager(this.scene);
    this.ui = new UIManager(this);

    // Window events
    window.addEventListener('resize', () => this.onWindowResize());

    // Finish Loading
    this.finishLoading();

    // Start Master Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    // 1. Scene & Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONSTANTS.FOG_COLOR);
    this.scene.fog = new THREE.Fog(CONSTANTS.FOG_COLOR, CONSTANTS.FOG_NEAR, CONSTANTS.FOG_FAR);

    // 2. Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 400);
    this.camera.position.set(0, CONSTANTS.CAM_OFFSET_Y, CONSTANTS.CAM_OFFSET_Z);

    // 3. Renderer with high performance & shadows
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(2.0, window.devicePixelRatio || 1.0));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Jungle Lighting
    // Ambient Jungle Light
    const ambientLight = new THREE.AmbientLight(0x2a4430, 0.85);
    this.scene.add(ambientLight);

    // Sun / Canopy Directional Light
    this.dirLight = new THREE.DirectionalLight(0xfff0cc, 1.25);
    this.dirLight.position.set(25, 45, -20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 120;
    this.dirLight.shadow.camera.left = -20;
    this.dirLight.shadow.camera.right = 20;
    this.dirLight.shadow.camera.top = 25;
    this.dirLight.shadow.camera.bottom = -20;
    this.scene.add(this.dirLight);

    // Hemisphere light for natural sky/ground gradient
    const hemiLight = new THREE.HemisphereLight(0x76b887, 0x1f2e1e, 0.65);
    this.scene.add(hemiLight);
  }

  finishLoading() {
    let progress = 0;
    const tips = [
      'Tip: Jump over fallen logs and spike traps!',
      'Tip: Slide under hanging vines and low stone arches!',
      'Tip: Grab the Temple Shield to survive one crash!',
      'Tip: Coin Magnet pulls all nearby gold towards you!'
    ];

    const interval = setInterval(() => {
      progress += 25;
      const tip = tips[Math.floor((progress / 25) - 1)] || tips[0];
      this.ui.showLoadingProgress(progress, tip);

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          this.ui.hideLoadingScreen();
          this.state = 'MAIN_MENU';
          this.ui.showMainMenu();
        }, 300);
      }
    }, 120);
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // --- GAME LIFECYCLE ---
  startGame() {
    this.state = 'PLAYING';
    this.distanceTraveled = 0;
    this.score = 0;
    this.coins = 0;
    this.currentSpeed = CONSTANTS.SPEED_INITIAL;
    this.camShakeIntensity = 0;
    this.gameTime = 0;

    // Reset systems
    this.player.reset();
    this.trackManager.reset();
    this.obstacleManager.reset();
    this.collectibleManager.reset();

    // Reset camera position directly behind player
    this.camera.position.set(0, CONSTANTS.CAM_OFFSET_Y, CONSTANTS.CAM_OFFSET_Z);

    this.ui.showGameplay();
    this.ui.updateHud(0, 0, 0, this.player);

    window.soundEngine.startMusic();
  }

  pauseGame() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    this.ui.showPause();
  }

  resumeGame() {
    if (this.state !== 'PAUSED') return;
    this.state = 'PLAYING';
    this.lastTime = performance.now();
    this.ui.hidePause();
  }

  returnToMenu() {
    this.state = 'MAIN_MENU';
    this.player.reset();
    this.trackManager.reset();
    this.obstacleManager.reset();
    this.collectibleManager.reset();
    this.ui.showMainMenu();
    window.soundEngine.stopMusic();
  }

  triggerGameOver() {
    this.state = 'GAME_OVER';
    this.camShakeIntensity = 0.6;
    window.soundEngine.stopMusic();

    setTimeout(() => {
      this.ui.showGameOver({
        score: Math.floor(this.score),
        distance: Math.floor(this.distanceTraveled),
        coins: this.coins
      });
    }, 700);
  }

  // --- MASTER ANIMATION & SIMULATION LOOP ---
  animate(currentTime) {
    requestAnimationFrame(this.animate);

    // Delta time calculation with safety clamp
    let dt = (currentTime - this.lastTime) * 0.001;
    this.lastTime = currentTime;
    if (dt > 0.1) dt = 0.1; // Clamp lag spikes

    if (this.state === 'MAIN_MENU') {
      // Cinematic menu orbit animation
      this.gameTime += dt;
      const camX = Math.sin(this.gameTime * 0.4) * 3.5;
      const camZ = 5.0 + Math.cos(this.gameTime * 0.3) * 1.5;
      this.camera.position.set(camX, 3.2, camZ);
      this.camera.lookAt(0, 1.2, -6.0);

      // Player subtle breathing/idle run
      this.player.updateAnimations(dt, 12.0);

    } else if (this.state === 'PLAYING') {
      this.gameTime += dt;

      // 1. Difficulty & Speed Acceleration
      const baseSpeed = Math.min(
        CONSTANTS.SPEED_MAX,
        CONSTANTS.SPEED_INITIAL + (this.distanceTraveled / 100.0) * CONSTANTS.SPEED_ACCEL_RATE * 10.0
      );
      this.currentSpeed = this.player.hasSpeedBoost
        ? baseSpeed * CONSTANTS.SPEED_BOOST_MULTIPLIER
        : baseSpeed;

      // 2. Player Forward Movement
      const forwardDelta = this.currentSpeed * dt;
      this.player.position.z -= forwardDelta;
      this.distanceTraveled += forwardDelta;

      // 3. Update Player Mechanics & Animations
      this.player.update(dt, this.currentSpeed);

      // 4. Update Track Chunks (Recycle behind player)
      this.trackManager.update(this.player.position.z);

      // 5. Update Obstacles
      this.obstacleManager.update(this.player.position.z, this.distanceTraveled);

      // 6. Update Collectibles & Powerups
      this.collectibleManager.update(dt, this.player, this.distanceTraveled, this.gameTime);

      // 7. Check Collectible Pickups
      const pickups = this.collectibleManager.checkPickups(this.player);
      if (pickups.coinsCollected > 0) {
        const coinMultiplier = this.player.hasMultiplier ? CONSTANTS.POWERUPS.MULTIPLIER.multiplier : 1;
        this.coins += pickups.coinsCollected * coinMultiplier;
        this.score += pickups.coinsCollected * CONSTANTS.SCORE_PER_COIN * coinMultiplier;
      }
      for (let pType of pickups.powerupsCollected) {
        switch (pType) {
          case 'shield': this.player.activateShield(); break;
          case 'magnet': this.player.activateMagnet(); break;
          case 'multiplier': this.player.activateMultiplier(); break;
          case 'score_boost': this.player.activateScoreBoost(); break;
          case 'speed_boost': this.player.activateSpeedBoost(); break;
        }
      }

      // 8. Distance Score Accumulation
      const scoreRate = this.player.hasScoreBoost ? CONSTANTS.POWERUPS.SCORE_BOOST.multiplier : 1;
      this.score += forwardDelta * CONSTANTS.SCORE_PER_METER * scoreRate;

      // 9. Collision Detection
      const collidedObstacle = this.obstacleManager.checkCollision(this.player);
      if (collidedObstacle) {
        const reaction = this.player.hitObstacle();
        if (reaction === 'killed') {
          this.triggerGameOver();
        } else {
          // Shield consumed or obstacle smashed in speed boost
          this.camShakeIntensity = 0.35;
          collidedObstacle.deactivate();
        }
      }

      // 10. Smooth Third-Person Chase Camera
      this.updateCamera(dt);

      // 11. Move Directional Light with Player (to keep shadows crisp around character)
      this.dirLight.position.set(
        this.player.position.x + 25,
        45,
        this.player.position.z - 20
      );
      this.dirLight.target = this.player.mesh;

      // 12. Update HUD
      this.ui.updateHud(this.score, this.distanceTraveled, this.coins, this.player);

    } else if (this.state === 'GAME_OVER') {
      // In game over, let player finish collapse animation and apply subtle camera ease
      this.player.update(dt, 0);
      this.collectibleManager.particleSystem.update(dt);
      this.updateCamera(dt);
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  updateCamera(dt) {
    const targetX = this.player.position.x * 0.72; // slight lag behind lane shifts
    const targetY = CONSTANTS.CAM_OFFSET_Y + this.player.position.y * 0.4;
    const targetZ = this.player.position.z + CONSTANTS.CAM_OFFSET_Z;

    // Smooth lerp
    this.camera.position.x += (targetX - this.camera.position.x) * dt * CONSTANTS.CAM_LERP_SPEED;
    this.camera.position.y += (targetY - this.camera.position.y) * dt * CONSTANTS.CAM_LERP_SPEED;
    this.camera.position.z += (targetZ - this.camera.position.z) * dt * CONSTANTS.CAM_LERP_SPEED;

    // Camera Shake on collisions
    if (this.camShakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.camShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.camShakeIntensity;
      this.camShakeIntensity = Math.max(0, this.camShakeIntensity - dt * 2.5);
    }

    // Camera look ahead along the path
    this.camera.lookAt(
      this.camera.position.x * 0.5,
      CONSTANTS.CAM_LOOK_Y + this.player.position.y * 0.3,
      this.player.position.z + CONSTANTS.CAM_LOOK_Z_AHEAD
    );
  }
}

// Bootstrap Game on Window Load
window.addEventListener('DOMContentLoaded', () => {
  window.jungleGame = new JungleEscapeGame();
});
