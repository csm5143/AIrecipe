import { canDeleteCollection, normalizeCollectionName } from '../utils/collectionRules';

describe('collectionRules', () => {
  it('trims collection names', () => {
    expect(normalizeCollectionName('  我的收藏  ')).toBe('我的收藏');
  });

  it('blocks empty collection names', () => {
    expect(() => normalizeCollectionName('   ')).toThrow('收藏夹名称不能为空');
  });

  it('blocks deleting non-empty collections', () => {
    expect(canDeleteCollection({ itemCount: 1 })).toEqual({
      ok: false,
      message: '请先移除收藏夹中的菜谱',
    });
  });
});
