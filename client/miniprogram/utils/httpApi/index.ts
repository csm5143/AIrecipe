/**
 * API 统一导出
 */

export { request, get, post, put, del, setGlobalErrorHandler } from './request';
export type { ApiResult, RequestOptions } from './request';

export * as authApi from './auth';
export * as recipeApi from './recipe';
export * as userRecipeApi from './userRecipe';
export * as collectionApi from './collection';
export * as feedbackApi from './feedback';
