class EntityManager {
  constructor() {
    this.entities = [];
    this.mobCap = 10;
  }

  addEntity(entity) {
    this.entities.push(entity);
  }

  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
    }
  }

  update(dt, world, physics, player) {
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      if (entity.dead) {
        if (entity.getDropItems) {
          const drops = entity.getDropItems();
          for (const drop of drops) {
            player.inventory.addItem(drop.type, drop.count);
          }
        }
        this.removeEntity(entity);
        continue;
      }

      if (entity.update) {
        const oldWorldIsSolid = entity.worldIsSolid;
        entity.worldIsSolid = (tx, ty) => world.isSolid(tx, ty);
        entity.update(dt, world, physics, player);
        entity.worldIsSolid = oldWorldIsSolid;
      }
    }

    this.spawnMobs(world, player);
  }

  spawnMobs(world, player) {
    const animalCount = this.entities.filter(e => e.mobType === 'sheep' || e.mobType === 'pig').length;
    const monsterCount = this.entities.filter(e => e.hostile).length;

    if (animalCount < 8 && Math.random() < 0.01) {
      const spawnX = player.x + (Math.random() - 0.5) * 500;
      const tileX = Math.floor(spawnX / TILE_SIZE);
      if (tileX > 1 && tileX < WORLD_WIDTH - 1) {
        const surfaceY = this.findSurface(world, tileX);
        if (surfaceY > 10 && surfaceY < 100) {
          const y = (surfaceY + 1) * TILE_SIZE;
          const r = Math.random();
          if (r < 0.5) {
            this.addEntity(new Sheep(spawnX, y));
          } else {
            this.addEntity(new Pig(spawnX, y));
          }
        }
      }
    }

    if (monsterCount < 3 && Math.random() < 0.002) {
      const spawnX = player.x + (Math.random() < 0.5 ? -1 : 1) * (300 + Math.random() * 200);
      const tileX = Math.floor(spawnX / TILE_SIZE);
      if (tileX > 1 && tileX < WORLD_WIDTH - 1) {
        const surfaceY = this.findSurface(world, tileX);
        if (surfaceY > 10 && surfaceY < 100) {
          const y = (surfaceY + 1) * TILE_SIZE;
          this.addEntity(new Zombie(spawnX, y));
        }
      }
    }
  }

  findSurface(world, tileX) {
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      if (world.isSolid(tileX, y)) {
        return y - 1;
      }
    }
    return -1;
  }

  getEntitiesNear(x, y, radius) {
    return this.entities.filter(e => {
      const dist = Math.sqrt(Math.pow(e.x - x, 2) + Math.pow(e.y - y, 2));
      return dist < radius;
    });
  }

  serialize() {
    return this.entities
      .filter(e => e.type === 'mob')
      .map(e => ({
        mobType: e.mobType,
        x: e.x,
        y: e.y,
        health: e.health,
        vx: e.vx,
        vy: e.vy,
      }));
  }

  static deserialize(data) {
    const manager = new EntityManager();
    if (data && data.length) {
      for (const mobData of data) {
        let mob;
        if (mobData.mobType === 'sheep') {
          mob = new Sheep(mobData.x, mobData.y);
        } else if (mobData.mobType === 'pig') {
          mob = new Pig(mobData.x, mobData.y);
        } else if (mobData.mobType === 'zombie') {
          mob = new Zombie(mobData.x, mobData.y);
        }
        if (mob) {
          mob.health = mobData.health;
          mob.vx = mobData.vx || 0;
          mob.vy = mobData.vy || 0;
          manager.addEntity(mob);
        }
      }
    }
    return manager;
  }
}
