/**
 * API 统一导出
 */

export { request, get, post, put, del, upload, setGlobalErrorHandler } from './request';
export type { ApiResult, RequestOptions, UploadResult } from './request';

export * as authApi from './auth';
export * as recipeApi from './recipe';
export * as collectionApi from './collection';
export * as feedbackApi from './feedback';
export * as fridgeApi from './fridge';
export * as ingredientApi from './ingredient';
export * as contentApi from './content';
export * as userRecipeApi from './userRecipe';
export * as aiScanApi from './aiScan';
