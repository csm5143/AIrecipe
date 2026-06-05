import 'package:flutter/material.dart';
import 'config/theme.dart';
import 'config/routes.dart';

class AIRecipeApp extends StatelessWidget {
  const AIRecipeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: '小厨子 · AIrecipe',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: goRouter,
    );
  }
}
