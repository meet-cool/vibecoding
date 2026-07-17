class UIManager {
  constructor(game) {
    this.game = game;
    this.menuElement = document.getElementById('mainMenu');
    this.gameElement = document.getElementById('gameContainer');
    this.hudElement = document.getElementById('hud');
    this.inventoryPanel = document.getElementById('inventoryPanel');
    this.pausePanel = document.getElementById('pausePanel');
    this.saveListPanel = document.getElementById('saveListPanel');
    this.settingsPanel = document.getElementById('settingsPanel');

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

    document.getElementById('pauseSettingsBtn')?.addEventListener('click', () => {
      this.showSettingsPanel();
    });

    this.initSettingsPanel();
  }

  updateHUD() {
    this.renderHealthBar();
    this.renderHungerBar();
    this.renderHotbar();
    this.renderCoords();
    this.renderTimeDisplay();
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
            <div class="item-icon" style="background:${itemInfo?.color || '#888'}">
              ${this.getItemIcon(itemInfo?.icon, itemInfo?.color)}
            </div>
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

  renderTimeDisplay() {
    const timeEl = document.getElementById('timeDisplay');
    if (!timeEl || !this.game) return;

    const dayTime = this.game.dayTime || 0;
    const dayLength = this.game.dayLength || 120;
    const progress = dayTime / dayLength;

    let hours = Math.floor(progress * 24);
    let minutes = Math.floor((progress * 24 * 60) % 60);

    let icon = '🕐';
    if (hours >= 6 && hours < 8) {
      icon = '🌅';
    } else if (hours >= 8 && hours < 17) {
      icon = '☀️';
    } else if (hours >= 17 && hours < 19) {
      icon = '🌇';
    } else if (hours >= 19 && hours < 21) {
      icon = '🌙';
    } else {
      icon = '🌑';
    }

    const timeStr = `${icon} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    timeEl.textContent = timeStr;
  }

  getItemIcon(iconType, color) {
    switch (iconType) {
      case 'grass':
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><rect x="2" y="12" width="20" height="10" fill="#8B4513"/><rect x="2" y="2" width="20" height="10" fill="#4CAF50"/><rect x="4" y="4" width="3" height="4" fill="#66BB6A"/><rect x="9" y="3" width="3" height="5" fill="#66BB6A"/><rect x="15" y="4" width="3" height="4" fill="#66BB6A"/><rect x="12" y="6" width="3" height="4" fill="#66BB6A"/></svg>`;
      case 'log':
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><rect x="2" y="2" width="20" height="20" fill="#6D4C41"/><rect x="2" y="5" width="20" height="3" fill="#5D4037"/><rect x="2" y="11" width="20" height="3" fill="#5D4037"/><rect x="2" y="17" width="20" height="3" fill="#5D4037"/><rect x="0" y="2" width="4" height="20" fill="#4E342E"/></svg>`;
      case 'leaves':
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><rect x="2" y="2" width="20" height="20" fill="#2E7D32"/><circle cx="7" cy="7" r="4" fill="#388E3C"/><circle cx="17" cy="7" r="4" fill="#388E3C"/><circle cx="7" cy="17" r="4" fill="#388E3C"/><circle cx="17" cy="17" r="4" fill="#388E3C"/><circle cx="12" cy="12" r="5" fill="#4CAF50"/></svg>`;
      case 'coal':
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><polygon points="5,5 19,7 17,19 7,17" fill="#212121" stroke="#424242" stroke-width="2"/><rect x="9" y="9" width="6" height="6" fill="#424242"/></svg>`;
      case 'ore':
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><rect x="2" y="2" width="20" height="20" fill="#757575"/><polygon points="6,6 10,8 8,12" fill="${color}"/><polygon points="18,8 20,6 16,12" fill="${color}"/><polygon points="8,18 12,16 10,20" fill="${color}"/><polygon points="14,10 18,12 16,16" fill="${color}"/></svg>`;
      case 'ingot':
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><rect x="4" y="6" width="16" height="12" rx="2" fill="${color}"/><rect x="6" y="8" width="3" height="8" fill="rgba(255,255,255,0.3)"/><rect x="15" y="8" width="3" height="8" fill="rgba(0,0,0,0.2)"/><rect x="10" y="14" width="4" height="2" fill="rgba(0,0,0,0.1)"/></svg>`;
      case 'planks':
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><rect x="2" y="2" width="20" height="20" fill="${color}"/><line x1="2" y1="8" x2="22" y2="8" stroke="rgba(0,0,0,0.3)" stroke-width="1"/><line x1="2" y1="16" x2="22" y2="16" stroke="rgba(0,0,0,0.3)" stroke-width="1"/><line x1="8" y1="2" x2="8" y2="22" stroke="rgba(0,0,0,0.2)" stroke-width="0.5"/></svg>`;
      case 'cobble':
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><rect x="2" y="2" width="20" height="20" fill="${color}"/><polygon points="5,5 9,7 7,11" fill="rgba(0,0,0,0.25)"/><polygon points="17,7 19,5 15,11" fill="rgba(255,255,255,0.2)"/><polygon points="7,17 11,15 9,19" fill="rgba(255,255,255,0.15)"/><polygon points="15,15 17,17 13,19" fill="rgba(0,0,0,0.2)"/></svg>`;
      case 'stick':
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><rect x="10" y="2" width="4" height="20" fill="${color}"/><rect x="6" y="2" width="12" height="4" fill="#5D4037"/></svg>`;
      case 'workbench':
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><rect x="2" y="6" width="20" height="16" fill="#5D4037"/><rect x="2" y="2" width="20" height="6" fill="${color}"/><rect x="4" y="8" width="4" height="4" fill="#3E2723"/><rect x="16" y="8" width="4" height="4" fill="#3E2723"/><rect x="4" y="16" width="4" height="4" fill="#3E2723"/><rect x="16" y="16" width="4" height="4" fill="#3E2723"/><rect x="2" y="6" width="20" height="2" fill="#3E2723"/></svg>`;
      case 'pickaxe':
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><rect x="10" y="8" width="4" height="16" fill="#5D4037"/><polygon points="12,8 2,2 8,8" fill="${color}" stroke="#333" stroke-width="0.5"/><polygon points="12,8 22,2 16,8" fill="${color}" stroke="#333" stroke-width="0.5"/><polygon points="6,4 12,8 10,6" fill="rgba(255,255,255,0.3)"/><polygon points="18,4 12,8 14,6" fill="rgba(255,255,255,0.3)"/></svg>`;
      case 'sword':
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><rect x="10" y="12" width="4" height="12" fill="#5D4037"/><polygon points="12,2 8,6 12,12 16,6" fill="${color}" stroke="#333" stroke-width="0.5"/><rect x="8" y="12" width="8" height="2" fill="#5D4037"/><polygon points="10,4 12,2 14,4" fill="rgba(255,255,255,0.4)"/></svg>`;
      case 'axe':
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><rect x="10" y="6" width="4" height="18" fill="#5D4037"/><polygon points="12,6 2,4 4,14 12,10" fill="${color}" stroke="#333" stroke-width="0.5"/><polygon points="4,6 8,8 6,12" fill="rgba(255,255,255,0.3)"/></svg>`;
      case 'meat':
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><ellipse cx="12" cy="13" rx="8" ry="9" fill="${color}"/><rect x="8" y="2" width="8" height="4" fill="#8D6E63"/><rect x="6" y="8" width="2" height="6" fill="rgba(0,0,0,0.1)"/><rect x="16" y="8" width="2" height="6" fill="rgba(0,0,0,0.1)"/><ellipse cx="12" cy="13" rx="6" ry="7" fill="rgba(255,255,255,0.1)"/></svg>`;
      case 'wool':
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><rect x="2" y="2" width="20" height="20" fill="${color}"/><circle cx="7" cy="7" r="4" fill="rgba(255,255,255,0.3)"/><circle cx="17" cy="9" r="3" fill="rgba(0,0,0,0.1)"/><circle cx="12" cy="17" r="4" fill="rgba(255,255,255,0.2)"/><circle cx="5" cy="15" r="2" fill="rgba(0,0,0,0.1)"/></svg>`;
      case 'torch':
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><rect x="10" y="8" width="4" height="16" fill="#5D4037"/><ellipse cx="12" cy="8" rx="6" ry="6" fill="#FFD54F"/><ellipse cx="12" cy="4" rx="4" ry="4" fill="#FFA000"/><circle cx="12" cy="2" r="2" fill="#FFFFFF"/><circle cx="12" cy="6" r="3" fill="rgba(255,255,255,0.3)"/></svg>`;
      case 'block':
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><rect x="2" y="2" width="20" height="20" fill="${color}"/><rect x="2" y="2" width="20" height="4" fill="rgba(255,255,255,0.15)"/><rect x="2" y="2" width="4" height="20" fill="rgba(255,255,255,0.1)"/><rect x="18" y="2" width="4" height="20" fill="rgba(0,0,0,0.1)"/><rect x="2" y="18" width="20" height="4" fill="rgba(0,0,0,0.15)"/></svg>`;
      default:
        return `<svg viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><rect x="2" y="2" width="20" height="20" fill="${color}"/></svg>`;
    }
  }

  isDarkColor(color) {
    if (!color) return false;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 4), 16);
    const b = parseInt(hex.substr(4, 6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
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

    document.getElementById('settingsPanel')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('settingsPanel')) {
        this.settingsPanel.style.display = 'none';
      }
    });
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
