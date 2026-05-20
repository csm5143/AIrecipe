export function normalizeCollectionName(name: unknown): string {
  const normalized = String(name ?? '').trim();
  if (!normalized) {
    throw new Error('收藏夹名称不能为空');
  }
  return normalized;
}

export function canDeleteCollection(collection: { itemCount?: number | null }) {
  if ((collection.itemCount || 0) > 0) {
    return { ok: false, message: '请先移除收藏夹中的菜谱' };
  }
  return { ok: true, message: '' };
}
