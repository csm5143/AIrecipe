import 'package:flutter/material.dart';
import 'config/theme.dart';
import 'config/routes.dart';

class AIRecipeApp extends StatelessWidget {
  const AIRecipeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: '吃了么 · AI Recipe',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: goRouter,
    );
  }
}
