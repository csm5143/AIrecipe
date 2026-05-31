import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';

class EditProfilePage extends StatefulWidget {
  const EditProfilePage({super.key});
  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final _nickCtrl = TextEditingController(text: 'Alex Design');
  final _bioCtrl = TextEditingController(text: 'Food enthusiast. Lover of minimalist design and clean typography.');
  String _gender = 'Male';

  @override
  void dispose() { _nickCtrl.dispose(); _bioCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.glassSurface,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new, size: 20), onPressed: () => Navigator.of(context).canPop() ? context.pop() : context.go('/mine')),
        title: const Text('编辑资料'),
        actions: [TextButton(onPressed: () => context.pop(), child: const Text('保存', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)))],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          const SizedBox(height: 16),
          // Avatar
          Center(child: Stack(children: [
            Container(width: 128, height: 128, decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.surfaceSecondary, border: Border.all(color: AppColors.divider)), child: const Icon(Icons.person, size: 64, color: AppColors.textSecondary)),
            Positioned(bottom: 4, right: 4, child: Container(width: 32, height: 32, decoration: BoxDecoration(color: AppColors.textPrimary, shape: BoxShape.circle, border: Border.all(color: AppColors.background, width: 2)), child: const Icon(Icons.camera_alt, size: 16, color: AppColors.surface))),
          ])),
          const SizedBox(height: 8),
          Text('点击更换头像', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary)),
          const SizedBox(height: 32),
          // Nickname
          _Field(label: '昵称', child: TextField(controller: _nickCtrl, style: const TextStyle(fontSize: 15), decoration: const InputDecoration(border: InputBorder.none, contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14)))),
          const SizedBox(height: 16),
          // Bio
          _Field(label: '简介', child: TextField(controller: _bioCtrl, maxLines: 3, style: const TextStyle(fontSize: 15), decoration: const InputDecoration(border: InputBorder.none, contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14)))),
          const SizedBox(height: 24),
          // Gender
          Align(alignment: Alignment.centerLeft, child: Text('性别', style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary))),
          const SizedBox(height: 8),
          Row(children: ['Female', 'Male', 'Other'].map((g) {
            final active = g == _gender;
            return Expanded(child: Padding(
              padding: EdgeInsets.only(right: g == 'Other' ? 0 : 8),
              child: GestureDetector(
                onTap: () => setState(() => _gender = g),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(color: active ? AppColors.textPrimary : AppColors.surface, borderRadius: BorderRadius.circular(14), border: active ? null : Border.all(color: AppColors.divider)),
                  child: Text(g, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: active ? AppColors.surface : AppColors.textSecondary)),
                ),
              ),
            ));
          }).toList()),
        ]),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final String label; final Widget child;
  const _Field({required this.label, required this.child});
  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary)),
      const SizedBox(height: 8),
      Container(decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0x0A000000)), boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 24)]), child: child),
    ]);
  }
}
