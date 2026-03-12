import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useMessageStore } from '../../stores/useMessageStore';
import { useTeamStore } from '../../stores/useTeamStore';
import { useIndicatorStore } from '../../stores/useIndicatorStore';
import type { LogMessage } from '../../types/message';
import type { IndicatorChangeEvent } from '../../types/indicator';
import { ModalAlert } from './ModalAlert';
import { Colors } from '../../constants/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function levelBadge(level: string) {
  switch (level) {
    case 'ALERT':
      return { bg: '#FFF7E6', text: Colors.warning, label: 'ALERT' };
    case 'ERROR':
      return { bg: '#FFF1F0', text: Colors.error, label: 'ERROR' };
    default:
      return { bg: Colors.primaryLight, text: Colors.primary, label: 'INFO' };
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'unread':
      return '未读';
    case 'read':
      return '已读';
    case 'acknowledged':
      return '已知晓';
    case 'shared':
      return '已分享';
    default:
      return status;
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MessageListModal({ visible, onClose }: Props) {
  const messages = useMessageStore((s) => s.messages);
  const lastViewedAt = useMessageStore((s) => s.lastViewedAt);
  const markAllRead = useMessageStore((s) => s.markAllRead);
  const acknowledgeAlert = useMessageStore((s) => s.acknowledgeAlert);
  const markShared = useMessageStore((s) => s.markShared);
  const teams = useTeamStore((s) => s.teams);
  const stopTracking = useIndicatorStore((s) => s.stopTracking);
  const getName = (id: string) => teams.find((t) => t.id === id)?.nickname ?? id;

  const [alertEvent, setAlertEvent] = useState<{
    event: IndicatorChangeEvent;
    messageId: string;
  } | null>(null);

  const handleOpen = () => {
    markAllRead();
  };

  const handleMessagePress = (msg: LogMessage) => {
    if (msg.level === 'ALERT' && msg.alertData && msg.status !== 'acknowledged' && msg.status !== 'shared') {
      setAlertEvent({ event: msg.alertData, messageId: msg.id });
    }
  };

  // Find separator position
  const newMessageSeparatorIndex = messages.findIndex((m) => m.timestamp <= lastViewedAt);

  const renderItem = ({ item, index }: { item: LogMessage; index: number }) => {
    const badge = levelBadge(item.level);
    const showSeparator = index === newMessageSeparatorIndex && newMessageSeparatorIndex > 0;
    const isUnhandledAlert =
      item.level === 'ALERT' && item.status !== 'acknowledged' && item.status !== 'shared';

    return (
      <>
        {showSeparator && (
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>以上为新消息</Text>
            <View style={styles.separatorLine} />
          </View>
        )}
        <TouchableOpacity
          style={[styles.messageCard, isUnhandledAlert && styles.alertCard]}
          onPress={() => handleMessagePress(item)}
          activeOpacity={isUnhandledAlert ? 0.7 : 1}
        >
          <View style={styles.cardTop}>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
            </View>
            <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
          </View>
          <Text style={styles.messageTitle}>{item.title}</Text>
          <Text style={styles.messageBody} numberOfLines={3}>
            {item.body}
          </Text>
          <View style={styles.cardBottom}>
            <Text style={styles.category}>{item.category}</Text>
            <Text
              style={[
                styles.status,
                isUnhandledAlert && styles.unhandledStatus,
              ]}
            >
              {isUnhandledAlert ? '未处理' : statusLabel(item.status)}
            </Text>
          </View>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onShow={handleOpen}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              消息中心
              {(() => {
                const count = messages.filter(
                  (m) => m.level === 'ALERT' && m.status !== 'acknowledged' && m.status !== 'shared',
                ).length;
                return count > 0 ? `  (${count}条未处理)` : '';
              })()}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>关闭</Text>
            </TouchableOpacity>
          </View>

          {messages.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>暂无消息</Text>
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
            />
          )}
        </View>
      </View>

      <ModalAlert
        visible={!!alertEvent}
        event={alertEvent?.event ?? null}
        getName={getName}
        onAcknowledge={() => {
          if (alertEvent) acknowledgeAlert(alertEvent.messageId);
          setAlertEvent(null);
        }}
        onShare={() => {
          if (alertEvent) markShared(alertEvent.messageId);
          setAlertEvent(null);
        }}
        onStopTracking={(indicator) => {
          stopTracking(indicator);
          if (alertEvent) acknowledgeAlert(alertEvent.messageId);
          setAlertEvent(null);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    flex: 1,
    marginTop: 60,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  closeText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
  },
  list: {
    padding: 16,
  },
  messageCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  alertCard: {
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  time: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  messageTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  messageBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  status: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  unhandledStatus: {
    color: Colors.warning,
    fontWeight: '600',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  separatorLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.textTertiary,
  },
  separatorText: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginHorizontal: 8,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
});
