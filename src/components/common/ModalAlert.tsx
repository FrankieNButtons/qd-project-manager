import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Share } from 'react-native';
import type { IndicatorChangeEvent } from '../../types/indicator';
import { Colors } from '../../constants/colors';

interface Props {
  visible: boolean;
  event: IndicatorChangeEvent | null;
  getName: (id: string) => string;
  onAcknowledge: () => void;
  onShare: () => void;
  onStopTracking: (indicator: string) => void;
}

function formatNames(ids: string[], getName: (id: string) => string): string {
  return ids.map(getName).join('、');
}

function getTitle(event: IndicatorChangeEvent, getName: (id: string) => string): string {
  switch (event.type) {
    case 'partial_add':
      return `${formatNames(event.haveTeams, getName)}团队新增了指标「${event.indicator}」`;
    case 'partial_delete':
      return `${formatNames(event.deletedTeams, getName)}团队删除了指标「${event.indicator}」`;
    case 'unified_delete':
      return `所有团队已删除指标「${event.indicator}」`;
    default:
      return '';
  }
}

function getBody(event: IndicatorChangeEvent, getName: (id: string) => string): string {
  switch (event.type) {
    case 'partial_add':
      return `但${formatNames(event.missingTeams, getName)}团队没有添加`;
    case 'partial_delete':
      return `但${formatNames(event.remainingTeams, getName)}团队仍然保留`;
    case 'unified_delete':
      return `该指标将不再被追踪`;
    default:
      return '';
  }
}

function getShareText(event: IndicatorChangeEvent, getName: (id: string) => string): string {
  switch (event.type) {
    case 'partial_add':
      return `我注意到${formatNames(event.haveTeams, getName)}团队新增了评价指标${event.indicator}，需要统一调整吗？`;
    case 'partial_delete':
      return `我注意到${formatNames(event.deletedTeams, getName)}团队删除了评价指标${event.indicator}，需要统一调整吗？`;
    case 'unified_delete':
      return `我注意到所有团队已删除评价指标${event.indicator}，需要统一调整吗？`;
    default:
      return '';
  }
}

export function ModalAlert({ visible, event, getName, onAcknowledge, onShare, onStopTracking }: Props) {
  if (!event) return null;

  const handleShare = async () => {
    try {
      await Share.share({ message: getShareText(event, getName) });
      onShare();
    } catch {
      // cancelled
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{getTitle(event, getName)}</Text>
          <Text style={styles.body}>{getBody(event, getName)}</Text>

          <View style={styles.actions}>
            {event.type === 'partial_delete' && (
              <TouchableOpacity
                style={[styles.button, styles.dangerButton]}
                onPress={() => onStopTracking(event.indicator)}
              >
                <Text style={styles.dangerButtonText}>
                  停止追踪「{event.indicator}」
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, { flex: 1 }]}
                onPress={onAcknowledge}
              >
                <Text style={styles.secondaryButtonText}>我已知晓</Text>
              </TouchableOpacity>

              <View style={{ width: 12 }} />

              <TouchableOpacity
                style={[styles.button, styles.primaryButton, { flex: 1 }]}
                onPress={handleShare}
              >
                <Text style={styles.primaryButtonText}>分享信息</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: Colors.error,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
