class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.mouse = {
      x: 0,
      y: 0,
      worldX: 0,
      worldY: 0,
      leftDown: false,
      rightDown: false,
      leftPressed: false,
      rightPressed: false,
      wheel: 0,
      leftClick: false,
      rightClick: false,
      leftDownTime: 0,
    };
    this.touch = {
      active: false,
      touches: [],
      startTime: 0,
      longPress: false,
      cursorActive: false,
      cursorX: 0,
      cursorY: 0,
      moveX: 0,
      moveY: 0,
      jump: false,
    };
    this.camera = null;

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (!this.keys[key]) {
        this.keys[key + '_pressed'] = true;
      }
      this.keys[key] = true;
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      this.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (e.button === 0) {
        this.mouse.leftDown = true;
        this.mouse.leftPressed = true;
      } else if (e.button === 2) {
        this.mouse.rightDown = true;
        this.mouse.rightPressed = true;
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.leftDown = false;
      } else if (e.button === 2) {
        this.mouse.rightDown = false;
      }
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.mouse.wheel += e.deltaY > 0 ? 1 : -1;
    }, { passive: false });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touch.active = true;
      this.touch.startTime = Date.now();
      this.touch.longPress = false;
      this.updateTouches(e);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.updateTouches(e);
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.updateTouches(e);
      if (e.touches.length === 0) {
        this.touch.active = false;
      }
    });
  }

  updateTouches(e) {
    this.touch.touches = [];
    const rect = this.canvas.getBoundingClientRect();
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      this.touch.touches.push({
        x: (t.clientX - rect.left) * (this.canvas.width / rect.width),
        y: (t.clientY - rect.top) * (this.canvas.height / rect.height),
        id: t.identifier,
      });
    }
  }

  setCamera(camera) {
    this.camera = camera;
  }

  update() {
    if (this.camera) {
      this.mouse.worldX = this.mouse.x + this.camera.x;
      this.mouse.worldY = this.mouse.y + this.camera.y;
    }

    if (this.mouse.leftDown) {
      this.mouse.leftDownTime++;
    }

    if (this.touch && this.touch.cursorActive) {
      return;
    }

    if (this.touch.active && !this.touch.longPress) {
      const touchDuration = Date.now() - this.touch.startTime;
      if (touchDuration > 200) {
        this.touch.longPress = true;
        this.mouse.leftDown = true;
      }
    }
  }

  endFrame() {
    this.mouse.leftPressed = false;
    this.mouse.rightPressed = false;
    this.mouse.leftClick = false;
    this.mouse.rightClick = false;
    this.mouse.wheel = 0;
    for (const key in this.keys) {
      if (key.endsWith('_pressed')) {
        this.keys[key] = false;
      }
    }
  }

  isKeyDown(key) {
    return !!this.keys[key.toLowerCase()];
  }

  isKeyPressed(key) {
    return !!this.keys[key.toLowerCase() + '_pressed'];
  }

  isLeftDown() {
    return this.mouse.leftDown;
  }

  isRightDown() {
    return this.mouse.rightDown;
  }

  isLeftPressed() {
    return this.mouse.leftPressed;
  }

  isRightPressed() {
    return this.mouse.rightPressed;
  }

  getMouseWorldPos() {
    return { x: this.mouse.worldX, y: this.mouse.worldY };
  }

  getMouseScreenPos() {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  getScrollWheel() {
    return this.mouse.wheel;
  }

  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || this.touch.active;
  }
}
