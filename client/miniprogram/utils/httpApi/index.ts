/**
 * API 统一导出
 */

export { request, get, post, put, del, upload, setGlobalErrorHandler } from './request.js';
export type { ApiResult, RequestOptions, UploadResult } from './request.js';

export * as authApi from './auth.js';
export * as recipeApi from './recipe.js';
export * as collectionApi from './collection.js';
export * as feedbackApi from './feedback.js';
export * as fridgeApi from './fridge.js';
export * as ingredientApi from './ingredient.js';
export * as contentApi from './content.js';
export * as userRecipeApi from './userRecipe.js';
export * as aiScanApi from './aiScan.js';
