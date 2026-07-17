class Mob extends Entity {
  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.type = 'mob';
    this.mobType = 'generic';
    this.state = 'idle';
    this.stateTimer = 0;
    this.moveDir = 0;
    this.speed = 80;
    this.jumpChance = 0.02;
    this.damage = 2;
    this.attackCooldown = 0;
    this.attackRange = 30;
    this.detectRange = 200;
    this.escapeRange = 300;
    this.drops = [];
    this.xpDrop = 0;
  }

  update(dt, world, physics, player) {
    this.stateTimer -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    this.updateAI(dt, world, physics, player);

    if (this.moveDir !== 0) {
      this.facing = this.moveDir;
      physics.applyMovement(this, this.moveDir, dt);
      this.vx *= 0.8;
      physics.moveHorizontal(this, this.vx * dt * 0.3);
    } else {
      physics.applyFriction(this, dt);
    }

    if (this.onGround && Math.random() < this.jumpChance * dt * 60) {
      physics.jump(this);
    }

    super.update(dt, world, physics);

    if (this.x < this.width) {
      this.x = this.width;
      this.moveDir = 1;
    }
    if (this.x > WORLD_WIDTH * TILE_SIZE - this.width) {
      this.x = WORLD_WIDTH * TILE_SIZE - this.width;
      this.moveDir = -1;
    }
  }

  updateAI(dt, world, physics, player) {
  }

  moveRandomly() {
    if (this.stateTimer <= 0) {
      this.stateTimer = 1 + Math.random() * 3;
      const r = Math.random();
      if (r < 0.3) {
        this.moveDir = -1;
      } else if (r < 0.6) {
        this.moveDir = 1;
      } else {
        this.moveDir = 0;
      }
    }

    const tileX = Math.floor((this.x + this.moveDir * this.width) / TILE_SIZE);
    const tileY = Math.floor((this.y - 1) / TILE_SIZE);
    const groundTileY = Math.floor(this.y / TILE_SIZE);

    if (this.moveDir !== 0) {
      if (!this.worldIsSolid(tileX, groundTileY)) {
        this.moveDir = 0;
        this.stateTimer = 0.5;
      }
      if (this.worldIsSolid(tileX, tileY)) {
        this.moveDir *= -1;
        this.stateTimer = 1;
      }
    }
  }

  worldIsSolid(tileX, tileY) {
    return false;
  }

  getDistanceToPlayer(player) {
    return Math.sqrt(
      Math.pow(this.x - player.x, 2) +
      Math.pow(this.y - player.y, 2)
    );
  }

  facePlayer(player) {
    this.facing = player.x > this.x ? 1 : -1;
  }
}
