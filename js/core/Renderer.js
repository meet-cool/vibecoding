class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.camera = { x: 0, y: 0 };
    this.width = canvas.width;
    this.height = canvas.height;
    this.timeOfDay = 0;
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
    this.ctx.imageSmoothingEnabled = false;
  }

  updateCamera(targetX, targetY) {
    this.camera.x = targetX - this.width / 2;
    this.camera.y = targetY - this.height / 2;

    this.camera.x = Math.max(0, Math.min(this.camera.x, WORLD_WIDTH * TILE_SIZE - this.width));
    this.camera.y = Math.max(0, Math.min(this.camera.y, WORLD_HEIGHT * TILE_SIZE - this.height));
  }

  clear(timeOfDay = 0) {
    this.timeOfDay = timeOfDay;
    const skyColor = this.getSkyColor(timeOfDay);
    this.ctx.fillStyle = skyColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  getSkyColor(timeOfDay) {
    const progress = timeOfDay / 120;
    if (progress < 0.35) {
      return this.lerpColor('#87CEEB', '#FFB74D', progress / 0.35);
    } else if (progress < 0.45) {
      return this.lerpColor('#FFB74D', '#FF5722', (progress - 0.35) / 0.1);
    } else if (progress < 0.5) {
      return this.lerpColor('#FF5722', '#87CEEB', (progress - 0.45) / 0.05);
    } else if (progress < 0.85) {
      return '#87CEEB';
    } else if (progress < 0.95) {
      return this.lerpColor('#87CEEB', '#7E57C2', (progress - 0.85) / 0.1);
    } else {
      return this.lerpColor('#7E57C2', '#1A237E', (progress - 0.95) / 0.05);
    }
  }

  lerpColor(c1, c2, t) {
    const r1 = parseInt(c1.slice(1, 3), 16);
    const g1 = parseInt(c1.slice(3, 5), 16);
    const b1 = parseInt(c1.slice(5, 7), 16);
    const r2 = parseInt(c2.slice(1, 3), 16);
    const g2 = parseInt(c2.slice(3, 5), 16);
    const b2 = parseInt(c2.slice(5, 7), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  renderClouds(time) {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const cloudY1 = 80 - this.camera.y * 0.3;
    const cloudY2 = 150 - this.camera.y * 0.3;

    for (let i = 0; i < 5; i++) {
      const cx = ((i * 400 + time * 10) % (this.width + 400)) - 200 - (this.camera.x * 0.1) % 400;
      this.drawCloud(cx, cloudY1 + i * 30, 80 + i * 10);
    }
  }

  drawCloud(x, y, size) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.35, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.6, y, size * 0.3, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.3, y + size * 0.15, size * 0.3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderBackgroundMountains() {
    const baseY = this.height - 200 + this.camera.y * 0.2;
    this.ctx.fillStyle = '#90A4AE';

    this.ctx.beginPath();
    this.ctx.moveTo(0, this.height);
    for (let x = 0; x <= this.width; x += 50) {
      const worldX = x + this.camera.x * 0.3;
      const h = Math.sin(worldX * 0.003) * 80 + Math.sin(worldX * 0.007) * 40 + 100;
      this.ctx.lineTo(x, baseY - h);
    }
    this.ctx.lineTo(this.width, this.height);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#B0BEC5';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.height);
    for (let x = 0; x <= this.width; x += 30) {
      const worldX = x + this.camera.x * 0.5;
      const h = Math.sin(worldX * 0.005 + 10) * 60 + Math.sin(worldX * 0.01) * 30 + 60;
      this.ctx.lineTo(x, baseY + 40 - h);
    }
    this.ctx.lineTo(this.width, this.height);
    this.ctx.closePath();
    this.ctx.fill();
  }

  renderWorld(world) {
    const startTileX = Math.floor(this.camera.x / TILE_SIZE);
    const endTileX = Math.ceil((this.camera.x + this.width) / TILE_SIZE);
    const startTileY = Math.floor(this.camera.y / TILE_SIZE);
    const endTileY = Math.ceil((this.camera.y + this.height) / TILE_SIZE);

    for (let y = Math.max(0, startTileY); y < Math.min(WORLD_HEIGHT, endTileY); y++) {
      for (let x = Math.max(0, startTileX); x < Math.min(WORLD_WIDTH, endTileX); x++) {
        const blockType = world.getBlock(x, y);
        if (blockType !== BlockType.AIR) {
          this.drawBlock(x, y, blockType);
        }
      }
    }
  }

  drawBlock(tileX, tileY, blockType) {
    const screenX = tileX * TILE_SIZE - this.camera.x;
    const screenY = tileY * TILE_SIZE - this.camera.y;
    const props = BlockProperties[blockType];
    if (!props) return;

    this.ctx.fillStyle = props.color;
    this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

    if (blockType === BlockType.GRASS) {
      this.ctx.fillStyle = props.topColor || '#66BB6A';
      this.ctx.fillRect(screenX, screenY, TILE_SIZE, 6);

      this.ctx.fillStyle = props.dirtColor || '#8B4513';
      this.ctx.fillRect(screenX, screenY + 6, TILE_SIZE, TILE_SIZE - 6);

      this.ctx.fillStyle = '#81C784';
      for (let i = 0; i < 4; i++) {
        const px = screenX + 2 + i * 8;
        this.ctx.fillRect(px, screenY - 2, 2, 4);
      }
    }

    if (blockType === BlockType.DIRT || blockType === BlockType.STONE || blockType === BlockType.COBBLESTONE) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      for (let i = 0; i < 3; i++) {
        const px = screenX + ((tileX * 7 + i * 11) % (TILE_SIZE - 4));
        const py = screenY + ((tileY * 13 + i * 7) % (TILE_SIZE - 4));
        this.ctx.fillRect(px, py, 4, 4);
      }
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      this.ctx.fillRect(screenX, screenY, TILE_SIZE, 2);
    }

    if (blockType === BlockType.WOOD) {
      this.ctx.fillStyle = '#5D4037';
      for (let i = 0; i < TILE_SIZE; i += 8) {
        this.ctx.fillRect(screenX + i, screenY, 2, TILE_SIZE);
      }
      this.ctx.fillStyle = '#8D6E63';
      this.ctx.fillRect(screenX, screenY, TILE_SIZE, 4);
      this.ctx.fillRect(screenX, screenY + TILE_SIZE - 4, TILE_SIZE, 4);
    }

    if (blockType === BlockType.LEAVES) {
      this.ctx.fillStyle = '#1B5E20';
      for (let i = 0; i < 8; i++) {
        const px = screenX + ((tileX * 3 + i * 5) % (TILE_SIZE - 6));
        const py = screenY + ((tileY * 5 + i * 3) % (TILE_SIZE - 6));
        this.ctx.fillRect(px, py, 6, 6);
      }
      this.ctx.fillStyle = '#388E3C';
      this.ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    }

    if (blockType === BlockType.COAL_ORE || blockType === BlockType.IRON_ORE) {
      this.ctx.fillStyle = '#757575';
      this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      this.ctx.fillStyle = props.specks || '#212121';
      const speckPositions = [
        [4, 6], [14, 4], [22, 12], [8, 18], [20, 22], [6, 26], [24, 26],
      ];
      for (const [sx, sy] of speckPositions) {
        this.ctx.fillRect(screenX + sx, screenY + sy, 5, 5);
      }
    }

    if (blockType === BlockType.WATER) {
      this.ctx.fillStyle = 'rgba(66, 165, 245, 0.7)';
      this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      const wave = Math.sin((tileX + Date.now() * 0.002)) * 2;
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(screenX, screenY + wave, TILE_SIZE, 2);
    }

    if (blockType === BlockType.SAND) {
      this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      for (let i = 0; i < 5; i++) {
        const px = screenX + ((tileX * 11 + i * 7) % (TILE_SIZE - 2));
        const py = screenY + ((tileY * 7 + i * 13) % (TILE_SIZE - 2));
        this.ctx.fillRect(px, py, 2, 2);
      }
    }

    if (blockType === BlockType.BEDROCK) {
      this.ctx.fillStyle = '#424242';
      for (let i = 0; i < 6; i++) {
        const px = screenX + ((tileX * 13 + i * 5) % (TILE_SIZE - 6));
        const py = screenY + ((tileY * 11 + i * 7) % (TILE_SIZE - 6));
        this.ctx.fillRect(px, py, 6, 6);
      }
    }

    if (blockType === BlockType.PLANKS) {
      this.ctx.fillStyle = '#A1887F';
      for (let i = 0; i < TILE_SIZE; i += 8) {
        this.ctx.fillRect(screenX, screenY + i, TILE_SIZE, 1);
      }
    }

    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(screenX + 0.5, screenY + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
  }

  renderMiningProgress(player, input) {
    if (player.miningProgress <= 0 || !player.miningTarget) return;

    const [tileX, tileY] = player.miningTarget.split(',').map(Number);
    const screenX = tileX * TILE_SIZE - this.camera.x;
    const screenY = tileY * TILE_SIZE - this.camera.y;

    const cracks = Math.floor(player.miningProgress * 5);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';

    for (let i = 0; i < cracks; i++) {
      const cx = screenX + 4 + i * 6;
      const cy = screenY + 8 + (i % 2) * 12;
      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy);
      this.ctx.lineTo(cx + 4, cy + 6);
      this.ctx.lineTo(cx - 2, cy + 10);
      this.ctx.lineTo(cx + 6, cy + 16);
      this.ctx.stroke();
    }

    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(screenX + 1, screenY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
  }

  renderPlayer(player) {
    const screenX = player.x - this.camera.x;
    const screenY = player.y - this.camera.y;

    if (player.invincibleTime > 0 && Math.floor(player.invincibleTime * 10) % 2 === 0) {
      this.ctx.globalAlpha = 0.5;
    }

    const bodyColor = '#3498DB';
    const skinColor = '#FFCC99';
    const hairColor = '#5D4037';
    const legColor = '#1565C0';
    const shoeColor = '#424242';

    const walkPhase = player.onGround && Math.abs(player.vx) > 10
      ? Math.sin(player.animTime * 10) * 4
      : 0;

    const headX = screenX - 10;
    const headY = screenY - player.height;
    const headW = 20;
    const headH = 20;

    this.ctx.fillStyle = hairColor;
    this.ctx.fillRect(headX, headY, headW, 6);
    this.ctx.fillRect(headX - 2, headY + 2, 4, 6);
    this.ctx.fillRect(headX + headW - 2, headY + 2, 4, 6);

    this.ctx.fillStyle = skinColor;
    this.ctx.fillRect(headX + 2, headY + 6, headW - 4, headH - 6);

    this.ctx.fillStyle = '#212121';
    const eyeOffset = player.facing > 0 ? 2 : -2;
    this.ctx.fillRect(headX + 6 + eyeOffset, headY + 10, 2, 2);
    this.ctx.fillRect(headX + 12 + eyeOffset, headY + 10, 2, 2);

    const bodyX = screenX - 8;
    const bodyY = headY + headH;
    const bodyW = 16;
    const bodyH = 18;

    this.ctx.fillStyle = bodyColor;
    this.ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

    const armY = bodyY + 2;
    const armW = 4;
    const armH = 14;
    const armSwing = player.onGround ? walkPhase * 0.8 : -4;

    this.ctx.fillStyle = skinColor;
    this.ctx.fillRect(bodyX - armW + 1, armY - armSwing, armW, armH);
    this.ctx.fillRect(bodyX + bodyW - 1, armY + armSwing, armW, armH);

    const legY = bodyY + bodyH;
    const legW = 6;
    const legH = 10;

    this.ctx.fillStyle = legColor;
    this.ctx.fillRect(bodyX + 1, legY + walkPhase, legW, legH);
    this.ctx.fillRect(bodyX + bodyW - legW - 1, legY - walkPhase, legW, legH);

    this.ctx.fillStyle = shoeColor;
    this.ctx.fillRect(bodyX, legY + legH + walkPhase - 1, legW + 2, 4);
    this.ctx.fillRect(bodyX + bodyW - legW - 2, legY + legH - walkPhase - 1, legW + 2, 4);

    this.ctx.globalAlpha = 1;
  }

  renderMob(mob) {
    const screenX = mob.x - this.camera.x;
    const screenY = mob.y - this.camera.y;

    if (mob.mobType === 'sheep') {
      this.drawSheep(screenX, screenY, mob);
    } else if (mob.mobType === 'pig') {
      this.drawPig(screenX, screenY, mob);
    } else if (mob.mobType === 'zombie') {
      this.drawZombie(screenX, screenY, mob);
    }

    if (mob.health < mob.maxHealth) {
      const barWidth = mob.width;
      const barHeight = 4;
      const barX = screenX - barWidth / 2;
      const barY = screenY - mob.height - 10;

      this.ctx.fillStyle = '#424242';
      this.ctx.fillRect(barX, barY, barWidth, barHeight);
      this.ctx.fillStyle = '#F44336';
      this.ctx.fillRect(barX, barY, barWidth * (mob.health / mob.maxHealth), barHeight);
    }
  }

  drawSheep(x, y, mob) {
    const f = mob.facing;
    const grazing = mob.isGrazing;

    this.ctx.fillStyle = '#FAFAFA';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y - 16, 14, 12, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#E0E0E0';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const bx = x + Math.cos(angle) * 10;
      const by = y - 16 + Math.sin(angle) * 8;
      this.ctx.beginPath();
      this.ctx.arc(bx, by, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    const headX = x + f * 12;
    const headY = grazing ? y - 8 : y - 20;
    this.ctx.fillStyle = '#FFCC80';
    this.ctx.beginPath();
    this.ctx.ellipse(headX, headY, 6, 5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#212121';
    this.ctx.fillRect(headX + f * 2, headY - 1, 1.5, 1.5);

    this.ctx.fillStyle = '#424242';
    const legOffset = Math.sin(mob.x * 0.1) * 2;
    this.ctx.fillRect(x - 8, y - 6 + legOffset, 3, 8);
    this.ctx.fillRect(x + 5, y - 6 - legOffset, 3, 8);
    this.ctx.fillRect(x - 4, y - 6 - legOffset, 3, 8);
    this.ctx.fillRect(x + 1, y - 6 + legOffset, 3, 8);
  }

  drawPig(x, y, mob) {
    const f = mob.facing;

    this.ctx.fillStyle = '#F48FB1';
    this.ctx.fillRect(x - 14, y - 18, 28, 14);

    this.ctx.beginPath();
    this.ctx.arc(x - 14, y - 14, 7, 0, Math.PI * 2);
    this.ctx.arc(x + 14, y - 14, 7, 0, Math.PI * 2);
    this.ctx.fill();

    const headX = x + f * 12;
    const headY = y - 14;
    this.ctx.fillStyle = '#F48FB1';
    this.ctx.beginPath();
    this.ctx.ellipse(headX, headY, 7, 6, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#F06292';
    this.ctx.fillRect(headX + f * 4, headY - 1, 4, 3);

    this.ctx.fillStyle = '#212121';
    this.ctx.fillRect(headX + f * 2, headY - 3, 1.5, 1.5);

    this.ctx.fillStyle = '#E91E63';
    this.ctx.fillRect(x - 3, y - 20, 6, 3);

    this.ctx.fillStyle = '#EC407A';
    const legOffset = Math.sin(mob.x * 0.15) * 2;
    this.ctx.fillRect(x - 10, y - 6 + legOffset, 4, 6);
    this.ctx.fillRect(x + 6, y - 6 - legOffset, 4, 6);
  }

  drawZombie(x, y, mob) {
    const f = mob.facing;

    const headX = x - 10;
    const headY = y - mob.height;
    this.ctx.fillStyle = '#558B2F';
    this.ctx.fillRect(headX, headY, 20, 18);

    this.ctx.fillStyle = '#212121';
    this.ctx.fillRect(headX + 4, headY + 6, 4, 4);
    this.ctx.fillRect(headX + 12, headY + 6, 4, 4);
    this.ctx.fillStyle = '#F44336';
    this.ctx.fillRect(headX + 5, headY + 7, 2, 2);
    this.ctx.fillRect(headX + 13, headY + 7, 2, 2);

    this.ctx.fillStyle = '#33691E';
    this.ctx.fillRect(headX + 6, headY + 13, 8, 2);

    this.ctx.fillStyle = '#689F38';
    this.ctx.fillRect(x - 8, headY + 18, 16, 16);

    const walkPhase = Math.sin(mob.x * 0.08) * 3;
    this.ctx.fillStyle = '#33691E';
    this.ctx.fillRect(x - 10, headY + 18, 4, 12);
    this.ctx.fillRect(x + 6, headY + 18, 4, 12);

    this.ctx.fillStyle = '#558B2F';
    this.ctx.fillRect(x - 6, headY + 34, 5, 10 + walkPhase);
    this.ctx.fillRect(x + 1, headY + 34, 5, 10 - walkPhase);
  }

  renderEntities(entityManager) {
    for (const entity of entityManager.entities) {
      if (entity.mobType) {
        this.renderMob(entity);
      }
    }
  }

  renderBlockHighlight(input, player) {
    const mouse = input.getMouseWorldPos();
    const tileX = Math.floor(mouse.x / TILE_SIZE);
    const tileY = Math.floor(mouse.y / TILE_SIZE);

    const dist = Math.sqrt(
      Math.pow(mouse.x - player.x, 2) +
      Math.pow(mouse.y - (player.y - player.height / 2), 2)
    );

    if (dist > 6 * TILE_SIZE) return;

    const screenX = tileX * TILE_SIZE - this.camera.x;
    const screenY = tileY * TILE_SIZE - this.camera.y;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
  }

  renderCursor(input, camera) {
    const touch = input.touch;
    const tc = window.game?.touchControls;
    if (!tc || !tc.cursorInitialized) return;

    const screenX = tc.cursorX;
    const screenY = tc.cursorY;

    this.ctx.strokeStyle = 'rgba(255, 193, 7, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(screenX - 12, screenY - 12, 24, 24);

    this.ctx.fillStyle = 'rgba(255, 193, 7, 0.8)';
    this.ctx.fillRect(screenX - 1, screenY - 8, 2, 6);
    this.ctx.fillRect(screenX - 1, screenY + 2, 2, 6);
    this.ctx.fillRect(screenX - 8, screenY - 1, 6, 2);
    this.ctx.fillRect(screenX + 2, screenY - 1, 6, 2);

    const worldX = screenX + this.camera.x;
    const worldY = screenY + this.camera.y;
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(tileX * TILE_SIZE - this.camera.x, tileY * TILE_SIZE - this.camera.y, TILE_SIZE, TILE_SIZE);
  }
}
