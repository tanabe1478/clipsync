import 'package:clipsync_mobile/core/constants.dart';
import 'package:clipsync_mobile/core/supabase_client.dart';
import 'package:clipsync_mobile/shared/models/clip.dart';

class ClipsRepository {
  /// Validates and optionally truncates content.
  /// Throws [ArgumentError] if empty.
  static String validateContent(String content) {
    if (content.trim().isEmpty) {
      throw ArgumentError('Clip content is empty');
    }
    if (content.length > maxContentLength) {
      return content.substring(0, maxContentLength);
    }
    return content;
  }

  /// Returns true if content matches the most recent clip.
  static bool isDuplicate(String content, List<Clip> existingClips) {
    if (existingClips.isEmpty) return false;
    return existingClips.first.content == content;
  }

  Future<List<Clip>> fetchClips({int limit = defaultClipLimit}) async {
    final response = await supabase
        .from('clips')
        .select()
        .order('pinned', ascending: false)
        .order('created_at', ascending: false)
        .limit(limit);

    return (response as List).map((e) => Clip.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Clip> saveClip({
    required String content,
    required String deviceName,
  }) async {
    final validContent = validateContent(content);

    final response = await supabase
        .from('clips')
        .insert({
          'content': validContent,
          'device_name': deviceName,
        })
        .select()
        .single();

    return Clip.fromJson(response);
  }

  Future<Clip> togglePin(Clip clip) async {
    final response = await supabase
        .from('clips')
        .update({'pinned': !clip.pinned})
        .eq('id', clip.id)
        .select()
        .single();

    return Clip.fromJson(response);
  }

  Future<void> deleteClip(String clipId) async {
    await supabase.from('clips').delete().eq('id', clipId);
  }
}
