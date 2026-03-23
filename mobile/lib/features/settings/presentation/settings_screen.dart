import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:clipsync_mobile/features/auth/application/auth_notifier.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authNotifierProvider).valueOrNull;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          if (user != null)
            ListTile(
              leading: const Icon(Icons.email),
              title: const Text('Account'),
              subtitle: Text(user.email ?? 'No email'),
            ),
          FutureBuilder(
            future: DeviceInfoPlugin().deviceInfo,
            builder: (context, snapshot) {
              final deviceName = snapshot.data?.data['model'] ?? 'Unknown';
              return ListTile(
                leading: const Icon(Icons.phone_android),
                title: const Text('Device Name'),
                subtitle: Text(deviceName.toString()),
              );
            },
          ),
          const Divider(),
          ListTile(
            leading: Icon(
              Icons.logout,
              color: Theme.of(context).colorScheme.error,
            ),
            title: Text(
              'Sign Out',
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
            onTap: () async {
              await ref.read(authNotifierProvider.notifier).signOut();
            },
          ),
          const Divider(),
          const ListTile(
            leading: Icon(Icons.info_outline),
            title: Text('ClipSync Mobile'),
            subtitle: Text('v0.1.0'),
          ),
        ],
      ),
    );
  }
}
