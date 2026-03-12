import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useIndicatorStore } from '../../stores/useIndicatorStore';
import { Colors } from '../../constants/colors';

export function WeightingConfig() {
  const trackedIndicators = useIndicatorStore((s) => s.trackedIndicators);
  const weights = useSettingsStore((s) => s.weights);
  const setWeight = useSettingsStore((s) => s.setWeight);
  const resetEqualWeights = useSettingsStore((s) => s.resetEqualWeights);

  if (trackedIndicators.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>指标权重</Text>
        <Text style={styles.emptyText}>暂无追踪的指标</Text>
      </View>
    );
  }

  const totalWeight = trackedIndicators.reduce(
    (sum, ind) => sum + (weights[ind] ?? 1 / trackedIndicators.length),
    0,
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>指标权重 (固定加权)</Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => resetEqualWeights(trackedIndicators)}
        >
          <Text style={styles.resetText}>均分</Text>
        </TouchableOpacity>
      </View>

      {trackedIndicators.map((ind) => {
        const w = weights[ind] ?? 1 / trackedIndicators.length;
        const pct = totalWeight > 0 ? Math.round((w / totalWeight) * 100) : 0;

        return (
          <View key={ind} style={styles.row}>
            <Text style={styles.indicatorName} numberOfLines={1}>
              {ind}
            </Text>
            <View style={styles.sliderContainer}>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${pct}%` }]} />
              </View>
            </View>
            <View style={styles.adjustButtons}>
              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => setWeight(ind, Math.max(0, w - 0.1))}
              >
                <Text style={styles.adjustText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.pctText}>{pct}%</Text>
              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => setWeight(ind, w + 0.1)}
              >
                <Text style={styles.adjustText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.primaryLight,
  },
  resetText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  indicatorName: {
    width: 80,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sliderContainer: {
    flex: 1,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  sliderFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  adjustButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adjustBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adjustText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  pctText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    width: 32,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 4,
  },
});
