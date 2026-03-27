import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { TeamProgress, TeamDetail, IndicatorDetail } from '../../types/indicator';
import { Colors, getIndicatorColor } from '../../constants/colors';
import { useIndicatorStore } from '../../stores/useIndicatorStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  team: TeamProgress;
  detail: TeamDetail | null;
}

function IndicatorDetailRow({
  indicator,
  colorIndex,
}: {
  indicator: IndicatorDetail;
  colorIndex: number;
}) {
  const pct = Math.round(indicator.progress * 100);
  const isComplete = pct >= 100;
  const color = getIndicatorColor(colorIndex);

  return (
    <View style={styles.indicatorBlock}>
      <View style={styles.indicatorHeader}>
        <View style={styles.indicatorLabel}>
          <View style={[styles.colorDot, { backgroundColor: color }]} />
          <Text style={styles.indicatorName}>{indicator.name}</Text>
        </View>
        <Text style={[styles.indicatorValue, isComplete && styles.valueComplete]}>
          {indicator.currentMax}/{indicator.target}
        </Text>
      </View>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.min(100, pct)}%`, backgroundColor: isComplete ? Colors.success : color },
          ]}
        />
      </View>
      {indicator.latestNote ? (
        <Text style={styles.noteText}>
          {indicator.latestNote}
          {indicator.latestPeriod ? (
            <Text style={styles.periodText}>{` (${indicator.latestPeriod})`}</Text>
          ) : null}
        </Text>
      ) : null}
    </View>
  );
}

export function TeamDetailModal({ visible, onClose, team, detail }: Props) {
  const trackedIndicators = useIndicatorStore((s) => s.trackedIndicators);

  const indicators: IndicatorDetail[] = detail
    ? detail.indicators
    : team.indicators.map((ind) => ({
        ...ind,
        latestNote: null,
        latestPeriod: null,
      }));

  const hasMetaInfo = !!(detail?.lead || detail?.members);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle} numberOfLines={1}>
            {team.nickname}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {hasMetaInfo && (
            <View style={styles.metaSection}>
              {detail?.lead ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>负责人</Text>
                  <Text style={styles.metaValue}>{detail.lead}</Text>
                </View>
              ) : null}
              {detail?.members ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>团队成员</Text>
                  <Text style={styles.metaValue}>{detail.members}</Text>
                </View>
              ) : null}
            </View>
          )}

          {hasMetaInfo && <View style={styles.divider} />}

          {indicators.map((ind, i) => {
            const colorIndex = trackedIndicators.indexOf(ind.name);
            return (
              <IndicatorDetailRow
                key={ind.name}
                indicator={ind}
                colorIndex={colorIndex >= 0 ? colorIndex : i}
              />
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '82%',
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  closeBtn: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    gap: 0,
  },
  metaSection: {
    gap: 8,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    width: 56,
    flexShrink: 0,
  },
  metaValue: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },
  indicatorBlock: {
    marginBottom: 16,
  },
  indicatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  indicatorLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  indicatorName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  indicatorValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  valueComplete: {
    color: Colors.success,
  },
  barBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.background,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  noteText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  periodText: {
    color: Colors.textTertiary,
  },
});
