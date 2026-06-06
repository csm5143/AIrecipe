import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../../config/constants.dart';
import '../../config/theme.dart';

class AboutPage extends StatefulWidget {
  const AboutPage({super.key});

  @override
  State<AboutPage> createState() => _AboutPageState();
}

class _AboutPageState extends State<AboutPage> {
  PackageInfo? _packageInfo;

  @override
  void initState() {
    super.initState();
    _loadPackageInfo();
  }

  Future<void> _loadPackageInfo() async {
    final info = await PackageInfo.fromPlatform();
    if (!mounted) return;
    setState(() => _packageInfo = info);
  }

  void _showTextDialog(String title, String content) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: SingleChildScrollView(child: Text(content)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('知道了'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final version = _packageInfo == null
        ? '读取中'
        : '${_packageInfo!.version}+${_packageInfo!.buildNumber}';

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
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 36, 16, 32),
        children: [
          Center(
            child: Column(
              children: [
                Container(
                  width: 112,
                  height: 112,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    color: AppColors.textPrimary,
                    boxShadow: const [
                      BoxShadow(color: Color(0x1A000000), blurRadius: 32),
                    ],
                  ),
                  child: const Icon(
                    Icons.restaurant,
                    size: 56,
                    color: AppColors.surface,
                  ),
                ),
                const SizedBox(height: 20),
                Text('小厨子', style: Theme.of(context).textTheme.displayLarge),
                const SizedBox(height: 8),
                Text(
                  'AIrecipe',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 12),
                _Badge(text: 'Version $version'),
              ],
            ),
          ),
          const SizedBox(height: 36),
          _InfoCard(
            children: [
              _LinkRow(
                title: '更新日志',
                onTap: () => _showTextDialog('更新日志', _changeLogText),
              ),
              const Divider(height: 1, indent: 16),
              _LinkRow(
                title: '用户协议',
                onTap: () => _showTextDialog('用户协议', _userAgreementText),
              ),
              const Divider(height: 1, indent: 16),
              _LinkRow(
                title: '隐私政策',
                onTap: () => _showTextDialog('隐私政策', _privacyPolicyText),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _InfoCard(
            children: const [
              _PlainRow(title: '当前 API 环境', value: AppConstants.apiBaseDev),
            ],
          ),
          const SizedBox(height: 36),
          Text(
            'Copyright © ${DateTime.now().year} 小厨子 AIrecipe. All rights reserved.',
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.labelSmall?.copyWith(color: AppColors.textPlaceholder),
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String text;

  const _Badge({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.surfaceSecondary,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final List<Widget> children;

  const _InfoCard({required this.children});

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

class _LinkRow extends StatelessWidget {
  final String title;
  final VoidCallback onTap;

  const _LinkRow({required this.title, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      title: Text(title, style: const TextStyle(fontSize: 15)),
      trailing: const Icon(Icons.chevron_right, color: AppColors.divider),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }
}

class _PlainRow extends StatelessWidget {
  final String title;
  final String value;

  const _PlainRow({required this.title, required this.value});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(title, style: const TextStyle(fontSize: 15)),
      subtitle: Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Text(
          value,
          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
        ),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }
}

const _changeLogText = '''
1. 接入真实后端账号、菜谱、收藏、草稿和 AI 聊天框架。
2. 优化设置页和个人中心体验。
3. 后续将继续完善图片上传、识别和多端同步细节。
''';

const _userAgreementText = '''
欢迎使用小厨子。你需要保证发布内容真实、合法，不上传侵权、违法或危害食品安全的信息。平台会根据内容规范对公开菜谱和社区内容进行审核。
''';

const _privacyPolicyText = '''
小厨子会在你授权或主动提交时收集账号资料、菜谱内容、收藏、浏览记录和反馈信息，用于提供多端同步、个性化推荐和问题处理。你可以在设置中管理部分隐私选项。
''';
