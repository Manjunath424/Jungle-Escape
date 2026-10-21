/**
 * JUNGLE ESCAPE - Collectible Coins, Power-Ups & Particle Effects System
 * Handles rotating 3D gold coins, 5 unique power-ups, magnetic attraction,
 * and high-performance pooled sparkle particle explosions.
 */

class CollectibleItem {
  constructor(scene, materials) {
    this.scene = scene;
    this.materials = materials;
    this.mesh = new THREE.Group();
    this.active = false;
    this.isCoin = true;
    this.powerupType = null;
    this.lane = 1;
    this.z = 0;
    this.baseY = 0.8;

    this.contentGroup = new THREE.Group();
    this.mesh.add(this.contentGroup);
    this.scene.add(this.mesh);
    this.mesh.visible = false;
  }

  setupCoin(lane, zPos, yPos = 0.8) {
    this.isCoin = true;
    this.powerupType = null;
    this.lane = lane;
    this.z = zPos;
    this.baseY = yPos;
    this.active = true;
    this.mesh.visible = true;

    // Clear previous children
    while (this.contentGroup.children.length > 0) {
      this.contentGroup.remove(this.contentGroup.children[0]);
    }

    const xPos = CONSTANTS.LANES[lane];
    this.mesh.position.set(xPos, yPos, zPos);

    // Build Gold Coin 3D Model
    const coinGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.12, 16);
    const coin = new THREE.Mesh(coinGeo, this.materials.coinMat);
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;
    this.contentGroup.add(coin);

    // Inner embossed star emblem
    const starGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.14, 5);
    const star = new THREE.Mesh(starGeo, this.materials.coinCenterMat);
    star.rotation.x = Math.PI / 2;
    this.contentGroup.add(star);
  }

  setupPowerup(powerupConfig, lane, zPos) {
    this.isCoin = false;
    this.powerupType = powerupConfig.type;
    this.lane = lane;
    this.z = zPos;
    this.baseY = 1.2;
    this.active = true;
    this.mesh.visible = true;

    while (this.contentGroup.children.length > 0) {
      this.contentGroup.remove(this.contentGroup.children[0]);
    }

    const xPos = CONSTANTS.LANES[lane];
    this.mesh.position.set(xPos, this.baseY, zPos);

    // Outer rotating glowing crystal ring
    const ringGeo = new THREE.TorusGeometry(0.75, 0.08, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: powerupConfig.color, wireframe: true });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    this.contentGroup.add(ring);
    this.ringMesh = ring;

    // Powerup Core Shape
    let coreGeo;
    if (powerupConfig.type === 'shield') {
      coreGeo = new THREE.IcosahedronGeometry(0.45, 0);
    } else if (powerupConfig.type === 'magnet') {
      coreGeo = new THREE.TorusGeometry(0.4, 0.12, 6, 12, Math.PI);
    } else if (powerupConfig.type === 'speed_boost') {
      coreGeo = new THREE.ConeGeometry(0.4, 0.8, 4);
    } else {
      coreGeo = new THREE.OctahedronGeometry(0.45, 0);
    }

    const coreMat = new THREE.MeshStandardMaterial({
      color: powerupConfig.color,
      emissive: powerupConfig.color,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    this.contentGroup.add(core);
  }

  deactivate() {
    this.active = false;
    this.mesh.visible = false;
  }

  update(dt, player, time) {
    if (!this.active) return;

    // Continuous rotation & gentle floating hover
    this.contentGroup.rotation.y += dt * 3.2;
    this.mesh.position.y = this.baseY + Math.sin(time * 4.0 + this.z * 0.1) * 0.12;

    if (this.ringMesh) {
      this.ringMesh.rotation.x += dt * 2.0;
      this.ringMesh.rotation.z += dt * 1.5;
    }

    // Magnet power-up attraction effect
    if (this.isCoin && player.hasMagnet) {
      const pPos = player.position;
      const dx = pPos.x - this.mesh.position.x;
      const dy = (pPos.y + 0.9) - this.mesh.position.y;
      const dz = pPos.z - this.mesh.position.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      const magnetRadius = CONSTANTS.POWERUPS.MAGNET.radius;
      if (distSq < magnetRadius * magnetRadius) {
        const pullSpeed = 28.0;
        const dist = Math.sqrt(distSq);
        if (dist > 0.1) {
          this.mesh.position.x += (dx / dist) * pullSpeed * dt;
          this.mesh.position.y += (dy / dist) * pullSpeed * dt;
          this.mesh.position.z += (dz / dist) * pullSpeed * dt;
          this.z = this.mesh.position.z;
        }
      }
    }
  }

  checkPickup(player) {
    if (!this.active) return false;

    const pPos = player.position;
    const dx = pPos.x - this.mesh.position.x;
    const dy = (pPos.y + 0.9) - this.mesh.position.y;
    const dz = pPos.z - this.mesh.position.z;

    // Collection radius
    const pickupRadius = this.isCoin ? 1.4 : 1.6;
    if (dx * dx + dy * dy + dz * dz < pickupRadius * pickupRadius) {
      return true;
    }
    return false;
  }
}

// Particle System for collection bursts & effects
class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.maxParticles = 60;

    const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd700 });

    for (let i = 0; i < this.maxParticles; i++) {
      const p = new THREE.Mesh(geo, mat.clone());
      p.visible = false;
      this.scene.add(p);
      this.particles.push({
        mesh: p,
        active: false,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1
      });
    }
  }

  burst(x, y, z, colorHex = 0xffd700, count = 12) {
    let spawned = 0;
    for (let p of this.particles) {
      if (!p.active) {
        p.active = true;
        p.mesh.visible = true;
        p.mesh.position.set(x, y, z);
        p.mesh.material.color.setHex(colorHex);

        const speed = 3.5 + Math.random() * 4.5;
        const angle = Math.random() * Math.PI * 2;
        const upAngle = Math.random() * Math.PI - Math.PI * 0.2;

        p.velocity.set(
          Math.cos(angle) * Math.cos(upAngle) * speed,
          Math.sin(upAngle) * speed + 2.0,
          Math.sin(angle) * Math.cos(upAngle) * speed
        );

        p.life = 0;
        p.maxLife = 0.45 + Math.random() * 0.3;

        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  update(dt) {
    for (let p of this.particles) {
      if (p.active) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          p.mesh.visible = false;
        } else {
          p.velocity.y -= 14.0 * dt; // Gravity
          p.mesh.position.x += p.velocity.x * dt;
          p.mesh.position.y += p.velocity.y * dt;
          p.mesh.position.z += p.velocity.z * dt;

          // Scale down as particle expires
          const scale = 1.0 - (p.life / p.maxLife);
          p.mesh.scale.set(scale, scale, scale);
        }
      }
    }
  }

  reset() {
    for (let p of this.particles) {
      p.active = false;
      p.mesh.visible = false;
    }
  }
}

class CollectibleManager {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.poolSize = 80;
    this.nextSpawnZ = -15.0;

    this.initMaterials();
    this.particleSystem = new ParticleSystem(scene);

    for (let i = 0; i < this.poolSize; i++) {
      this.items.push(new CollectibleItem(this.scene, this.materials));
    }
  }

  initMaterials() {
    this.materials = {
      coinMat: new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.88,
        roughness: 0.18,
        emissive: 0xaa7700,
        emissiveIntensity: 0.25
      }),
      coinCenterMat: new THREE.MeshStandardMaterial({
        color: 0xffea00,
        metalness: 0.95,
        roughness: 0.1
      })
    };
  }

  reset() {
    for (let item of this.items) {
      item.deactivate();
    }
    this.particleSystem.reset();
    this.nextSpawnZ = -15.0;
  }

  getAvailableItem() {
    for (let item of this.items) {
      if (!item.active) return item;
    }
    const newItem = new CollectibleItem(this.scene, this.materials);
    this.items.push(newItem);
    return newItem;
  }

  update(dt, player, distanceTraveled, time) {
    this.particleSystem.update(dt);

    // 1. Recycle items behind player
    for (let item of this.items) {
      if (item.active) {
        item.update(dt, player, time);

        if (item.z > player.position.z + 10.0) {
          item.deactivate();
        }
      }
    }

    // 2. Spawn upcoming items
    const spawnHorizon = player.position.z - 220.0;
    while (this.nextSpawnZ > spawnHorizon) {
      this.spawnPattern(this.nextSpawnZ, distanceTraveled);
      this.nextSpawnZ -= 16.0 + Math.random() * 8.0;
    }
  }

  spawnPattern(zPos, distance) {
    // 10% chance to spawn a Power-Up instead of coins
    if (Math.random() < 0.12) {
      const pKeys = Object.keys(CONSTANTS.POWERUPS);
      const chosenKey = pKeys[Math.floor(Math.random() * pKeys.length)];
      const powerupConfig = CONSTANTS.POWERUPS[chosenKey];
      const lane = Math.floor(Math.random() * 3);

      const item = this.getAvailableItem();
      if (item) {
        item.setupPowerup(powerupConfig, lane, zPos);
      }
      return;
    }

    // Spawn Coin Group (Straight line, arc, or zigzag)
    const patternType = Math.floor(Math.random() * 3);
    const lane = Math.floor(Math.random() * 3);
    const count = 4 + Math.floor(Math.random() * 3);

    if (patternType === 0) {
      // Straight line
      for (let i = 0; i < count; i++) {
        const item = this.getAvailableItem();
        if (item) item.setupCoin(lane, zPos - i * 2.2, 0.8);
      }
    } else if (patternType === 1) {
      // Arc / Jump pattern (coins rise up in a parabolic curve)
      for (let i = 0; i < 5; i++) {
        const progress = i / 4.0;
        const height = 0.8 + Math.sin(progress * Math.PI) * 1.8;
        const item = this.getAvailableItem();
        if (item) item.setupCoin(lane, zPos - i * 2.2, height);
      }
    } else {
      // Zigzag across lanes
      let currentLane = lane;
      for (let i = 0; i < count; i++) {
        const item = this.getAvailableItem();
        if (item) item.setupCoin(currentLane, zPos - i * 2.6, 0.8);
        currentLane = (currentLane + 1) % 3;
      }
    }
  }

  checkPickups(player) {
    const results = {
      coinsCollected: 0,
      powerupsCollected: []
    };

    for (let item of this.items) {
      if (item.active && item.checkPickup(player)) {
        if (item.isCoin) {
          results.coinsCollected++;
          this.particleSystem.burst(
            item.mesh.position.x,
            item.mesh.position.y,
            item.mesh.position.z,
            0xffd700,
            8
          );
          window.soundEngine.playCoin();
        } else {
          results.powerupsCollected.push(item.powerupType);
          const pConfig = Object.values(CONSTANTS.POWERUPS).find(p => p.type === item.powerupType);
          const colorHex = pConfig ? pConfig.color : 0x00d4ff;
          this.particleSystem.burst(
            item.mesh.position.x,
            item.mesh.position.y,
            item.mesh.position.z,
            colorHex,
            18
          );
        }
        item.deactivate();
      }
    }

    return results;
  }
}

window.CollectibleManager = CollectibleManager;
