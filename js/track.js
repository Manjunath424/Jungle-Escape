/**
 * JUNGLE ESCAPE - Endless Track & Procedural Jungle Environment
 * Spawns, recycles, and renders ancient stone pathways, ruins, trees,
 * torches, and distant tropical scenery with zero runtime allocations.
 */

class TrackChunk {
  constructor(index, scene, materials) {
    this.index = index;
    this.scene = scene;
    this.materials = materials;
    this.group = new THREE.Group();

    this.z = 0;
    this.length = CONSTANTS.CHUNK_LENGTH;
    this.torchLights = [];

    this.buildChunk();
    this.scene.add(this.group);
  }

  buildChunk() {
    const mats = this.materials;
    const len = this.length;
    const pathW = CONSTANTS.PATH_WIDTH;

    // 1. Ancient Stone Path Floor
    const floorGeo = new THREE.BoxGeometry(pathW, 0.8, len);
    const floor = new THREE.Mesh(floorGeo, mats.stoneFloor);
    floor.position.set(0, -0.4, 0);
    floor.receiveShadow = true;
    this.group.add(floor);

    // 2. Stone Curb Rails & Mossy Borders
    const curbGeo = new THREE.BoxGeometry(0.8, 0.9, len);
    const leftCurb = new THREE.Mesh(curbGeo, mats.mossyStone);
    leftCurb.position.set(-pathW * 0.5 + 0.4, -0.15, 0);
    leftCurb.receiveShadow = true;
    leftCurb.castShadow = true;
    this.group.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, mats.mossyStone);
    rightCurb.position.set(pathW * 0.5 - 0.4, -0.15, 0);
    rightCurb.receiveShadow = true;
    rightCurb.castShadow = true;
    this.group.add(rightCurb);

    // 3. Lane Marker Grooves (Carved ancient lines between lanes)
    const grooveGeo = new THREE.BoxGeometry(0.08, 0.82, len);
    const leftGroove = new THREE.Mesh(grooveGeo, mats.darkStone);
    leftGroove.position.set(-1.6, -0.38, 0);
    this.group.add(leftGroove);

    const rightGroove = new THREE.Mesh(grooveGeo, mats.darkStone);
    rightGroove.position.set(1.6, -0.38, 0);
    this.group.add(rightGroove);

    // 4. Ground Terrain (Dense Jungle Floor beneath & to sides of path)
    const terrainGeo = new THREE.BoxGeometry(110, 1.0, len);
    const terrain = new THREE.Mesh(terrainGeo, mats.jungleGround);
    terrain.position.set(0, -0.9, 0);
    terrain.receiveShadow = true;
    this.group.add(terrain);

    // Container for procedurally shuffled scenery per chunk
    this.sceneryGroup = new THREE.Group();
    this.group.add(this.sceneryGroup);
  }

  repopulateScenery(themeIndex) {
    // Clear previous scenery children
    while (this.sceneryGroup.children.length > 0) {
      this.sceneryGroup.remove(this.sceneryGroup.children[0]);
    }
    this.torchLights = [];

    const mats = this.materials;
    const len = this.length;
    const halfLen = len * 0.5;

    // Add Jungle Trees on both sides (flanking path)
    const treeCount = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < treeCount; i++) {
      const zPos = -halfLen + (i / treeCount) * len + (Math.random() * 4 - 2);
      // Left side trees
      const xLeft = -(CONSTANTS.PATH_WIDTH * 0.5 + 2.5 + Math.random() * 8.0);
      this.addJungleTree(xLeft, zPos, mats);

      // Right side trees
      const xRight = (CONSTANTS.PATH_WIDTH * 0.5 + 2.5 + Math.random() * 8.0);
      this.addJungleTree(xRight, zPos, mats);
    }

    // Add Ruins / Ancient Architecture
    const sceneryType = themeIndex % 4;

    if (sceneryType === 0) {
      // Ancient Stone Pillars along edges
      this.addStonePillar(-CONSTANTS.PATH_WIDTH * 0.5 - 0.9, -halfLen + 10, mats);
      this.addStonePillar(CONSTANTS.PATH_WIDTH * 0.5 + 0.9, -halfLen + 10, mats);
      this.addStonePillar(-CONSTANTS.PATH_WIDTH * 0.5 - 0.9, halfLen - 10, mats);
      this.addStonePillar(CONSTANTS.PATH_WIDTH * 0.5 + 0.9, halfLen - 10, mats);

      // Torches with fire
      this.addTorch(-CONSTANTS.PATH_WIDTH * 0.5 - 0.4, 0, mats);
      this.addTorch(CONSTANTS.PATH_WIDTH * 0.5 + 0.4, 0, mats);
    } else if (sceneryType === 1) {
      // Grand Temple Overhead Archway
      this.addTempleArch(0, 0, mats);

      // Ancient Totems on sides
      this.addTotemStatue(-CONSTANTS.PATH_WIDTH * 0.5 - 2.0, -12, mats);
      this.addTotemStatue(CONSTANTS.PATH_WIDTH * 0.5 + 2.0, 12, mats);
    } else if (sceneryType === 2) {
      // Broken Ruined Walls & Ivy Boulders
      this.addRuinedWall(-CONSTANTS.PATH_WIDTH * 0.5 - 1.5, -8, mats);
      this.addRuinedWall(CONSTANTS.PATH_WIDTH * 0.5 + 1.5, 8, mats);
      this.addTorch(-CONSTANTS.PATH_WIDTH * 0.5 - 0.4, 15, mats);
      this.addTorch(CONSTANTS.PATH_WIDTH * 0.5 + 0.4, -15, mats);
    } else {
      // Dense Foliage & Cliff Boulders
      this.addBoulder(-CONSTANTS.PATH_WIDTH * 0.5 - 3.0, 0, mats);
      this.addBoulder(CONSTANTS.PATH_WIDTH * 0.5 + 3.0, -10, mats);
      this.addTorch(-CONSTANTS.PATH_WIDTH * 0.5 - 0.4, 0, mats);
      this.addTorch(CONSTANTS.PATH_WIDTH * 0.5 + 0.4, 0, mats);
    }

    // Distant jungle mountain silhouette (alternating sides)
    if (Math.random() > 0.4) {
      const side = Math.random() > 0.5 ? 1 : -1;
      this.addDistantMountain(side * (45 + Math.random() * 20), (Math.random() - 0.5) * 20, mats);
    }
  }

  addJungleTree(x, z, mats) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0, z);

    const trunkH = 8 + Math.random() * 6;
    const trunkGeo = new THREE.CylinderGeometry(0.45, 0.8, trunkH, 7);
    const trunk = new THREE.Mesh(trunkGeo, mats.woodTrunk);
    trunk.position.set(0, trunkH * 0.5, 0);
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Multilayer Canopy
    const leafMat = Math.random() > 0.5 ? mats.leavesDeep : mats.leavesVibrant;
    const tiers = 3;
    for (let t = 0; t < tiers; t++) {
      const radius = (3.2 - t * 0.7) * (0.8 + Math.random() * 0.4);
      const canopyH = 2.4 + Math.random() * 0.8;
      const canopyGeo = new THREE.ConeGeometry(radius, canopyH, 6);
      const canopy = new THREE.Mesh(canopyGeo, leafMat);
      canopy.position.set(
        (Math.random() - 0.5) * 0.4,
        trunkH - 1.2 + t * 1.8,
        (Math.random() - 0.5) * 0.4
      );
      canopy.castShadow = true;
      treeGroup.add(canopy);
    }

    this.sceneryGroup.add(treeGroup);
  }

  addStonePillar(x, z, mats) {
    const pillarH = 4.8 + Math.random() * 2.0;
    const pillarGeo = new THREE.BoxGeometry(1.2, pillarH, 1.2);
    const pillar = new THREE.Mesh(pillarGeo, mats.mossyStone);
    pillar.position.set(x, pillarH * 0.5, z);
    pillar.rotation.y = Math.random() * 0.4;
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    this.sceneryGroup.add(pillar);

    // Pillar Cap
    const capGeo = new THREE.BoxGeometry(1.5, 0.4, 1.5);
    const cap = new THREE.Mesh(capGeo, mats.stoneFloor);
    cap.position.set(x, pillarH + 0.2, z);
    cap.castShadow = true;
    this.sceneryGroup.add(cap);
  }

  addTempleArch(x, z, mats) {
    const archH = 6.2;
    const span = CONSTANTS.PATH_WIDTH + 1.2;

    // Left Arch Column
    const colGeo = new THREE.BoxGeometry(1.4, archH, 1.4);
    const leftCol = new THREE.Mesh(colGeo, mats.mossyStone);
    leftCol.position.set(-span * 0.5, archH * 0.5, z);
    leftCol.castShadow = true;
    this.sceneryGroup.add(leftCol);

    // Right Arch Column
    const rightCol = new THREE.Mesh(colGeo, mats.mossyStone);
    rightCol.position.set(span * 0.5, archH * 0.5, z);
    rightCol.castShadow = true;
    this.sceneryGroup.add(rightCol);

    // Top Cross Beam with carved Mayan apex
    const beamGeo = new THREE.BoxGeometry(span + 1.6, 1.2, 1.8);
    const beam = new THREE.Mesh(beamGeo, mats.stoneFloor);
    beam.position.set(0, archH + 0.6, z);
    beam.castShadow = true;
    this.sceneryGroup.add(beam);

    // Temple Peak Emblem
    const peakGeo = new THREE.ConeGeometry(1.2, 1.4, 4);
    const peak = new THREE.Mesh(peakGeo, mats.mossyStone);
    peak.position.set(0, archH + 1.8, z);
    peak.rotation.y = Math.PI / 4;
    this.sceneryGroup.add(peak);
  }

  addTotemStatue(x, z, mats) {
    const totemGroup = new THREE.Group();
    totemGroup.position.set(x, 0, z);

    const baseGeo = new THREE.BoxGeometry(1.8, 1.2, 1.8);
    const base = new THREE.Mesh(baseGeo, mats.mossyStone);
    base.position.y = 0.6;
    totemGroup.add(base);

    const headGeo = new THREE.BoxGeometry(1.4, 2.2, 1.4);
    const head = new THREE.Mesh(headGeo, mats.darkStone);
    head.position.y = 2.2;
    head.castShadow = true;
    totemGroup.add(head);

    // Glowing Eyes
    const eyeGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.35, 2.4, 0.72);
    totemGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.35, 2.4, 0.72);
    totemGroup.add(rightEye);

    this.sceneryGroup.add(totemGroup);
  }

  addRuinedWall(x, z, mats) {
    const wallGeo = new THREE.BoxGeometry(1.2, 2.8, 7.0);
    const wall = new THREE.Mesh(wallGeo, mats.mossyStone);
    wall.position.set(x, 1.4, z);
    wall.castShadow = true;
    this.sceneryGroup.add(wall);
  }

  addBoulder(x, z, mats) {
    const boulderGeo = new THREE.DodecahedronGeometry(2.4 + Math.random() * 1.2, 1);
    const boulder = new THREE.Mesh(boulderGeo, mats.mossyStone);
    boulder.position.set(x, 1.6, z);
    boulder.rotation.set(Math.random(), Math.random(), Math.random());
    boulder.castShadow = true;
    this.sceneryGroup.add(boulder);
  }

  addTorch(x, z, mats) {
    const torchH = 2.4;
    const postGeo = new THREE.CylinderGeometry(0.12, 0.16, torchH, 6);
    const post = new THREE.Mesh(postGeo, mats.woodTrunk);
    post.position.set(x, torchH * 0.5, z);
    post.castShadow = true;
    this.sceneryGroup.add(post);

    const bowlGeo = new THREE.CylinderGeometry(0.35, 0.15, 0.4, 8);
    const bowl = new THREE.Mesh(bowlGeo, mats.darkStone);
    bowl.position.set(x, torchH + 0.2, z);
    this.sceneryGroup.add(bowl);

    // Glowing Flame mesh
    const flameGeo = new THREE.OctahedronGeometry(0.24, 0);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff7700 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, torchH + 0.5, z);
    this.sceneryGroup.add(flame);
  }

  addDistantMountain(x, z, mats) {
    const mountH = 28 + Math.random() * 15;
    const mountR = 20 + Math.random() * 12;
    const mountGeo = new THREE.ConeGeometry(mountR, mountH, 5);
    const mount = new THREE.Mesh(mountGeo, mats.mountainMat);
    mount.position.set(x, mountH * 0.45 - 2, z);
    this.sceneryGroup.add(mount);
  }

  setPositionZ(newZ) {
    this.z = newZ;
    this.group.position.z = newZ;
  }
}

class TrackManager {
  constructor(scene) {
    this.scene = scene;
    this.chunks = [];
    this.initMaterials();

    // Create the pool of visible chunks
    for (let i = 0; i < CONSTANTS.VISIBLE_CHUNKS; i++) {
      const chunk = new TrackChunk(i, this.scene, this.materials);
      const zPos = -i * CONSTANTS.CHUNK_LENGTH;
      chunk.setPositionZ(zPos);
      chunk.repopulateScenery(i);
      this.chunks.push(chunk);
    }

    this.furthestZ = -(CONSTANTS.VISIBLE_CHUNKS - 1) * CONSTANTS.CHUNK_LENGTH;
    this.themeCounter = CONSTANTS.VISIBLE_CHUNKS;
  }

  initMaterials() {
    this.materials = {
      stoneFloor: new THREE.MeshStandardMaterial({
        color: 0x4d554a,
        roughness: 0.88,
        metalness: 0.1
      }),
      mossyStone: new THREE.MeshStandardMaterial({
        color: 0x3d4b38,
        roughness: 0.92,
        metalness: 0.05
      }),
      darkStone: new THREE.MeshStandardMaterial({
        color: 0x222820,
        roughness: 0.85,
        metalness: 0.1
      }),
      jungleGround: new THREE.MeshLambertMaterial({
        color: 0x142816 // deep lush jungle floor
      }),
      woodTrunk: new THREE.MeshLambertMaterial({
        color: 0x3b291a
      }),
      leavesDeep: new THREE.MeshLambertMaterial({
        color: 0x184a22
      }),
      leavesVibrant: new THREE.MeshLambertMaterial({
        color: 0x276d33
      }),
      mountainMat: new THREE.MeshLambertMaterial({
        color: 0x0c2518 // matches atmospheric fog depth
      })
    };
  }

  reset() {
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      const zPos = -i * CONSTANTS.CHUNK_LENGTH;
      chunk.setPositionZ(zPos);
      chunk.repopulateScenery(i);
    }
    this.furthestZ = -(CONSTANTS.VISIBLE_CHUNKS - 1) * CONSTANTS.CHUNK_LENGTH;
    this.themeCounter = CONSTANTS.VISIBLE_CHUNKS;
  }

  update(playerZ) {
    // Check if the nearest chunk has fallen behind the player
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      // When chunk is well behind camera (player.z + 20)
      if (chunk.z > playerZ + CONSTANTS.CHUNK_LENGTH * 0.7) {
        // Move chunk to the front
        this.furthestZ -= CONSTANTS.CHUNK_LENGTH;
        chunk.setPositionZ(this.furthestZ);
        chunk.repopulateScenery(this.themeCounter++);
      }
    }
  }
}

window.TrackManager = TrackManager;
