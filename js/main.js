window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');

  const game = new Game(canvas);
  const ui = new UIManager(game);
  const touchControls = new TouchControls(game, ui);

  game.ui = ui;
  game.touchControls = touchControls;

  window.game = game;
  window.ui = ui;

  game.onStateChange = (state) => {
    if (state === 'menu') {
      ui.showMenuScreen();
    } else if (state === 'playing') {
      ui.showGameScreen();
    }
  };

  setInterval(() => {
    if (game.state === 'playing' && !game.paused && !game.showInventory) {
      ui.updateHUD();
    }
  }, 200);

  function applyTouchMovement() {
    if (game.state !== 'playing' || game.paused || game.showInventory) {
      requestAnimationFrame(applyTouchMovement);
      return;
    }

    if (touchControls.isMobile && game.input.touch) {
      const moveX = game.input.touch.moveX || 0;
      if (Math.abs(moveX) > 0.1) {
        game.input.keys['a'] = moveX < 0;
        game.input.keys['d'] = moveX > 0;
      } else {
        game.input.keys['a'] = false;
        game.input.keys['d'] = false;
      }
    }

    requestAnimationFrame(applyTouchMovement);
  }
  applyTouchMovement();

  console.log('2D Sandbox Game loaded!');
});
