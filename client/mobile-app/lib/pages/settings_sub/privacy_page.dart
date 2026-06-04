import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';

class PrivacyPage extends StatefulWidget {
  const PrivacyPage({super.key});
  @override
  State<PrivacyPage> createState() => _PrivacyPageState();
}

class _PrivacyPageState extends State<PrivacyPage> {
  bool _fridgeVisible = true;

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
        title: const Text('吃了么'),
      ),
      body: ListView(
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
            '管理你的可见范围和数据权限。',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 28),
          _SectionTitle(title: '可见范围'),
          _Card(
            children: [
              _NavRow(
                icon: Icons.collections_bookmark,
                title: '收藏夹可见范围',
                trailing: '公开',
              ),
              const Divider(height: 1, indent: 48),
              _ToggleRow(
                icon: Icons.kitchen,
                title: '冰箱食材可见',
                subtitle: '允许关注者查看你的食材',
                value: _fridgeVisible,
                onChanged: (v) => setState(() => _fridgeVisible = v),
              ),
            ],
          ),
          const SizedBox(height: 24),
          _SectionTitle(title: '访问与数据'),
          _Card(
            children: [
              _NavRow(icon: Icons.block, title: '黑名单'),
              const Divider(height: 1, indent: 48),
              _NavRow(icon: Icons.storage, title: '数据权限'),
            ],
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});
  @override
  Widget build(BuildContext c) => Padding(
    padding: const EdgeInsets.only(bottom: 10, left: 8),
    child: Text(
      title,
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: AppColors.textSecondary,
        letterSpacing: 0.5,
      ),
    ),
  );
}

class _Card extends StatelessWidget {
  final List<Widget> children;
  const _Card({required this.children});
  @override
  Widget build(BuildContext c) => Container(
    decoration: BoxDecoration(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(16),
      boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)],
    ),
    child: Column(children: children),
  );
}

class _NavRow extends StatelessWidget {
  final IconData icon;
  final String title, trailing;
  const _NavRow({required this.icon, required this.title, this.trailing = ''});
  @override
  Widget build(BuildContext c) => ListTile(
    leading: Icon(icon, size: 20, color: AppColors.textSecondary),
    title: Text(title, style: const TextStyle(fontSize: 15)),
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

class _ToggleRow extends StatelessWidget {
  final IconData icon;
  final String title, subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _ToggleRow({
    required this.icon,
    required this.title,
    this.subtitle = '',
    required this.value,
    required this.onChanged,
  });
  @override
  Widget build(BuildContext c) => SwitchListTile(
    secondary: Icon(icon, size: 20, color: AppColors.textSecondary),
    title: Text(title, style: const TextStyle(fontSize: 15)),
    subtitle: subtitle.isNotEmpty
        ? Text(
            subtitle,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
          )
        : null,
    value: value,
    onChanged: onChanged,
    activeThumbColor: AppColors.textPrimary,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
  );
}
