/**
 * JUNGLE ESCAPE - Obstacles & Hazard Generation System
 * Generates 10 distinct types of obstacles (jumpable, slidable, and dodgeable),
 * maintains fair navigation paths, and scales difficulty over distance.
 */

class Obstacle {
  constructor(scene, materials) {
    this.scene = scene;
    this.materials = materials;
    this.mesh = new THREE.Group();
    this.active = false;
    this.type = null;
    this.lane = 1;
    this.z = 0;

    // Hitbox parameters
    this.hitbox = {
      minX: 0, maxX: 0,
      minY: 0, maxY: 0,
      minZ: 0, maxZ: 0
    };

    // Sub-objects container
    this.contentGroup = new THREE.Group();
    this.mesh.add(this.contentGroup);

    this.scene.add(this.mesh);
    this.mesh.visible = false;
  }

  setup(type, lane, zPos, extraLane = null) {
    this.type = type;
    this.lane = lane;
    this.z = zPos;
    this.active = true;
    this.mesh.visible = true;

    // Clear previous children
    while (this.contentGroup.children.length > 0) {
      this.contentGroup.remove(this.contentGroup.children[0]);
    }

    const xPos = CONSTANTS.LANES[lane];
    this.mesh.position.set(xPos, 0, zPos);

    const mats = this.materials;

    switch (type) {
      case CONSTANTS.OBSTACLES.ROCK:
        this.buildRock(mats);
        break;

      case CONSTANTS.OBSTACLES.FALLEN_TRUNK:
        this.buildFallenTrunk(mats, extraLane !== null);
        break;

      case CONSTANTS.OBSTACLES.STONE_BARRIER:
        this.buildStoneBarrier(mats);
        break;

      case CONSTANTS.OBSTACLES.WOODEN_BARRICADE:
        this.buildWoodenBarricade(mats);
        break;

      case CONSTANTS.OBSTACLES.LOW_BRANCH:
        this.buildLowBranch(mats);
        break;

      case CONSTANTS.OBSTACLES.HIGH_ARCH_TRAP:
        this.buildHighArchTrap(mats);
        break;

      case CONSTANTS.OBSTACLES.STONE_PILLAR:
        this.buildStonePillar(mats);
        break;

      case CONSTANTS.OBSTACLES.SPIKE_TRAP:
        this.buildSpikeTrap(mats);
        break;

      case CONSTANTS.OBSTACLES.GAP_CHASM:
        this.buildGapChasm(mats);
        break;

      default:
        this.buildRock(mats);
    }
  }

  // 1. Large mossy boulder (Dodge)
  buildRock(mats) {
    const geo = new THREE.DodecahedronGeometry(1.2, 1);
    const rock = new THREE.Mesh(geo, mats.rockMat);
    rock.position.set(0, 1.1, 0);
    rock.rotation.set(0.4, 0.2, 0.5);
    rock.castShadow = true;
    this.contentGroup.add(rock);

    this.hitbox = {
      minX: -1.1, maxX: 1.1,
      minY: 0.0, maxY: 2.2,
      minZ: -1.0, maxZ: 1.0,
      mustDodge: true
    };
  }

  // 2. Fallen Mossy Trunk across 1 or 2 lanes (Jump over)
  buildFallenTrunk(mats, isWide) {
    const width = isWide ? 5.8 : 2.8;
    const geo = new THREE.CylinderGeometry(0.38, 0.42, width, 8);
    const trunk = new THREE.Mesh(geo, mats.trunkMat);
    trunk.rotation.z = Math.PI / 2;
    trunk.position.set(isWide ? 1.4 : 0, 0.42, 0);
    trunk.castShadow = true;
    this.contentGroup.add(trunk);

    // Moss clumps on log
    const mossGeo = new THREE.BoxGeometry(0.8, 0.2, 0.6);
    const moss = new THREE.Mesh(mossGeo, mats.mossMat);
    moss.position.set(0, 0.8, 0);
    this.contentGroup.add(moss);

    this.hitbox = {
      minX: isWide ? -1.4 : -1.3,
      maxX: isWide ? 4.2 : 1.3,
      minY: 0.0,
      maxY: 0.82, // Jump height threshold
      minZ: -0.6,
      maxZ: 0.6,
      jumpable: true
    };
  }

  // 3. Ancient Stone Barrier (Jump over)
  buildStoneBarrier(mats) {
    const geo = new THREE.BoxGeometry(2.6, 0.85, 0.6);
    const barrier = new THREE.Mesh(geo, mats.barrierMat);
    barrier.position.set(0, 0.42, 0);
    barrier.castShadow = true;
    this.contentGroup.add(barrier);

    this.hitbox = {
      minX: -1.3, maxX: 1.3,
      minY: 0.0, maxY: 0.85,
      minZ: -0.5, maxZ: 0.5,
      jumpable: true
    };
  }

  // 4. Wooden Tribal Barricade (Dodge or high jump)
  buildWoodenBarricade(mats) {
    const group = new THREE.Group();
    // Cross beams
    const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 2.2, 6);
    const p1 = new THREE.Mesh(postGeo, mats.woodMat);
    p1.position.set(-1.0, 1.1, 0);
    p1.castShadow = true;
    group.add(p1);

    const p2 = new THREE.Mesh(postGeo, mats.woodMat);
    p2.position.set(1.0, 1.1, 0);
    p2.castShadow = true;
    group.add(p2);

    // Cross planks
    const plankGeo = new THREE.BoxGeometry(2.4, 0.28, 0.16);
    for (let y = 0.5; y <= 1.8; y += 0.5) {
      const plank = new THREE.Mesh(plankGeo, mats.woodMat);
      plank.position.set(0, y, 0);
      plank.castShadow = true;
      group.add(plank);
    }

    this.contentGroup.add(group);

    this.hitbox = {
      minX: -1.2, maxX: 1.2,
      minY: 0.0, maxY: 2.1,
      minZ: -0.4, maxZ: 0.4,
      mustDodge: true
    };
  }

  // 5. Low Jungle Tree Branch (Slide under!)
  buildLowBranch(mats) {
    const branchGeo = new THREE.CylinderGeometry(0.35, 0.45, 3.4, 7);
    const branch = new THREE.Mesh(branchGeo, mats.trunkMat);
    branch.rotation.z = Math.PI / 2;
    branch.position.set(0, 1.6, 0); // Bottom of branch is at y = 1.25
    branch.castShadow = true;
    this.contentGroup.add(branch);

    // Hanging vines
    const vineGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 4);
    for (let x = -1.0; x <= 1.0; x += 0.5) {
      const vine = new THREE.Mesh(vineGeo, mats.mossMat);
      vine.position.set(x, 1.1, 0);
      this.contentGroup.add(vine);
    }

    this.hitbox = {
      minX: -1.4, maxX: 1.4,
      minY: 1.05, // Standing player (1.85m) hits this; sliding player (0.9m) clears it!
      maxY: 2.6,
      minZ: -0.6, maxZ: 0.6,
      slidable: true
    };
  }

  // 6. High Stone Arch Trap (Slide under!)
  buildHighArchTrap(mats) {
    const beamGeo = new THREE.BoxGeometry(3.0, 0.6, 1.0);
    const beam = new THREE.Mesh(beamGeo, mats.barrierMat);
    beam.position.set(0, 1.7, 0); // Bottom at y = 1.4
    beam.castShadow = true;
    this.contentGroup.add(beam);

    // Spikes hanging down from beam
    const spikeGeo = new THREE.ConeGeometry(0.12, 0.4, 4);
    for (let x = -1.1; x <= 1.1; x += 0.45) {
      const spike = new THREE.Mesh(spikeGeo, mats.rockMat);
      spike.rotation.x = Math.PI;
      spike.position.set(x, 1.2, 0);
      this.contentGroup.add(spike);
    }

    this.hitbox = {
      minX: -1.4, maxX: 1.4,
      minY: 1.0,
      maxY: 2.8,
      minZ: -0.6, maxZ: 0.6,
      slidable: true
    };
  }

  // 7. Stone Broken Pillar / Obelisk (Dodge)
  buildStonePillar(mats) {
    const pillarGeo = new THREE.BoxGeometry(1.2, 3.4, 1.2);
    const pillar = new THREE.Mesh(pillarGeo, mats.barrierMat);
    pillar.position.set(0, 1.7, 0);
    pillar.rotation.y = 0.3;
    pillar.castShadow = true;
    this.contentGroup.add(pillar);

    this.hitbox = {
      minX: -0.9, maxX: 0.9,
      minY: 0.0, maxY: 3.4,
      minZ: -0.8, maxZ: 0.8,
      mustDodge: true
    };
  }

  // 8. Ground Spike Trap (Jump over)
  buildSpikeTrap(mats) {
    // Metal/stone plate on floor
    const plateGeo = new THREE.BoxGeometry(2.4, 0.1, 1.6);
    const plate = new THREE.Mesh(plateGeo, mats.barrierMat);
    plate.position.set(0, 0.05, 0);
    this.contentGroup.add(plate);

    // Upward spikes
    const spikeGeo = new THREE.ConeGeometry(0.12, 0.6, 5);
    for (let x = -0.8; x <= 0.8; x += 0.4) {
      for (let z = -0.5; z <= 0.5; z += 0.5) {
        const spike = new THREE.Mesh(spikeGeo, mats.rockMat);
        spike.position.set(x, 0.38, z);
        spike.castShadow = true;
        this.contentGroup.add(spike);
      }
    }

    this.hitbox = {
      minX: -1.2, maxX: 1.2,
      minY: 0.0, maxY: 0.7,
      minZ: -0.8, maxZ: 0.8,
      jumpable: true
    };
  }

  // 9. Broken Chasm Pit in Road (Jump over!)
  buildGapChasm(mats) {
    // Visual dark pit cover replacing normal floor
    const pitGeo = new THREE.BoxGeometry(3.0, 0.2, 2.8);
    const pitMat = new THREE.MeshBasicMaterial({ color: 0x050d09 });
    const pit = new THREE.Mesh(pitGeo, pitMat);
    pit.position.set(0, 0.02, 0);
    this.contentGroup.add(pit);

    // Broken wooden planks across edges
    const plankGeo = new THREE.BoxGeometry(0.4, 0.1, 1.0);
    const p1 = new THREE.Mesh(plankGeo, mats.woodMat);
    p1.position.set(-0.9, 0.08, -1.1);
    p1.rotation.y = 0.2;
    this.contentGroup.add(p1);

    const p2 = new THREE.Mesh(plankGeo, mats.woodMat);
    p2.position.set(0.8, 0.08, 1.1);
    p2.rotation.y = -0.3;
    this.contentGroup.add(p2);

    this.hitbox = {
      minX: -1.3, maxX: 1.3,
      minY: 0.0, maxY: 0.35, // Player must be in the air (jumping) above 0.35
      minZ: -1.3, maxZ: 1.3,
      isGap: true
    };
  }

  // Check collision against player bounding box
  checkCollision(playerBounds) {
    if (!this.active) return false;

    // Convert local hitbox to world coordinates
    const worldMinX = this.mesh.position.x + this.hitbox.minX;
    const worldMaxX = this.mesh.position.x + this.hitbox.maxX;
    const worldMinY = this.hitbox.minY;
    const worldMaxY = this.hitbox.maxY;
    const worldMinZ = this.z + this.hitbox.minZ;
    const worldMaxZ = this.z + this.hitbox.maxZ;

    // AABB Overlap check
    const xOverlap = playerBounds.minX < worldMaxX && playerBounds.maxX > worldMinX;
    const zOverlap = playerBounds.minZ < worldMaxZ && playerBounds.maxZ > worldMinZ;
    const yOverlap = playerBounds.minY < worldMaxY && playerBounds.maxY > worldMinY;

    if (xOverlap && zOverlap && yOverlap) {
      return true;
    }

    return false;
  }

  deactivate() {
    this.active = false;
    this.mesh.visible = false;
  }
}

class ObstacleManager {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.poolSize = 40;
    this.nextSpawnZ = -35.0; // Start spawning after initial safe zone

    this.initMaterials();

    // Pre-allocate obstacle pool
    for (let i = 0; i < this.poolSize; i++) {
      this.obstacles.push(new Obstacle(this.scene, this.materials));
    }
  }

  initMaterials() {
    this.materials = {
      rockMat: new THREE.MeshStandardMaterial({
        color: 0x5a5f57,
        roughness: 0.9,
        metalness: 0.1
      }),
      trunkMat: new THREE.MeshStandardMaterial({
        color: 0x4a321e,
        roughness: 0.85,
        metalness: 0.05
      }),
      barrierMat: new THREE.MeshStandardMaterial({
        color: 0x40493e,
        roughness: 0.92,
        metalness: 0.08
      }),
      woodMat: new THREE.MeshStandardMaterial({
        color: 0x593d25,
        roughness: 0.8,
        metalness: 0.0
      }),
      mossMat: new THREE.MeshLambertMaterial({
        color: 0x2e6628
      })
    };
  }

  reset() {
    for (let obs of this.obstacles) {
      obs.deactivate();
    }
    this.nextSpawnZ = -35.0;
  }

  getAvailableObstacle() {
    for (let obs of this.obstacles) {
      if (!obs.active) return obs;
    }
    // Expand pool if necessary
    const newObs = new Obstacle(this.scene, this.materials);
    this.obstacles.push(newObs);
    return newObs;
  }

  update(playerZ, distanceTraveled) {
    // 1. Recycle obstacles that have passed far behind player
    for (let obs of this.obstacles) {
      if (obs.active && obs.z > playerZ + 15.0) {
        obs.deactivate();
      }
    }

    // 2. Spawn upcoming obstacles ahead of the player up to CONSTANTS.TOTAL_TRACK_AHEAD
    const spawnHorizon = playerZ - 240.0;

    while (this.nextSpawnZ > spawnHorizon) {
      this.spawnPattern(this.nextSpawnZ, distanceTraveled);

      // Distance between obstacle patterns scales smoothly with distance
      // Starts at ~36m apart (plenty of reaction time), gradually down to ~19m
      const spacing = Math.max(19.0, 36.0 - (distanceTraveled / 400.0) * 14.0);
      this.nextSpawnZ -= spacing;
    }
  }

  spawnPattern(zPos, distance) {
    const types = [
      CONSTANTS.OBSTACLES.ROCK,
      CONSTANTS.OBSTACLES.FALLEN_TRUNK,
      CONSTANTS.OBSTACLES.STONE_BARRIER,
      CONSTANTS.OBSTACLES.WOODEN_BARRICADE,
      CONSTANTS.OBSTACLES.LOW_BRANCH,
      CONSTANTS.OBSTACLES.HIGH_ARCH_TRAP,
      CONSTANTS.OBSTACLES.STONE_PILLAR,
      CONSTANTS.OBSTACLES.SPIKE_TRAP,
      CONSTANTS.OBSTACLES.GAP_CHASM
    ];

    // Progression: earlier distances have simpler single obstacles
    const allowDouble = distance > 250 && Math.random() < Math.min(0.65, (distance - 250) / 800);

    if (allowDouble) {
      // Pick 2 lanes out of 3 to block, ensuring at least 1 lane is ALWAYS safe or jumpable/slidable
      const freeLane = Math.floor(Math.random() * 3);
      for (let l = 0; l < 3; l++) {
        if (l !== freeLane) {
          const type = types[Math.floor(Math.random() * types.length)];
          const obs = this.getAvailableObstacle();
          if (obs) obs.setup(type, l, zPos);
        }
      }
    } else {
      // Single obstacle in a random lane
      const lane = Math.floor(Math.random() * 3);
      const type = types[Math.floor(Math.random() * types.length)];
      const obs = this.getAvailableObstacle();
      if (obs) obs.setup(type, lane, zPos);
    }
  }

  checkCollision(player) {
    const bounds = player.getBounds();

    for (let obs of this.obstacles) {
      if (obs.active && obs.checkCollision(bounds)) {
        return obs;
      }
    }
    return null;
  }
}

window.ObstacleManager = ObstacleManager;
