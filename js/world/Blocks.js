const BlockType = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  SAND: 6,
  WATER: 7,
  COAL_ORE: 8,
  IRON_ORE: 9,
  PLANKS: 10,
  COBBLESTONE: 11,
  BEDROCK: 12,
  TORCH: 13,
  WORKBENCH: 14,
  FURNACE: 15,
  WOOL: 16,
  MUTTON: 17,
  PORKCHOP: 18,
  COAL: 19,
  IRON_INGOT: 20,
  STICK: 21,
  WOODEN_PICKAXE: 22,
  STONE_PICKAXE: 23,
  IRON_PICKAXE: 24,
  WOODEN_SWORD: 25,
  STONE_SWORD: 26,
  IRON_SWORD: 27,
  WOODEN_AXE: 28,
  STONE_AXE: 29,
  IRON_AXE: 30,
};

const BlockProperties = {
  [BlockType.AIR]: { name: 'air', solid: false, hardness: 0, color: 'transparent', drop: null },
  [BlockType.GRASS]: { name: 'grass', solid: true, hardness: 0.6, color: '#4CAF50', topColor: '#66BB6A', dirtColor: '#8B4513', drop: BlockType.DIRT },
  [BlockType.DIRT]: { name: 'dirt', solid: true, hardness: 0.5, color: '#8B4513', drop: BlockType.DIRT },
  [BlockType.STONE]: { name: 'stone', solid: true, hardness: 1.5, color: '#757575', drop: BlockType.COBBLESTONE, minTool: 'wooden_pickaxe' },
  [BlockType.WOOD]: { name: 'wood', solid: true, hardness: 1.2, color: '#6D4C41', drop: BlockType.WOOD },
  [BlockType.LEAVES]: { name: 'leaves', solid: false, hardness: 0.2, color: '#2E7D32', drop: null, transparent: true },
  [BlockType.SAND]: { name: 'sand', solid: true, hardness: 0.5, color: '#FDD835', drop: BlockType.SAND },
  [BlockType.WATER]: { name: 'water', solid: false, hardness: -1, color: '#42A5F5', transparent: true, drop: null },
  [BlockType.COAL_ORE]: { name: 'coal_ore', solid: true, hardness: 2.0, color: '#424242', specks: '#212121', drop: BlockType.COAL, minTool: 'wooden_pickaxe' },
  [BlockType.IRON_ORE]: { name: 'iron_ore', solid: true, hardness: 3.0, color: '#757575', specks: '#FFB74D', drop: BlockType.IRON_ORE, minTool: 'stone_pickaxe' },
  [BlockType.PLANKS]: { name: 'planks', solid: true, hardness: 0.8, color: '#BCAAA4', drop: BlockType.PLANKS },
  [BlockType.COBBLESTONE]: { name: 'cobblestone', solid: true, hardness: 1.5, color: '#616161', drop: BlockType.COBBLESTONE },
  [BlockType.BEDROCK]: { name: 'bedrock', solid: true, hardness: -1, color: '#212121', drop: null },
  [BlockType.TORCH]: { name: 'torch', solid: false, hardness: 0.1, color: '#FFD54F', drop: BlockType.TORCH, transparent: true },
  [BlockType.WORKBENCH]: { name: 'workbench', solid: true, hardness: 1.0, color: '#8D6E63', drop: BlockType.WORKBENCH },
  [BlockType.FURNACE]: { name: 'furnace', solid: true, hardness: 1.5, color: '#616161', drop: BlockType.COBBLESTONE },
  [BlockType.WOOL]: { name: 'wool', solid: true, hardness: 0.4, color: '#FAFAFA', drop: BlockType.WOOL },
};

const ToolLevels = {
  wooden_pickaxe: 1,
  stone_pickaxe: 2,
  iron_pickaxe: 3,
  golden_pickaxe: 2,
  diamond_pickaxe: 4,
};

function getToolLevel(itemType) {
  if (itemType === BlockType.WOODEN_PICKAXE) return 1;
  if (itemType === BlockType.STONE_PICKAXE) return 2;
  if (itemType === BlockType.IRON_PICKAXE) return 3;
  return 0;
}

function isToolEffective(toolType, blockType) {
  const props = BlockProperties[blockType];
  if (!props || !props.minTool) return true;
  const toolLevel = getToolLevel(toolType);
  const minLevel = props.minTool === 'wooden_pickaxe' ? 1 : props.minTool === 'stone_pickaxe' ? 2 : 3;
  return toolLevel >= minLevel;
}

function getMiningTime(blockType, toolType) {
  const props = BlockProperties[blockType];
  if (!props || props.hardness < 0) return Infinity;
  let time = props.hardness;
  if (isToolEffective(toolType, blockType)) {
    if (toolType === BlockType.WOODEN_PICKAXE) time /= 2;
    else if (toolType === BlockType.STONE_PICKAXE) time /= 4;
    else if (toolType === BlockType.IRON_PICKAXE) time /= 6;
  }
  if (toolType === BlockType.WOODEN_AXE && blockType === BlockType.WOOD) time /= 2;
  if (toolType === BlockType.STONE_AXE && blockType === BlockType.WOOD) time /= 4;
  if (toolType === BlockType.IRON_AXE && blockType === BlockType.WOOD) time /= 6;
  return Math.max(0.05, time);
}

const TILE_SIZE = 32;
const CHUNK_WIDTH = 16;
const CHUNK_HEIGHT = 128;
const WORLD_WIDTH_CHUNKS = 32;
const WORLD_HEIGHT = CHUNK_HEIGHT;
const WORLD_WIDTH = WORLD_WIDTH_CHUNKS * CHUNK_WIDTH;
