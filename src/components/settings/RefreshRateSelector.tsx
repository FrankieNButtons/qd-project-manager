import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSettingsStore, type RefreshRate } from '../../stores/useSettingsStore';
import { Colors } from '../../constants/colors';

const OPTIONS: { label: string; value: RefreshRate }[] = [
  { label: '快 (1s)', value: 1000 },
  { label: '中 (3s)', value: 3000 },
  { label: '慢 (5s)', value: 5000 },
];

export function RefreshRateSelector() {
  const refreshRate = useSettingsStore((s) => s.refreshRate);
  const setRefreshRate = useSettingsStore((s) => s.setRefreshRate);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>刷新频率</Text>
      <View style={styles.options}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.option, refreshRate === opt.value && styles.optionActive]}
            onPress={() => setRefreshRate(opt.value)}
          >
            <Text
              style={[styles.optionText, refreshRate === opt.value && styles.optionTextActive]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10,
  },
  options: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  optionTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
