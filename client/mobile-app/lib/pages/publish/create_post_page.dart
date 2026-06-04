import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';

/// 发帖子页 — 文字输入 + 图片上传 + 位置话题标签 + 底部格式工具栏
class CreatePostPage extends StatefulWidget {
  const CreatePostPage({super.key});
  @override
  State<CreatePostPage> createState() => _CreatePostPageState();
}

class _CreatePostPageState extends State<CreatePostPage> {
  final _textCtrl = TextEditingController();
  final List<String> _images = [];
  int _charCount = 0;

  @override
  void dispose() {
    _textCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.glassSurface,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () =>
              Navigator.of(context).canPop() ? context.pop() : context.go('/'),
        ),
        title: const Text('发帖子'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).canPop()
                ? context.pop()
                : context.go('/'),
            style: TextButton.styleFrom(
              backgroundColor: AppColors.textPrimary,
              foregroundColor: AppColors.surface,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text('发布', style: TextStyle(fontSize: 13)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: _textCtrl,
                    maxLines: null,
                    minLines: 5,
                    onChanged: (v) => setState(() => _charCount = v.length),
                    decoration: const InputDecoration(
                      hintText: '分享你的美食心得...',
                      hintStyle: TextStyle(
                        fontSize: 17,
                        color: AppColors.textPlaceholder,
                      ),
                      border: InputBorder.none,
                    ),
                    style: const TextStyle(fontSize: 17, height: 1.6),
                  ),
                  const SizedBox(height: 24),
                  // 图片
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      ..._images.map(
                        (_) => Container(
                          width: (MediaQuery.of(context).size.width - 44) / 3,
                          height: (MediaQuery.of(context).size.width - 44) / 3,
                          decoration: BoxDecoration(
                            color: AppColors.surfaceSecondary,
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => setState(() => _images.add('')),
                        child: Container(
                          width: (MediaQuery.of(context).size.width - 44) / 3,
                          height: (MediaQuery.of(context).size.width - 44) / 3,
                          decoration: BoxDecoration(
                            color: const Color(0x80FFFFFF),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.divider),
                          ),
                          child: const Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.add_photo_alternate,
                                size: 32,
                                color: AppColors.textSecondary,
                              ),
                              SizedBox(height: 4),
                              Text(
                                '添加图片',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Divider(color: AppColors.divider),
                  const SizedBox(height: 16),
                  // 位置与话题
                  _TagChip(icon: Icons.location_on, label: '添加位置'),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _TopicChip(label: '# 今日美食', active: true),
                      _TopicChip(label: '# 做饭技巧', active: true),
                      _TopicChip(label: '+ 添加话题', active: false),
                    ],
                  ),
                ],
              ),
            ),
          ),
          // 底部工具栏
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
            decoration: BoxDecoration(
              color: AppColors.glassSurface,
              border: Border(top: BorderSide(color: const Color(0x0A000000))),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      _ToolBtn(icon: Icons.format_bold),
                      const SizedBox(width: 24),
                      _ToolBtn(icon: Icons.format_list_bulleted),
                      const SizedBox(width: 24),
                      _ToolBtn(icon: Icons.alternate_email),
                      const SizedBox(width: 24),
                      _ToolBtn(icon: Icons.sentiment_satisfied_outlined),
                    ],
                  ),
                  Text(
                    '$_charCount / 500',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
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
}

class _TagChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _TagChip({required this.icon, required this.label});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0x80FFFFFF),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _TopicChip extends StatelessWidget {
  final String label;
  final bool active;
  const _TopicChip({required this.label, required this.active});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: active ? const Color(0x80FFFFFF) : Colors.transparent,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: active ? AppColors.divider : AppColors.textPlaceholder,
          strokeAlign: active
              ? BorderSide.strokeAlignInside
              : BorderSide.strokeAlignInside,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 13,
          color: active ? AppColors.textPrimary : AppColors.textSecondary,
        ),
      ),
    );
  }
}

class _ToolBtn extends StatelessWidget {
  final IconData icon;
  const _ToolBtn({required this.icon});
  @override
  Widget build(BuildContext context) {
    return Icon(icon, size: 24, color: AppColors.textSecondary);
  }
}
