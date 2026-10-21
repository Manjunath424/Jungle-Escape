/**
 * JUNGLE ESCAPE - 3D Explorer Player Character
 * Procedural low-poly adventure explorer with full hierarchical rigging,
 * running/jumping/sliding animations, collision bounds, and visual powerup auras.
 */

class Player {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();

    // Movement state
    this.lane = CONSTANTS.LANE_CENTER;
    this.targetLane = CONSTANTS.LANE_CENTER;
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Physics & State
    this.isGrounded = true;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.isDead = false;

    // Active power-ups
    this.hasShield = false;
    this.shieldTimer = 0;
    this.hasMagnet = false;
    this.magnetTimer = 0;
    this.hasMultiplier = false;
    this.multiplierTimer = 0;
    this.hasScoreBoost = false;
    this.scoreBoostTimer = 0;
    this.hasSpeedBoost = false;
    this.speedBoostTimer = 0;

    // Animation internal counters
    this.runAnimTime = 0;
    this.lateralTilt = 0;

    // Hitbox dimensions
    this.colliderHeight = CONSTANTS.PLAYER_RUN_HEIGHT;
    this.colliderWidth = CONSTANTS.PLAYER_WIDTH;
    this.colliderDepth = CONSTANTS.PLAYER_DEPTH;

    // Build the 3D model
    this.buildModel();

    // Shield mesh
    this.buildShieldMesh();

    // Speed boost aura
    this.buildSpeedAura();

    this.scene.add(this.mesh);
  }

  buildModel() {
    // Explorer Palette
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xe0ac69 });
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0xd8c89d }); // Khaki safari shirt
    const vestMat = new THREE.MeshLambertMaterial({ color: 0x5a3d28 });  // Brown leather vest
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x3d352a }); // Dark cargo pants
    const bootMat = new THREE.MeshLambertMaterial({ color: 0x241911 });  // Rugged dark boots
    const hatMat = new THREE.MeshLambertMaterial({ color: 0x6e4a2c });   // Fedora brown
    const hatBandMat = new THREE.MeshLambertMaterial({ color: 0x1f1610 }); // Fedora band
    const leatherMat = new THREE.MeshLambertMaterial({ color: 0x4a321f });// Backpack
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.85,
      roughness: 0.25
    }); // Ancient idol artifact

    // Root model container
    this.modelRoot = new THREE.Group();
    this.mesh.add(this.modelRoot);

    // --- HIPS & TORSO ---
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.95, 0);
    this.modelRoot.add(this.torsoGroup);

    // Main Torso Body
    const torsoGeo = new THREE.BoxGeometry(0.68, 0.72, 0.42);
    this.torsoMesh = new THREE.Mesh(torsoGeo, shirtMat);
    this.torsoMesh.castShadow = true;
    this.torsoGroup.add(this.torsoMesh);

    // Leather Vest
    const vestGeo = new THREE.BoxGeometry(0.72, 0.68, 0.46);
    const vestMesh = new THREE.Mesh(vestGeo, vestMat);
    vestMesh.position.set(0, 0.02, 0);
    vestMesh.castShadow = true;
    this.torsoGroup.add(vestMesh);

    // Leather Belt & Buckle
    const beltGeo = new THREE.BoxGeometry(0.70, 0.12, 0.44);
    const beltMesh = new THREE.Mesh(beltGeo, bootMat);
    beltMesh.position.set(0, -0.32, 0);
    this.torsoGroup.add(beltMesh);

    const buckleGeo = new THREE.BoxGeometry(0.18, 0.14, 0.47);
    const buckleMesh = new THREE.Mesh(buckleGeo, goldMat);
    buckleMesh.position.set(0, -0.32, 0);
    this.torsoGroup.add(buckleMesh);

    // Backpack
    const packGeo = new THREE.BoxGeometry(0.52, 0.52, 0.32);
    const packMesh = new THREE.Mesh(packGeo, leatherMat);
    packMesh.position.set(0, 0.05, -0.32);
    packMesh.castShadow = true;
    this.torsoGroup.add(packMesh);

    // Bedroll on top of backpack
    const bedrollGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.58, 8);
    const bedrollMat = new THREE.MeshLambertMaterial({ color: 0x3d5438 });
    const bedrollMesh = new THREE.Mesh(bedrollGeo, bedrollMat);
    bedrollMesh.rotation.z = Math.PI / 2;
    bedrollMesh.position.set(0, 0.35, -0.32);
    this.torsoGroup.add(bedrollMesh);

    // Ancient Golden Idol on hip
    const idolGeo = new THREE.CylinderGeometry(0.08, 0.10, 0.30, 8);
    const idolMesh = new THREE.Mesh(idolGeo, goldMat);
    idolMesh.position.set(0.40, -0.20, 0);
    idolMesh.rotation.z = -0.2;
    this.torsoGroup.add(idolMesh);

    // --- NECK & HEAD ---
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.48, 0);
    this.torsoGroup.add(this.headGroup);

    // Head
    const headGeo = new THREE.BoxGeometry(0.42, 0.44, 0.42);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, 0.18, 0);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Explorer Fedora Hat
    const hatBrimGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.05, 12);
    const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
    hatBrim.position.set(0, 0.40, 0);
    this.headGroup.add(hatBrim);

    const hatCrownGeo = new THREE.BoxGeometry(0.38, 0.28, 0.40);
    const hatCrown = new THREE.Mesh(hatCrownGeo, hatMat);
    hatCrown.position.set(0, 0.52, 0);
    this.headGroup.add(hatCrown);

    const hatBandGeo = new THREE.BoxGeometry(0.40, 0.08, 0.42);
    const hatBand = new THREE.Mesh(hatBandGeo, hatBandMat);
    hatBand.position.set(0, 0.44, 0);
    this.headGroup.add(hatBand);

    // --- ARMS (Left & Right Pivots) ---
    // Left Arm
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.46, 0.28, 0);
    this.torsoGroup.add(this.leftArmPivot);

    const armGeo = new THREE.BoxGeometry(0.20, 0.62, 0.22);
    const leftArmMesh = new THREE.Mesh(armGeo, shirtMat);
    leftArmMesh.position.set(0, -0.26, 0);
    leftArmMesh.castShadow = true;
    this.leftArmPivot.add(leftArmMesh);

    const handGeo = new THREE.BoxGeometry(0.18, 0.18, 0.20);
    const leftHandMesh = new THREE.Mesh(handGeo, skinMat);
    leftHandMesh.position.set(0, -0.58, 0);
    this.leftArmPivot.add(leftHandMesh);

    // Right Arm
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.46, 0.28, 0);
    this.torsoGroup.add(this.rightArmPivot);

    const rightArmMesh = new THREE.Mesh(armGeo, shirtMat);
    rightArmMesh.position.set(0, -0.26, 0);
    rightArmMesh.castShadow = true;
    this.rightArmPivot.add(rightArmMesh);

    const rightHandMesh = new THREE.Mesh(handGeo, skinMat);
    rightHandMesh.position.set(0, -0.58, 0);
    this.rightArmPivot.add(rightHandMesh);

    // --- LEGS (Left & Right Pivots) ---
    // Left Leg
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.20, 0.65, 0);
    this.modelRoot.add(this.leftLegPivot);

    const legGeo = new THREE.BoxGeometry(0.24, 0.48, 0.28);
    const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
    leftLegMesh.position.set(0, -0.22, 0);
    leftLegMesh.castShadow = true;
    this.leftLegPivot.add(leftLegMesh);

    const bootGeo = new THREE.BoxGeometry(0.26, 0.32, 0.36);
    const leftBootMesh = new THREE.Mesh(bootGeo, bootMat);
    leftBootMesh.position.set(0, -0.50, 0.04);
    leftBootMesh.castShadow = true;
    this.leftLegPivot.add(leftBootMesh);

    // Right Leg
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.20, 0.65, 0);
    this.modelRoot.add(this.rightLegPivot);

    const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rightLegMesh.position.set(0, -0.22, 0);
    rightLegMesh.castShadow = true;
    this.rightLegPivot.add(rightLegMesh);

    const rightBootMesh = new THREE.Mesh(bootGeo, bootMat);
    rightBootMesh.position.set(0, -0.50, 0.04);
    rightBootMesh.castShadow = true;
    this.rightLegPivot.add(rightBootMesh);
  }

  buildShieldMesh() {
    const shieldGeo = new THREE.SphereGeometry(1.6, 16, 16);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      emissive: 0x00a2ff,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.38,
      roughness: 0.1,
      metalness: 0.2,
      wireframe: false
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.set(0, 1.0, 0);
    this.shieldMesh.visible = false;
    this.mesh.add(this.shieldMesh);

    // Inner wireframe ring for high-tech magic temple effect
    const ringGeo = new THREE.TorusGeometry(1.4, 0.04, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x88ffff, wireframe: true });
    this.shieldRing = new THREE.Mesh(ringGeo, ringMat);
    this.shieldMesh.add(this.shieldRing);
  }

  buildSpeedAura() {
    const auraGeo = new THREE.ConeGeometry(0.8, 2.4, 8);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.35,
      wireframe: true
    });
    this.speedAura = new THREE.Mesh(auraGeo, auraMat);
    this.speedAura.rotation.x = Math.PI / 2;
    this.speedAura.position.set(0, 0.9, 1.2);
    this.speedAura.visible = false;
    this.mesh.add(this.speedAura);
  }

  reset() {
    this.lane = CONSTANTS.LANE_CENTER;
    this.targetLane = CONSTANTS.LANE_CENTER;
    this.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.isGrounded = true;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.isDead = false;

    // Reset powerups
    this.hasShield = false;
    this.shieldTimer = 0;
    this.hasMagnet = false;
    this.magnetTimer = 0;
    this.hasMultiplier = false;
    this.multiplierTimer = 0;
    this.hasScoreBoost = false;
    this.scoreBoostTimer = 0;
    this.hasSpeedBoost = false;
    this.speedBoostTimer = 0;

    this.shieldMesh.visible = false;
    this.speedAura.visible = false;

    this.colliderHeight = CONSTANTS.PLAYER_RUN_HEIGHT;
    this.modelRoot.position.set(0, 0, 0);
    this.modelRoot.rotation.set(0, 0, 0);
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);

    this.resetLimbs();
  }

  resetLimbs() {
    this.torsoGroup.position.set(0, 0.95, 0);
    this.torsoGroup.rotation.set(0, 0, 0);
    this.leftArmPivot.rotation.set(0, 0, 0);
    this.rightArmPivot.rotation.set(0, 0, 0);
    this.leftLegPivot.position.set(-0.20, 0.65, 0);
    this.leftLegPivot.rotation.set(0, 0, 0);
    this.rightLegPivot.position.set(0.20, 0.65, 0);
    this.rightLegPivot.rotation.set(0, 0, 0);
    this.headGroup.rotation.set(0, 0, 0);
  }

  // Input actions
  moveLeft() {
    if (this.isDead) return;
    if (this.targetLane > CONSTANTS.LANE_LEFT) {
      this.targetLane--;
      window.soundEngine.playFootstep();
    }
  }

  moveRight() {
    if (this.isDead) return;
    if (this.targetLane < CONSTANTS.LANE_RIGHT) {
      this.targetLane++;
      window.soundEngine.playFootstep();
    }
  }

  jump() {
    if (this.isDead || !this.isGrounded) return;

    // Cancel slide if jumping
    if (this.isSliding) {
      this.endSlide();
    }

    this.velocity.y = CONSTANTS.JUMP_VELOCITY;
    this.isGrounded = false;
    this.isJumping = true;
    window.soundEngine.playJump();
  }

  slide() {
    if (this.isDead || this.isSliding) return;

    // Fast-drop if in mid-air
    if (!this.isGrounded) {
      this.velocity.y = -CONSTANTS.JUMP_VELOCITY * 1.5;
    }

    this.isSliding = true;
    this.slideTimer = CONSTANTS.SLIDE_DURATION;
    this.colliderHeight = CONSTANTS.PLAYER_SLIDE_HEIGHT;
    window.soundEngine.playSlide();
  }

  endSlide() {
    this.isSliding = false;
    this.slideTimer = 0;
    this.colliderHeight = CONSTANTS.PLAYER_RUN_HEIGHT;
    this.resetLimbs();
  }

  // Activate Power-ups
  activateShield(duration = CONSTANTS.POWERUPS.SHIELD.duration) {
    this.hasShield = true;
    this.shieldTimer = duration;
    this.shieldMesh.visible = true;
    window.soundEngine.playPowerup();
  }

  activateMagnet(duration = CONSTANTS.POWERUPS.MAGNET.duration) {
    this.hasMagnet = true;
    this.magnetTimer = duration;
    window.soundEngine.playPowerup();
  }

  activateMultiplier(duration = CONSTANTS.POWERUPS.MULTIPLIER.duration) {
    this.hasMultiplier = true;
    this.multiplierTimer = duration;
    window.soundEngine.playPowerup();
  }

  activateScoreBoost(duration = CONSTANTS.POWERUPS.SCORE_BOOST.duration) {
    this.hasScoreBoost = true;
    this.scoreBoostTimer = duration;
    window.soundEngine.playPowerup();
  }

  activateSpeedBoost(duration = CONSTANTS.POWERUPS.SPEED_BOOST.duration) {
    this.hasSpeedBoost = true;
    this.speedBoostTimer = duration;
    this.speedAura.visible = true;
    window.soundEngine.playPowerup();
  }

  hitObstacle() {
    // If Speed Boost is active, smash through obstacle with invincibility
    if (this.hasSpeedBoost) {
      window.soundEngine.playShieldBreak();
      return 'smashed';
    }

    // If Shield is active, consume shield and stay alive!
    if (this.hasShield) {
      this.hasShield = false;
      this.shieldTimer = 0;
      this.shieldMesh.visible = false;
      window.soundEngine.playShieldBreak();
      return 'shield_consumed';
    }

    // Fatal hit
    this.isDead = true;
    window.soundEngine.playHit();
    window.soundEngine.playGameOver();
    return 'killed';
  }

  update(dt, currentForwardSpeed) {
    if (this.isDead) {
      this.updateDeathAnimation(dt);
      return;
    }

    // 1. Update Powerup Timers
    this.updatePowerups(dt);

    // 2. Smooth Lane Switching (Lerp X)
    const targetX = CONSTANTS.LANES[this.targetLane];
    const diffX = targetX - this.position.x;
    this.position.x += diffX * Math.min(1.0, dt * CONSTANTS.LANE_CHANGE_SPEED);

    // Banking tilt when changing lanes
    const targetTilt = -diffX * 0.16;
    this.lateralTilt += (targetTilt - this.lateralTilt) * dt * 10.0;
    this.modelRoot.rotation.z = this.lateralTilt;

    // 3. Vertical Physics (Jumping & Falling)
    if (!this.isGrounded) {
      this.velocity.y -= CONSTANTS.GRAVITY * dt;
      this.position.y += this.velocity.y * dt;

      if (this.position.y <= 0) {
        this.position.y = 0;
        this.velocity.y = 0;
        this.isGrounded = true;
        this.isJumping = false;
        window.soundEngine.playFootstep();
      }
    }

    // 4. Sliding Timer
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.endSlide();
      }
    }

    // 5. Update Mesh Position
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);

    // 6. Character Rig Animations
    this.updateAnimations(dt, currentForwardSpeed);

    // 7. Shield & Speed Boost FX Animation
    if (this.hasShield) {
      this.shieldRing.rotation.x += dt * 2.2;
      this.shieldRing.rotation.y += dt * 3.1;
      const pulse = 1.0 + Math.sin(performance.now() * 0.006) * 0.06;
      this.shieldMesh.scale.set(pulse, pulse, pulse);
    }
    if (this.hasSpeedBoost) {
      this.speedAura.rotation.z += dt * 10;
    }
  }

  updatePowerups(dt) {
    if (this.hasShield) {
      this.shieldTimer -= dt;
      if (this.shieldTimer <= 0) {
        this.hasShield = false;
        this.shieldMesh.visible = false;
      }
    }
    if (this.hasMagnet) {
      this.magnetTimer -= dt;
      if (this.magnetTimer <= 0) this.hasMagnet = false;
    }
    if (this.hasMultiplier) {
      this.multiplierTimer -= dt;
      if (this.multiplierTimer <= 0) this.hasMultiplier = false;
    }
    if (this.hasScoreBoost) {
      this.scoreBoostTimer -= dt;
      if (this.scoreBoostTimer <= 0) this.hasScoreBoost = false;
    }
    if (this.hasSpeedBoost) {
      this.speedBoostTimer -= dt;
      if (this.speedBoostTimer <= 0) {
        this.hasSpeedBoost = false;
        this.speedAura.visible = false;
      }
    }
  }

  updateAnimations(dt, speed) {
    const animRate = Math.max(8.0, speed * 0.42);

    if (this.isSliding) {
      // SLIDE ANIMATION: explorer lowers body, leans back, slides feet-forward
      this.torsoGroup.position.set(0, 0.45, 0.2);
      this.torsoGroup.rotation.x = -0.75; // Leaning back

      this.leftArmPivot.rotation.x = -0.5;
      this.rightArmPivot.rotation.x = -0.5;

      this.leftLegPivot.position.set(-0.20, 0.25, -0.1);
      this.leftLegPivot.rotation.x = 1.45; // Leg straight forward
      this.rightLegPivot.position.set(0.20, 0.25, -0.1);
      this.rightLegPivot.rotation.x = 1.30;
      this.headGroup.rotation.x = 0.55; // Keep eyes forward
    } else if (!this.isGrounded) {
      // JUMP ANIMATION: Tuck legs up, throw arms upward for balance
      this.torsoGroup.position.set(0, 0.95, 0);
      this.torsoGroup.rotation.x = 0.15; // slight forward lean

      this.leftArmPivot.rotation.x = -1.2;
      this.rightArmPivot.rotation.x = -1.2;

      this.leftLegPivot.position.set(-0.20, 0.65, 0);
      this.leftLegPivot.rotation.x = 0.85; // Tuck knees
      this.rightLegPivot.position.set(0.20, 0.65, 0);
      this.rightLegPivot.rotation.x = 0.60;
      this.headGroup.rotation.x = -0.1;
    } else {
      // RUNNING ANIMATION: Smooth natural strides synced to movement speed
      this.runAnimTime += dt * animRate;

      const stride = Math.sin(this.runAnimTime);
      const strideCos = Math.cos(this.runAnimTime);

      // Footstep sound trigger on stride peak
      if (stride > 0.95) {
        window.soundEngine.playFootstep();
      }

      // Torso bobbing and breathing
      this.torsoGroup.position.y = 0.95 + Math.abs(stride) * 0.08;
      this.torsoGroup.rotation.y = stride * 0.08;
      this.torsoGroup.rotation.x = 0.18; // Running forward tilt

      // Limbs swing in opposite directions
      this.leftLegPivot.position.set(-0.20, 0.65, 0);
      this.rightLegPivot.position.set(0.20, 0.65, 0);

      this.leftLegPivot.rotation.x = stride * 0.95;
      this.rightLegPivot.rotation.x = -stride * 0.95;

      this.leftArmPivot.rotation.x = -stride * 0.85;
      this.rightArmPivot.rotation.x = stride * 0.85;

      // Slight head counter-balance
      this.headGroup.rotation.x = -0.12;
      this.headGroup.rotation.y = -stride * 0.05;
    }
  }

  updateDeathAnimation(dt) {
    // Collapsing stumble and fall
    if (this.modelRoot.position.y > 0.2) {
      this.modelRoot.position.y -= dt * 2.0;
    }
    this.modelRoot.rotation.x -= dt * 3.5;
    this.leftArmPivot.rotation.x += dt * 4.0;
    this.rightArmPivot.rotation.x += dt * 4.0;
    this.leftLegPivot.rotation.x -= dt * 2.5;
    this.rightLegPivot.rotation.x += dt * 2.5;
  }

  // Bounding box for accurate collision checks
  getBounds() {
    const halfW = this.colliderWidth * 0.5;
    const halfD = this.colliderDepth * 0.5;

    return {
      minX: this.position.x - halfW,
      maxX: this.position.x + halfW,
      minY: this.position.y,
      maxY: this.position.y + this.colliderHeight,
      minZ: this.position.z - halfD,
      maxZ: this.position.z + halfD
    };
  }
}

window.Player = Player;
