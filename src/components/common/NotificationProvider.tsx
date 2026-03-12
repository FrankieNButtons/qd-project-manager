import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import type { IndicatorChangeEvent } from '../../types/indicator';
import { BubbleNotification } from './BubbleNotification';
import { ModalAlert } from './ModalAlert';
import { useMessageStore } from '../../stores/useMessageStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTeamStore } from '../../stores/useTeamStore';
import { useIndicatorStore } from '../../stores/useIndicatorStore';

interface NotificationContextType {
  processEvents: (events: IndicatorChangeEvent[]) => void;
  showBubble: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  processEvents: () => {},
  showBubble: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

function formatList(items: string[], max = 2): string {
  if (items.length <= max) return items.join('、');
  return `${items.slice(0, max).join('、')}等${items.length}个`;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [bubbleMessage, setBubbleMessage] = useState('');
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [modalEvent, setModalEvent] = useState<IndicatorChangeEvent | null>(null);
  const alertQueue = useRef<IndicatorChangeEvent[]>([]);
  const acknowledgeAlert = useMessageStore((s) => s.acknowledgeAlert);
  const markShared = useMessageStore((s) => s.markShared);
  const showRefreshBubble = useSettingsStore((s) => s.showRefreshBubble);
  const teams = useTeamStore((s) => s.teams);
  const stopTracking = useIndicatorStore((s) => s.stopTracking);

  const getName = useCallback(
    (id: string) => teams.find((t) => t.id === id)?.nickname ?? id,
    [teams],
  );

  const showBubble = useCallback((message: string) => {
    setBubbleMessage(message);
    setBubbleVisible(true);
  }, []);

  const showNextAlert = useCallback(() => {
    if (alertQueue.current.length > 0) {
      setModalEvent(alertQueue.current.shift()!);
    } else {
      setModalEvent(null);
    }
  }, []);

  const processEvents = useCallback(
    (events: IndicatorChangeEvent[]) => {
      const bubbleTexts: string[] = [];
      const alertEvents: IndicatorChangeEvent[] = [];

      for (const event of events) {
        switch (event.type) {
          case 'data_update': {
            const teamNames = event.teams.map(getName);
            const indNames = event.indicators;
            bubbleTexts.push(
              `${formatList(teamNames)}团队更新了${formatList(indNames)}指标`,
            );
            break;
          }
          case 'unified_add':
            bubbleTexts.push(`${event.indicator}指标已被添加`);
            break;
          case 'partial_add':
          case 'partial_delete':
          case 'unified_delete':
            alertEvents.push(event);
            break;
        }
      }

      if (bubbleTexts.length > 0 && showRefreshBubble) {
        showBubble(bubbleTexts.join(' | '));
      }

      if (alertEvents.length > 0) {
        alertQueue.current.push(...alertEvents);
        if (!modalEvent) showNextAlert();
      }
    },
    [modalEvent, showBubble, showNextAlert, showRefreshBubble, getName],
  );

  return (
    <NotificationContext.Provider value={{ processEvents, showBubble }}>
      <View style={styles.container}>
        {children}
        <BubbleNotification
          message={bubbleMessage}
          visible={bubbleVisible}
          onDismiss={() => setBubbleVisible(false)}
        />
        <ModalAlert
          visible={!!modalEvent}
          event={modalEvent}
          getName={getName}
          onAcknowledge={() => showNextAlert()}
          onShare={() => showNextAlert()}
          onStopTracking={(indicator) => {
            stopTracking(indicator);
            showNextAlert();
          }}
        />
      </View>
    </NotificationContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
