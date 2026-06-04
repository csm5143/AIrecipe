import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../widgets/capsule_toast.dart';

class HelpPage extends StatelessWidget {
  const HelpPage({super.key});
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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () =>
            showCapsuleToast(context, '反馈邮件入口稍后接入', icon: Icons.mail_outline),
        backgroundColor: AppColors.glassSurface,
        foregroundColor: AppColors.textPrimary,
        icon: const Icon(Icons.mail),
        label: const Text('联系我们'),
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 100),
        children: [
          Text(
            '帮助与反馈',
            style: Theme.of(
              context,
            ).textTheme.displayLarge?.copyWith(fontSize: 28),
          ),
          const SizedBox(height: 20),
          // Search
          Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: AppColors.surfaceSecondary,
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Row(
              children: [
                Icon(Icons.search, size: 20, color: AppColors.textSecondary),
                SizedBox(width: 8),
                Text(
                  '搜索常见问题...',
                  style: TextStyle(
                    fontSize: 15,
                    color: AppColors.textPlaceholder,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),
          Text('需要什么帮助？', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.3,
            children: [
              _HelpCard(icon: Icons.login, title: '账号与登录', desc: '密码重置、个人资料设置'),
              _HelpCard(
                icon: Icons.smart_toy,
                title: 'AI 助手',
                desc: '食谱生成故障排除',
              ),
              _HelpCard(icon: Icons.publish, title: '发布食谱', desc: '草稿、图片和分享'),
              _HelpCard(
                icon: Icons.credit_card,
                title: '计费与订阅',
                desc: '管理支付方式',
              ),
            ],
          ),
          const SizedBox(height: 28),
          Text('常见问题', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 12),
          _FaqItem(question: '如何保存食谱？'),
          _FaqItem(question: 'AI 为什么不回复？'),
          _FaqItem(question: '可以修改用户名吗？'),
        ],
      ),
    );
  }
}

class _HelpCard extends StatelessWidget {
  final IconData icon;
  final String title, desc;
  const _HelpCard({
    required this.icon,
    required this.title,
    required this.desc,
  });
  @override
  Widget build(BuildContext c) => GestureDetector(
    onTap: () => showCapsuleToast(c, '已打开$title帮助'),
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 28, color: AppColors.textPrimary),
          const Spacer(),
          Text(
            title,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            desc,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    ),
  );
}

class _FaqItem extends StatefulWidget {
  final String question;
  const _FaqItem({required this.question});
  @override
  State<_FaqItem> createState() => _FaqItemState();
}

class _FaqItemState extends State<_FaqItem> {
  bool _expanded = false;
  @override
  Widget build(BuildContext c) => Container(
    margin: const EdgeInsets.only(bottom: 4),
    decoration: BoxDecoration(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(12),
      boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)],
    ),
    child: ListTile(
      title: Text(widget.question, style: const TextStyle(fontSize: 15)),
      trailing: AnimatedRotation(
        turns: _expanded ? 0.5 : 0,
        duration: const Duration(milliseconds: 200),
        child: const Icon(Icons.expand_more, color: AppColors.textSecondary),
      ),
      onTap: () => setState(() => _expanded = !_expanded),
    ),
  );
}
