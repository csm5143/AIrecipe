import 'dart:typed_data';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../config/theme.dart';
import '../../models/ingredient.dart';
import '../../providers/api_providers.dart';
import '../../providers/collection_provider.dart';
import '../../widgets/capsule_toast.dart';

class ScanPage extends ConsumerStatefulWidget {
  const ScanPage({super.key});

  @override
  ConsumerState<ScanPage> createState() => _ScanPageState();
}

class _ScanPageState extends ConsumerState<ScanPage>
    with SingleTickerProviderStateMixin {
  final _picker = ImagePicker();
  late final AnimationController _scanCtrl;

  XFile? _imageFile;
  List<_DetectedIngredient> _detectedItems = const [];
  bool _hasScanned = false;
  bool _recognizing = false;
  bool _adding = false;

  @override
  void initState() {
    super.initState();
    _scanCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _scanCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          Positioned.fill(child: _CameraPreviewBackground(file: _imageFile)),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withAlpha(120),
                    Colors.transparent,
                    Colors.black.withAlpha(150),
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  _GlassIconButton(
                    icon: Icons.close,
                    onTap: () => Navigator.of(context).canPop()
                        ? context.pop()
                        : context.go('/'),
                  ),
                  const Spacer(),
                  const Text(
                    '拍照识别食材',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      shadows: [Shadow(color: Colors.black45, blurRadius: 10)],
                    ),
                  ),
                  const Spacer(),
                  _GlassIconButton(
                    icon: Icons.help_outline,
                    onTap: () => showCapsuleToast(context, '请让食材完整出现在画面内'),
                  ),
                ],
              ),
            ),
          ),
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: AspectRatio(
                aspectRatio: 0.82,
                child: Stack(
                  children: [
                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(28),
                          border: Border.all(
                            color: const Color(0xCCFFFFFF),
                            width: 1.4,
                          ),
                        ),
                      ),
                    ),
                    const Positioned(top: 0, left: 0, child: _FrameCorner()),
                    const Positioned(
                      top: 0,
                      right: 0,
                      child: _FrameCorner(turns: 1),
                    ),
                    const Positioned(
                      bottom: 0,
                      right: 0,
                      child: _FrameCorner(turns: 2),
                    ),
                    const Positioned(
                      bottom: 0,
                      left: 0,
                      child: _FrameCorner(turns: 3),
                    ),
                    AnimatedBuilder(
                      animation: _scanCtrl,
                      builder: (context, _) {
                        return Positioned(
                          left: 18,
                          right: 18,
                          top: 26 + _scanCtrl.value * 430,
                          child: Container(
                            height: 2,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [
                                  Colors.transparent,
                                  Colors.white,
                                  Colors.transparent,
                                ],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.white.withAlpha(120),
                                  blurRadius: 18,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                    if (_hasScanned)
                      ..._detectedItems.take(2).toList().asMap().entries.map((
                        entry,
                      ) {
                        final first = entry.key == 0;
                        return Positioned(
                          left: first ? 52 : null,
                          right: first ? null : 44,
                          top: first ? 104 : 238,
                          child: _DetectBox(
                            label: entry.value.name,
                            confidence: entry.value.confidence,
                          ),
                        );
                      }),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: SafeArea(
              top: false,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 260),
                    child: _buildBottomPanel(),
                  ),
                  const SizedBox(height: 14),
                  _CaptureBar(
                    hasScanned: _hasScanned,
                    isBusy: _recognizing,
                    onFlash: () => showCapsuleToast(context, '闪光灯请在系统相机中设置'),
                    onCapture: () => _pickAndRecognize(ImageSource.camera),
                    onAlbum: () => _pickAndRecognize(ImageSource.gallery),
                    onReset: _reset,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomPanel() {
    if (_recognizing) {
      return const _HintPill(
        key: ValueKey('recognizing'),
        text: '正在识别食材...',
        loading: true,
      );
    }

    if (_hasScanned) {
      return _ResultPanel(
        key: const ValueKey('result'),
        items: _detectedItems,
        adding: _adding,
        onAdd: _addToFridge,
        onRecipe: _generateRecipe,
      );
    }

    return const _HintPill(key: ValueKey('hint'), text: '将食材放入画面，点击快门开始识别');
  }

  Future<void> _pickAndRecognize(ImageSource source) async {
    if (_recognizing) return;

    try {
      final picked = await _picker.pickImage(source: source, imageQuality: 85);
      if (!mounted || picked == null) return;

      setState(() {
        _imageFile = picked;
        _detectedItems = const [];
        _hasScanned = false;
        _recognizing = true;
      });

      final imageUrl = await ref
          .read(uploadApiProvider)
          .uploadImage(picked, folder: 'ai-scan');
      final names = await ref
          .read(ingredientApiProvider)
          .recognizeImageUrl(imageUrl);
      final items = _uniqueNames(
        names,
      ).map(_DetectedIngredient.fromName).toList(growable: false);

      if (!mounted) return;
      setState(() {
        _detectedItems = items;
        _hasScanned = true;
      });
      showCapsuleToast(
        context,
        items.isEmpty ? '未识别到清晰食材' : '已识别 ${items.length} 种食材',
        icon: Icons.auto_awesome,
      );
    } catch (error) {
      if (!mounted) return;
      showCapsuleToast(context, '识别失败：$error', icon: Icons.error_outline);
    } finally {
      if (mounted) {
        setState(() => _recognizing = false);
      }
    }
  }

  Future<void> _addToFridge() async {
    if (_detectedItems.isEmpty || _adding) return;

    setState(() => _adding = true);
    try {
      final api = ref.read(ingredientApiProvider);
      for (final item in _detectedItems) {
        await api.addToFridge(
          Ingredient(
            id: '',
            name: item.name,
            amount: '1',
            unit: '份',
            category: 'other',
          ),
        );
      }
      await ref.read(ingredientListProvider.notifier).load();

      if (!mounted) return;
      showCapsuleToast(context, '已加入小冰箱', icon: Icons.kitchen_outlined);
    } catch (error) {
      if (!mounted) return;
      showCapsuleToast(context, '添加失败：$error', icon: Icons.error_outline);
    } finally {
      if (mounted) {
        setState(() => _adding = false);
      }
    }
  }

  void _generateRecipe() {
    if (_detectedItems.isEmpty) {
      showCapsuleToast(context, '请先识别食材', icon: Icons.info_outline);
      return;
    }

    final prompt = _detectedItems.map((item) => item.name).join('、');
    context.push('/ai/chat?prompt=${Uri.encodeQueryComponent(prompt)}');
  }

  void _reset() {
    setState(() {
      _imageFile = null;
      _detectedItems = const [];
      _hasScanned = false;
    });
  }

  List<String> _uniqueNames(List<String> names) {
    final seen = <String>{};
    final unique = <String>[];
    for (final rawName in names) {
      final name = rawName.replaceAll(RegExp(r'^[\d\.\-\s、]+'), '').trim();
      if (name.isEmpty || seen.contains(name)) continue;
      seen.add(name);
      unique.add(name);
    }
    return unique;
  }
}

class _CameraPreviewBackground extends StatelessWidget {
  final XFile? file;

  const _CameraPreviewBackground({required this.file});

  @override
  Widget build(BuildContext context) {
    final imageFile = file;
    if (imageFile != null) {
      return FutureBuilder<Uint8List>(
        future: imageFile.readAsBytes(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return Container(color: AppColors.textPrimary);
          }
          return Image.memory(snapshot.data!, fit: BoxFit.cover);
        },
      );
    }

    return Image.network(
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900&q=80',
      fit: BoxFit.cover,
      errorBuilder: (_, _, _) => Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFE7F0E8), Color(0xFFF7E7D7)],
          ),
        ),
      ),
    );
  }
}

class _GlassIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _GlassIconButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0x99FFFFFF),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0x66FFFFFF)),
            ),
            child: Icon(icon, color: AppColors.textPrimary, size: 20),
          ),
        ),
      ),
    );
  }
}

class _FrameCorner extends StatelessWidget {
  final int turns;

  const _FrameCorner({this.turns = 0});

  @override
  Widget build(BuildContext context) {
    return RotatedBox(
      quarterTurns: turns,
      child: SizedBox(
        width: 44,
        height: 44,
        child: DecoratedBox(
          decoration: BoxDecoration(
            border: const Border(
              top: BorderSide(color: Colors.white, width: 4),
              left: BorderSide(color: Colors.white, width: 4),
            ),
            borderRadius: const BorderRadius.only(topLeft: Radius.circular(28)),
            boxShadow: [
              BoxShadow(color: Colors.white.withAlpha(80), blurRadius: 12),
            ],
          ),
        ),
      ),
    );
  }
}

class _DetectBox extends StatelessWidget {
  final String label;
  final String confidence;

  const _DetectBox({required this.label, required this.confidence});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 92,
          height: 92,
          decoration: BoxDecoration(
            border: Border.all(color: Colors.white, width: 2),
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: const Color(0xE6FFFFFF),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Text(
            '$label · $confidence',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}

class _HintPill extends StatelessWidget {
  final String text;
  final bool loading;

  const _HintPill({super.key, required this.text, this.loading = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
      decoration: BoxDecoration(
        color: const Color(0xE6FFFFFF),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (loading) ...[
            const SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Text(
              text,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ResultPanel extends StatelessWidget {
  final List<_DetectedIngredient> items;
  final bool adding;
  final VoidCallback onAdd;
  final VoidCallback onRecipe;

  const _ResultPanel({
    super.key,
    required this.items,
    required this.adding,
    required this.onAdd,
    required this.onRecipe,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 26, sigmaY: 26),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xEFFFFFFF),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0x1AFFFFFF)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.auto_awesome,
                    size: 18,
                    color: AppColors.accent,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '识别结果',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${items.length} 种食材',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (items.isEmpty)
                const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text(
                    '暂未识别到清晰食材，可以重新拍摄一张更明亮的照片。',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                )
              else
                ...items.map((item) => _IngredientRow(item: item)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: items.isEmpty || adding ? null : onAdd,
                      icon: adding
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.kitchen_outlined, size: 18),
                      label: Text(adding ? '加入中' : '加入冰箱'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.textPrimary,
                        side: const BorderSide(color: AppColors.divider),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: items.isEmpty ? null : onRecipe,
                      icon: const Icon(Icons.auto_awesome, size: 18),
                      label: const Text('生成菜谱'),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.textPrimary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _IngredientRow extends StatelessWidget {
  final _DetectedIngredient item;

  const _IngredientRow({required this.item});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: AppColors.surfaceSecondary,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(item.icon, size: 18, color: AppColors.textPrimary),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              item.name,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
            ),
          ),
          Text(
            item.amount,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(width: 12),
          Text(
            item.confidence,
            style: const TextStyle(fontSize: 12, color: AppColors.accentBlue),
          ),
        ],
      ),
    );
  }
}

class _CaptureBar extends StatelessWidget {
  final bool hasScanned;
  final bool isBusy;
  final VoidCallback onFlash;
  final VoidCallback onCapture;
  final VoidCallback onAlbum;
  final VoidCallback onReset;

  const _CaptureBar({
    required this.hasScanned,
    required this.isBusy,
    required this.onFlash,
    required this.onCapture,
    required this.onAlbum,
    required this.onReset,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(32),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xCCFFFFFF),
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: const Color(0x33FFFFFF)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _RoundToolButton(
                icon: hasScanned ? Icons.refresh : Icons.flash_on,
                onTap: isBusy ? null : (hasScanned ? onReset : onFlash),
              ),
              GestureDetector(
                onTap: isBusy ? null : onCapture,
                child: Container(
                  width: 78,
                  height: 78,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 4),
                    boxShadow: const [
                      BoxShadow(color: Color(0x24000000), blurRadius: 20),
                    ],
                  ),
                  child: Center(
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      width: hasScanned ? 48 : 60,
                      height: hasScanned ? 48 : 60,
                      decoration: BoxDecoration(
                        color: hasScanned
                            ? AppColors.textPrimary
                            : Colors.transparent,
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0x33000000)),
                      ),
                      child: isBusy
                          ? const Padding(
                              padding: EdgeInsets.all(12),
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Icon(
                              hasScanned
                                  ? Icons.check
                                  : Icons.center_focus_strong,
                              color: hasScanned
                                  ? Colors.white
                                  : AppColors.textPrimary,
                              size: 30,
                            ),
                    ),
                  ),
                ),
              ),
              _RoundToolButton(
                icon: Icons.photo_library_outlined,
                onTap: isBusy ? null : onAlbum,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoundToolButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;

  const _RoundToolButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Opacity(
        opacity: onTap == null ? 0.5 : 1,
        child: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: const Color(0x80FFFFFF),
            borderRadius: BorderRadius.circular(24),
          ),
          child: Icon(icon, color: AppColors.textPrimary),
        ),
      ),
    );
  }
}

class _DetectedIngredient {
  final String name;
  final String amount;
  final String confidence;
  final IconData icon;

  const _DetectedIngredient({
    required this.name,
    required this.amount,
    required this.confidence,
    required this.icon,
  });

  factory _DetectedIngredient.fromName(String name) {
    return _DetectedIngredient(
      name: name,
      amount: '1 份',
      confidence: '已识别',
      icon: _iconFor(name),
    );
  }

  static IconData _iconFor(String name) {
    if (name.contains('蛋')) return Icons.egg_alt_outlined;
    if (name.contains('菜') || name.contains('葱') || name.contains('香')) {
      return Icons.eco_outlined;
    }
    if (name.contains('肉') || name.contains('鸡') || name.contains('牛')) {
      return Icons.restaurant_menu_outlined;
    }
    if (name.contains('鱼') || name.contains('虾')) {
      return Icons.set_meal_outlined;
    }
    if (name.contains('米') || name.contains('面')) {
      return Icons.rice_bowl_outlined;
    }
    return Icons.local_pizza_outlined;
  }
}
