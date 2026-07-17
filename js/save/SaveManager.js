class SaveManager {
  constructor() {
    this.storageKey = 'sandbox2d_saves';
    this.currentSaveId = null;
  }

  getSaves() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load saves:', e);
      return [];
    }
  }

  saveSavesList(saves) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(saves));
    } catch (e) {
      console.error('Failed to save saves list:', e);
    }
  }

  createNewSave(name) {
    const id = 'save_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const now = Date.now();
    const saveInfo = {
      id,
      name: name || '新存档',
      createdAt: now,
      lastPlayed: now,
      seed: Math.floor(Math.random() * 1000000),
    };

    const saves = this.getSaves();
    saves.unshift(saveInfo);
    this.saveSavesList(saves);

    return saveInfo;
  }

  deleteSave(saveId) {
    const saves = this.getSaves().filter(s => s.id !== saveId);
    this.saveSavesList(saves);
    localStorage.removeItem(this.getSaveDataKey(saveId));
  }

  renameSave(saveId, newName) {
    const saves = this.getSaves();
    const save = saves.find(s => s.id === saveId);
    if (save) {
      save.name = newName;
      this.saveSavesList(saves);
    }
  }

  getSaveDataKey(saveId) {
    return 'sandbox2d_save_' + saveId;
  }

  saveGame(saveId, gameData) {
    try {
      const key = this.getSaveDataKey(saveId);
      const data = JSON.stringify(gameData);
      localStorage.setItem(key, data);

      const saves = this.getSaves();
      const save = saves.find(s => s.id === saveId);
      if (save) {
        save.lastPlayed = Date.now();
        this.saveSavesList(saves);
      }

      return true;
    } catch (e) {
      console.error('Failed to save game:', e);
      return false;
    }
  }

  loadGame(saveId) {
    try {
      const key = this.getSaveDataKey(saveId);
      const data = localStorage.getItem(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load game:', e);
      return null;
    }
  }

  getSaveInfo(saveId) {
    const saves = this.getSaves();
    return saves.find(s => s.id === saveId) || null;
  }

  getLatestSave() {
    const saves = this.getSaves();
    if (saves.length === 0) return null;
    return saves.reduce((latest, save) =>
      save.lastPlayed > latest.lastPlayed ? save : latest
    );
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
