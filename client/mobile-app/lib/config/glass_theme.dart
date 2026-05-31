import 'package:flutter/material.dart';

/// 液体玻璃设计系统常量
/// 参考: DESIGN.md "Liquid Minimalism" 规范
class GlassTheme {
  GlassTheme._();

  // ── 模糊 ──
  static const double blurSigma = 24.0;

  // ── 颜色 ──
  static const Color surfaceColor = Color(0xB8FFFFFF); // rgba(255,255,255,0.72)
  static const Color borderColor = Color(0x0A000000); // rgba(0,0,0,0.04)
  static const Color refractionColor = Color(0x99FFFFFF); // rgba(255,255,255,0.6)
  static const Color outerShadowColor = Color(0x0A000000); // rgba(0,0,0,0.04)

  // ── 圆角 ──
  static const double navRadius = 22.0;
  static const double cardRadius = 16.0;
  static const double buttonRadius = 14.0;

  // ── 阴影 ──
  static const List<BoxShadow> outerShadows = [
    BoxShadow(
      offset: Offset(0, 4),
      blurRadius: 24,
      spreadRadius: 0,
      color: outerShadowColor,
    ),
  ];

  static const List<BoxShadow> innerRefraction = [
    BoxShadow(
      offset: Offset(0, 1),
      blurRadius: 0,
      spreadRadius: 0,
      color: refractionColor,
    ),
  ];

  /// 液体玻璃 Decoration：内折射光 + 外阴影 + 边框
  static BoxDecoration glassDecoration({
    double borderRadius = cardRadius,
    Color? bgColor,
  }) {
    return BoxDecoration(
      color: bgColor ?? surfaceColor,
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(color: borderColor, width: 1),
      boxShadow: [...outerShadows, ...innerRefraction],
    );
  }
}
