import 'package:flutter/foundation.dart';

@immutable
class Clip {
  final String id;
  final String userId;
  final String content;
  final String deviceName;
  final bool pinned;
  final String createdAt;

  const Clip({
    required this.id,
    required this.userId,
    required this.content,
    required this.deviceName,
    required this.pinned,
    required this.createdAt,
  });

  factory Clip.fromJson(Map<String, dynamic> json) {
    return Clip(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      content: json['content'] as String,
      deviceName: json['device_name'] as String,
      pinned: json['pinned'] as bool,
      createdAt: json['created_at'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'content': content,
      'device_name': deviceName,
      'pinned': pinned,
      'created_at': createdAt,
    };
  }

  Clip copyWith({
    String? id,
    String? userId,
    String? content,
    String? deviceName,
    bool? pinned,
    String? createdAt,
  }) {
    return Clip(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      content: content ?? this.content,
      deviceName: deviceName ?? this.deviceName,
      pinned: pinned ?? this.pinned,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Clip &&
        other.id == id &&
        other.userId == userId &&
        other.content == content &&
        other.deviceName == deviceName &&
        other.pinned == pinned &&
        other.createdAt == createdAt;
  }

  @override
  int get hashCode {
    return Object.hash(id, userId, content, deviceName, pinned, createdAt);
  }

  @override
  String toString() {
    return 'Clip(id: $id, content: ${content.length > 30 ? '${content.substring(0, 30)}...' : content}, device: $deviceName, pinned: $pinned)';
  }
}
