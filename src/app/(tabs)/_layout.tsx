import { useState } from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '../../constants/colors';
import { MessageListButton } from '../../components/common/MessageListButton';
import { MessageListModal } from '../../components/common/MessageListModal';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  const [messageModalVisible, setMessageModalVisible] = useState(false);

  const headerRight = () => (
    <MessageListButton onPress={() => setMessageModalVisible(true)} />
  );

  return (
    <>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerTitleAlign: 'center',
          headerTitleStyle: { fontWeight: '600', color: Colors.text },
          tabBarStyle: { backgroundColor: Colors.tabBar, borderTopColor: Colors.border },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.tabBarInactive,
          headerRight,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '总览',
            tabBarIcon: ({ focused }) => <TabIcon label="📊" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="teams"
          options={{
            title: '团队',
            tabBarIcon: ({ focused }) => <TabIcon label="👥" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: '设置',
            tabBarIcon: ({ focused }) => <TabIcon label="⚙️" focused={focused} />,
          }}
        />
      </Tabs>

      <MessageListModal
        visible={messageModalVisible}
        onClose={() => setMessageModalVisible(false)}
      />
    </>
  );
}
