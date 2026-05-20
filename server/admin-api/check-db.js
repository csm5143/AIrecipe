const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
Promise.all([
  p.recipe.count(),
  p.user.count(),
  p.ingredient.count(),
  p.admin.count(),
]).then(([r, u, i, a]) => {
  console.log('Recipe:', r, '| User:', u, '| Ingredient:', i, '| Admin:', a);
  p.$disconnect();
}).catch(e => {
  console.error('Error:', e.message);
  p.$disconnect();
});
