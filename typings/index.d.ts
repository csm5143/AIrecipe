/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
    recipesCache?: any[] | null,
    ingredientsCache?: Array<{ name: string; category: string; subCategory?: string; selected?: boolean; isCommon?: boolean }> | null,
    cacheTimestamp?: number,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}