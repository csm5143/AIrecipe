import 'dart:ui';
import 'package:flutter/material.dart';
import '../config/glass_theme.dart';
import '../config/theme.dart';

/// 液体玻璃核心容器
/// 封装 BackdropFilter + BoxDecoration（内阴影折射 + 外阴影 + 边框）
class LiquidGlass extends StatelessWidget {
  final Widget child;
  final double borderRadius;
  final double blurSigma;
  final Color? bgColor;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double? width;
  final double? height;

  const LiquidGlass({
    super.key,
    required this.child,
    this.borderRadius = GlassTheme.cardRadius,
    this.blurSigma = GlassTheme.blurSigma,
    this.bgColor,
    this.padding,
    this.margin,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      margin: margin,
      padding: padding,
      decoration: GlassTheme.glassDecoration(
        borderRadius: borderRadius,
        bgColor: bgColor,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
          child: child,
        ),
      ),
    );
  }
}

/// 不含 BackdropFilter 的简化版本 — 用于不需要模糊内容的场景
class GlassContainer extends StatelessWidget {
  final Widget child;
  final double borderRadius;
  final Color? bgColor;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;

  const GlassContainer({
    super.key,
    required this.child,
    this.borderRadius = GlassTheme.cardRadius,
    this.bgColor,
    this.padding,
    this.margin,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: padding ?? const EdgeInsets.all(16),
      decoration: GlassTheme.glassDecoration(
        borderRadius: borderRadius,
        bgColor: bgColor,
      ),
      child: child,
    );
  }
}

/// 液体玻璃按钮
class GlassButton extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double borderRadius;
  final Color? bgColor;
  final EdgeInsetsGeometry padding;

  const GlassButton({
    super.key,
    required this.child,
    this.onTap,
    this.borderRadius = GlassTheme.buttonRadius,
    this.bgColor,
    this.padding = const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: padding,
        decoration: GlassTheme.glassDecoration(
          borderRadius: borderRadius,
          bgColor: bgColor ?? AppColors.textPrimary,
        ),
        child: child,
      ),
    );
  }
}
