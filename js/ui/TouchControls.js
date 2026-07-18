class TouchControls {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.isMobile = this.checkMobile();
    this.longPressTimer = null;
    this.touchStartTime = 0;
    this.touchStartPos = null;
    this.isLongPress = false;
    this.joystickEnabled = false;

    // 始终创建控件，确保摇杆元素存在于DOM中，以便设置中可以切换显示
    this.createControls();
    this.bindEvents();
    this.applyJoystickSetting();

    // 非移动设备隐藏操作按钮（跳跃、背包），摇杆显示由设置控制
    this.updateActionButtonsVisibility();
  }

  checkMobile() {
    // 检查UA、触摸支持、屏幕尺寸，避免漏判移动设备
    const ua = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const smallScreen = Math.min(window.innerWidth, window.innerHeight) <= 1024;
    return ua || (touch && smallScreen);
  }

  updateActionButtonsVisibility() {
    const actionButtons = document.querySelector('.action-buttons');
    if (actionButtons) {
      actionButtons.style.display = this.isMobile ? 'flex' : 'none';
    }
  }

  applyJoystickSetting() {
    const saved = localStorage.getItem('sandbox2d_setting_joystickEnabled');
    this.joystickEnabled = saved === 'true';
    console.log('[TouchControls] applyJoystickSetting:', this.joystickEnabled, '(saved:', saved, ')');
    this.toggleJoystick(this.joystickEnabled);
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
      <div class="action-buttons">
        <button class="action-btn jump-btn" id="jumpBtn">跳</button>
        <button class="action-btn inv-btn" id="invBtn">背包</button>
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

    const startJoystick = (e) => {
      e.preventDefault();
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
      e.preventDefault();
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
      const maxDist = 40;

      if (dist > maxDist) {
        dx = dx / dist * maxDist;
        dy = dy / dist * maxDist;
      }

      joystickStick.style.left = `calc(50% + ${dx}px)`;
      joystickStick.style.top = `calc(50% + ${dy}px)`;

      this.game.input.touch.moveX = dx / maxDist;
      this.game.input.touch.moveY = dy / maxDist;
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
        if (!found) return;
      }
      joystickActive = false;
      joystickId = null;
      joystickStick.style.left = '50%';
      joystickStick.style.top = '50%';
      this.game.input.touch.moveX = 0;
      this.game.input.touch.moveY = 0;
    };

    joystickArea.addEventListener('touchstart', startJoystick, { passive: false });
    joystickArea.addEventListener('touchmove', moveJoystick, { passive: false });
    joystickArea.addEventListener('touchend', endJoystick);
    joystickArea.addEventListener('touchcancel', endJoystick);

    document.getElementById('jumpBtn')?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.game.input.touch.jump = true;
    });
    document.getElementById('jumpBtn')?.addEventListener('touchend', () => {
      this.game.input.touch.jump = false;
    });

    document.getElementById('invBtn')?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.game.showInventory = !this.game.showInventory;
      this.game.showCrafting = false;
      if (this.game.ui) this.game.ui.updateInventoryUI();
    });

    const canvas = this.game.canvas;
    canvas.addEventListener('touchstart', (e) => this.handleCanvasTouchStart(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this.handleCanvasTouchMove(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this.handleCanvasTouchEnd(e), { passive: false });

    this.game.input.touch = {
      moveX: 0,
      moveY: 0,
      jump: false,
      active: false,
      startTime: 0,
      longPress: false,
      touches: [],
      cursorActive: false,
      cursorX: 0,
      cursorY: 0,
    };
  }

  handleCanvasTouchStart(e) {
    if (e.touches.length > 1) return;
    e.preventDefault();

    const touch = e.touches[0];
    const rect = this.game.canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (this.game.canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (this.game.canvas.height / rect.height);
    const z = this.game.renderer.zoom || 1;

    this.touchStartPos = { x, y };
    this.touchStartTime = Date.now();
    this.isLongPress = false;

    this.game.input.mouse.x = x;
    this.game.input.mouse.y = y;
    this.game.input.mouse.worldX = x / z + this.game.renderer.camera.x;
    this.game.input.mouse.worldY = y / z + this.game.renderer.camera.y;

    this.game.input.touch.active = true;
    this.game.input.touch.startTime = Date.now();
    this.game.input.touch.longPress = false;
    this.game.input.touch.touches = [{ x, y }];

    this.longPressTimer = setTimeout(() => {
      this.isLongPress = true;
      this.game.input.touch.longPress = true;
      this.game.input.mouse.leftDown = true;
    }, 300);
  }

  handleCanvasTouchMove(e) {
    if (!this.touchStartPos) return;
    e.preventDefault();

    const touch = e.touches[0];
    const rect = this.game.canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (this.game.canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (this.game.canvas.height / rect.height);
    const z = this.game.renderer.zoom || 1;

    this.game.input.mouse.x = x;
    this.game.input.mouse.y = y;
    this.game.input.mouse.worldX = x / z + this.game.renderer.camera.x;
    this.game.input.mouse.worldY = y / z + this.game.renderer.camera.y;

    const dx = Math.abs(x - this.touchStartPos.x);
    const dy = Math.abs(y - this.touchStartPos.y);

    if (dx > 15 || dy > 15) {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      this.isLongPress = false;
      this.game.input.mouse.leftDown = false;
    }
  }

  handleCanvasTouchEnd(e) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const touchDuration = Date.now() - this.touchStartTime;

    if (!this.isLongPress && touchDuration < 300 && this.touchStartPos) {
      this.handleTap(this.touchStartPos.x, this.touchStartPos.y);
    }

    this.game.input.mouse.leftDown = false;
    this.game.input.touch.active = false;
    this.game.input.touch.longPress = false;
    this.touchStartPos = null;
  }

  handleTap(screenX, screenY) {
    if (!this.game.player || !this.game.world) return;

    const z = this.game.renderer.zoom || 1;
    const worldX = screenX / z + this.game.renderer.camera.x;
    const worldY = screenY / z + this.game.renderer.camera.y;

    const nearbyMobs = this.game.entityManager.getEntitiesNear(worldX, worldY, TILE_SIZE);
    for (const mob of nearbyMobs) {
      if (mob.type === 'mob') {
        this.game.player.attack(mob);
        return;
      }
    }

    this.game.player.placeBlock(this.game.world, {
      getMouseWorldPos: () => ({ x: worldX, y: worldY }),
    });
  }

  toggleJoystick(enabled) {
    this.joystickEnabled = enabled;
    console.log('[TouchControls] toggleJoystick:', enabled);
    const joystickArea = document.getElementById('joystickArea');
    if (joystickArea) {
      joystickArea.style.display = enabled ? 'block' : 'none';
      console.log('[TouchControls] joystickArea display set to:', joystickArea.style.display, 'element:', joystickArea);
    } else {
      console.warn('[TouchControls] joystickArea element NOT FOUND!');
    }
    // 确保父容器可见
    const container = document.getElementById('touchControls');
    if (container) {
      container.style.display = 'block';
    }
    if (!enabled && this.game.input && this.game.input.touch) {
      this.game.input.touch.moveX = 0;
      this.game.input.touch.moveY = 0;
    }
  }
}