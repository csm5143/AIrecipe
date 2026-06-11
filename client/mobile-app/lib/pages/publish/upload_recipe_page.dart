import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../config/theme.dart';
import '../../models/recipe.dart';
import '../../providers/api_providers.dart';
import '../../providers/recipe_provider.dart';
import '../../widgets/capsule_toast.dart';

class UploadRecipePage extends ConsumerStatefulWidget {
  final Recipe? initialRecipe;

  const UploadRecipePage({super.key, this.initialRecipe});

  @override
  ConsumerState<UploadRecipePage> createState() => _UploadRecipePageState();
}

class _UploadRecipePageState extends ConsumerState<UploadRecipePage> {
  final _picker = ImagePicker();
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _cookTimeCtrl = TextEditingController(text: '30');
  final _servingsCtrl = TextEditingController(text: '2');
  final List<_IngredientEditors> _ingredients = [];
  final List<_StepData> _steps = [];
  XFile? _coverFile;
  String _difficulty = 'normal';
  bool _saving = false;

  bool get _isEditing => widget.initialRecipe != null;

  @override
  void initState() {
    super.initState();
    final recipe = widget.initialRecipe;
    if (recipe != null) {
      _nameCtrl.text = recipe.title;
      _descCtrl.text = recipe.description;
      _cookTimeCtrl.text = recipe.cookTime.toString();
      _servingsCtrl.text = recipe.servings.toString();
      _difficulty = _difficultyToApi(recipe.difficulty);
      for (final item in recipe.ingredients) {
        _ingredients.add(
          _IngredientEditors(
            name: TextEditingController(text: item.name),
            amount: TextEditingController(
              text: [item.amount, item.unit].where((v) => v.isNotEmpty).join(''),
            ),
          ),
        );
      }
      for (final step in recipe.steps) {
        _steps.add(_StepData(
          controller: TextEditingController(text: step.description),
          imageUrl: step.imageUrl,
        ));
      }
    }

    if (_ingredients.isEmpty) {
      _ingredients.addAll([_IngredientEditors.empty(), _IngredientEditors.empty()]);
    }
    if (_steps.isEmpty) _steps.add(_StepData(controller: TextEditingController()));
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    _cookTimeCtrl.dispose();
    _servingsCtrl.dispose();
    for (final item in _ingredients) { item.dispose(); }
    for (final step in _steps) { step.dispose(); }
    super.dispose();
  }

  Future<void> _saveRecipe(String status) async {
    final title = _nameCtrl.text.trim();
    if (status != 'draft' && title.isEmpty) {
      showCapsuleToast(context, '请输入菜谱名称');
      return;
    }

    setState(() => _saving = true);
    try {
      final uploadApi = ref.read(uploadApiProvider);

      // Upload cover image
      String coverUrl = widget.initialRecipe?.coverImage ?? '';
      if (_coverFile != null) {
        coverUrl = await uploadApi.uploadUserRecipeImage(
          _coverFile!,
          purpose: 'cover',
          title: title,
        );
      }

      // Upload step images in parallel
      final stepImageFutures = _steps.asMap().entries.map((entry) async {
        final index = entry.key;
        final step = entry.value;
        if (step.imageFile != null) {
          return await uploadApi.uploadUserRecipeImage(
            step.imageFile!,
            purpose: 'step',
            title: title,
            stepIndex: index,
          );
        }
        return step.imageUrl ?? '';
      }).toList();
      final stepImages = await Future.wait(stepImageFutures);

      final stepsPayload = <Map<String, dynamic>>[];
      for (var i = 0; i < _steps.length; i++) {
        final text = _steps[i].controller.text.trim();
        if (text.isEmpty && stepImages[i].isEmpty) continue;
        stepsPayload.add({
          'order': i + 1,
          'content': text,
          'image': stepImages[i],
        });
      }

      final payload = {
        'title': title,
        'description': _descCtrl.text.trim(),
        'coverImage': coverUrl,
        'difficulty': _difficulty,
        'cookingTime': _cookTimeCtrl.text.trim(),
        'servings': _servingsCtrl.text.trim(),
        'status': status,
        'ingredients': _ingredients
            .map((item) => {'name': item.name.text.trim(), 'amount': item.amount.text.trim()})
            .where((item) => item['name']!.isNotEmpty)
            .toList(),
        'steps': stepsPayload,
      };

      final existingId = widget.initialRecipe?.id;
      if (existingId != null && existingId.isNotEmpty) {
        await ref.read(recipeApiProvider).updateUserRecipe(existingId, payload);
      } else {
        await ref.read(recipeApiProvider).submitUserRecipe(payload);
      }

      ref.invalidate(myRecipeListProvider);
      if (!mounted) return;
      showCapsuleToast(context, status == 'draft' ? '草稿已保存' : '已提交审核', icon: Icons.check_circle_outline);
      context.go('/drafts');
    } catch (error) {
      if (mounted) showCapsuleToast(context, '保存失败: $error');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
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
        title: Text(_isEditing ? '继续编辑' : '上传菜谱'),
        actions: [
          TextButton(
            onPressed: _saving ? null : () => _saveRecipe('draft'),
            child: const Text('保存草稿', style: TextStyle(fontSize: 13)),
          ),
          const SizedBox(width: 4),
          TextButton(
            onPressed: _saving ? null : () => _saveRecipe('pending'),
            style: TextButton.styleFrom(
              backgroundColor: AppColors.textPrimary,
              foregroundColor: AppColors.surface,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: _saving
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('提交', style: TextStyle(fontSize: 13)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _CoverPicker(
              imageUrl: widget.initialRecipe?.coverImage ?? '',
              imageFile: _coverFile,
              onPick: () => _pickCoverImage(),
            ),
            const SizedBox(height: 16),
            _GlassInput(
              controller: _nameCtrl,
              hint: '菜谱名称',
              fontSize: 18,
              bold: true,
            ),
            const SizedBox(height: 12),
            _GlassInput(
              controller: _descCtrl,
              hint: '描述',
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _GlassInput(
                    controller: _cookTimeCtrl,
                    hint: '烹饪时间',
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _GlassInput(
                    controller: _servingsCtrl,
                    hint: '份数',
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _DifficultySelector(
              value: _difficulty,
              onChanged: (value) => setState(() => _difficulty = value),
            ),
            const SizedBox(height: 28),
            _SectionTitle(title: '食材', onAdd: _addIngredient),
            const SizedBox(height: 12),
            ..._ingredients.asMap().entries.map(
              (entry) => _IngredientRow(
                editors: entry.value,
                onRemove: _ingredients.length <= 1
                    ? null
                    : () => setState(() {
                        entry.value.dispose();
                        _ingredients.removeAt(entry.key);
                      }),
              ),
            ),
            const SizedBox(height: 28),
            _SectionTitle(title: '步骤', onAdd: _addStep),
            const SizedBox(height: 12),
            ..._steps.asMap().entries.map(
              (entry) => _StepEditor(
                index: entry.key,
                controller: entry.value.controller,
                imageFile: entry.value.imageFile,
                imageUrl: entry.value.imageUrl,
                onPickImage: () => _pickStepImage(entry.key),
                onRemoveImage: () => _removeStepImage(entry.key),
                onRemove: _steps.length <= 1
                    ? null
                    : () => setState(() {
                        entry.value.dispose();
                        _steps.removeAt(entry.key);
                      }),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _addIngredient() {
    setState(() => _ingredients.add(_IngredientEditors.empty()));
  }

  void _addStep() {
    setState(() => _steps.add(_StepData(controller: TextEditingController())));
  }

  Future<void> _pickCoverImage() async {
    final file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85, maxWidth: 1600);
    if (file != null) setState(() => _coverFile = file);
  }

  Future<void> _pickStepImage(int index) async {
    final file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80, maxWidth: 1200);
    if (file != null) setState(() => _steps[index].imageFile = file);
  }

  void _removeStepImage(int index) {
    setState(() {
      _steps[index].imageFile = null;
      _steps[index].imageUrl = null;
    });
  }
}

class _StepData {
  final TextEditingController controller;
  XFile? imageFile;
  String? imageUrl;

  _StepData({required this.controller, this.imageFile, this.imageUrl});

  void dispose() {
    controller.dispose();
  }
}

class _IngredientEditors {
  final TextEditingController name;
  final TextEditingController amount;

  const _IngredientEditors({required this.name, required this.amount});

  factory _IngredientEditors.empty() {
    return _IngredientEditors(
      name: TextEditingController(),
      amount: TextEditingController(),
    );
  }

  void dispose() {
    name.dispose();
    amount.dispose();
  }
}

class _CoverPicker extends StatelessWidget {
  final String imageUrl;
  final XFile? imageFile;
  final VoidCallback? onPick;

  const _CoverPicker({required this.imageUrl, this.imageFile, this.onPick});

  @override
  Widget build(BuildContext context) {
    final hasImage = imageFile != null || imageUrl.isNotEmpty;

    return GestureDetector(
      onTap: onPick,
      child: Container(
        height: 200,
        width: double.infinity,
        decoration: BoxDecoration(
          color: AppColors.surfaceSecondary,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppColors.divider),
        ),
        child: hasImage
            ? ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: imageFile != null
                    ? FutureBuilder(
                        future: imageFile!.readAsBytes(),
                        builder: (_, snap) => snap.hasData
                            ? Image.memory(snap.data!, fit: BoxFit.cover)
                            : const Center(child: CircularProgressIndicator()),
                      )
                    : Image.network(imageUrl, fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const Icon(Icons.broken_image, size: 48, color: AppColors.textPlaceholder)),
              )
            : const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.photo_camera, size: 48, color: AppColors.textPlaceholder),
                  SizedBox(height: 8),
                  Text('点击上传封面图', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                ],
              ),
      ),
    );
  }
}

class _DifficultySelector extends StatelessWidget {
  final String value;
  final ValueChanged<String> onChanged;

  const _DifficultySelector({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Row(
      children:
          const [
            _DifficultyOption(label: '简单', value: 'easy'),
            _DifficultyOption(label: '中等', value: 'normal'),
            _DifficultyOption(label: '困难', value: 'hard'),
          ].map((option) {
            final active = option.value == value;
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: option.value == 'hard' ? 0 : 8),
                child: GestureDetector(
                  onTap: () => onChanged(option.value),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: active ? AppColors.textPrimary : AppColors.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: active
                          ? null
                          : Border.all(color: AppColors.divider),
                    ),
                    child: Text(
                      option.label,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: active
                            ? AppColors.surface
                            : AppColors.textSecondary,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
    );
  }
}

class _DifficultyOption {
  final String label;
  final String value;

  const _DifficultyOption({required this.label, required this.value});
}

class _SectionTitle extends StatelessWidget {
  final String title;
  final VoidCallback onAdd;

  const _SectionTitle({required this.title, required this.onAdd});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(title, style: Theme.of(context).textTheme.headlineMedium),
        const Spacer(),
        IconButton(
          tooltip: '添加',
          icon: const Icon(Icons.add_circle_outline),
          onPressed: onAdd,
        ),
      ],
    );
  }
}

class _IngredientRow extends StatelessWidget {
  final _IngredientEditors editors;
  final VoidCallback? onRemove;

  const _IngredientRow({required this.editors, this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(
            child: _GlassInput(controller: editors.name, hint: '食材名称'),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 110,
            child: _GlassInput(controller: editors.amount, hint: '用量'),
          ),
          IconButton(
            icon: const Icon(Icons.close),
            color: AppColors.textSecondary,
            onPressed: onRemove,
          ),
        ],
      ),
    );
  }
}

class _StepEditor extends StatelessWidget {
  final int index;
  final TextEditingController controller;
  final VoidCallback? onRemove;
  final XFile? imageFile;
  final String? imageUrl;
  final VoidCallback? onPickImage;
  final VoidCallback? onRemoveImage;

  const _StepEditor({
    required this.index,
    required this.controller,
    this.onRemove,
    this.imageFile,
    this.imageUrl,
    this.onPickImage,
    this.onRemoveImage,
  });

  @override
  Widget build(BuildContext context) {
    final hasImage = imageFile != null || (imageUrl != null && imageUrl!.isNotEmpty);

    return Padding(
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
                '${index + 1}',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.surface),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _GlassInput(controller: controller, hint: '描述这一步...', maxLines: 3),
                const SizedBox(height: 8),
                Row(
                  children: [
                    GestureDetector(
                      onTap: hasImage ? onRemoveImage : onPickImage,
                      child: Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          color: AppColors.surfaceSecondary,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.divider),
                        ),
                        child: hasImage
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: imageFile != null
                                    ? FutureBuilder(
                                        future: imageFile!.readAsBytes(),
                                        builder: (_, snap) => snap.hasData
                                            ? Image.memory(snap.data!, width: 64, height: 64, fit: BoxFit.cover)
                                            : const Icon(Icons.image, size: 24, color: AppColors.textSecondary),
                                      )
                                    : Image.network(imageUrl!, width: 64, height: 64, fit: BoxFit.cover,
                                        errorBuilder: (_, __, ___) => const Icon(Icons.image, size: 24, color: AppColors.textSecondary)),
                              )
                            : const Icon(Icons.add_photo_alternate, size: 24, color: AppColors.textSecondary),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      hasImage ? '点击移除图片' : '添加步骤图片',
                      style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close),
            color: AppColors.textSecondary,
            onPressed: onRemove,
          ),
        ],
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
  final TextInputType? keyboardType;

  const _GlassInput({
    required this.controller,
    required this.hint,
    this.maxLines = 1,
    this.fontSize = 15,
    this.bold = false,
    this.keyboardType,
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
        keyboardType: keyboardType,
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

String _difficultyToApi(String value) {
  switch (value) {
    case 'Easy':
    case '简单':
      return 'easy';
    case 'Hard':
    case '困难':
      return 'hard';
    default:
      return 'normal';
  }
}
