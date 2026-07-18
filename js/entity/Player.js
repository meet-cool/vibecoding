class Player extends Entity {
  constructor(x, y) {
    super(x, y, 20, 48);
    this.type = 'player';
    this.health = 20;
    this.maxHealth = 20;
    this.hunger = 20;
    this.maxHunger = 20;
    this.inventory = new Inventory(36, 9);
    this.miningProgress = 0;
    this.miningTarget = null;
    this.attackCooldown = 0;
    this.invincibleTime = 0;
    this.animTime = 0;
    this.autoJumpEnabled = true;

    this.giveStarterItems();
  }

  giveStarterItems() {
    this.inventory.addItem(ItemType.WOODEN_PICKAXE, 1);
    this.inventory.addItem(ItemType.WOODEN_AXE, 1);
    this.inventory.addItem(ItemType.WOODEN_SWORD, 1);
    this.inventory.addItem(ItemType.DIRT, 10);
  }

  update(dt, world, physics, input) {
    this.animTime += dt;

    if (this.invincibleTime > 0) {
      this.invincibleTime -= dt;
    }
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    let moveDir = 0;
    if (input.isKeyDown('a') || input.isKeyDown('arrowleft')) moveDir = -1;
    if (input.isKeyDown('d') || input.isKeyDown('arrowright')) moveDir = 1;
    if (input.touch && input.touch.moveX) {
      if (input.touch.moveX < -0.2) moveDir = -1;
      if (input.touch.moveX > 0.2) moveDir = 1;
    }

    if (moveDir !== 0) {
      this.facing = moveDir;
      physics.applyMovement(this, moveDir, dt);

      if (this.onGround && this.autoJumpEnabled && this.checkAutoJump(world, moveDir)) {
        physics.jump(this);
      }
    } else {
      physics.applyFriction(this, dt);
    }

    if (input.isKeyPressed('w') || input.isKeyPressed(' ') || input.isKeyPressed('arrowup')) {
      physics.jump(this);
    }

    // 触屏跳跃按钮
    if (input.touch && input.touch.jump) {
      physics.jump(this);
    }

    super.update(dt, world, physics);

    if (this.x < this.width) {
      this.x = this.width;
      this.vx = 0;
    }
    if (this.x > WORLD_WIDTH * TILE_SIZE - this.width) {
      this.x = WORLD_WIDTH * TILE_SIZE - this.width;
      this.vx = 0;
    }

    const scroll = input.getScrollWheel();
    if (scroll !== 0) {
      let newSlot = this.inventory.selectedSlot + scroll;
      if (newSlot < 0) newSlot = this.inventory.hotbarSize - 1;
      if (newSlot >= this.inventory.hotbarSize) newSlot = 0;
      this.inventory.setSelectedSlot(newSlot);
    }

    for (let i = 1; i <= 9; i++) {
      if (input.isKeyPressed(i.toString())) {
        this.inventory.setSelectedSlot(i - 1);
      }
    }

    if (this.hunger > 0) {
      this.hunger -= dt * 0.01;
      if (this.hunger < 0) this.hunger = 0;
    }
    if (this.hunger <= 0) {
      this.takeDamage(dt * 0.5);
    }
    if (this.hunger >= 18 && this.health < this.maxHealth) {
      this.health += dt * 0.5;
      if (this.health > this.maxHealth) this.health = this.maxHealth;
    }

    if (this.y > WORLD_HEIGHT * TILE_SIZE + 100) {
      this.takeDamage(100);
    }
  }

  tryMining(world, input, dt) {
    const mouse = input.getMouseWorldPos();
    const tileX = Math.floor(mouse.x / TILE_SIZE);
    const tileY = Math.floor(mouse.y / TILE_SIZE);

    const dist = Math.sqrt(
      Math.pow(mouse.x - this.x, 2) +
      Math.pow(mouse.y - (this.y - this.height / 2), 2)
    );

    if (dist > 6 * TILE_SIZE) {
      this.miningProgress = 0;
      this.miningTarget = null;
      return;
    }

    const blockType = world.getBlock(tileX, tileY);
    if (blockType === BlockType.AIR) {
      this.miningProgress = 0;
      this.miningTarget = null;
      return;
    }

    const selectedItem = this.inventory.getSelectedItem();
    const toolType = this.itemToBlockType(selectedItem?.type);

    const key = `${tileX},${tileY}`;
    if (this.miningTarget !== key) {
      this.miningTarget = key;
      this.miningProgress = 0;
    }

    const miningTime = getMiningTime(blockType, toolType);
    if (miningTime === Infinity) return;

    this.miningProgress += dt / miningTime;

    if (this.miningProgress >= 1) {
      this.breakBlock(world, tileX, tileY);
      this.miningProgress = 0;
      this.miningTarget = null;
    }
  }

  stopMining() {
    this.miningProgress = 0;
    this.miningTarget = null;
  }

  breakBlock(world, tileX, tileY) {
    const blockType = world.getBlock(tileX, tileY);
    const props = BlockProperties[blockType];
    if (!props || props.hardness < 0) return;

    const selectedItem = this.inventory.getSelectedItem();
    const toolType = this.itemToBlockType(selectedItem?.type);

    if (props.minTool && !isToolEffective(toolType, blockType)) {
      return;
    }

    world.setBlock(tileX, tileY, BlockType.AIR);

    if (props.drop !== null && props.drop !== undefined) {
      const dropItem = this.blockTypeToItemType(props.drop);
      if (dropItem) {
        this.inventory.addItem(dropItem, 1);
      }
    }
  }

  placeBlock(world, input) {
    const mouse = input.getMouseWorldPos();
    const tileX = Math.floor(mouse.x / TILE_SIZE);
    const tileY = Math.floor(mouse.y / TILE_SIZE);

    const dist = Math.sqrt(
      Math.pow(mouse.x - this.x, 2) +
      Math.pow(mouse.y - (this.y - this.height / 2), 2)
    );

    if (dist > 6 * TILE_SIZE) return;

    if (world.getBlock(tileX, tileY) !== BlockType.AIR) return;

    const playerBounds = this.getBounds();
    const blockBounds = {
      x: tileX * TILE_SIZE,
      y: tileY * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    };

    if (this.rectsOverlap(playerBounds, blockBounds)) return;

    const selectedItem = this.inventory.getSelectedItem();
    if (!selectedItem || !selectedItem.type) return;

    const info = ItemInfo[selectedItem.type];
    if (!info || !info.placeAs) return;

    world.setBlock(tileX, tileY, info.placeAs);
    this.inventory.removeItem(this.inventory.selectedSlot, 1);
  }

  useItem() {
    const selectedItem = this.inventory.getSelectedItem();
    if (!selectedItem || !selectedItem.type) return false;

    const info = ItemInfo[selectedItem.type];
    if (info && info.food) {
      this.hunger = Math.min(this.maxHunger, this.hunger + info.food);
      this.inventory.removeItem(this.inventory.selectedSlot, 1);
      return true;
    }
    return false;
  }

  attack(entity) {
    if (this.attackCooldown > 0) return false;
    const selectedItem = this.inventory.getSelectedItem();
    let damage = 1;
    if (selectedItem && selectedItem.type) {
      const info = ItemInfo[selectedItem.type];
      if (info && info.damage) damage = info.damage;
    }
    entity.takeDamage(damage);
    this.attackCooldown = 0.3;
    return true;
  }

  takeDamage(amount) {
    if (this.invincibleTime > 0) return;
    super.takeDamage(amount);
    this.invincibleTime = 0.5;
  }

  checkAutoJump(world, moveDir) {
    const checkX = Math.floor((this.x + moveDir * this.width / 2) / TILE_SIZE) + moveDir;
    const checkY = Math.floor((this.y - this.height) / TILE_SIZE);
    
    for (let dy = 0; dy <= 2; dy++) {
      const block = world.getBlock(checkX, checkY + dy);
      if (block !== BlockType.AIR) {
        const props = BlockProperties[block];
        if (props && props.solid) {
          const headY = Math.floor((this.y - this.height - 1) / TILE_SIZE);
          return checkY + dy === headY + 1;
        }
      }
    }
    return false;
  }

  rectsOverlap(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  itemToBlockType(itemType) {
    if (!itemType) return null;
    const map = {
      [ItemType.WOODEN_PICKAXE]: BlockType.WOODEN_PICKAXE,
      [ItemType.STONE_PICKAXE]: BlockType.STONE_PICKAXE,
      [ItemType.IRON_PICKAXE]: BlockType.IRON_PICKAXE,
      [ItemType.WOODEN_AXE]: BlockType.WOODEN_AXE,
      [ItemType.STONE_AXE]: BlockType.STONE_AXE,
      [ItemType.IRON_AXE]: BlockType.IRON_AXE,
    };
    return map[itemType] || null;
  }

  blockTypeToItemType(blockType) {
    const map = {
      [BlockType.DIRT]: ItemType.DIRT,
      [BlockType.GRASS]: ItemType.GRASS,
      [BlockType.STONE]: ItemType.STONE,
      [BlockType.WOOD]: ItemType.WOOD,
      [BlockType.LEAVES]: ItemType.LEAVES,
      [BlockType.SAND]: ItemType.SAND,
      [BlockType.COAL]: ItemType.COAL,
      [BlockType.IRON_ORE]: ItemType.IRON_ORE,
      [BlockType.PLANKS]: ItemType.PLANKS,
      [BlockType.COBBLESTONE]: ItemType.COBBLESTONE,
      [BlockType.WORKBENCH]: ItemType.WORKBENCH,
      [BlockType.WOOL]: ItemType.WOOL,
    };
    return map[blockType] || null;
  }

  serialize() {
    const data = super.serialize();
    data.hunger = this.hunger;
    data.maxHunger = this.maxHunger;
    data.inventory = this.inventory.serialize();
    return data;
  }

  static deserialize(data) {
    const player = new Player(data.x, data.y);
    Object.assign(player, data);
    if (data.inventory) {
      player.inventory = Inventory.deserialize(data.inventory);
    }
    return player;
  }
}
