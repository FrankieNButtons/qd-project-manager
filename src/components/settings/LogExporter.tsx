import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { useMessageStore } from '../../stores/useMessageStore';
import { Colors } from '../../constants/colors';

export function LogExporter() {
  const messages = useMessageStore((s) => s.messages);

  const handleExport = async () => {
    if (messages.length === 0) {
      Alert.alert('提示', '暂无日志可导出');
      return;
    }

    const logContent = messages
      .map((m) => {
        const date = new Date(m.timestamp).toLocaleString('zh-CN');
        return `[${date}] [${m.level}] [${m.category}] ${m.title}\n${m.body}\n状态: ${m.status}`;
      })
      .join('\n---\n');

    try {
      await Share.share({
        message: `[QD项目追踪] 日志导出 (${messages.length}条)\n\n${logContent}`,
      });
    } catch {
      // User cancelled
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleExport}>
        <Text style={styles.buttonText}>导出日志 ({messages.length}条)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
