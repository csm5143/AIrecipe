-- CreateTable
CREATE TABLE "featured_recipes" (
    "id" SERIAL NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "addedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "featured_recipes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "featured_recipes_recipeId_key" ON "featured_recipes"("recipeId");

-- CreateIndex
CREATE INDEX "featured_recipes_weight_idx" ON "featured_recipes"("weight");

-- AddForeignKey
ALTER TABLE "featured_recipes" ADD CONSTRAINT "featured_recipes_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
