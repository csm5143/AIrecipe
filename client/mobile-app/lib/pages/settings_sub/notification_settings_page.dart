import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../config/theme.dart';

class NotificationSettingsPage extends StatefulWidget {
  const NotificationSettingsPage({super.key});

  @override
  State<NotificationSettingsPage> createState() =>
      _NotificationSettingsPageState();
}

class _NotificationSettingsPageState extends State<NotificationSettingsPage> {
  static const _likesKey = 'pref_notify_likes';
  static const _commentsKey = 'pref_notify_comments';
  static const _followsKey = 'pref_notify_follows';
  static const _systemKey = 'pref_notify_system';

  var _isLoading = true;
  var _likes = true;
  var _comments = true;
  var _follows = true;
  var _system = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _likes = prefs.getBool(_likesKey) ?? true;
      _comments = prefs.getBool(_commentsKey) ?? true;
      _follows = prefs.getBool(_followsKey) ?? true;
      _system = prefs.getBool(_systemKey) ?? true;
      _isLoading = false;
    });
  }

  Future<void> _update(String key, bool value, void Function() apply) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, value);
    if (!mounted) return;
    setState(apply);
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
                  '通知设置',
                  style: Theme.of(
                    context,
                  ).textTheme.displayLarge?.copyWith(fontSize: 28),
                ),
                const SizedBox(height: 6),
                Text(
                  '管理点赞、评论、关注和系统消息提醒。',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 28),
                const _Section(title: '互动通知'),
                _Card(
                  children: [
                    _Toggle(
                      icon: Icons.favorite,
                      title: '新的点赞',
                      desc: '有人点赞你的菜谱或帖子时提醒',
                      value: _likes,
                      onChanged: (value) =>
                          _update(_likesKey, value, () => _likes = value),
                    ),
                    const Divider(height: 1, indent: 48),
                    _Toggle(
                      icon: Icons.chat_bubble,
                      title: '评论',
                      desc: '有人评论你的内容时提醒',
                      value: _comments,
                      onChanged: (value) =>
                          _update(_commentsKey, value, () => _comments = value),
                    ),
                    const Divider(height: 1, indent: 48),
                    _Toggle(
                      icon: Icons.person_add,
                      title: '新的关注',
                      desc: '有人关注你时提醒',
                      value: _follows,
                      onChanged: (value) =>
                          _update(_followsKey, value, () => _follows = value),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                const _Section(title: '系统通知'),
                _Card(
                  children: [
                    _Toggle(
                      icon: Icons.campaign,
                      title: '系统消息',
                      desc: '重要更新、审核结果和功能公告',
                      value: _system,
                      onChanged: (value) =>
                          _update(_systemKey, value, () => _system = value),
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

class _Toggle extends StatelessWidget {
  final IconData icon;
  final String title;
  final String desc;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _Toggle({
    required this.icon,
    required this.title,
    required this.desc,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      secondary: Icon(icon, size: 20, color: AppColors.textSecondary),
      title: Text(title, style: const TextStyle(fontSize: 15)),
      subtitle: Text(
        desc,
        style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
      ),
      value: value,
      onChanged: onChanged,
      activeThumbColor: AppColors.textPrimary,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
    );
  }
}
