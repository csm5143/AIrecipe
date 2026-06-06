import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../config/theme.dart';
import '../../widgets/capsule_toast.dart';

class StoragePage extends StatefulWidget {
  const StoragePage({super.key});

  @override
  State<StoragePage> createState() => _StoragePageState();
}

class _StoragePageState extends State<StoragePage> {
  var _isLoading = true;
  var _imageCacheBytes = 0;
  var _preferencesBytes = 0;

  int get _totalBytes => _imageCacheBytes + _preferencesBytes;

  @override
  void initState() {
    super.initState();
    _loadUsage();
  }

  Future<void> _loadUsage() async {
    final values = await Future.wait([
      _estimateImageCacheSize(),
      _estimatePreferencesSize(),
    ]);
    if (!mounted) return;
    setState(() {
      _imageCacheBytes = values[0];
      _preferencesBytes = values[1];
      _isLoading = false;
    });
  }

  /// Web 兼容：用 PaintingBinding 估算图片缓存
  Future<int> _estimateImageCacheSize() async {
    var total = PaintingBinding.instance.imageCache.currentSizeBytes;
    // CachedNetworkImage 缓存估算（内存中已解码的图片）
    total += PaintingBinding.instance.imageCache.liveImageCount * 200 * 1024;
    return total;
  }

  Future<int> _estimatePreferencesSize() async {
    final prefs = await SharedPreferences.getInstance();
    var total = 0;
    for (final key in prefs.getKeys()) {
      final value = prefs.get(key);
      total += key.length * 2;
      total += value.toString().length * 2;
    }
    return total;
  }

  Future<void> _clearImageCache() async {
    await CachedNetworkImage.evictFromCache('');
    try {
      await DefaultCacheManager().emptyCache();
    } catch (_) {}
    PaintingBinding.instance.imageCache.clear();
    PaintingBinding.instance.imageCache.clearLiveImages();
    if (!mounted) return;
    showCapsuleToast(context, '图片缓存已清除', icon: Icons.check_circle_outline);
    await _loadUsage();
  }

  void _clearAiHistory() {
    showCapsuleToast(context, 'AI 历史清理功能开发中', icon: Icons.memory);
  }

  String _formatBytes(int bytes) {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    var size = bytes.toDouble();
    var index = 0;
    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index++;
    }
    return '${size.toStringAsFixed(index == 0 ? 0 : 1)} ${units[index]}';
  }

  @override
  Widget build(BuildContext context) {
    final total = _totalBytes == 0 ? 1 : _totalBytes;
    final appRatio = _preferencesBytes / total;
    final imageRatio = _imageCacheBytes / total;

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
          : RefreshIndicator(
              onRefresh: _loadUsage,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 100),
                children: [
                  Text(
                    '存储管理',
                    style: Theme.of(
                      context,
                    ).textTheme.displayLarge?.copyWith(fontSize: 28),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '管理应用数据、图片缓存和临时文件。',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 32),
                  Center(
                    child: SizedBox(
                      width: 160,
                      height: 160,
                      child: CustomPaint(
                        painter: _DonutPainter(
                          appRatio: appRatio,
                          imageRatio: imageRatio,
                        ),
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _formatBytes(_totalBytes),
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const Text(
                                '已使用',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  _LegendRow(
                    color: AppColors.surfaceSecondary,
                    label: '应用偏好',
                    size: _formatBytes(_preferencesBytes),
                  ),
                  _LegendRow(
                    color: AppColors.textPrimary,
                    label: '图片缓存',
                    size: _formatBytes(_imageCacheBytes),
                  ),
                  const SizedBox(height: 32),
                  _ActionBtn(
                    icon: Icons.image,
                    title: '清除图片缓存',
                    subtitle: '当前约 ${_formatBytes(_imageCacheBytes)}',
                    onTap: _clearImageCache,
                  ),
                  const SizedBox(height: 12),
                  _ActionBtn(
                    icon: Icons.memory,
                    title: '清除 AI 历史',
                    subtitle: '后端清理接口暂未开放',
                    onTap: _clearAiHistory,
                  ),
                ],
              ),
            ),
    );
  }
}

class _LegendRow extends StatelessWidget {
  final Color color;
  final String label;
  final String size;

  const _LegendRow({
    required this.color,
    required this.label,
    required this.size,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(shape: BoxShape.circle, color: color),
          ),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(fontSize: 15)),
          const Spacer(),
          Text(
            size,
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

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ActionBtn({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, size: 22, color: AppColors.textSecondary),
      title: Text(title, style: const TextStyle(fontSize: 15)),
      subtitle: Text(
        subtitle,
        style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
      ),
      trailing: const Icon(Icons.chevron_right, color: AppColors.divider),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    );
  }
}

class _DonutPainter extends CustomPainter {
  final double appRatio;
  final double imageRatio;

  const _DonutPainter({
    required this.appRatio,
    required this.imageRatio,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 8;
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 16
      ..strokeCap = StrokeCap.round;
    var start = -1.57;

    void draw(Color color, double ratio) {
      if (ratio <= 0) return;
      paint.color = color;
      final sweep = ratio * 6.28;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        start,
        sweep,
        false,
        paint,
      );
      start += sweep;
    }

    draw(AppColors.surfaceSecondary, appRatio);
    draw(AppColors.textPrimary, imageRatio);
  }

  @override
  bool shouldRepaint(covariant _DonutPainter oldDelegate) {
    return appRatio != oldDelegate.appRatio ||
        imageRatio != oldDelegate.imageRatio;
  }
}
