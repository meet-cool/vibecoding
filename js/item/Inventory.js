class Inventory {
  constructor(size = 36, hotbarSize = 9) {
    this.size = size;
    this.hotbarSize = hotbarSize;
    this.slots = [];
    for (let i = 0; i < size; i++) {
      this.slots.push({ type: null, count: 0 });
    }
    this.selectedSlot = 0;
  }

  getSelectedItem() {
    return this.slots[this.selectedSlot];
  }

  setSelectedSlot(index) {
    if (index >= 0 && index < this.hotbarSize) {
      this.selectedSlot = index;
    }
  }

  addItem(type, count = 1) {
    const info = ItemInfo[type];
    if (!info) return count;

    if (!info.stackable) {
      let remaining = count;
      for (let i = 0; i < this.size && remaining > 0; i++) {
        if (this.slots[i].type === null) {
          this.slots[i] = { type, count: 1 };
          remaining--;
        }
      }
      return remaining;
    }

    const maxStack = info.maxStack || 64;
    let remaining = count;

    for (let i = 0; i < this.size && remaining > 0; i++) {
      if (this.slots[i].type === type && this.slots[i].count < maxStack) {
        const add = Math.min(remaining, maxStack - this.slots[i].count);
        this.slots[i].count += add;
        remaining -= add;
      }
    }

    for (let i = 0; i < this.size && remaining > 0; i++) {
      if (this.slots[i].type === null) {
        const add = Math.min(remaining, maxStack);
        this.slots[i] = { type, count: add };
        remaining -= add;
      }
    }

    return remaining;
  }

  removeItem(slotIndex, count = 1) {
    if (slotIndex < 0 || slotIndex >= this.size) return false;
    const slot = this.slots[slotIndex];
    if (!slot.type || slot.count < count) return false;
    slot.count -= count;
    if (slot.count <= 0) {
      this.slots[slotIndex] = { type: null, count: 0 };
    }
    return true;
  }

  removeItemByType(type, count = 1) {
    let remaining = count;
    for (let i = 0; i < this.size && remaining > 0; i++) {
      if (this.slots[i].type === type) {
        const remove = Math.min(remaining, this.slots[i].count);
        this.slots[i].count -= remove;
        remaining -= remove;
        if (this.slots[i].count <= 0) {
          this.slots[i] = { type: null, count: 0 };
        }
      }
    }
    return remaining === 0;
  }

  hasItem(type, count = 1) {
    let total = 0;
    for (let i = 0; i < this.size; i++) {
      if (this.slots[i].type === type) {
        total += this.slots[i].count;
        if (total >= count) return true;
      }
    }
    return false;
  }

  getItemCount(type) {
    let total = 0;
    for (let i = 0; i < this.size; i++) {
      if (this.slots[i].type === type) {
        total += this.slots[i].count;
      }
    }
    return total;
  }

  clearSlot(slotIndex) {
    if (slotIndex < 0 || slotIndex >= this.size) return;
    this.slots[slotIndex] = { type: null, count: 0 };
  }

  setSlot(slotIndex, type, count) {
    if (slotIndex < 0 || slotIndex >= this.size) return;
    this.slots[slotIndex] = { type, count };
  }

  swapSlots(slot1, slot2) {
    if (slot1 < 0 || slot1 >= this.size || slot2 < 0 || slot2 >= this.size) return;
    const temp = this.slots[slot1];
    this.slots[slot1] = this.slots[slot2];
    this.slots[slot2] = temp;
  }

  serialize() {
    return {
      slots: this.slots.map(s => ({ ...s })),
      selectedSlot: this.selectedSlot,
    };
  }

  static deserialize(data) {
    const inv = new Inventory();
    if (data.slots) {
      for (let i = 0; i < Math.min(data.slots.length, inv.size); i++) {
        inv.slots[i] = { ...data.slots[i] };
      }
    }
    if (typeof data.selectedSlot === 'number') {
      inv.selectedSlot = data.selectedSlot;
    }
    return inv;
  }
}
