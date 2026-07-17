class CraftingSystem {
  static checkRecipe(grid, size = 2) {
    const recipes = size === 2 ? CraftingRecipes2x2 : CraftingRecipes3x3;
    for (const recipe of recipes) {
      if (this.matchRecipe(grid, recipe.input, size)) {
        return recipe.output;
      }
    }
    return null;
  }

  static matchRecipe(grid, recipeInput, size) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const gridItem = grid[y][x];
        const recipeItem = recipeInput[y][x];
        if (recipeItem === null) {
          if (gridItem !== null && gridItem.type !== null) return false;
        } else {
          if (!gridItem || gridItem.type !== recipeItem || gridItem.count < 1) return false;
        }
      }
    }
    return true;
  }

  static craft(inventory, gridSize = 2, gridSlots = null) {
    const size = gridSize;
    const grid = gridSlots || [];
    if (!gridSlots) {
      for (let y = 0; y < size; y++) {
        grid[y] = [];
        for (let x = 0; x < size; x++) {
          grid[y][x] = null;
        }
      }
    }

    const result = this.checkRecipe(grid, size);
    if (!result) return false;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (grid[y][x] && grid[y][x].type) {
          grid[y][x].count--;
          if (grid[y][x].count <= 0) {
            grid[y][x] = { type: null, count: 0 };
          }
        }
      }
    }

    inventory.addItem(result.type, result.count);
    return result;
  }

  static findAllRecipes(inventory) {
    const results = [];
    const allRecipes = [...CraftingRecipes2x2, ...CraftingRecipes3x3];
    for (const recipe of allRecipes) {
      let canCraft = true;
      const needed = {};
      for (const row of recipe.input) {
        for (const item of row) {
          if (item) {
            needed[item] = (needed[item] || 0) + 1;
          }
        }
      }
      for (const [item, count] of Object.entries(needed)) {
        if (inventory.getItemCount(item) < count) {
          canCraft = false;
          break;
        }
      }
      if (canCraft) {
        results.push(recipe.output);
      }
    }
    return results;
  }
}
