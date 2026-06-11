import 'link_launcher_platform.dart'
    if (dart.library.html) 'link_launcher_web.dart'
    as launcher;

class LinkLauncher {
  LinkLauncher._();

  static Future<bool> openUrl(String url) => launcher.openUrl(url);
}
