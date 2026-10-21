/**
 * JUNGLE ESCAPE - UI, Menus, Input & HUD Controller
 * Manages all DOM screens, modals, touch/swipe handling, local persistence,
 * audio settings, and power-up indicator badges.
 */

class UIManager {
  constructor(game) {
    this.game = game;

    // Cache DOM Elements
    this.loadingScreen = document.getElementById('loading-screen');
    this.progressBar = document.getElementById('progress-bar');
    this.loadingTip = document.getElementById('loading-tip');

    this.mainMenu = document.getElementById('main-menu');
    this.menuBestScore = document.getElementById('menu-best-score');
    this.menuTotalCoins = document.getElementById('menu-total-coins');

    this.hud = document.getElementById('game-hud');
    this.hudScore = document.getElementById('hud-score');
    this.hudDist = document.getElementById('hud-dist');
    this.hudCoins = document.getElementById('hud-coins');
    this.hudPowerups = document.getElementById('hud-powerups');
    this.mobileControls = document.getElementById('mobile-controls');

    this.pauseModal = document.getElementById('pause-modal');
    this.gameOverModal = document.getElementById('game-over-modal');
    this.settingsModal = document.getElementById('settings-modal');
    this.howToPlayModal = document.getElementById('how-to-play-modal');
    this.creditsModal = document.getElementById('credits-modal');

    // Game Over stats elements
    this.goScore = document.getElementById('go-score');
    this.goDist = document.getElementById('go-dist');
    this.goCoins = document.getElementById('go-coins');
    this.goBest = document.getElementById('go-best');
    this.goNewRecord = document.getElementById('go-new-record');

    // Settings input elements
    this.sliderMaster = document.getElementById('setting-master-vol');
    this.sliderMusic = document.getElementById('setting-music-vol');
    this.sliderSfx = document.getElementById('setting-sfx-vol');
    this.selectGraphics = document.getElementById('setting-graphics');
    this.selectControls = document.getElementById('setting-controls');

    this.soundToggleBtn = document.getElementById('btn-sound-toggle');

    // Swipe tracking state
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;

    this.initStorage();
    this.bindEvents();
    this.bindTouchGestures();
    this.loadSavedSettings();
  }

  // --- LOCAL PERSISTENCE ---
  initStorage() {
    try {
      if (!localStorage.getItem(CONSTANTS.STORAGE_KEYS.BEST_SCORE)) {
        localStorage.setItem(CONSTANTS.STORAGE_KEYS.BEST_SCORE, '0');
      }
      if (!localStorage.getItem(CONSTANTS.STORAGE_KEYS.LONGEST_DIST)) {
        localStorage.setItem(CONSTANTS.STORAGE_KEYS.LONGEST_DIST, '0');
      }
      if (!localStorage.getItem(CONSTANTS.STORAGE_KEYS.TOTAL_COINS)) {
        localStorage.setItem(CONSTANTS.STORAGE_KEYS.TOTAL_COINS, '0');
      }
    } catch (e) {
      console.warn('LocalStorage not accessible:', e);
    }
  }

  getBestScore() {
    try {
      return parseInt(localStorage.getItem(CONSTANTS.STORAGE_KEYS.BEST_SCORE) || '0', 10);
    } catch (e) { return 0; }
  }

  setBestScore(val) {
    try {
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.BEST_SCORE, val.toString());
    } catch (e) {}
  }

  getLongestDist() {
    try {
      return parseInt(localStorage.getItem(CONSTANTS.STORAGE_KEYS.LONGEST_DIST) || '0', 10);
    } catch (e) { return 0; }
  }

  setLongestDist(val) {
    try {
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.LONGEST_DIST, val.toString());
    } catch (e) {}
  }

  getTotalCoins() {
    try {
      return parseInt(localStorage.getItem(CONSTANTS.STORAGE_KEYS.TOTAL_COINS) || '0', 10);
    } catch (e) { return 0; }
  }

  addTotalCoins(val) {
    try {
      const current = this.getTotalCoins();
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.TOTAL_COINS, (current + val).toString());
    } catch (e) {}
  }

  resetAllData() {
    try {
      localStorage.removeItem(CONSTANTS.STORAGE_KEYS.BEST_SCORE);
      localStorage.removeItem(CONSTANTS.STORAGE_KEYS.LONGEST_DIST);
      localStorage.removeItem(CONSTANTS.STORAGE_KEYS.TOTAL_COINS);
      this.initStorage();
      this.updateMenuBanners();
      alert('All high scores and records have been reset.');
    } catch (e) {}
  }

  // --- SETTINGS ---
  loadSavedSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(CONSTANTS.STORAGE_KEYS.SETTINGS) || '{}');
      if (saved.masterVol !== undefined) {
        this.sliderMaster.value = saved.masterVol;
        window.soundEngine.setMasterVolume(saved.masterVol / 100);
      }
      if (saved.musicVol !== undefined) {
        this.sliderMusic.value = saved.musicVol;
        window.soundEngine.setMusicVolume(saved.musicVol / 100);
      }
      if (saved.sfxVol !== undefined) {
        this.sliderSfx.value = saved.sfxVol;
        window.soundEngine.setSfxVolume(saved.sfxVol / 100);
      }
      if (saved.graphics) {
        this.selectGraphics.value = saved.graphics;
        this.applyGraphicsQuality(saved.graphics);
      }
      if (saved.controls) {
        this.selectControls.value = saved.controls;
        this.updateMobileControlsVisibility();
      }
    } catch (e) {}
  }

  saveCurrentSettings() {
    try {
      const settings = {
        masterVol: parseInt(this.sliderMaster.value, 10),
        musicVol: parseInt(this.sliderMusic.value, 10),
        sfxVol: parseInt(this.sliderSfx.value, 10),
        graphics: this.selectGraphics.value,
        controls: this.selectControls.value
      };
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {}
  }

  applyGraphicsQuality(level) {
    if (this.game && this.game.renderer) {
      if (level === 'low') {
        this.game.renderer.shadowMap.enabled = false;
        this.game.renderer.setPixelRatio(1.0);
      } else if (level === 'medium') {
        this.game.renderer.shadowMap.enabled = false;
        this.game.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
      } else {
        this.game.renderer.shadowMap.enabled = true;
        this.game.renderer.setPixelRatio(Math.min(2.0, window.devicePixelRatio));
      }
    }
  }

  updateMobileControlsVisibility() {
    const pref = this.selectControls.value;
    const isMobileDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    if (pref === 'always') {
      this.mobileControls.classList.remove('hidden');
    } else if (pref === 'off') {
      this.mobileControls.classList.add('hidden');
    } else {
      // Auto: show if touch device
      if (isMobileDevice) {
        this.mobileControls.classList.remove('hidden');
      } else {
        this.mobileControls.classList.add('hidden');
      }
    }
  }

  // --- BUTTON EVENT BINDINGS ---
  bindEvents() {
    // Menu Buttons
    document.getElementById('btn-start-game').addEventListener('click', () => {
      window.soundEngine.unlock();
      window.soundEngine.playClick();
      this.game.startGame();
    });

    document.getElementById('btn-how-to-play').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.howToPlayModal.classList.remove('hidden');
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.settingsModal.classList.remove('hidden');
    });

    document.getElementById('btn-credits').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.creditsModal.classList.remove('hidden');
    });

    // Close Modal buttons
    document.getElementById('btn-close-how-to-play').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.howToPlayModal.classList.add('hidden');
    });

    document.getElementById('btn-close-settings').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.settingsModal.classList.add('hidden');
    });

    document.getElementById('btn-close-credits').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.creditsModal.classList.add('hidden');
    });

    // Reset Data button
    document.getElementById('btn-reset-data').addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all high scores and collected coins?')) {
        this.resetAllData();
      }
    });

    // Sound toggle
    this.soundToggleBtn.addEventListener('click', () => {
      window.soundEngine.unlock();
      const muted = window.soundEngine.toggleMute();
      this.soundToggleBtn.textContent = muted ? '🔇' : '🔊';
    });

    // Pause & HUD Buttons
    document.getElementById('btn-pause').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.game.pauseGame();
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.game.resumeGame();
    });

    document.getElementById('btn-restart-pause').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.pauseModal.classList.add('hidden');
      this.game.startGame();
    });

    document.getElementById('btn-menu-pause').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.pauseModal.classList.add('hidden');
      this.game.returnToMenu();
    });

    // Game Over Buttons
    document.getElementById('btn-restart-gameover').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.gameOverModal.classList.add('hidden');
      this.game.startGame();
    });

    document.getElementById('btn-menu-gameover').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.gameOverModal.classList.add('hidden');
      this.game.returnToMenu();
    });

    // Settings Slider listeners
    this.sliderMaster.addEventListener('input', (e) => {
      window.soundEngine.setMasterVolume(e.target.value / 100);
      this.saveCurrentSettings();
    });

    this.sliderMusic.addEventListener('input', (e) => {
      window.soundEngine.setMusicVolume(e.target.value / 100);
      this.saveCurrentSettings();
    });

    this.sliderSfx.addEventListener('input', (e) => {
      window.soundEngine.setSfxVolume(e.target.value / 100);
      this.saveCurrentSettings();
    });

    this.selectGraphics.addEventListener('change', (e) => {
      this.applyGraphicsQuality(e.target.value);
      this.saveCurrentSettings();
    });

    this.selectControls.addEventListener('change', () => {
      this.updateMobileControlsVisibility();
      this.saveCurrentSettings();
    });

    // Desktop Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (this.game.state === 'PLAYING') {
        switch (e.code) {
          case 'ArrowLeft':
          case 'KeyA':
            e.preventDefault();
            this.game.player.moveLeft();
            break;
          case 'ArrowRight':
          case 'KeyD':
            e.preventDefault();
            this.game.player.moveRight();
            break;
          case 'ArrowUp':
          case 'KeyW':
          case 'Space':
            e.preventDefault();
            this.game.player.jump();
            break;
          case 'ArrowDown':
          case 'KeyS':
            e.preventDefault();
            this.game.player.slide();
            break;
          case 'Escape':
          case 'KeyP':
            e.preventDefault();
            this.game.pauseGame();
            break;
        }
      } else if (this.game.state === 'PAUSED' && (e.code === 'Escape' || e.code === 'KeyP')) {
        this.game.resumeGame();
      }
    });

    // Mobile D-Pad on-screen buttons
    document.getElementById('m-btn-left').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.game.state === 'PLAYING') this.game.player.moveLeft();
    }, { passive: false });

    document.getElementById('m-btn-right').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.game.state === 'PLAYING') this.game.player.moveRight();
    }, { passive: false });

    document.getElementById('m-btn-jump').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.game.state === 'PLAYING') this.game.player.jump();
    }, { passive: false });

    document.getElementById('m-btn-slide').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.game.state === 'PLAYING') this.game.player.slide();
    }, { passive: false });
  }

  // --- TOUCH SWIPE GESTURES ---
  bindTouchGestures() {
    const canvas = document.getElementById('three-canvas');

    canvas.addEventListener('touchstart', (e) => {
      window.soundEngine.unlock();
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.touchStartTime = performance.now();
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      // Prevent browser native scrolling or pull-to-refresh
      if (e.cancelable) e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      if (this.game.state !== 'PLAYING') return;
      if (e.changedTouches.length === 0) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - this.touchStartX;
      const dy = touchEndY - this.touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      const minDistance = 35; // Pixels
      const maxTime = 400; // ms
      const timeElapsed = performance.now() - this.touchStartTime;

      if (timeElapsed < maxTime && (absDx > minDistance || absDy > minDistance)) {
        if (absDx > absDy) {
          // Horizontal swipe
          if (dx > 0) {
            this.game.player.moveRight();
          } else {
            this.game.player.moveLeft();
          }
        } else {
          // Vertical swipe
          if (dy < 0) {
            this.game.player.jump();
          } else {
            this.game.player.slide();
          }
        }
      }
    }, { passive: true });
  }

  // --- SCREEN VISIBILITY & STATE HELPERS ---
  updateMenuBanners() {
    this.menuBestScore.textContent = this.getBestScore().toLocaleString();
    this.menuTotalCoins.textContent = this.getTotalCoins().toLocaleString();
  }

  showLoadingProgress(pct, tip) {
    this.progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    if (tip) this.loadingTip.textContent = tip;
  }

  hideLoadingScreen() {
    this.loadingScreen.style.opacity = '0';
    setTimeout(() => {
      this.loadingScreen.classList.add('hidden');
    }, 400);
  }

  showMainMenu() {
    this.updateMenuBanners();
    this.mainMenu.classList.remove('hidden');
    this.hud.classList.add('hidden');
    this.pauseModal.classList.add('hidden');
    this.gameOverModal.classList.add('hidden');
  }

  showGameplay() {
    this.mainMenu.classList.add('hidden');
    this.pauseModal.classList.add('hidden');
    this.gameOverModal.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.updateMobileControlsVisibility();
  }

  showPause() {
    this.pauseModal.classList.remove('hidden');
  }

  hidePause() {
    this.pauseModal.classList.add('hidden');
  }

  showGameOver(stats) {
    this.hud.classList.add('hidden');

    this.goScore.textContent = stats.score.toLocaleString();
    this.goDist.textContent = `${Math.floor(stats.distance).toLocaleString()} m`;
    this.goCoins.textContent = stats.coins.toLocaleString();

    // Check if new best score
    const prevBest = this.getBestScore();
    if (stats.score > prevBest) {
      this.setBestScore(stats.score);
      this.goBest.textContent = stats.score.toLocaleString();
      this.goNewRecord.classList.remove('hidden');
    } else {
      this.goBest.textContent = prevBest.toLocaleString();
      this.goNewRecord.classList.add('hidden');
    }

    // Update longest distance & coins
    const prevLongest = this.getLongestDist();
    if (stats.distance > prevLongest) {
      this.setLongestDist(Math.floor(stats.distance));
    }
    this.addTotalCoins(stats.coins);

    this.gameOverModal.classList.remove('hidden');
  }

  // --- HUD UPDATE LOOP ---
  updateHud(score, distance, coins, player) {
    this.hudScore.textContent = Math.floor(score).toLocaleString();
    this.hudDist.textContent = `${Math.floor(distance).toLocaleString()} m`;
    this.hudCoins.textContent = coins.toLocaleString();

    // Render Active Powerup Badges
    this.renderPowerupBadges(player);
  }

  renderPowerupBadges(player) {
    let html = '';

    if (player.hasShield) {
      const pct = (player.shieldTimer / CONSTANTS.POWERUPS.SHIELD.duration) * 100;
      html += `<div class="powerup-badge" style="border-color:#00d4ff;">
        <span>🛡️</span>
        <div class="powerup-bar"><div class="powerup-bar-fill" style="width:${pct}%; background:#00d4ff;"></div></div>
      </div>`;
    }
    if (player.hasMagnet) {
      const pct = (player.magnetTimer / CONSTANTS.POWERUPS.MAGNET.duration) * 100;
      html += `<div class="powerup-badge" style="border-color:#ff3b30;">
        <span>🧲</span>
        <div class="powerup-bar"><div class="powerup-bar-fill" style="width:${pct}%; background:#ff3b30;"></div></div>
      </div>`;
    }
    if (player.hasMultiplier) {
      const pct = (player.multiplierTimer / CONSTANTS.POWERUPS.MULTIPLIER.duration) * 100;
      html += `<div class="powerup-badge" style="border-color:#ffd700;">
        <span>✨ 2X</span>
        <div class="powerup-bar"><div class="powerup-bar-fill" style="width:${pct}%; background:#ffd700;"></div></div>
      </div>`;
    }
    if (player.hasScoreBoost) {
      const pct = (player.scoreBoostTimer / CONSTANTS.POWERUPS.SCORE_BOOST.duration) * 100;
      html += `<div class="powerup-badge" style="border-color:#34c759;">
        <span>⚡ +PTS</span>
        <div class="powerup-bar"><div class="powerup-bar-fill" style="width:${pct}%; background:#34c759;"></div></div>
      </div>`;
    }
    if (player.hasSpeedBoost) {
      const pct = (player.speedBoostTimer / CONSTANTS.POWERUPS.SPEED_BOOST.duration) * 100;
      html += `<div class="powerup-badge" style="border-color:#ff9500;">
        <span>🔥 RUSH</span>
        <div class="powerup-bar"><div class="powerup-bar-fill" style="width:${pct}%; background:#ff9500;"></div></div>
      </div>`;
    }

    this.hudPowerups.innerHTML = html;
  }
}

window.UIManager = UIManager;
