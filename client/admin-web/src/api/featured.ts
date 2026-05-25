import request from '../utils/request';

export interface FeaturedRecipeItem {
  id: number;
  weight: number;
  note: string | null;
  addedBy: string | null;
  createdAt: number;
  recipe: {
    id: number;
    title: string;
    coverImage?: string;
    viewCount: number;
    collectCount: number;
    status: string;
  };
}

export interface HotRecipeItem {
  id: number;
  title: string;
  coverImage?: string;
  viewCount: number;
  collectCount: number;
  status: string;
  isHot: boolean;
  isFeatured: boolean;
}

export interface RecipeSearchItem {
  id: number;
  title: string;
  coverImage?: string;
  viewCount: number;
  isHot: boolean;
  isFeatured: boolean;
}

export const featuredApi = {
  getList(params: { page?: number; pageSize?: number; keyword?: string }) {
    return request.get<{ list: FeaturedRecipeItem[]; total: number }>('/featured-recipes', { params });
  },

  add(recipeId: number, note?: string) {
    return request.post('/featured-recipes', { recipeId, note });
  },

  remove(id: number) {
    return request.delete(`/featured-recipes/${id}`);
  },

  updateWeight(id: number, weight: number, note?: string) {
    const data: any = { weight };
    if (note !== undefined) data.note = note;
    return request.put(`/featured-recipes/${id}/weight`, data);
  },

  batchUpdate(data: { id: number; weight: number }[]) {
    return request.put('/featured-recipes/batch', data);
  },

  search(params: { keyword: string }) {
    return request.get<RecipeSearchItem[]>('/featured-recipes/search', { params });
  },
};

export const hotRecipesApi = {
  getList(params: { page?: number; pageSize?: number; keyword?: string }) {
    return request.get<{ list: HotRecipeItem[]; total: number }>('/featured-recipes/hot', { params });
  },

  getAll(params: { page?: number; pageSize?: number; keyword?: string }) {
    return request.get<{ list: HotRecipeItem[]; total: number }>('/featured-recipes/all', { params });
  },

  toggle(id: number, isHot: boolean) {
    return request.patch(`/featured-recipes/hot/${id}`, { isHot });
  },

  batchToggle(ids: number[], isHot: boolean) {
    return request.patch('/featured-recipes/hot/batch', { ids, isHot });
  },
};
