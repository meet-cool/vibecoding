class Physics {
  constructor(world) {
    this.world = world;
    this.gravity = 1800;
    this.maxFallSpeed = 900;
    this.jumpForce = -520;
    this.moveSpeed = 200;
  }

  updateEntity(entity, dt) {
    entity.vy += this.gravity * dt;
    if (entity.vy > this.maxFallSpeed) entity.vy = this.maxFallSpeed;

    this.moveHorizontal(entity, entity.vx * dt);
    this.moveVertical(entity, entity.vy * dt);
  }

  moveHorizontal(entity, dx) {
    entity.x += dx;
    const direction = dx > 0 ? 1 : -1;
    const bounds = this.getEntityBounds(entity);

    const leftTile = Math.floor(bounds.x / TILE_SIZE);
    const rightTile = Math.floor((bounds.x + bounds.width - 1) / TILE_SIZE);
    const topTile = Math.floor(bounds.y / TILE_SIZE);
    const bottomTile = Math.floor((bounds.y + bounds.height - 0.01) / TILE_SIZE);

    for (let y = topTile; y <= bottomTile; y++) {
      if (direction > 0) {
        if (this.world.isSolid(rightTile, y)) {
          entity.x = rightTile * TILE_SIZE - entity.width / 2 - 0.01;
          entity.vx = 0;
          return;
        }
      } else {
        if (this.world.isSolid(leftTile, y)) {
          entity.x = (leftTile + 1) * TILE_SIZE + entity.width / 2 + 0.01;
          entity.vx = 0;
          return;
        }
      }
    }
  }

  moveVertical(entity, dy) {
    entity.y += dy;
    const direction = dy > 0 ? 1 : -1;
    const bounds = this.getEntityBounds(entity);

    const leftTile = Math.floor(bounds.x / TILE_SIZE);
    const rightTile = Math.floor((bounds.x + bounds.width - 1) / TILE_SIZE);
    const topTile = Math.floor(bounds.y / TILE_SIZE);
    const bottomTile = Math.floor((bounds.y + bounds.height - 0.01) / TILE_SIZE);

    for (let x = leftTile; x <= rightTile; x++) {
      if (direction > 0) {
        if (this.world.isSolid(x, bottomTile)) {
          entity.y = bottomTile * TILE_SIZE - 0.01;
          entity.vy = 0;
          entity.onGround = true;
          return;
        }
      } else {
        if (this.world.isSolid(x, topTile)) {
          entity.y = (topTile + 1) * TILE_SIZE + entity.height + 0.01;
          entity.vy = 0;
          return;
        }
      }
    }

    if (direction > 0) {
      entity.onGround = false;
    }
  }

  getEntityBounds(entity) {
    return {
      x: entity.x - entity.width / 2,
      y: entity.y - entity.height,
      width: entity.width,
      height: entity.height,
    };
  }

  checkCollision(a, b) {
    const aBounds = this.getEntityBounds(a);
    const bBounds = this.getEntityBounds(b);
    return (
      aBounds.x < bBounds.x + bBounds.width &&
      aBounds.x + aBounds.width > bBounds.x &&
      aBounds.y < bBounds.y + bBounds.height &&
      aBounds.y + aBounds.height > bBounds.y
    );
  }

  applyMovement(entity, direction, dt) {
    const targetVx = direction * this.moveSpeed;
    const accel = entity.onGround ? 1000 : 600;
    if (entity.vx < targetVx) {
      entity.vx = Math.min(targetVx, entity.vx + accel * dt);
    } else if (entity.vx > targetVx) {
      entity.vx = Math.max(targetVx, entity.vx - accel * dt);
    }
  }

  applyFriction(entity, dt) {
    if (entity.onGround) {
      const friction = 800;
      if (entity.vx > 0) {
        entity.vx = Math.max(0, entity.vx - friction * dt);
      } else if (entity.vx < 0) {
        entity.vx = Math.min(0, entity.vx + friction * dt);
      }
    }
  }

  jump(entity) {
    if (entity.onGround) {
      entity.vy = this.jumpForce;
      entity.onGround = false;
    }
  }
}
