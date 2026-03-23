import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:clipsync_mobile/features/clips/application/clips_notifier.dart';
import 'package:device_info_plus/device_info_plus.dart';

/// Handles shared text from other apps via Android share sheet.
final shareHandlerProvider = Provider<ShareHandler>((ref) {
  return ShareHandler(ref);
});

class ShareHandler {
  final Ref _ref;

  ShareHandler(this._ref);

  Future<bool> handleSharedText(String? text) async {
    if (text == null || text.trim().isEmpty) return false;

    final deviceInfo = DeviceInfoPlugin();
    final androidInfo = await deviceInfo.androidInfo;
    final deviceName = androidInfo.model;

    final notifier = _ref.read(clipsNotifierProvider.notifier);
    final clip = await notifier.saveClip(
      content: text,
      deviceName: deviceName,
    );

    return clip != null;
  }
}
