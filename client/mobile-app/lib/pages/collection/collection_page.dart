import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../providers/collection_provider.dart';
import '../../widgets/capsule_toast.dart';

class CollectionPage extends ConsumerStatefulWidget {
  const CollectionPage({super.key});
  @override
  ConsumerState<CollectionPage> createState() => _CollectionPageState();
}

class _CollectionPageState extends ConsumerState<CollectionPage> {
  int _subTab = 0; // 0=菜篮, 1=冰箱
  bool _showNotifPanel = false;
  bool _menuOpen = false;
  final Set<int> _selected = {};

  final _fridgeItems = const [
    _FItem('有机苹果', '3个', '10月24日 09:15', '🍎'),
    _FItem('大番茄', '2个', '10月23日 18:20', '🍅'),
    _FItem('胡萝卜', '500g', '10月22日 11:45', '🥕'),
  ];

  final _basketGroups = const [
    _BGroup('川味担担面', [
      _BItem('猪肉沫', '150g'),
      _BItem('宜宾碎米芽菜', '50g'),
      _BItem('鲜面条', '2人份'),
    ]),
    _BGroup('手动添加', [_BItem('大蒜', '2头')]),
  ];

  @override
  Widget build(BuildContext context) {
    final notifications = ref.watch(notificationListProvider);
    final isFridge = _subTab == 1;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.glassSurface,
        title: const Text('我的食材'),
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => setState(() {
            _menuOpen = !_menuOpen;
            if (_menuOpen) _showNotifPanel = false;
          }),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => setState(() {
              _showNotifPanel = !_showNotifPanel;
              if (_showNotifPanel) _menuOpen = false;
            }),
          ),
        ],
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 180),
            child: Column(
              children: [
                // Tabs
                Container(
                  height: 44,
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: const Color(0x80E2E2E4),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0x0A000000)),
                  ),
                  child: Row(
                    children: [
                      _TabBtn(
                        '小菜篮',
                        _subTab == 0,
                        () => setState(() {
                          _subTab = 0;
                          _selected.clear();
                        }),
                      ),
                      _TabBtn(
                        '小冰箱',
                        _subTab == 1,
                        () => setState(() {
                          _subTab = 1;
                          _selected.clear();
                        }),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                if (isFridge) ...[
                  Row(
                    children: [
                      Expanded(
                        child: _Btn(
                          Icons.photo_camera,
                          'AI 拍照识别',
                          true,
                          () => context.push('/publish/scan'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _Btn(Icons.add, '手动添加', false, _showAddDialog),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  ..._buildFridgeList(),
                ] else ...[
                  // Basket action bar: 合并 / 复制 / 手动添加
                  Row(
                    children: [
                      Expanded(
                        child: _BasketActionBtn(
                          Icons.merge,
                          '合并',
                          () => _showToast('已合并相同食材'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _BasketActionBtn(
                          Icons.content_copy,
                          '复制',
                          () => _showToast('采购清单已复制'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _BasketActionBtn(
                          Icons.add,
                          '手动添加',
                          _showAddDialog,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  // Basket groups
                  ..._basketGroups.map((g) => _buildBasketGroup(g)),
                  // Basket selected bar
                  if (_selected.isNotEmpty) _buildBasketSelectedBar(),
                ],
              ],
            ),
          ),
          // Fridge selected bar
          if (isFridge && _selected.isNotEmpty)
            Positioned(
              left: 16,
              right: 16,
              bottom: 90,
              child: _selectedFridgeBar(),
            ),
          // Notification panel
          if (_showNotifPanel)
            Positioned.fill(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => setState(() => _showNotifPanel = false),
                child: Container(color: Colors.transparent),
              ),
            ),
          if (_showNotifPanel)
            Positioned(
              top: 56,
              right: 16,
              width: 280,
              child: _notifPanel(
                context,
                notifications,
                onViewAll: () {
                  setState(() => _showNotifPanel = false);
                  context.push('/notifications');
                },
              ),
            ),
          if (_menuOpen)
            Positioned.fill(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => setState(() => _menuOpen = false),
                child: Container(color: Colors.transparent),
              ),
            ),
          if (_menuOpen)
            Positioned(
              top: 8,
              left: 16,
              width: 224,
              child: Material(
                color: Colors.transparent,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: const [
                      BoxShadow(color: Color(0x14000000), blurRadius: 24),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _MenuItem(
                        icon: Icons.shopping_basket_outlined,
                        label: '小菜篮',
                        onTap: () {
                          setState(() {
                            _subTab = 0;
                            _selected.clear();
                            _menuOpen = false;
                          });
                        },
                      ),
                      _MenuItem(
                        icon: Icons.kitchen_outlined,
                        label: '小冰箱',
                        onTap: () {
                          setState(() {
                            _subTab = 1;
                            _selected.clear();
                            _menuOpen = false;
                          });
                        },
                      ),
                      _MenuItem(
                        icon: Icons.history,
                        label: '浏览历史',
                        onTap: () {
                          setState(() => _menuOpen = false);
                          context.push('/history');
                        },
                      ),
                      _MenuItem(
                        icon: Icons.collections_bookmark_outlined,
                        label: '我的收藏',
                        onTap: () {
                          setState(() => _menuOpen = false);
                          context.push('/my-collections');
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  List<Widget> _buildFridgeList() {
    return _fridgeItems.asMap().entries.map((e) {
      final i = e.key;
      final item = e.value;
      final sel = _selected.contains(i);
      return GestureDetector(
        onTap: () {
          if (_selected.isNotEmpty) {
            setState(() => sel ? _selected.remove(i) : _selected.add(i));
          } else {
            _showEditDialog(item);
          }
        },
        onLongPress: () {
          if (_selected.isEmpty) setState(() => _selected.add(i));
        },
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x0A000000)),
            boxShadow: const [
              BoxShadow(color: Color(0x08000000), blurRadius: 20),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: sel ? AppColors.textPrimary : Colors.transparent,
                  border: Border.all(
                    color: sel ? AppColors.textPrimary : AppColors.divider,
                    width: 2,
                  ),
                ),
                child: sel
                    ? const Icon(Icons.check, size: 14, color: Colors.white)
                    : null,
              ),
              const SizedBox(width: 14),
              Text(item.emoji, style: const TextStyle(fontSize: 28)),
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
                      '${item.qty} · ${item.date}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.close,
                size: 18,
                color: AppColors.textPlaceholder,
              ),
            ],
          ),
        ),
      );
    }).toList();
  }

  void _showToast(String message) {
    showCapsuleToast(context, message);
  }

  Widget _buildBasketGroup(_BGroup group) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8, top: 4),
          child: Row(
            children: [
              Icon(
                group.recipe == '手动添加'
                    ? Icons.edit_note
                    : Icons.restaurant_menu,
                size: 16,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 6),
              Text(
                '来源：${group.recipe}',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [
              BoxShadow(color: Color(0x08000000), blurRadius: 20),
            ],
          ),
          child: Column(
            children: group.items.asMap().entries.map((e) {
              final i = e.key;
              final item = e.value;
              final sel = _selected.contains(i + 100); // offset for basket
              return Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                decoration: const BoxDecoration(
                  border: Border(
                    bottom: BorderSide(color: AppColors.divider, width: 0.5),
                  ),
                ),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => setState(
                        () => sel
                            ? _selected.remove(i + 100)
                            : _selected.add(i + 100),
                      ),
                      child: Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: sel
                              ? AppColors.textPrimary
                              : Colors.transparent,
                          border: Border.all(
                            color: sel
                                ? AppColors.textPrimary
                                : AppColors.divider,
                            width: 2,
                          ),
                        ),
                        child: sel
                            ? const Icon(
                                Icons.check,
                                size: 14,
                                color: Colors.white,
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Text(
                        item.name,
                        style: const TextStyle(fontSize: 15),
                      ),
                    ),
                    Text(
                      item.qty,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(width: 16),
                    const Icon(
                      Icons.close,
                      size: 18,
                      color: AppColors.textPlaceholder,
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildBasketSelectedBar() {
    return Container(
      margin: const EdgeInsets.only(bottom: 100),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.textPrimary,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                '已选中',
                style: TextStyle(fontSize: 11, color: Color(0xCCFFFFFF)),
              ),
              Text(
                '${_selected.length} 项食材',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const Spacer(),
          GestureDetector(
            onTap: () => setState(() => _selected.clear()),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Text(
                '全部移入冰箱',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _selectedFridgeBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.textPrimary,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                '已选中',
                style: TextStyle(fontSize: 11, color: Color(0xCCFFFFFF)),
              ),
              Text(
                '${_selected.length} 项食材',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const Spacer(),
          GestureDetector(
            onTap: () {
              setState(() => _selected.clear());
              context.push('/ai/chat');
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.auto_awesome,
                    size: 18,
                    color: AppColors.textPrimary,
                  ),
                  SizedBox(width: 6),
                  Text(
                    'AI 菜谱',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Dialogs (居中淡入淡出) ──
  void _showEditDialog(_FItem item) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: '',
      barrierColor: Colors.black26,
      transitionDuration: const Duration(milliseconds: 250),
      pageBuilder: (c, a1, a2) => const SizedBox.shrink(),
      transitionBuilder: (c, anim, a2, child) {
        return FadeTransition(
          opacity: anim,
          child: ScaleTransition(
            scale: Tween(begin: 0.92, end: 1.0).animate(
              CurvedAnimation(parent: anim, curve: Curves.easeOutCubic),
            ),
            child: Center(child: _EditDialog(item: item)),
          ),
        );
      },
    );
  }

  void _showAddDialog() {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: '',
      barrierColor: Colors.black26,
      transitionDuration: const Duration(milliseconds: 250),
      pageBuilder: (c, a1, a2) => const SizedBox.shrink(),
      transitionBuilder: (c, anim, a2, child) {
        return FadeTransition(
          opacity: anim,
          child: ScaleTransition(
            scale: Tween(begin: 0.92, end: 1.0).animate(
              CurvedAnimation(parent: anim, curve: Curves.easeOutCubic),
            ),
            child: const Center(
              child: Material(
                type: MaterialType.transparency,
                child: _AddDialog(),
              ),
            ),
          ),
        );
      },
    );
  }
}

// ── Data classes ──
class _FItem {
  final String name, qty, date, emoji;
  const _FItem(this.name, this.qty, this.date, this.emoji);
}

class _BGroup {
  final String recipe;
  final List<_BItem> items;
  const _BGroup(this.recipe, this.items);
}

class _BItem {
  final String name, qty;
  const _BItem(this.name, this.qty);
}

// ── Widgets ──
class _TabBtn extends StatelessWidget {
  final String text;
  final bool active;
  final VoidCallback onTap;
  const _TabBtn(this.text, this.active, this.onTap);
  @override
  Widget build(BuildContext c) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          decoration: BoxDecoration(
            color: active ? AppColors.surface : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: active
                ? const [BoxShadow(color: Color(0x0A000000), blurRadius: 8)]
                : null,
            border: active ? Border.all(color: const Color(0x0A000000)) : null,
          ),
          child: Center(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: active ? AppColors.textPrimary : AppColors.textSecondary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Btn extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool dark;
  final VoidCallback onTap;
  const _Btn(this.icon, this.label, this.dark, this.onTap);
  @override
  Widget build(BuildContext c) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: dark ? AppColors.textPrimary : AppColors.surface,
          borderRadius: BorderRadius.circular(22),
          border: dark ? null : Border.all(color: const Color(0x0A000000)),
          boxShadow: dark
              ? null
              : const [BoxShadow(color: Color(0x05000000), blurRadius: 8)],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 20,
              color: dark ? AppColors.surface : AppColors.textPrimary,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 15,
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

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(12)),
        child: Row(
          children: [
            Icon(icon, size: 20, color: AppColors.textPrimary),
            const SizedBox(width: 12),
            Text(label, style: Theme.of(context).textTheme.labelMedium),
          ],
        ),
      ),
    );
  }
}

// ── Edit Dialog (居中弹出) ──
class _BasketActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _BasketActionBtn(this.icon, this.label, this.onTap);
  @override
  Widget build(BuildContext c) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 44,
        decoration: BoxDecoration(
          color: const Color(0x80FFFFFF),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x1AFFFFFF)),
          boxShadow: const [
            BoxShadow(color: Color(0x05000000), blurRadius: 16),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: AppColors.textPrimary),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EditDialog extends StatelessWidget {
  final _FItem item;
  const _EditDialog({required this.item});
  @override
  Widget build(BuildContext c) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 48)],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('编辑食材', style: Theme.of(c).textTheme.headlineMedium),
              GestureDetector(
                onTap: () => Navigator.pop(c),
                child: const Icon(Icons.close, color: AppColors.textSecondary),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.surfaceSecondary,
              border: Border.all(color: Colors.white, width: 3),
            ),
            child: Center(
              child: Text(item.emoji, style: const TextStyle(fontSize: 28)),
            ),
          ),
          const SizedBox(height: 20),
          _Ef(label: '食材名称', icon: Icons.restaurant, value: item.name),
          const SizedBox(height: 12),
          _Ef(label: '数量', icon: Icons.scale, value: item.qty),
          const SizedBox(height: 12),
          _Ef(label: '保质期至', icon: Icons.event, value: item.date, isRed: true),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () => Navigator.pop(c),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.textPrimary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.check, size: 18),
                  SizedBox(width: 8),
                  Text('保存修改', style: TextStyle(fontSize: 13)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => Navigator.pop(c),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.error),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.delete, size: 18, color: AppColors.error),
                  SizedBox(width: 8),
                  Text(
                    '删除食材',
                    style: TextStyle(fontSize: 13, color: AppColors.error),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Ef extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final bool isRed;
  const _Ef({
    required this.label,
    required this.icon,
    required this.value,
    this.isRed = false,
  });
  @override
  Widget build(BuildContext c) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        label,
        style: Theme.of(
          c,
        ).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary),
      ),
      const SizedBox(height: 6),
      Container(
        height: 44,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: AppColors.surfaceSecondary,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: AppColors.textPlaceholder),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                value,
                style: TextStyle(
                  fontSize: 15,
                  color: isRed ? AppColors.error : AppColors.textPrimary,
                ),
              ),
            ),
            if (isRed)
              const Icon(Icons.warning, size: 18, color: AppColors.error),
          ],
        ),
      ),
    ],
  );
}

// ── Add Dialog (居中弹出) ──
class _AddDialog extends StatefulWidget {
  const _AddDialog();
  @override
  State<_AddDialog> createState() => _AddDialogState();
}

class _AddDialogState extends State<_AddDialog> {
  int _qty = 1, _expiry = 0;
  @override
  Widget build(BuildContext c) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 360),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(22),
            boxShadow: const [
              BoxShadow(color: Color(0x33000000), blurRadius: 48),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('添加食材', style: Theme.of(c).textTheme.headlineMedium),
                  GestureDetector(
                    onTap: () => Navigator.pop(c),
                    child: const Icon(
                      Icons.close,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Text(
                '食材名称',
                style: Theme.of(c).textTheme.labelMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 6),
              Container(
                height: 48,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: AppColors.surfaceSecondary,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.restaurant,
                      size: 20,
                      color: AppColors.textPlaceholder,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        decoration: const InputDecoration(
                          hintText: '例如：有机苹果',
                          hintStyle: TextStyle(
                            color: AppColors.textPlaceholder,
                          ),
                          border: InputBorder.none,
                        ),
                        style: const TextStyle(fontSize: 17),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Text(
                '数量与单位',
                style: Theme.of(c).textTheme.labelMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceSecondary,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        children: [
                          GestureDetector(
                            onTap: () {
                              if (_qty > 1) setState(() => _qty--);
                            },
                            child: const Padding(
                              padding: EdgeInsets.all(12),
                              child: Icon(
                                Icons.remove,
                                size: 20,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              '$_qty',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          GestureDetector(
                            onTap: () => setState(() => _qty++),
                            child: const Padding(
                              padding: EdgeInsets.all(12),
                              child: Icon(
                                Icons.add,
                                size: 20,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Container(
                    width: 72,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceSecondary,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Center(
                      child: Text('个', style: TextStyle(fontSize: 17)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                '保质期',
                style: Theme.of(c).textTheme.labelMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 6),
              SizedBox(
                height: 36,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: 5,
                  itemBuilder: (ctx, i) {
                    const opts = ['设置', '3天', '1周', '1月', '自定义'];
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: GestureDetector(
                        onTap: () => setState(() => _expiry = i),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: i == _expiry
                                ? AppColors.textPrimary
                                : AppColors.surfaceSecondary,
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: Text(
                            opts[i],
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: i == _expiry
                                  ? Colors.white
                                  : AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => Navigator.pop(c),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.textPrimary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.kitchen, size: 18),
                      SizedBox(width: 8),
                      Text('加入冰箱', style: TextStyle(fontSize: 15)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Notification Panel ──
Widget _notifPanel(
  BuildContext context,
  List notifications, {
  required VoidCallback onViewAll,
}) {
  return Material(
    elevation: 0,
    color: Colors.transparent,
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Color(0x1A000000), blurRadius: 24)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '通知',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              GestureDetector(
                onTap: onViewAll,
                child: const Text(
                  '查看全部',
                  style: TextStyle(fontSize: 11, color: AppColors.accentBlue),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...notifications
              .take(4)
              .map(
                (n) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        margin: const EdgeInsets.only(top: 6, right: 10),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: n.isUnread
                              ? AppColors.accentBlue
                              : Colors.transparent,
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            RichText(
                              text: TextSpan(
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textPrimary,
                                  height: 1.3,
                                ),
                                children: [
                                  TextSpan(
                                    text: n.fromUserName,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  TextSpan(
                                    text: ' ${n.action} ${n.targetName}',
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              n.timeAgo,
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
        ],
      ),
    ),
  );
}
