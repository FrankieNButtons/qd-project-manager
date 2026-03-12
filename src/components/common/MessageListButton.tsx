import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useMessageStore } from '../../stores/useMessageStore';
import { Colors } from '../../constants/colors';

interface Props {
  onPress: () => void;
}

export function MessageListButton({ onPress }: Props) {
  const unreadCount = useMessageStore((s) => {
    return s.messages.filter(
      (m) => m.status === 'unread' && (m.level === 'INFO' || m.level === 'ALERT'),
    ).length;
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.icon}>🔔</Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    marginRight: 8,
    position: 'relative',
  },
  icon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
