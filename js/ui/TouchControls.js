class TouchControls {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.isMobile = this.checkMobile();
    this.cursorX = 0;
    this.cursorY = 0;
    this.cursorActive = false;
    this.cursorInitialized = false;
    this.cursorJoystickActive = false;
    this.cursorJoystickId = null;
    this.longPressTimer = null;
    this.touchStartPos = null;
    this.miningActive = false;
    this.miningStartTime = 0;
    this.hudElement = document.getElementById('hud');

    if (this.isMobile) {
      this.createControls();
      this.bindEvents();
    }
  }

  checkMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  createControls() {
    const container = document.getElementById('touchControls');
    if (!container) return;

    container.innerHTML = `
      <div class="joystick-area" id="joystickArea">
        <div class="joystick-base" id="joystickBase">
          <div class="joystick-stick" id="joystickStick"></div>
        </div>
      </div>
      <div class="cursor-joystick-area" id="cursorJoystickArea">
        <div class="cursor-joystick-base" id="cursorJoystickBase">
          <div class="cursor-joystick-stick" id="cursorJoystickStick"></div>
        </div>
      </div>
      <div class="action-buttons">
        <button class="action-btn jump-btn" id="jumpBtn">跳</button>
        <button class="action-btn inv-btn" id="invBtn">背包</button>
      </div>
      <div class="aux-buttons">
        <button class="action-btn break-btn" id="breakBtn">破坏</button>
        <button class="action-btn place-btn" id="placeBtn">放置</button>
      </div>
    `;

    container.style.display = 'block';
  }

  bindEvents() {
    const joystickArea = document.getElementById('joystickArea');
    const joystickStick = document.getElementById('joystickStick');
    const joystickBase = document.getElementById('joystickBase');

    let joystickActive = false;
    let joystickId = null;
    const baseRadius = 50;
    const stickRadius = 25;

    const startJoystick = (e) => {
      const touch = e.touches ? e.touches[0] : e;
      const rect = joystickArea.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      joystickActive = true;
      joystickId = e.touches ? touch.identifier : 'mouse';
      joystickBase.style.left = x + 'px';
      joystickBase.style.top = y + 'px';
      joystickStick.style.left = '50%';
      joystickStick.style.top = '50%';
    };

    const moveJoystick = (e) => {
      if (!joystickActive) return;
      let touch;
      if (e.touches) {
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === joystickId) {
            touch = e.touches[i];
            break;
          }
        }
      } else {
        touch = e;
      }
      if (!touch) return;

      const rect = joystickArea.getBoundingClientRect();
      const baseRect = joystickBase.getBoundingClientRect();
      const baseX = baseRect.left - rect.left + baseRect.width / 2;
      const baseY = baseRect.top - rect.top + baseRect.height / 2;

      let dx = touch.clientX - rect.left - baseX;
      let dy = touch.clientY - rect.top - baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > baseRadius - stickRadius) {
        const ratio = (baseRadius - stickRadius) / dist;
        dx *= ratio;
        dy *= ratio;
      }

      joystickStick.style.left = (50 + dx / baseRect.width * 100) + '%';
      joystickStick.style.top = (50 + dy / baseRect.height * 100) + '%';

      const moveX = dx / (baseRadius - stickRadius);
      this.game.input.touch.moveX = moveX;
    };

    const endJoystick = (e) => {
      if (e.changedTouches) {
        let found = false;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === joystickId) {
            found = true;
            break;
          }
        }
        if (!found && e.touches && e.touches.length > 0) return;
      }
      joystickActive = false;
      joystickId = null;
      joystickStick.style.left = '50%';
      joystickStick.style.top = '50%';
      this.game.input.touch.moveX = 0;
    };

    joystickArea.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startJoystick(e);
    });
    joystickArea.addEventListener('touchmove', (e) => {
      e.preventDefault();
      moveJoystick(e);
    });
    joystickArea.addEventListener('touchend', (e) => {
      e.preventDefault();
      endJoystick(e);
    });
    joystickArea.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      endJoystick(e);
    });

    const cursorJoystickArea = document.getElementById('cursorJoystickArea');
    const cursorJoystickBase = document.getElementById('cursorJoystickBase');
    const cursorJoystickStick = document.getElementById('cursorJoystickStick');
    const cursorRadius = 45;
    const cursorStickRadius = 20;

    const startCursorJoystick = (e) => {
      const touch = e.touches ? e.touches[0] : e;
      const rect = cursorJoystickArea.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.cursorJoystickActive = true;
      this.cursorJoystickId = e.touches ? touch.identifier : 'mouse';
      cursorJoystickBase.style.left = x + 'px';
      cursorJoystickBase.style.top = y + 'px';
      cursorJoystickStick.style.left = '50%';
      cursorJoystickStick.style.top = '50%';

      const canvasRect = this.game.canvas.getBoundingClientRect();
      this.cursorX = touch.clientX - canvasRect.left;
      this.cursorY = touch.clientY - canvasRect.top;

      this.touchStartPos = { x: touch.clientX, y: touch.clientY, time: Date.now(), startX: this.cursorX, startY: this.cursorY };
      this.game.input.touch.cursorActive = true;
      this.game.input.touch.cursorX = this.cursorX;
      this.game.input.touch.cursorY = this.cursorY;

      if (!this.cursorInitialized) {
        this.cursorInitialized = true;
      }

      this.miningActive = false;
      this.miningStartTime = 0;

      this.longPressTimer = setTimeout(() => {
        if (this.cursorJoystickActive && this.touchStartPos) {
          const now = Date.now();
          const dx = Math.abs(this.touchStartPos.startX - this.cursorX);
          const dy = Math.abs(this.touchStartPos.startY - this.cursorY);
          if (now - this.touchStartPos.time > 300 && dx < 20 && dy < 20) {
            this.miningActive = true;
            this.miningStartTime = Date.now();
            this.game.input.mouse.leftDown = true;
          }
        }
      }, 300);
    };

    const moveCursorJoystick = (e) => {
      if (!this.cursorJoystickActive) return;
      let touch;
      if (e.touches) {
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === this.cursorJoystickId) {
            touch = e.touches[i];
            break;
          }
        }
      } else {
        touch = e;
      }
      if (!touch) return;

      const rect = cursorJoystickArea.getBoundingClientRect();
      const baseRect = cursorJoystickBase.getBoundingClientRect();
      const baseX = baseRect.left - rect.left + baseRect.width / 2;
      const baseY = baseRect.top - rect.top + baseRect.height / 2;

      let dx = touch.clientX - rect.left - baseX;
      let dy = touch.clientY - rect.top - baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > cursorRadius - cursorStickRadius) {
        const ratio = (cursorRadius - cursorStickRadius) / dist;
        dx *= ratio;
        dy *= ratio;
      }

      cursorJoystickStick.style.left = (50 + dx / baseRect.width * 100) + '%';
      cursorJoystickStick.style.top = (50 + dy / baseRect.height * 100) + '%';

      const moveX = dx / (cursorRadius - cursorStickRadius);
      const moveY = dy / (cursorRadius - cursorStickRadius);

      if (!this.miningActive) {
        this.cursorX += moveX * 12;
        this.cursorY += moveY * 12;

        const canvasRect = this.game.canvas.getBoundingClientRect();
        this.cursorX = Math.max(0, Math.min(this.cursorX, canvasRect.width));
        this.cursorY = Math.max(0, Math.min(this.cursorY, canvasRect.height));

        this.game.input.touch.cursorX = this.cursorX;
        this.game.input.touch.cursorY = this.cursorY;
      }
    };

    const endCursorJoystick = (e) => {
      if (e.changedTouches) {
        let found = false;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.cursorJoystickId) {
            found = true;
            break;
          }
        }
        if (!found && e.touches && e.touches.length > 0) return;
      }

      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }

      const wasLongPress = this.miningActive;

      if (!wasLongPress && this.touchStartPos) {
        const now = Date.now();
        const dx = Math.abs(this.touchStartPos.startX - this.cursorX);
        const dy = Math.abs(this.touchStartPos.startY - this.cursorY);
        if (now - this.touchStartPos.time < 250 && dx < 25 && dy < 25) {
          this.handleCursorTap();
        } else if (now - this.touchStartPos.time >= 250 && now - this.touchStartPos.time < 500 && dx < 40 && dy < 40) {
          this.handleCursorInteract();
        }
      }

      this.game.input.mouse.leftDown = false;
      this.miningActive = false;
      this.cursorJoystickActive = false;
      this.cursorJoystickId = null;
      this.touchStartPos = null;
      cursorJoystickStick.style.left = '50%';
      cursorJoystickStick.style.top = '50%';
      this.game.input.touch.cursorActive = false;
    };

    cursorJoystickArea.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startCursorJoystick(e);
    });
    cursorJoystickArea.addEventListener('touchmove', (e) => {
      e.preventDefault();
      moveCursorJoystick(e);
    });
    cursorJoystickArea.addEventListener('touchend', (e) => {
      e.preventDefault();
      endCursorJoystick(e);
    });
    cursorJoystickArea.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      endCursorJoystick(e);
    });

    const jumpBtn = document.getElementById('jumpBtn');
    jumpBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.game.input.keys[' '] = true;
      this.game.input.keys['_pressed'] = true;
    });
    jumpBtn?.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.game.input.keys[' '] = false;
    });

    const invBtn = document.getElementById('invBtn');
    invBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.game.showInventory = !this.game.showInventory;
      this.ui.updateInventoryUI();
    });

    this.game.input.touch = { 
      moveX: 0, 
      moveY: 0, 
      jump: false,
      cursorActive: false,
      cursorX: 0,
      cursorY: 0
    };
  }

  getCursorTouchPos() {
    if (!this.cursorJoystickId || !this.game.canvas) return null;
    const rect = this.game.canvas.getBoundingClientRect();
    return { x: this.cursorX + rect.left, y: this.cursorY + rect.top };
  }

  handleCursorTap() {
    if (!this.game.player || !this.game.world) return;

    const worldX = this.cursorX + this.game.renderer.camera.x;
    const worldY = this.cursorY + this.game.renderer.camera.y;

    const hitMob = this.game.entityManager.getEntitiesNear(worldX, worldY, TILE_SIZE).find(e => e.type === 'mob');
    if (hitMob) {
      this.game.player.attack(hitMob);
      return;
    }

    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);

    const blockType = this.game.world.getBlock(tileX, tileY);
    if (blockType === BlockType.WORKBENCH) {
      this.game.showCrafting = !this.game.showCrafting;
      this.game.showInventory = true;
      if (this.game.ui) this.game.ui.updateInventoryUI();
      return;
    }

    const selectedItem = this.game.player.inventory.getSelectedItem();
    if (selectedItem && selectedItem.type) {
      const info = ItemInfo[selectedItem.type];
      if (info && info.food) {
        this.game.player.useItem();
        return;
      }
    }

    this.game.player.placeBlock(this.game.world, {
      getMouseWorldPos: () => ({ x: worldX, y: worldY }),
    });
  }

  handleCursorInteract() {
    if (!this.game.player || !this.game.world) return;

    const worldX = this.cursorX + this.game.renderer.camera.x;
    const worldY = this.cursorY + this.game.renderer.camera.y;

    const nearbyMobs = this.game.entityManager.getEntitiesNear(worldX, worldY, 40);
    for (const mob of nearbyMobs) {
      if (mob.mobType === 'sheep' || mob.mobType === 'pig') {
        this.interactWithAnimal(mob);
        return;
      }
    }

    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);

    const blockType = this.game.world.getBlock(tileX, tileY);
    if (blockType === BlockType.WORKBENCH) {
      this.game.showCrafting = !this.game.showCrafting;
      this.game.showInventory = true;
      if (this.game.ui) this.game.ui.updateInventoryUI();
    }
  }

  interactWithAnimal(mob) {
    if (mob.mobType === 'sheep' && mob.health > 0) {
      mob.setSheared();
      this.game.player.inventory.addItem(ItemType.WOOL, 1);
    } else if (mob.mobType === 'pig' && mob.health > 0) {
      this.game.player.inventory.addItem(ItemType.PORKCHOP, 1);
    }
  }
}