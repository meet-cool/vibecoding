class UIManager {
  constructor(game) {
    this.game = game;
    this.menuElement = document.getElementById('mainMenu');
    this.gameElement = document.getElementById('gameContainer');
    this.hudElement = document.getElementById('hud');
    this.inventoryPanel = document.getElementById('inventoryPanel');
    this.pausePanel = document.getElementById('pausePanel');
    this.saveListPanel = document.getElementById('saveListPanel');

    this.initMenu();
    this.initHUD();
  }

  initMenu() {
    const startBtn = document.getElementById('startBtn');
    const continueBtn = document.getElementById('continueBtn');
    const savesBtn = document.getElementById('savesBtn');

    startBtn.addEventListener('click', () => this.createNewWorld());
    continueBtn.addEventListener('click', () => this.continueGame());
    savesBtn.addEventListener('click', () => this.showSavesList());

    document.getElementById('closeSavesBtn')?.addEventListener('click', () => {
      this.saveListPanel.style.display = 'none';
    });

    document.getElementById('newSaveBtn')?.addEventListener('click', () => this.createNewWorld());

    this.updateContinueButton();
  }

  updateContinueButton() {
    const continueBtn = document.getElementById('continueBtn');
    const latest = this.game.saveManager.getLatestSave();
    continueBtn.disabled = !latest;
    continueBtn.style.opacity = latest ? '1' : '0.5';
  }

  createNewWorld() {
    const name = prompt('请输入存档名称：', '新世界 ' + new Date().toLocaleDateString());
    if (name === null) return;

    const saveInfo = this.game.saveManager.createNewSave(name || '新世界');
    this.game.startNewGame(saveInfo);
    this.showGameScreen();
  }

  continueGame() {
    const latest = this.game.saveManager.getLatestSave();
    if (!latest) return;

    if (this.game.loadGame(latest.id)) {
      this.showGameScreen();
    }
  }

  showSavesList() {
    const savesList = document.getElementById('savesList');
    savesList.innerHTML = '';

    const saves = this.game.saveManager.getSaves();
    if (saves.length === 0) {
      savesList.innerHTML = '<p style="text-align:center;color:#aaa;padding:20px;">暂无存档</p>';
    } else {
      for (const save of saves) {
        const item = document.createElement('div');
        item.className = 'save-item';
        item.innerHTML = `
          <div class="save-info">
            <div class="save-name">${this.escapeHtml(save.name)}</div>
            <div class="save-date">${this.game.saveManager.formatDate(save.lastPlayed)}</div>
          </div>
          <div class="save-actions">
            <button class="btn-small" data-action="load">游玩</button>
            <button class="btn-small" data-action="rename">重命名</button>
            <button class="btn-small btn-danger" data-action="delete">删除</button>
          </div>
        `;

        item.querySelector('[data-action="load"]').addEventListener('click', () => {
          if (this.game.loadGame(save.id)) {
            this.saveListPanel.style.display = 'none';
            this.showGameScreen();
          }
        });

        item.querySelector('[data-action="rename"]').addEventListener('click', () => {
          const newName = prompt('输入新名称：', save.name);
          if (newName && newName.trim()) {
            this.game.saveManager.renameSave(save.id, newName.trim());
            this.showSavesList();
            this.updateContinueButton();
          }
        });

        item.querySelector('[data-action="delete"]').addEventListener('click', () => {
          if (confirm(`确定删除存档 "${save.name}" 吗？`)) {
            this.game.saveManager.deleteSave(save.id);
            this.showSavesList();
            this.updateContinueButton();
          }
        });

        savesList.appendChild(item);
      }
    }

    this.saveListPanel.style.display = 'flex';
  }

  showGameScreen() {
    this.menuElement.style.display = 'none';
    this.gameElement.style.display = 'block';
    this.hudElement.style.display = 'block';
    this.updateHUD();
    this.updateInventoryUI();
  }

  showMenuScreen() {
    this.menuElement.style.display = 'flex';
    this.gameElement.style.display = 'none';
    this.hudElement.style.display = 'none';
    this.pausePanel.style.display = 'none';
    this.inventoryPanel.style.display = 'none';
    this.updateContinueButton();
  }

  initHUD() {
    document.getElementById('resumeBtn')?.addEventListener('click', () => {
      this.game.paused = false;
      this.pausePanel.style.display = 'none';
    });

    document.getElementById('saveExitBtn')?.addEventListener('click', () => {
      this.game.exitToMenu();
      this.showMenuScreen();
    });

    document.getElementById('inventoryCloseBtn')?.addEventListener('click', () => {
      this.game.showInventory = false;
      this.game.showCrafting = false;
      this.inventoryPanel.style.display = 'none';
    });

    document.getElementById('pauseBtn')?.addEventListener('click', () => {
      this.game.paused = true;
      this.updatePauseUI();
    });

    document.getElementById('settingsBtn')?.addEventListener('click', () => {
      this.showSettingsPanel();
    });

    this.initSettingsPanel();
  }

  updateHUD() {
    this.renderHealthBar();
    this.renderHungerBar();
    this.renderHotbar();
    this.renderCoords();
  }

  renderHealthBar() {
    const healthBar = document.getElementById('healthBar');
    if (!healthBar || !this.game.player) return;

    const hearts = 10;
    const fullHearts = Math.floor(this.game.player.health / 2);
    const halfHeart = this.game.player.health % 2 >= 1;

    let html = '';
    for (let i = 0; i < hearts; i++) {
      if (i < fullHearts) {
        html += '<span class="heart full">♥</span>';
      } else if (i === fullHearts && halfHeart) {
        html += '<span class="heart half">♥</span>';
      } else {
        html += '<span class="heart empty">♥</span>';
      }
    }
    healthBar.innerHTML = html;
  }

  renderHungerBar() {
    const hungerBar = document.getElementById('hungerBar');
    if (!hungerBar || !this.game.player) return;

    const drumsticks = 10;
    const full = Math.floor(this.game.player.hunger / 2);
    const half = this.game.player.hunger % 2 >= 1;

    let html = '';
    for (let i = 0; i < drumsticks; i++) {
      if (i < full) {
        html += '<span class="drumstick full">🍗</span>';
      } else if (i === full && half) {
        html += '<span class="drumstick half">🍗</span>';
      } else {
        html += '<span class="drumstick empty">🍗</span>';
      }
    }
    hungerBar.innerHTML = html;
  }

  renderHotbar() {
    const hotbar = document.getElementById('hotbar');
    if (!hotbar || !this.game.player) return;

    let html = '';
    for (let i = 0; i < 9; i++) {
      const slot = this.game.player.inventory.slots[i];
      const selected = i === this.game.player.inventory.selectedSlot;
      const itemInfo = slot.type ? ItemInfo[slot.type] : null;

      html += `
        <div class="hotbar-slot ${selected ? 'selected' : ''}" data-slot="${i}">
          ${slot.type ? `
            <div class="item-icon" style="background:${itemInfo?.color || '#888'}"></div>
            ${slot.count > 1 ? `<span class="item-count">${slot.count}</span>` : ''}
          ` : ''}
        </div>
      `;
    }
    hotbar.innerHTML = html;

    hotbar.querySelectorAll('.hotbar-slot').forEach(el => {
      el.addEventListener('click', () => {
        const slot = parseInt(el.dataset.slot);
        this.game.player.inventory.setSelectedSlot(slot);
        this.renderHotbar();
      });
    });
  }

  renderCoords() {
    const coordsEl = document.getElementById('coords');
    if (!coordsEl || !this.game.player) return;
    const x = Math.floor(this.game.player.x / TILE_SIZE);
    const y = Math.floor(this.game.player.y / TILE_SIZE);
    coordsEl.textContent = `X: ${x}  Y: ${y}`;
  }

  updatePauseUI() {
    this.pausePanel.style.display = this.game.paused ? 'flex' : 'none';
  }

  updateInventoryUI() {
    if (!this.game.showInventory) {
      this.inventoryPanel.style.display = 'none';
      return;
    }

    this.inventoryPanel.style.display = 'flex';
    this.renderInventorySlots();
    this.renderCraftingGrid();
  }

  renderInventorySlots() {
    const container = document.getElementById('inventorySlots');
    if (!container || !this.game.player) return;

    let html = '';
    for (let i = 9; i < 36; i++) {
      const slot = this.game.player.inventory.slots[i];
      const itemInfo = slot.type ? ItemInfo[slot.type] : null;

      html += `
        <div class="inv-slot" data-slot="${i}">
          ${slot.type ? `
            <div class="item-icon" style="background:${itemInfo?.color || '#888'}"></div>
            ${slot.count > 1 ? `<span class="item-count">${slot.count}</span>` : ''}
          ` : ''}
        </div>
      `;
    }
    container.innerHTML = html;
  }

  renderCraftingGrid() {
    const gridContainer = document.getElementById('craftingGrid');
    const resultContainer = document.getElementById('craftingResult');
    if (!gridContainer) return;

    let gridHtml = '';
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        const slot = this.game.craftingGrid[y][x];
        const itemInfo = slot.type ? ItemInfo[slot.type] : null;
        gridHtml += `
          <div class="craft-slot" data-craft-x="${x}" data-craft-y="${y}">
            ${slot.type ? `
              <div class="item-icon" style="background:${itemInfo?.color || '#888'}"></div>
              ${slot.count > 1 ? `<span class="item-count">${slot.count}</span>` : ''}
            ` : ''}
          </div>
        `;
      }
    }
    gridContainer.innerHTML = gridHtml;

    this.game.updateCraftingResult();
    const result = this.game.craftingResult;
    if (resultContainer) {
      const resultInfo = result ? ItemInfo[result.type] : null;
      resultContainer.innerHTML = result ? `
        <div class="item-icon" style="background:${resultInfo?.color || '#888'}"></div>
        ${result.count > 1 ? `<span class="item-count">${result.count}</span>` : ''}
      ` : '';
      resultContainer.onclick = () => {
        this.game.takeCraftingResult();
        this.renderCraftingGrid();
        this.renderHotbar();
      };
    }

    gridContainer.querySelectorAll('.craft-slot').forEach(el => {
      el.addEventListener('click', () => {
        const x = parseInt(el.dataset.craftX);
        const y = parseInt(el.dataset.craftY);
        this.handleCraftingSlotClick(x, y);
      });
    });
  }

  handleCraftingSlotClick(x, y) {
    const slot = this.game.craftingGrid[y][x];
    const selectedItem = this.game.player.inventory.getSelectedItem();

    if (slot.type) {
      this.game.player.inventory.addItem(slot.type, slot.count);
      this.game.craftingGrid[y][x] = { type: null, count: 0 };
    } else if (selectedItem?.type) {
      this.game.craftingGrid[y][x] = { type: selectedItem.type, count: 1 };
      this.game.player.inventory.removeItem(this.game.player.inventory.selectedSlot, 1);
    }

    this.renderCraftingGrid();
    this.renderHotbar();
  }

  initSettingsPanel() {
    this.settingsPanel = document.getElementById('settingsPanel');
    
    const closeBtn = document.getElementById('settingsCloseBtn');
    closeBtn?.addEventListener('click', () => {
      this.settingsPanel.style.display = 'none';
    });

    const saveBtn = document.getElementById('saveSettingsBtn');
    saveBtn?.addEventListener('click', () => {
      this.saveSettings();
      this.settingsPanel.style.display = 'none';
    });

    this.setupToggle('autoJumpToggle', 'autoJump', true);
    this.setupToggle('soundToggle', 'soundEnabled', true);
    this.setupToggle('musicToggle', 'musicEnabled', false);
    this.setupToggle('touchToggle', 'touchControls', true);
  }

  setupToggle(elementId, settingKey, defaultValue) {
    const btn = document.getElementById(elementId);
    if (!btn) return;

    const saved = localStorage.getItem('sandbox2d_setting_' + settingKey);
    const value = saved !== null ? saved === 'true' : defaultValue;
    this.updateToggle(btn, value);

    btn.addEventListener('click', () => {
      const current = btn.textContent === '开启';
      this.updateToggle(btn, !current);
    });
  }

  updateToggle(btn, enabled) {
    btn.textContent = enabled ? '开启' : '关闭';
    btn.classList.toggle('off', !enabled);
    btn.dataset.value = enabled;
  }

  showSettingsPanel() {
    this.settingsPanel.style.display = 'flex';
  }

  saveSettings() {
    const toggles = ['autoJumpToggle', 'soundToggle', 'musicToggle', 'touchToggle'];
    const keys = ['autoJump', 'soundEnabled', 'musicEnabled', 'touchControls'];
    
    for (let i = 0; i < toggles.length; i++) {
      const btn = document.getElementById(toggles[i]);
      if (btn) {
        localStorage.setItem('sandbox2d_setting_' + keys[i], btn.dataset.value);
      }
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
