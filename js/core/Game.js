class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager(canvas);
    this.physics = null;
    this.world = null;
    this.player = null;
    this.entityManager = null;
    this.saveManager = new SaveManager();
    this.saveId = null;

    this.state = 'menu';
    this.showInventory = false;
    this.showCrafting = false;
    this.paused = false;
    this.craftingGrid = [
      [{ type: null, count: 0 }, { type: null, count: 0 }],
      [{ type: null, count: 0 }, { type: null, count: 0 }],
    ];
    this.craftingResult = null;

    this.lastTime = 0;
    this.autoSaveTimer = 0;
    this.autoSaveInterval = 30;

    this.dayTime = 0;
    this.dayLength = 120;

    this.ui = null;
    this.touchControls = null;

    this.onStateChange = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.resize(width, height);
  }

  startNewGame(saveInfo) {
    this.saveId = saveInfo.id;
    this.world = new World(saveInfo.seed);
    this.physics = new Physics(this.world);
    this.entityManager = new EntityManager();

    const spawnPos = this.world.getSpawnPosition();
    this.player = new Player(spawnPos.x, spawnPos.y);

    this.state = 'playing';
    this.showInventory = false;
    this.paused = false;

    this.loadSettings();

    if (this.onStateChange) this.onStateChange('playing');
    this.gameLoop();
  }

  loadGame(saveId) {
    const saveData = this.saveManager.loadGame(saveId);
    if (!saveData) return false;

    this.saveId = saveId;
    this.world = World.deserialize(saveData.world);
    this.physics = new Physics(this.world);
    this.player = Player.deserialize(saveData.player);
    this.entityManager = EntityManager.deserialize(saveData.entities || []);

    this.state = 'playing';
    this.showInventory = false;
    this.paused = false;

    this.loadSettings();

    if (this.onStateChange) this.onStateChange('playing');
    this.gameLoop();
    return true;
  }

  loadSettings() {
    if (!this.player) return;
    const autoJump = localStorage.getItem('sandbox2d_setting_autoJump');
    if (autoJump !== null) {
      this.player.autoJumpEnabled = autoJump === 'true';
    }
    this.applySettings();
  }

  applySettings() {
    if (this.touchControls) {
      const joystickEnabled = localStorage.getItem('sandbox2d_setting_joystickEnabled');
      this.touchControls.toggleJoystick(joystickEnabled === 'true');
    }
    const zoom = localStorage.getItem('sandbox2d_setting_mapZoom');
    if (this.renderer) {
      this.renderer.setZoom(zoom ? parseFloat(zoom) : 1);
    }
  }

  saveGame() {
    if (!this.saveId || !this.world) return false;

    const gameData = {
      world: this.world.serialize(),
      player: this.player.serialize(),
      entities: this.entityManager.serialize(),
      time: Date.now(),
    };

    return this.saveManager.saveGame(this.saveId, gameData);
  }

  exitToMenu() {
    this.saveGame();
    this.state = 'menu';
    this.paused = false;
    if (this.onStateChange) this.onStateChange('menu');
  }

  gameLoop(currentTime = 0) {
    if (this.state !== 'playing') return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    if (!this.paused) {
      this.update(dt);
    }
    this.render();

    this.input.endFrame();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt) {
    this.input.update();
    this.input.setCamera(this.renderer.camera, this.renderer.zoom);

    if (this.input.isKeyPressed('escape')) {
      this.paused = !this.paused;
      if (this.ui) this.ui.updatePauseUI();
      return;
    }

    if (this.input.isKeyPressed('e')) {
      this.showInventory = !this.showInventory;
      this.showCrafting = false;
      if (this.ui) this.ui.updateInventoryUI();
      return;
    }

    if (this.paused || this.showInventory) return;

    this.player.update(dt, this.world, this.physics, this.input);
    this.entityManager.update(dt, this.world, this.physics, this.player);
    this.world.updateChunks(this.player.x);

    this.dayTime += dt;
    if (this.dayTime >= this.dayLength) {
      this.dayTime = 0;
    }

    if (this.input.isLeftDown()) {
      this.handleLeftClick();
    } else {
      this.player.stopMining();
    }

    if (this.input.isRightPressed()) {
      this.handleRightClick();
    }

    this.renderer.updateCamera(this.player.x, this.player.y - this.player.height / 2);

    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= this.autoSaveInterval) {
      this.autoSaveTimer = 0;
      this.saveGame();
    }

    if (this.player.dead) {
      this.respawnPlayer();
    }
  }

  handleLeftClick() {
    const mouse = this.input.getMouseWorldPos();
    const tileX = Math.floor(mouse.x / TILE_SIZE);
    const tileY = Math.floor(mouse.y / TILE_SIZE);

    const nearbyMobs = this.entityManager.getEntitiesNear(mouse.x, mouse.y, 30);
    if (nearbyMobs.length > 0) {
      const mob = nearbyMobs[0];
      const dist = Math.sqrt(
        Math.pow(mob.x - this.player.x, 2) +
        Math.pow(mob.y - this.player.y, 2)
      );
      if (dist < 80) {
        this.player.attack(mob);
        this.player.stopMining();
        return;
      }
    }

    this.player.tryMining(this.world, this.input, 1 / 60);
  }

  handleRightClick() {
    const mouse = this.input.getMouseWorldPos();
    const tileX = Math.floor(mouse.x / TILE_SIZE);
    const tileY = Math.floor(mouse.y / TILE_SIZE);

    const blockType = this.world.getBlock(tileX, tileY);
    if (blockType === BlockType.WORKBENCH) {
      this.showCrafting = !this.showCrafting;
      this.showInventory = true;
      if (this.ui) this.ui.updateInventoryUI();
      return;
    }

    const selectedItem = this.player.inventory.getSelectedItem();
    if (selectedItem && selectedItem.type) {
      const info = ItemInfo[selectedItem.type];
      if (info && info.food) {
        this.player.useItem();
        return;
      }
    }

    this.player.placeBlock(this.world, this.input);
  }

  handleTouchTap() {
    const touch = this.input.touch.touches[0];
    const z = this.renderer.zoom || 1;
    const worldX = touch.x / z + this.renderer.camera.x;
    const worldY = touch.y / z + this.renderer.camera.y;
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);

    const blockType = this.world.getBlock(tileX, tileY);
    if (blockType === BlockType.WORKBENCH) {
      this.showCrafting = !this.showCrafting;
      this.showInventory = true;
      if (this.ui) this.ui.updateInventoryUI();
      return;
    }

    const selectedItem = this.player.inventory.getSelectedItem();
    if (selectedItem && selectedItem.type) {
      const info = ItemInfo[selectedItem.type];
      if (info && info.food) {
        this.player.useItem();
        return;
      }
    }

    this.player.placeBlock(this.world, {
      getMouseWorldPos: () => ({ x: worldX, y: worldY }),
    });

    this.input.touch.active = false;
    this.input.touch.longPress = false;
  }

  respawnPlayer() {
    const spawnPos = this.world.getSpawnPosition();
    this.player.x = spawnPos.x;
    this.player.y = spawnPos.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.health = this.player.maxHealth;
    this.player.hunger = this.player.maxHunger;
    this.player.dead = false;
    this.player.invincibleTime = 2;
  }

  render() {
    this.renderer.clear(this.dayTime);
    this.renderer.renderClouds(Date.now() * 0.001);
    this.renderer.renderBackgroundMountains();
    this.renderer.renderWorld(this.world);
    this.renderer.renderEntities(this.entityManager);
    this.renderer.renderPlayer(this.player);
    this.renderer.renderMiningProgress(this.player, this.input);
    this.renderer.renderBlockHighlight(this.input, this.player);
    this.renderer.endRender();
  }

  updateCraftingResult() {
    this.craftingResult = CraftingSystem.checkRecipe(this.craftingGrid, 2);
  }

  takeCraftingResult() {
    if (!this.craftingResult) return;
    const remaining = this.player.inventory.addItem(this.craftingResult.type, this.craftingResult.count);
    if (remaining < this.craftingResult.count) {
      CraftingSystem.craft(this.player.inventory, 2, this.craftingGrid);
      this.updateCraftingResult();
    }
  }
}
