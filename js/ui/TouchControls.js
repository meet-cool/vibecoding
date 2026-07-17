class TouchControls {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.isMobile = this.checkMobile();

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
      <div class="action-buttons">
        <button class="action-btn jump-btn" id="jumpBtn">跳</button>
        <div class="action-row">
          <button class="action-btn break-btn" id="breakBtn">挖</button>
          <button class="action-btn place-btn" id="placeBtn">放</button>
        </div>
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

    const jumpBtn = document.getElementById('jumpBtn');
    jumpBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.game.input.keys[' '] = true;
      this.game.input.keys[' _pressed'] = true;
    });
    jumpBtn?.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.game.input.keys[' '] = false;
    });

    const breakBtn = document.getElementById('breakBtn');
    let breakInterval = null;
    breakBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.game.input.mouse.leftDown = true;
      this.game.input.mouse.leftPressed = true;
    });
    breakBtn?.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.game.input.mouse.leftDown = false;
    });

    const placeBtn = document.getElementById('placeBtn');
    placeBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.game.input.mouse.rightDown = true;
      this.game.input.mouse.rightPressed = true;
    });
    placeBtn?.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.game.input.mouse.rightDown = false;
    });

    const invBtn = document.getElementById('invBtn');
    invBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.game.showInventory = !this.game.showInventory;
      this.ui.updateInventoryUI();
    });

    this.game.input.touch = { moveX: 0, moveY: 0, jump: false };
  }
}
