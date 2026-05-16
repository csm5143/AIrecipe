const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname);

// Convert ingredients.json
const ingData = JSON.parse(fs.readFileSync(path.join(dataDir, 'ingredients.json'), 'utf8'));
const ingOut = '// auto-generated\nconst ingredients = ' + JSON.stringify(ingData) + ';\nmodule.exports = ingredients;';
fs.writeFileSync(path.join(dataDir, 'ingredients.js'), ingOut);
console.log('ingredients.js done, items:', ingData.length);

// Convert hotRecipes.json
const hotData = JSON.parse(fs.readFileSync(path.join(dataDir, 'hotRecipes.json'), 'utf8'));
const hotOut = '// auto-generated\nconst hotRecipes = ' + JSON.stringify(hotData) + ';\nmodule.exports = hotRecipes;';
fs.writeFileSync(path.join(dataDir, 'hotRecipes.js'), hotOut);
console.log('hotRecipes.js done, items:', Array.isArray(hotData) ? hotData.length : 'object');

// Convert recipes.json
const recipesData = JSON.parse(fs.readFileSync(path.join(dataDir, 'recipes.json'), 'utf8'));
const recipesOut = '// auto-generated\nconst recipes = ' + JSON.stringify(recipesData) + ';\nmodule.exports = recipes;';
fs.writeFileSync(path.join(dataDir, 'recipes.js'), recipesOut);
console.log('recipes.js done, items:', recipesData.length);
