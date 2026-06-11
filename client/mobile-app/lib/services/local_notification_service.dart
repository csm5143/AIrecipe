import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

import '../models/chat.dart';

class LocalNotificationService {
  LocalNotificationService._();

  static final instance = LocalNotificationService._();
  final _plugin = FlutterLocalNotificationsPlugin();
  var _initialized = false;

  Future<void> ensureInitialized() async {
    if (_initialized) return;
    tz_data.initializeTimeZones();
    tz.setLocalLocation(tz.getLocation('Asia/Shanghai'));

    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    await _plugin.initialize(
      const InitializationSettings(android: android, iOS: ios),
    );

    await _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.requestNotificationsPermission();
    await _plugin
        .resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin
        >()
        ?.requestPermissions(alert: true, badge: true, sound: true);

    _initialized = true;
  }

  Future<void> scheduleShoppingReminder(ChatReminderAction reminder) async {
    await ensureInitialized();
    final triggerAt = reminder.triggerAt;
    if (!triggerAt.isAfter(DateTime.now())) return;

    final body = reminder.items.isEmpty
        ? reminder.body
        : '${reminder.body}\n需要买：${reminder.items.join('、')}';

    await _plugin.zonedSchedule(
      100000 + reminder.id,
      reminder.title,
      body,
      tz.TZDateTime.from(triggerAt, tz.local),
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'shopping_reminders',
          '买菜提醒',
          channelDescription: '小厨子根据 AI 对话创建的买菜提醒',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      payload: 'shoppingListId=${reminder.shoppingListId ?? ''}',
    );
  }
}
