import 'package:flutter/services.dart';

const _channel = MethodChannel('airecipe/link');

Future<bool> openUrl(String url) async {
  if (url.trim().isEmpty) return false;
  try {
    final result = await _channel.invokeMethod<bool>('openUrl', {
      'url': url.trim(),
    });
    return result == true;
  } catch (_) {
    return false;
  }
}
