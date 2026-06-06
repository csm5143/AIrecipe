import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../config/theme.dart';
import '../../widgets/capsule_toast.dart';

class PrivacyPage extends StatefulWidget {
  const PrivacyPage({super.key});

  @override
  State<PrivacyPage> createState() => _PrivacyPageState();
}

class _PrivacyPageState extends State<PrivacyPage> {
  static const _fridgeKey = 'privacy_fridge_visible';
  static const _collectionKey = 'privacy_collection_visible';

  var _isLoading = true;
  var _fridgeVisible = 'followers';
  var _collectionVisible = 'public';

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _fridgeVisible = prefs.getString(_fridgeKey) ?? 'followers';
      _collectionVisible = prefs.getString(_collectionKey) ?? 'public';
      _isLoading = false;
    });
  }

  Future<void> _saveVisibility(String key, String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(key, value);
  }

  Future<void> _selectVisibility({
    required String title,
    required String currentValue,
    required ValueChanged<String> onSelected,
  }) async {
    final value = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 8),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
              ),
            ),
            for (final option in _visibilityOptions)
              ListTile(
                onTap: () => Navigator.of(context).pop(option.value),
                title: Text(option.label),
                subtitle: Text(
                  option.desc,
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
                trailing: option.value == currentValue
                    ? const Icon(Icons.check, color: AppColors.textPrimary)
                    : null,
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );

    if (value != null) onSelected(value);
  }

  String _labelFor(String value) {
    return _visibilityOptions
        .firstWhere(
          (option) => option.value == value,
          orElse: () => _visibilityOptions.first,
        )
        .label;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.glassSurface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Navigator.of(context).canPop()
              ? context.pop()
              : context.go('/mine'),
        ),
        title: const Text('小厨子'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 100),
              children: [
                Text(
                  '隐私设置',
                  style: Theme.of(
                    context,
                  ).textTheme.displayLarge?.copyWith(fontSize: 28),
                ),
                const SizedBox(height: 6),
                Text(
                  '管理冰箱、收藏夹和数据访问范围。',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 28),
                const _SectionTitle(title: '可见范围'),
                _Card(
                  children: [
                    _NavRow(
                      icon: Icons.kitchen,
                      title: '冰箱食材可见范围',
                      subtitle: '控制谁可以看到你的冰箱食材',
                      trailing: _labelFor(_fridgeVisible),
                      onTap: () => _selectVisibility(
                        title: '冰箱食材可见范围',
                        currentValue: _fridgeVisible,
                        onSelected: (value) async {
                          await _saveVisibility(_fridgeKey, value);
                          if (!mounted) return;
                          setState(() => _fridgeVisible = value);
                        },
                      ),
                    ),
                    const Divider(height: 1, indent: 48),
                    _NavRow(
                      icon: Icons.collections_bookmark,
                      title: '收藏夹可见范围',
                      subtitle: '控制谁可以看到你的收藏夹',
                      trailing: _labelFor(_collectionVisible),
                      onTap: () => _selectVisibility(
                        title: '收藏夹可见范围',
                        currentValue: _collectionVisible,
                        onSelected: (value) async {
                          await _saveVisibility(_collectionKey, value);
                          if (!mounted) return;
                          setState(() => _collectionVisible = value);
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                const _SectionTitle(title: '访问与数据'),
                _Card(
                  children: [
                    _NavRow(
                      icon: Icons.block,
                      title: '黑名单',
                      subtitle: '管理被你屏蔽的用户',
                      onTap: () => showCapsuleToast(
                        context,
                        '功能开发中',
                        icon: Icons.build_outlined,
                      ),
                    ),
                    const Divider(height: 1, indent: 48),
                    _NavRow(
                      icon: Icons.storage,
                      title: '数据权限',
                      subtitle: '查看数据导出和授权记录',
                      onTap: () => showCapsuleToast(
                        context,
                        '功能开发中',
                        icon: Icons.build_outlined,
                      ),
                    ),
                  ],
                ),
              ],
            ),
    );
  }
}

const _visibilityOptions = [
  _VisibilityOption('public', '公开', '所有用户可见'),
  _VisibilityOption('followers', '仅关注者', '关注你的人可见'),
  _VisibilityOption('private', '仅自己', '只有你自己可见'),
];

class _VisibilityOption {
  final String value;
  final String label;
  final String desc;

  const _VisibilityOption(this.value, this.label, this.desc);
}

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, left: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}

class _Card extends StatelessWidget {
  final List<Widget> children;

  const _Card({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)],
      ),
      child: Column(children: children),
    );
  }
}

class _NavRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String trailing;
  final VoidCallback onTap;

  const _NavRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.trailing = '',
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, size: 20, color: AppColors.textSecondary),
      title: Text(title, style: const TextStyle(fontSize: 15)),
      subtitle: Text(
        subtitle,
        style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (trailing.isNotEmpty)
            Text(
              trailing,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
              ),
            ),
          const SizedBox(width: 8),
          const Icon(Icons.chevron_right, color: AppColors.divider),
        ],
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }
}
