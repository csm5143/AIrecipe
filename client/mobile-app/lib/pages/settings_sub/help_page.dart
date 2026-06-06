import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../data/api/app_exception.dart';
import '../../providers/api_providers.dart';
import '../../widgets/capsule_toast.dart';

class HelpPage extends ConsumerStatefulWidget {
  const HelpPage({super.key});

  @override
  ConsumerState<HelpPage> createState() => _HelpPageState();
}

class _HelpPageState extends ConsumerState<HelpPage> {
  final _searchController = TextEditingController();
  final _contentController = TextEditingController();
  final _contactController = TextEditingController();
  var _keyword = '';
  var _feedbackType = 'bug_report';
  var _isSubmitting = false;

  @override
  void dispose() {
    _searchController.dispose();
    _contentController.dispose();
    _contactController.dispose();
    super.dispose();
  }

  List<_FaqData> get _filteredFaqs {
    final keyword = _keyword.trim().toLowerCase();
    if (keyword.isEmpty) return _faqs;
    return _faqs.where((item) {
      return item.question.toLowerCase().contains(keyword) ||
          item.answer.toLowerCase().contains(keyword) ||
          item.category.toLowerCase().contains(keyword);
    }).toList();
  }

  Future<void> _submitFeedback() async {
    final content = _contentController.text.trim();
    if (content.length < 5) {
      showCapsuleToast(context, '请至少输入 5 个字', icon: Icons.info_outline);
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await ref
          .read(feedbackApiProvider)
          .submitFeedback(
            type: _feedbackType,
            content: content,
            contact: _contactController.text.trim(),
          );
      if (!mounted) return;
      _contentController.clear();
      _contactController.clear();
      showCapsuleToast(context, '反馈已提交', icon: Icons.check_circle_outline);
    } catch (error) {
      final message = error is AppException ? error.message : error.toString();
      if (mounted) {
        showCapsuleToast(context, message, icon: Icons.error_outline);
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredFaqs = _filteredFaqs;

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
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 100),
        children: [
          Text(
            '帮助与反馈',
            style: Theme.of(
              context,
            ).textTheme.displayLarge?.copyWith(fontSize: 28),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _searchController,
            onChanged: (value) => setState(() => _keyword = value),
            decoration: InputDecoration(
              hintText: '搜索常见问题...',
              prefixIcon: const Icon(
                Icons.search,
                size: 20,
                color: AppColors.textSecondary,
              ),
              suffixIcon: _keyword.isEmpty
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _keyword = '');
                      },
                    ),
              filled: true,
              fillColor: AppColors.surfaceSecondary,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(24),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16),
            ),
          ),
          const SizedBox(height: 28),
          Text('常见问题', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 12),
          if (filteredFaqs.isEmpty)
            const _EmptyFaq()
          else
            ...filteredFaqs.map((item) => _FaqItem(item: item)),
          const SizedBox(height: 28),
          Text('提交反馈', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 12),
          _FeedbackForm(
            type: _feedbackType,
            contentController: _contentController,
            contactController: _contactController,
            isSubmitting: _isSubmitting,
            onTypeChanged: (value) => setState(() => _feedbackType = value),
            onSubmit: _submitFeedback,
          ),
        ],
      ),
    );
  }
}

class _FeedbackForm extends StatelessWidget {
  final String type;
  final TextEditingController contentController;
  final TextEditingController contactController;
  final bool isSubmitting;
  final ValueChanged<String> onTypeChanged;
  final VoidCallback onSubmit;

  const _FeedbackForm({
    required this.type,
    required this.contentController,
    required this.contactController,
    required this.isSubmitting,
    required this.onTypeChanged,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)],
      ),
      child: Column(
        children: [
          DropdownButtonFormField<String>(
            initialValue: type,
            items: const [
              DropdownMenuItem(value: 'bug_report', child: Text('问题反馈')),
              DropdownMenuItem(value: 'feature_request', child: Text('功能建议')),
              DropdownMenuItem(value: 'content_issue', child: Text('内容问题')),
              DropdownMenuItem(value: 'other', child: Text('其他')),
            ],
            onChanged: isSubmitting
                ? null
                : (value) {
                    if (value != null) onTypeChanged(value);
                  },
            decoration: const InputDecoration(labelText: '反馈类型'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: contentController,
            enabled: !isSubmitting,
            minLines: 4,
            maxLines: 6,
            decoration: const InputDecoration(
              labelText: '反馈内容',
              hintText: '请描述你遇到的问题或建议',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: contactController,
            enabled: !isSubmitting,
            decoration: const InputDecoration(
              labelText: '联系方式（选填）',
              hintText: '手机号或邮箱',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: FilledButton.icon(
              onPressed: isSubmitting ? null : onSubmit,
              icon: isSubmitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send_outlined),
              label: Text(isSubmitting ? '提交中' : '提交反馈'),
            ),
          ),
        ],
      ),
    );
  }
}

class _FaqItem extends StatelessWidget {
  final _FaqData item;

  const _FaqItem({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)],
      ),
      child: ExpansionTile(
        shape: const Border(),
        collapsedShape: const Border(),
        tilePadding: const EdgeInsets.symmetric(horizontal: 16),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        title: Text(item.question, style: const TextStyle(fontSize: 15)),
        subtitle: Text(
          item.category,
          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              item.answer,
              style: const TextStyle(
                fontSize: 14,
                height: 1.5,
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyFaq extends StatelessWidget {
  const _EmptyFaq();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Center(
        child: Text(
          '没有找到相关问题',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      ),
    );
  }
}

class _FaqData {
  final String category;
  final String question;
  final String answer;

  const _FaqData({
    required this.category,
    required this.question,
    required this.answer,
  });
}

const _faqs = [
  _FaqData(
    category: '账号与登录',
    question: '忘记密码怎么办？',
    answer: '在登录页选择手机号登录或注册。密码修改入口在“账号与安全”页面，后端接口可用时会直接更新密码。',
  ),
  _FaqData(
    category: 'AI 助手',
    question: 'AI 为什么暂时没有回复？',
    answer:
        'AI 聊天依赖后台配置的 text 或 multimodal 类型 API Key。如果还没有配置，小厨子会先保存对话，配置完成后即可继续测试。',
  ),
  _FaqData(
    category: '菜谱发布',
    question: '草稿箱里的菜谱可以继续编辑吗？',
    answer: '可以。进入草稿箱后点击草稿，会回到发布编辑页继续编辑并保存到后端。',
  ),
  _FaqData(
    category: '收藏与菜篮',
    question: '收藏和菜篮会同步到其他端吗？',
    answer: '登录后收藏夹、冰箱和购物清单会走后端接口，后续小程序和 APP 可共用同一份数据。',
  ),
  _FaqData(
    category: '隐私',
    question: '冰箱和收藏夹可见范围在哪里设置？',
    answer: '进入“设置 - 隐私设置”，可以分别设置冰箱食材和收藏夹的可见范围。',
  ),
  _FaqData(
    category: '图片上传',
    question: '头像和菜谱图保存在哪里？',
    answer: '后端上传服务会优先使用腾讯云 COS。当前 APP 里的图片入口会逐步接入该上传接口。',
  ),
];
