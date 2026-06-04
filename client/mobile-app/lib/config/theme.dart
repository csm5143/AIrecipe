import 'package:flutter/material.dart';

/// 冷调极简 · 食物前置
/// UI 是白盘子，食物是唯一主角

class AppColors {
  AppColors._();

  // ── 背景 ──
  static const Color background = Color(0xFFF8F8FA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceSecondary = Color(0xFFF0F0F5);

  // ── 文字 ──
  static const Color textPrimary = Color(0xFF1C1C1E);
  static const Color textSecondary = Color(0xFF6E6E73);
  static const Color textPlaceholder = Color(0xFFAEAEB2);

  // ── 分隔与描边 ──
  static const Color divider = Color(0xFFE5E5EA);
  static const Color subtleBorder = Color(0x0A000000); // rgba(0,0,0,0.06)

  // ── 强调色 ──
  static const Color accent = Color(0xFFFF6B35); // 珊瑚橙 CTA
  static const Color accentBlue = Color(0xFF007AFF); // 未读蓝点
  static const Color error = Color(0xFFBA1A1A);

  // ── 液体玻璃 ──
  static const Color glassSurface = Color(0xB8FFFFFF); // rgba(255,255,255,0.72)
  static const Color glassRefraction = Color(
    0x99FFFFFF,
  ); // rgba(255,255,255,0.6)
}

class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: const ColorScheme.light(
        surface: AppColors.surface,
        primary: AppColors.textPrimary,
        onPrimary: AppColors.surface,
        secondary: AppColors.textSecondary,
        onSurface: AppColors.textPrimary,
        error: AppColors.error,
      ),

      // ── 字体 (使用系统默认，避免 Google Fonts 网络问题) ──
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontSize: 34,
          fontWeight: FontWeight.w700,
          letterSpacing: 0,
          height: 1.2,
        ),
        headlineLarge: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          letterSpacing: 0,
          height: 1.2,
        ),
        headlineMedium: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          height: 1.27,
        ),
        bodyLarge: TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w400,
          height: 1.4,
        ),
        bodyMedium: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w400,
          height: 1.33,
        ),
        labelMedium: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          letterSpacing: 0,
          height: 1.38,
        ),
        labelSmall: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          height: 1.18,
        ),
      ),

      // ── 组件样式 ──
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.glassSurface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        titleTextStyle: const TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
      ),

      dividerTheme: const DividerThemeData(
        color: AppColors.divider,
        thickness: 1,
        space: 1,
      ),

      iconTheme: const IconThemeData(color: AppColors.textPrimary, size: 24),
    );
  }
}
