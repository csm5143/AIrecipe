import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../config/theme.dart';
import '../../providers/api_providers.dart';
import '../../providers/collection_provider.dart';
import '../../widgets/capsule_toast.dart';

/// 发帖子页 - 文字输入 + 图片上传 + 位置话题标签 + 底部格式工具栏
class CreatePostPage extends ConsumerStatefulWidget {
  const CreatePostPage({super.key});

  @override
  ConsumerState<CreatePostPage> createState() => _CreatePostPageState();
}

class _CreatePostPageState extends ConsumerState<CreatePostPage> {
  static const _maxImages = 9;

  final _picker = ImagePicker();
  final _textCtrl = TextEditingController();
  final List<File> _images = [];
  int _charCount = 0;
  bool _submitting = false;

  @override
  void dispose() {
    _textCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tileSize = (MediaQuery.of(context).size.width - 56) / 3;

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
            onPressed: _submitting ? null : _submit,
            style: TextButton.styleFrom(
              backgroundColor: AppColors.textPrimary,
              foregroundColor: AppColors.surface,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: _submitting
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('发布', style: TextStyle(fontSize: 13)),
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
                    enabled: !_submitting,
                    maxLines: null,
                    minLines: 5,
                    maxLength: 500,
                    onChanged: (v) => setState(() => _charCount = v.length),
                    decoration: const InputDecoration(
                      hintText: '分享你的美食心得...',
                      hintStyle: TextStyle(
                        fontSize: 17,
                        color: AppColors.textPlaceholder,
                      ),
                      border: InputBorder.none,
                      counterText: '',
                    ),
                    style: const TextStyle(fontSize: 17, height: 1.6),
                  ),
                  const SizedBox(height: 24),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      for (var i = 0; i < _images.length; i++)
                        _ImageTile(
                          file: _images[i],
                          size: tileSize,
                          onRemove: _submitting ? null : () => _removeImage(i),
                        ),
                      if (_images.length < _maxImages)
                        _AddImageTile(
                          size: tileSize,
                          onTap: _submitting ? null : _showImageSourceSheet,
                        ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Divider(color: AppColors.divider),
                  const SizedBox(height: 16),
                  _TagChip(
                    icon: Icons.location_on,
                    label: '添加位置',
                    onTap: () => _toastDeveloping('位置功能开发中'),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _TopicChip(
                        label: '# 今日美食',
                        active: true,
                        onTap: () => _toastDeveloping('话题功能开发中'),
                      ),
                      _TopicChip(
                        label: '# 做饭技巧',
                        active: true,
                        onTap: () => _toastDeveloping('话题功能开发中'),
                      ),
                      _TopicChip(
                        label: '+ 添加话题',
                        active: false,
                        onTap: () => _toastDeveloping('话题功能开发中'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
            decoration: const BoxDecoration(
              color: AppColors.glassSurface,
              border: Border(top: BorderSide(color: Color(0x0A000000))),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      _ToolBtn(
                        icon: Icons.format_bold,
                        onTap: () => _toastDeveloping('加粗功能开发中'),
                      ),
                      const SizedBox(width: 24),
                      _ToolBtn(
                        icon: Icons.format_list_bulleted,
                        onTap: () => _toastDeveloping('列表功能开发中'),
                      ),
                      const SizedBox(width: 24),
                      _ToolBtn(
                        icon: Icons.alternate_email,
                        onTap: () => _toastDeveloping('提及功能开发中'),
                      ),
                      const SizedBox(width: 24),
                      _ToolBtn(
                        icon: Icons.sentiment_satisfied_outlined,
                        onTap: () => _toastDeveloping('表情功能开发中'),
                      ),
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

  Future<void> _showImageSourceSheet() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: const Text('拍照'),
              onTap: () => Navigator.of(context).pop(ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('从相册选择'),
              onTap: () => Navigator.of(context).pop(ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (!mounted || source == null) return;

    await _pickImages(source);
  }

  Future<void> _pickImages(ImageSource source) async {
    final remaining = _maxImages - _images.length;
    if (remaining <= 0) {
      showCapsuleToast(context, '最多选择9张图片', icon: Icons.info_outline);
      return;
    }

    try {
      final List<XFile> pickedFiles;
      if (source == ImageSource.camera) {
        final file = await _picker.pickImage(
          source: ImageSource.camera,
          imageQuality: 85,
        );
        pickedFiles = file == null ? const [] : [file];
      } else {
        pickedFiles = await _picker.pickMultiImage(
          imageQuality: 85,
          limit: remaining,
        );
      }

      if (!mounted || pickedFiles.isEmpty) return;

      setState(() {
        _images.addAll(
          pickedFiles.take(remaining).map((file) => File(file.path)),
        );
      });
    } catch (error) {
      if (!mounted) return;
      showCapsuleToast(context, '选择图片失败：$error', icon: Icons.error_outline);
    }
  }

  void _removeImage(int index) {
    setState(() => _images.removeAt(index));
  }

  Future<List<String>> _uploadImages() async {
    final uploadApi = ref.read(uploadApiProvider);
    final urls = <String>[];
    for (final file in _images) {
      final url = await uploadApi.uploadImage(file.path);
      if (url.isNotEmpty) urls.add(url);
    }
    return urls;
  }

  Future<void> _submit() async {
    final content = _textCtrl.text.trim();
    if (content.isEmpty) {
      showCapsuleToast(context, '先写一点内容再发布', icon: Icons.error_outline);
      return;
    }

    setState(() => _submitting = true);
    try {
      final imageUrls = await _uploadImages();
      final post = await ref.read(postApiProvider).createPost({
        'content': content,
        'status': 'pending',
        'coverImage': imageUrls.isNotEmpty ? imageUrls.first : '',
        'imageUrls': imageUrls,
      });
      ref.invalidate(postListProvider);

      if (!mounted) return;
      showCapsuleToast(context, '已提交审核');
      context.go('/post/${post.id}');
    } catch (error) {
      if (!mounted) return;
      showCapsuleToast(context, error.toString(), icon: Icons.error_outline);
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  void _toastDeveloping(String message) {
    showCapsuleToast(context, message, icon: Icons.info_outline);
  }
}

class _ImageTile extends StatelessWidget {
  final File file;
  final double size;
  final VoidCallback? onRemove;

  const _ImageTile({
    required this.file,
    required this.size,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned.fill(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.file(file, fit: BoxFit.cover),
            ),
          ),
          Positioned(
            top: 6,
            right: 6,
            child: GestureDetector(
              onTap: onRemove,
              child: Container(
                width: 24,
                height: 24,
                decoration: const BoxDecoration(
                  color: Color(0xB3000000),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, size: 16, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AddImageTile extends StatelessWidget {
  final double size;
  final VoidCallback? onTap;

  const _AddImageTile({required this.size, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
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
              style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}

class _TagChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _TagChip({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Container(
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
      ),
    );
  }
}

class _TopicChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _TopicChip({
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: active ? const Color(0x80FFFFFF) : Colors.transparent,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: active ? AppColors.divider : AppColors.textPlaceholder,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: active ? AppColors.textPrimary : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _ToolBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _ToolBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkResponse(
      onTap: onTap,
      radius: 24,
      child: Icon(icon, size: 24, color: AppColors.textSecondary),
    );
  }
}
