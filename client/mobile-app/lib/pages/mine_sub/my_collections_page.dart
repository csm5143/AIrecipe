import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../widgets/capsule_toast.dart';

class MyCollectionsPage extends StatefulWidget {
  const MyCollectionsPage({super.key});
  @override
  State<MyCollectionsPage> createState() => _MyCollectionsPageState();
}

class _MyCollectionsPageState extends State<MyCollectionsPage> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
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
        title: const Text('我的收藏'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.create_new_folder),
            onPressed: () => showCapsuleToast(
              context,
              '已创建新的收藏夹',
              icon: Icons.create_new_folder,
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            // Segmented tabs
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
              child: Container(
                width: 220,
                height: 40,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppColors.surfaceSecondary,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _tab = 0),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          decoration: BoxDecoration(
                            color: _tab == 0
                                ? AppColors.surface
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: _tab == 0
                                ? const [
                                    BoxShadow(
                                      color: Color(0x0A000000),
                                      blurRadius: 8,
                                      offset: Offset(0, 2),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Center(
                            child: Text(
                              '食谱',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: _tab == 0
                                    ? AppColors.textPrimary
                                    : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _tab = 1),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          decoration: BoxDecoration(
                            color: _tab == 1
                                ? AppColors.surface
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: _tab == 1
                                ? const [
                                    BoxShadow(
                                      color: Color(0x0A000000),
                                      blurRadius: 8,
                                      offset: Offset(0, 2),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Center(
                            child: Text(
                              '帖子',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: _tab == 1
                                    ? AppColors.textPrimary
                                    : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Collection grid
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Expanded(
                        child: _Card(
                          title: '健康食谱',
                          count: '15 项',
                          color: Color(0xFFD5E8D4),
                          subColor: Color(0xFF8FC8A8),
                          hasOverlay: true,
                          overlayText: '+12',
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _Card(
                          title: '周末烘焙',
                          count: '8 项',
                          color: Color(0xFFE8D5C4),
                          subColor: null,
                          hasOverlay: false,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(child: _CreateCard()),
                      const SizedBox(width: 16),
                      const Spacer(),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }
}

class _Card extends StatelessWidget {
  final String title, count;
  final Color color;
  final Color? subColor;
  final bool hasOverlay;
  final String? overlayText;
  const _Card({
    required this.title,
    required this.count,
    required this.color,
    this.subColor,
    required this.hasOverlay,
    this.overlayText,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AspectRatio(
          aspectRatio: 1,
          child: Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
              boxShadow: const [
                BoxShadow(color: Color(0x06000000), blurRadius: 20),
              ],
              border: Border.all(color: const Color(0x08000000)),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: hasOverlay
                  ? Column(
                      children: [
                        Expanded(flex: 2, child: Container(color: color)),
                        Expanded(
                          child: Row(
                            children: [
                              Expanded(
                                child: Container(
                                  color: const Color(0xFFB5D8B0),
                                ),
                              ),
                              Expanded(
                                child: Container(
                                  color: subColor ?? color,
                                  child: Center(
                                    child: Text(
                                      overlayText ?? '',
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    )
                  : Container(
                      color: color,
                      child: const Center(
                        child: Icon(
                          Icons.cake,
                          size: 40,
                          color: Colors.white54,
                        ),
                      ),
                    ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          title,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 2),
        Text(
          count,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
      ],
    );
  }
}

class _CreateCard extends StatelessWidget {
  const _CreateCard();
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () =>
          showCapsuleToast(context, '已创建新的收藏夹', icon: Icons.create_new_folder),
      child: AspectRatio(
        aspectRatio: 0.75,
        child: Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            boxShadow: const [
              BoxShadow(color: Color(0x06000000), blurRadius: 20),
            ],
            border: Border.all(color: const Color(0x08000000)),
          ),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              color: AppColors.surfaceSecondary,
              border: Border.all(
                color: AppColors.divider,
                strokeAlign: BorderSide.strokeAlignInside,
              ),
            ),
            child: const Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: Color(0xFFE8E8EA),
                  child: Icon(
                    Icons.add,
                    size: 22,
                    color: AppColors.textSecondary,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  '新建',
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
    );
  }
}
