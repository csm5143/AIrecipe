import 'package:flutter/material.dart';
import '../config/theme.dart';

/// 首页搜索栏 — 圆角胶囊形
class GlassSearchBar extends StatelessWidget {
  final VoidCallback? onTap;
  final ValueChanged<String>? onChanged;
  final TextEditingController? controller;

  const GlassSearchBar({super.key, this.onTap, this.onChanged, this.controller});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 44,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: const Color(0x4DF0F0F5), // ~30% surface-secondary
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0x0A000000)),
        ),
        child: Row(
          children: [
            const Icon(Icons.search, color: AppColors.textSecondary, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: controller != null
                  ? TextField(
                      controller: controller,
                      onChanged: onChanged,
                      decoration: const InputDecoration(
                        hintText: '搜索菜谱、食材、博主...',
                        hintStyle: TextStyle(color: AppColors.textPlaceholder, fontSize: 15),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                      style: const TextStyle(fontSize: 15, color: AppColors.textPrimary),
                    )
                  : const Text(
                      '搜索菜谱、食材、博主...',
                      style: TextStyle(color: AppColors.textPlaceholder, fontSize: 15),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
