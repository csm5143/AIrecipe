// ignore: avoid_web_libraries_in_flutter, deprecated_member_use
import 'dart:html' as html;

Future<bool> openUrl(String url) async {
  if (url.trim().isEmpty) return false;
  html.window.open(url.trim(), '_blank');
  return true;
}
