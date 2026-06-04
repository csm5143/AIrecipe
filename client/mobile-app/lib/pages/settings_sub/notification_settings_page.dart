import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';

class NotificationSettingsPage extends StatefulWidget {
  const NotificationSettingsPage({super.key});
  @override
  State<NotificationSettingsPage> createState() =>
      _NotificationSettingsPageState();
}

class _NotificationSettingsPageState extends State<NotificationSettingsPage> {
  bool _likes = true,
      _comments = true,
      _followers = false,
      _announcements = true;

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
            '通知设置',
            style: Theme.of(
              context,
            ).textTheme.displayLarge?.copyWith(fontSize: 28),
          ),
          const SizedBox(height: 6),
          Text(
            '管理你的提醒和更新通知。',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 28),
          _Section(title: '互动通知'),
          _Card(
            children: [
              _Toggle(
                icon: Icons.favorite,
                title: '新的赞',
                desc: '有人赞了你的食谱',
                value: _likes,
                onChanged: (v) => setState(() => _likes = v),
              ),
              const Divider(height: 1, indent: 48),
              _Toggle(
                icon: Icons.chat_bubble,
                title: '评论',
                desc: '有人评论了你的帖子',
                value: _comments,
                onChanged: (v) => setState(() => _comments = v),
              ),
              const Divider(height: 1, indent: 48),
              _Toggle(
                icon: Icons.person_add,
                title: '新关注者',
                desc: '有人关注了你',
                value: _followers,
                onChanged: (v) => setState(() => _followers = v),
              ),
            ],
          ),
          const SizedBox(height: 24),
          _Section(title: '系统通知'),
          _Card(
            children: [
              _Toggle(
                icon: Icons.campaign,
                title: '公告',
                desc: '重要更新和新功能',
                value: _announcements,
                onChanged: (v) => setState(() => _announcements = v),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  const _Section({required this.title});
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

class _Toggle extends StatelessWidget {
  final IconData icon;
  final String title, desc;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _Toggle({
    required this.icon,
    required this.title,
    this.desc = '',
    required this.value,
    required this.onChanged,
  });
  @override
  Widget build(BuildContext c) => SwitchListTile(
    secondary: Icon(icon, size: 20, color: AppColors.textSecondary),
    title: Text(title, style: const TextStyle(fontSize: 15)),
    subtitle: desc.isNotEmpty
        ? Text(
            desc,
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
