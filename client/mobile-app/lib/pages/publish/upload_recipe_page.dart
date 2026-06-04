import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../config/glass_theme.dart';

/// 上传菜谱页 — 封面图 + 菜名/简介 + 耗时/难度/份数 + 食材列表 + 烹饪步骤
class UploadRecipePage extends StatefulWidget {
  const UploadRecipePage({super.key});
  @override
  State<UploadRecipePage> createState() => _UploadRecipePageState();
}

class _UploadRecipePageState extends State<UploadRecipePage> {
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final List<Map<String, String>> _ingredients = [
    {'name': '', 'amount': ''},
    {'name': '', 'amount': ''},
  ];
  final List<String> _steps = [''];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
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
        title: const Text('上传菜谱'),
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
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: const Text('发布', style: TextStyle(fontSize: 13)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 封面图
            GestureDetector(
              child: Container(
                height: 220,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.surfaceSecondary,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(
                    color: AppColors.divider,
                    strokeAlign: BorderSide.strokeAlignInside,
                  ),
                ),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.photo_camera,
                      size: 48,
                      color: AppColors.textPlaceholder,
                    ),
                    SizedBox(height: 8),
                    Text(
                      '添加封面图',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            // 表单字段
            _GlassInput(
              controller: _nameCtrl,
              hint: '菜谱名称',
              fontSize: 18,
              bold: true,
            ),
            const SizedBox(height: 12),
            _GlassInput(
              controller: _descCtrl,
              hint: '简介，例如：适合晚餐的快手家常菜',
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            // 快速信息
            SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _GlassPill(icon: Icons.schedule, hint: '烹饪时间'),
                  const SizedBox(width: 10),
                  _GlassPill(icon: Icons.bar_chart, hint: '难度'),
                  const SizedBox(width: 10),
                  _GlassPill(icon: Icons.restaurant, hint: '份量'),
                ],
              ),
            ),
            const SizedBox(height: 28),
            // 食材
            Text('食材清单', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 12),
            ..._ingredients.asMap().entries.map(
              (e) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 48,
                        decoration: BoxDecoration(
                          color: const Color(0x80FFFFFF),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0x0D000000)),
                        ),
                        child: TextField(
                          decoration: const InputDecoration(
                            hintText: '食材名称',
                            hintStyle: TextStyle(
                              fontSize: 15,
                              color: AppColors.textPlaceholder,
                            ),
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(
                              horizontal: 16,
                            ),
                          ),
                          style: const TextStyle(fontSize: 15),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 100,
                      child: Container(
                        height: 48,
                        decoration: BoxDecoration(
                          color: const Color(0x80FFFFFF),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0x0D000000)),
                        ),
                        child: TextField(
                          decoration: const InputDecoration(
                            hintText: '用量',
                            hintStyle: TextStyle(
                              fontSize: 15,
                              color: AppColors.textPlaceholder,
                            ),
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(
                              horizontal: 16,
                            ),
                          ),
                          textAlign: TextAlign.right,
                          style: const TextStyle(fontSize: 15),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () => setState(() => _ingredients.removeAt(e.key)),
                      child: const Icon(
                        Icons.close,
                        size: 20,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            GestureDetector(
              onTap: () =>
                  setState(() => _ingredients.add({'name': '', 'amount': ''})),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  border: Border.all(
                    color: AppColors.divider,
                    strokeAlign: BorderSide.strokeAlignInside,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.add, size: 20, color: AppColors.textSecondary),
                    SizedBox(width: 8),
                    Text(
                      '添加食材',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 28),
            // 步骤
            Text('烹饪步骤', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 12),
            ..._steps.asMap().entries.map(
              (e) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: const BoxDecoration(
                        color: AppColors.textPrimary,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          '${e.key + 1}',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.surface,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0x80FFFFFF),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0x0D000000)),
                        ),
                        child: TextField(
                          maxLines: 3,
                          decoration: const InputDecoration(
                            hintText: '描述这一步的做法...',
                            hintStyle: TextStyle(
                              fontSize: 15,
                              color: AppColors.textPlaceholder,
                            ),
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.all(16),
                          ),
                          style: const TextStyle(fontSize: 15),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            GestureDetector(
              onTap: () => setState(() => _steps.add('')),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: GlassTheme.glassDecoration(borderRadius: 16),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.add, size: 20, color: AppColors.textPrimary),
                    SizedBox(width: 8),
                    Text(
                      '+ 添加步骤',
                      style: TextStyle(
                        fontSize: 13,
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
      ),
    );
  }
}

class _GlassInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final int maxLines;
  final double fontSize;
  final bool bold;
  const _GlassInput({
    required this.controller,
    required this.hint,
    this.maxLines = 1,
    this.fontSize = 15,
    this.bold = false,
  });
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0x80FFFFFF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x0D000000)),
      ),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(
            fontSize: fontSize,
            color: AppColors.textPlaceholder,
            fontWeight: bold ? FontWeight.w700 : FontWeight.w400,
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.all(16),
        ),
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: bold ? FontWeight.w700 : FontWeight.w400,
        ),
      ),
    );
  }
}

class _GlassPill extends StatelessWidget {
  final IconData icon;
  final String hint;
  const _GlassPill({required this.icon, required this.hint});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0x80FFFFFF),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0x0D000000)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 8),
          Text(
            hint,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textPlaceholder,
            ),
          ),
        ],
      ),
    );
  }
}
