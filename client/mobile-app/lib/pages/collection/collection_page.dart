import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../models/ingredient.dart';
import '../../providers/collection_provider.dart';
import '../../widgets/capsule_toast.dart';

class CollectionPage extends ConsumerStatefulWidget {
  const CollectionPage({super.key});

  @override
  ConsumerState<CollectionPage> createState() => _CollectionPageState();
}

class _CollectionPageState extends ConsumerState<CollectionPage> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final fridgeItems = ref.watch(ingredientListProvider);
    final shoppingLists = ref.watch(shoppingListProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.glassSurface,
        title: const Text('我的食材'),
        actions: [
          IconButton(
            tooltip: '刷新',
            icon: const Icon(Icons.refresh),
            onPressed: _refresh,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
          children: [
            _SegmentedTabs(
              index: _tab,
              onChanged: (value) => setState(() => _tab = value),
            ),
            const SizedBox(height: 16),
            if (_tab == 0)
              _ShoppingListView(
                lists: shoppingLists,
                onDelete: _deleteShoppingList,
                onMerge: _mergeShoppingLists,
              )
            else
              _FridgeView(
                items: fridgeItems,
                onAdd: _showAddDialog,
                onDelete: _deleteFridgeItem,
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _refresh() async {
    await Future.wait([
      ref.read(ingredientListProvider.notifier).load(),
      ref.read(shoppingListProvider.notifier).load(),
    ]);
  }

  Future<void> _deleteShoppingList(String id) async {
    try {
      await ref.read(shoppingListProvider.notifier).remove(id);
      if (mounted) showCapsuleToast(context, '菜篮已删除');
    } catch (error) {
      if (mounted) showCapsuleToast(context, '删除失败：$error');
    }
  }

  Future<void> _deleteFridgeItem(String id) async {
    try {
      await ref.read(ingredientListProvider.notifier).remove(id);
      if (mounted) showCapsuleToast(context, '食材已删除');
    } catch (error) {
      if (mounted) showCapsuleToast(context, '删除失败：$error');
    }
  }

  Future<void> _mergeShoppingLists(
      String name, List<Map<String, dynamic>> items) async {
    try {
      await ref.read(shoppingListProvider.notifier).create(name, items);
      if (mounted) showCapsuleToast(context, '合并清单已创建');
    } catch (error) {
      if (mounted) showCapsuleToast(context, '合并失败：$error');
    }
  }

  Future<void> _showAddDialog() async {
    final result = await showDialog<_IngredientDraft>(
      context: context,
      builder: (context) => const _AddIngredientDialog(),
    );

    if (result == null) return;

    try {
      await ref
          .read(ingredientListProvider.notifier)
          .add(
            Ingredient(
              id: '',
              name: result.name,
              amount: result.amount,
              unit: result.unit,
              category: result.category,
            ),
          );
      if (mounted) showCapsuleToast(context, '已加入小冰箱');
    } catch (error) {
      if (mounted) showCapsuleToast(context, '添加失败：$error');
    }
  }
}

class _SegmentedTabs extends StatelessWidget {
  final int index;
  final ValueChanged<int> onChanged;

  const _SegmentedTabs({required this.index, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 44,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0x80E2E2E4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x0A000000)),
      ),
      child: Row(
        children: [
          _TabButton(
            label: '小菜篮',
            active: index == 0,
            onTap: () => onChanged(0),
          ),
          _TabButton(
            label: '小冰箱',
            active: index == 1,
            onTap: () => onChanged(1),
          ),
        ],
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _TabButton({
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: active ? AppColors.textPrimary : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: active ? AppColors.surface : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}

class _ShoppingListView extends StatefulWidget {
  final List<Map<String, dynamic>> lists;
  final ValueChanged<String> onDelete;
  final void Function(String name, List<Map<String, dynamic>> items) onMerge;

  const _ShoppingListView({
    required this.lists,
    required this.onDelete,
    required this.onMerge,
  });

  @override
  State<_ShoppingListView> createState() => _ShoppingListViewState();
}

class _ShoppingListViewState extends State<_ShoppingListView> {
  final _selected = <String>{};
  bool _mergeMode = false;

  void _exitMergeMode() {
    setState(() {
      _selected.clear();
      _mergeMode = false;
    });
  }

  void _toggleSelect(String id) {
    setState(() {
      if (_selected.contains(id)) {
        _selected.remove(id);
        if (_selected.isEmpty) _mergeMode = false;
      } else {
        _selected.add(id);
        _mergeMode = true;
      }
    });
  }

  void _doMerge() {
    if (_selected.length < 2) {
      showCapsuleToast(context, '请至少选择两个清单进行合并');
      return;
    }
    final merged = <Map<String, dynamic>>[];
    final seen = <String>{};
    for (final list in widget.lists) {
      final id = list['id']?.toString() ?? '';
      if (!_selected.contains(id)) continue;
      final items = list['items'] is List ? list['items'] as List : const [];
      for (final raw in items) {
        final item = raw is Map ? raw : const {};
        final key = (item['name']?.toString() ?? '').trim();
        if (key.isEmpty || seen.contains(key)) continue;
        seen.add(key);
        merged.add({
          'name': key,
          'amount': item['amount']?.toString() ?? '',
          'unit': item['unit']?.toString() ?? '',
        });
      }
    }
    widget.onMerge('合并清单', merged);
    _exitMergeMode();
    showCapsuleToast(context, '已合并 ${merged.length} 种食材');
  }

  String _formatForClipboard(Map<String, dynamic> list) {
    final name = list['name']?.toString() ?? '清单';
    final items = list['items'] is List ? list['items'] as List : const [];
    if (items.isEmpty) return name;
    return '$name\n${items.map((raw) {
      final item = raw is Map ? raw : const {};
      final n = item['name']?.toString() ?? '';
      final a = item['amount']?.toString() ?? '';
      final u = item['unit']?.toString() ?? '';
      final qty = a.isNotEmpty ? '$a$u' : '';
      return qty.isNotEmpty ? '  · $n  $qty' : '  · $n';
    }).join('\n')}';
  }

  @override
  Widget build(BuildContext context) {
    final lists = widget.lists;

    if (lists.isEmpty) {
      return const _EmptyState(
        icon: Icons.shopping_basket_outlined,
        title: '小菜篮还没有同步清单',
        message: '从菜谱详情加入食材后，会在这里显示购物清单。',
      );
    }

    return Column(
      children: [
        // 合并模式工具栏
        if (_mergeMode)
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.textPrimary,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                Text(
                  '已选 ${_selected.length} 个',
                  style: const TextStyle(
                    color: AppColors.surface,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: _exitMergeMode,
                  child: const Text('取消',
                    style: TextStyle(color: AppColors.surface)),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: _doMerge,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.surface,
                    foregroundColor: AppColors.textPrimary,
                  ),
                  child: const Text('合并选中'),
                ),
              ],
            ),
          ),
        // 清单卡片
        ...lists.map((list) {
          final id = list['id']?.toString() ?? '';
          final name = list['name']?.toString() ?? '未命名清单';
          final items = list['items'] is List ? list['items'] as List : const [];
          final isSelected = _selected.contains(id);

          return GestureDetector(
            onLongPress: () => _toggleSelect(id),
            child: _Panel(
              margin: const EdgeInsets.only(bottom: 14),
              child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (_mergeMode)
                      GestureDetector(
                        onTap: () => _toggleSelect(id),
                        child: Container(
                          width: 24, height: 24,
                          margin: const EdgeInsets.only(right: 8),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isSelected
                                ? AppColors.textPrimary
                                : Colors.transparent,
                            border: Border.all(
                              color: isSelected
                                  ? AppColors.textPrimary
                                  : AppColors.textPlaceholder,
                              width: 2,
                            ),
                          ),
                          child: isSelected
                              ? const Icon(Icons.check, size: 16,
                                  color: AppColors.surface)
                              : null,
                        ),
                      )
                    else
                      const Icon(Icons.receipt_long, size: 20,
                          color: AppColors.textSecondary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(name,
                        style: Theme.of(context).textTheme.headlineMedium),
                    ),
                    if (!_mergeMode) ...[
                      IconButton(
                        tooltip: '复制清单',
                        icon: const Icon(Icons.copy, size: 18),
                        color: AppColors.textPlaceholder,
                        onPressed: () {
                          Clipboard.setData(
                              ClipboardData(text: _formatForClipboard(list)));
                          showCapsuleToast(context, '已复制食材清单',
                              icon: Icons.check);
                        },
                      ),
                      IconButton(
                        tooltip: '删除',
                        icon: const Icon(Icons.delete_outline, size: 18),
                        color: AppColors.textPlaceholder,
                        onPressed: () => widget.onDelete(id),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 8),
                if (items.isEmpty)
                  Text('暂无食材',
                    style: Theme.of(context).textTheme.bodyMedium
                        ?.copyWith(color: AppColors.textSecondary))
                else
                  ...items.map((raw) {
                    final item = raw is Map ? raw : const {};
                    final itemName = item['name']?.toString() ?? '';
                    final amount = item['amount']?.toString() ?? '';
                    final unit = item['unit']?.toString() ?? '';
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 7),
                      child: Row(
                        children: [
                          const Icon(Icons.circle, size: 7,
                              color: AppColors.textPlaceholder),
                          const SizedBox(width: 10),
                          Expanded(child: Text(itemName)),
                          Text('$amount$unit',
                            style: Theme.of(context).textTheme.labelMedium
                                ?.copyWith(color: AppColors.textSecondary)),
                        ],
                      ),
                    );
                  }),
              ],
            ),
          ),
        );
        }),
      ],
    );
  }
}

class _FridgeView extends StatelessWidget {
  final List<Ingredient> items;
  final VoidCallback onAdd;
  final ValueChanged<String> onDelete;

  const _FridgeView({
    required this.items,
    required this.onAdd,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _ActionButton(
                icon: Icons.photo_camera,
                label: 'AI 拍照识别',
                dark: true,
                onTap: () => context.push('/publish/scan'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _ActionButton(
                icon: Icons.add,
                label: '手动添加',
                onTap: onAdd,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (items.isEmpty)
          const _EmptyState(
            icon: Icons.kitchen_outlined,
            title: '小冰箱还是空的',
            message: '添加食材后，其他端登录同一账号也能同步看到。',
          )
        else
          ...items.map(
            (item) =>
                _FridgeTile(item: item, onDelete: () => onDelete(item.id)),
          ),
      ],
    );
  }
}

class _FridgeTile extends StatelessWidget {
  final Ingredient item;
  final VoidCallback onDelete;

  const _FridgeTile({required this.item, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final amount = [item.amount, item.unit].where((v) => v.isNotEmpty).join('');

    return _Panel(
      margin: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.surfaceSecondary,
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.kitchen, color: AppColors.textSecondary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  [
                    if (amount.isNotEmpty) amount,
                    if (item.category.isNotEmpty) item.category,
                  ].join(' · '),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: '删除',
            icon: const Icon(Icons.close),
            color: AppColors.textPlaceholder,
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool dark;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.dark = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 46,
        decoration: BoxDecoration(
          color: dark ? AppColors.textPrimary : AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x0A000000)),
          boxShadow: const [
            BoxShadow(color: Color(0x08000000), blurRadius: 20),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 18,
              color: dark ? AppColors.surface : AppColors.textPrimary,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: dark ? AppColors.surface : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AddIngredientDialog extends StatefulWidget {
  const _AddIngredientDialog();

  @override
  State<_AddIngredientDialog> createState() => _AddIngredientDialogState();
}

class _AddIngredientDialogState extends State<_AddIngredientDialog> {
  final _nameCtrl = TextEditingController();
  final _amountCtrl = TextEditingController(text: '1');
  final _unitCtrl = TextEditingController();
  String _category = 'other';

  @override
  void dispose() {
    _nameCtrl.dispose();
    _amountCtrl.dispose();
    _unitCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppColors.surface,
      title: const Text('添加食材'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _nameCtrl,
            decoration: const InputDecoration(labelText: '食材名称'),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _amountCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: '数量'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: _unitCtrl,
                  decoration: const InputDecoration(labelText: '单位'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
            initialValue: _category,
            decoration: const InputDecoration(labelText: '分类'),
            items: const [
              DropdownMenuItem(value: 'other', child: Text('其他')),
              DropdownMenuItem(value: 'vegetable', child: Text('蔬菜')),
              DropdownMenuItem(value: 'meat', child: Text('肉类')),
              DropdownMenuItem(value: 'seafood', child: Text('海鲜')),
              DropdownMenuItem(value: 'seasoning', child: Text('调味')),
            ],
            onChanged: (value) => setState(() => _category = value ?? 'other'),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('取消'),
        ),
        FilledButton(
          onPressed: () {
            final name = _nameCtrl.text.trim();
            if (name.isEmpty) return;
            Navigator.pop(
              context,
              _IngredientDraft(
                name: name,
                amount: _amountCtrl.text.trim().isEmpty
                    ? '1'
                    : _amountCtrl.text.trim(),
                unit: _unitCtrl.text.trim(),
                category: _category,
              ),
            );
          },
          child: const Text('保存'),
        ),
      ],
    );
  }
}

class _IngredientDraft {
  final String name;
  final String amount;
  final String unit;
  final String category;

  const _IngredientDraft({
    required this.name,
    required this.amount,
    required this.unit,
    required this.category,
  });
}

class _Panel extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? margin;

  const _Panel({required this.child, this.margin});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x0A000000)),
        boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 20)],
      ),
      child: child,
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;

  const _EmptyState({
    required this.icon,
    required this.title,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 20),
      child: Column(
        children: [
          Icon(icon, size: 44, color: AppColors.textPlaceholder),
          const SizedBox(height: 14),
          Text(title, style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}
