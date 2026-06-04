/// 应用常量 — API 地址、分页大小等（预留后端接入）
class AppConstants {
  AppConstants._();

  static const String appName = '吃了么 · AI Recipe';
  static const String apiBaseDev = 'http://10.0.2.2:3000/api';
  static const String apiBaseProd = 'https://api.airecipe.com/api/v1';

  static const int pageSize = 20;
  static const int searchDebounceMs = 300;

  // 间距
  static const double pageMargin = 16.0;
  static const double cardPadding = 16.0;
  static const double elementGapTight = 8.0;
  static const double elementGapComfortable = 12.0;
  static const double sectionGap = 24.0;
}
