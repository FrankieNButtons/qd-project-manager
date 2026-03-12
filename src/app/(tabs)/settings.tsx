/**
 * 设置 (Settings) — Team management, refresh rate, weights, TOML import/export, logs.
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
  ScrollView,
} from 'react-native';
import { useTeamStore } from '../../stores/useTeamStore';
import { useDataStore } from '../../stores/useDataStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { WEB_DEMO_URL, WEB_DEMO_URL_2 } from '../../constants/demo';
import { RefreshRateSelector } from '../../components/settings/RefreshRateSelector';
import { WeightingConfig } from '../../components/settings/WeightingConfig';
import { LogExporter } from '../../components/settings/LogExporter';
import { Colors } from '../../constants/colors';

/** Minimal TOML stringify/parse for team config (["Name"]\nurl = "...") */
const TOML = {
  stringify(data: Record<string, { url: string }>): string {
    return Object.entries(data)
      .map(([name, val]) => `["${name}"]\nurl = "${val.url}"`)
      .join('\n\n');
  },
  parse(input: string): Record<string, { url: string }> {
    const result: Record<string, { url: string }> = {};
    let currentSection = '';
    for (const line of input.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const sectionMatch = trimmed.match(/^\[["']?(.+?)["']?\]$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1];
        result[currentSection] = { url: '' };
        continue;
      }
      const kvMatch = trimmed.match(/^(\w+)\s*=\s*"(.+)"$/);
      if (kvMatch && currentSection) {
        (result[currentSection] as any)[kvMatch[1]] = kvMatch[2];
      }
    }
    return result;
  },
};

export default function SettingsScreen() {
  const teams = useTeamStore((s) => s.teams);
  const addTeam = useTeamStore((s) => s.addTeam);
  const removeTeam = useTeamStore((s) => s.removeTeam);
  const clearTeam = useDataStore((s) => s.clearTeam);
  const showRefreshBubble = useSettingsStore((s) => s.showRefreshBubble);
  const setShowRefreshBubble = useSettingsStore((s) => s.setShowRefreshBubble);

  const [nickname, setNickname] = useState('');
  const [url, setUrl] = useState('');
  const [tomlInput, setTomlInput] = useState('');
  const [showTomlImport, setShowTomlImport] = useState(false);

  const handleAdd = () => {
    const trimmedName = nickname.trim();
    const trimmedUrl = url.trim();

    if (!trimmedName) {
      Alert.alert('提示', '请输入团队名称');
      return;
    }
    if (!trimmedUrl) {
      Alert.alert('提示', '请输入文档链接');
      return;
    }

    const result = addTeam(trimmedName, trimmedUrl);
    if (!result) {
      Alert.alert('错误', '无法解析文档链接，请检查格式\n格式: https://docs.qq.com/sheet/XXX?tab=YYY');
      return;
    }

    setNickname('');
    setUrl('');
  };

  const handleRemove = (id: string, name: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`确认删除「${name}」？`)) {
        removeTeam(id);
        clearTeam(id);
      }
    } else {
      Alert.alert('删除团队', `确认删除「${name}」？`, [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            removeTeam(id);
            clearTeam(id);
          },
        },
      ]);
    }
  };

  const handleAddDemo = () => {
    addTeam('Web演示团队A', WEB_DEMO_URL);
    addTeam('Web演示团队B', WEB_DEMO_URL_2);
  };

  const handleExportToml = async () => {
    const data: Record<string, { url: string }> = {};
    for (const team of teams) {
      data[team.nickname] = { url: team.url };
    }
    const tomlStr = TOML.stringify(data);
    try {
      await Share.share({ message: tomlStr });
    } catch {
      // cancelled
    }
  };

  const handleImportToml = () => {
    const trimmed = tomlInput.trim();
    if (!trimmed) {
      Alert.alert('提示', '请输入TOML内容');
      return;
    }
    try {
      const parsed = TOML.parse(trimmed);
      let count = 0;
      for (const [name, value] of Object.entries(parsed)) {
        if (typeof value === 'object' && value !== null && 'url' in value) {
          const result = addTeam(name, String((value as { url: string }).url));
          if (result) count++;
        }
      }
      Alert.alert('导入成功', `已导入 ${count} 个团队`);
      setTomlInput('');
      setShowTomlImport(false);
    } catch (e) {
      Alert.alert('解析错误', String(e));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView>
        {/* Add Team Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>添加团队</Text>
          <TextInput
            style={styles.input}
            placeholder="团队名称"
            placeholderTextColor={Colors.textTertiary}
            value={nickname}
            onChangeText={setNickname}
          />
          <TextInput
            style={styles.input}
            placeholder="文档链接 (https://docs.qq.com/sheet/...)"
            placeholderTextColor={Colors.textTertiary}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>添加</Text>
          </TouchableOpacity>
          {Platform.OS === 'web' && (
            <TouchableOpacity style={styles.demoButton} onPress={handleAddDemo}>
              <Text style={styles.demoButtonText}>添加演示团队 (Web)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* TOML Import/Export */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>团队配置导入/导出</Text>
          <View style={styles.tomlRow}>
            <TouchableOpacity style={styles.tomlButton} onPress={handleExportToml}>
              <Text style={styles.tomlButtonText}>导出TOML</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tomlButton}
              onPress={() => setShowTomlImport(!showTomlImport)}
            >
              <Text style={styles.tomlButtonText}>
                {showTomlImport ? '取消导入' : '导入TOML'}
              </Text>
            </TouchableOpacity>
          </View>
          {showTomlImport && (
            <>
              <TextInput
                style={[styles.input, styles.tomlInput]}
                placeholder={'[团队名称]\nurl = "https://docs.qq.com/sheet/..."'}
                placeholderTextColor={Colors.textTertiary}
                value={tomlInput}
                onChangeText={setTomlInput}
                multiline
                numberOfLines={5}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleImportToml}>
                <Text style={styles.addButtonText}>确认导入</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Refresh Rate */}
        <View style={styles.section}>
          <RefreshRateSelector />
        </View>

        {/* Notification Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通知设置</Text>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setShowRefreshBubble(!showRefreshBubble)}
          >
            <Text style={styles.toggleLabel}>数据刷新弹窗提示</Text>
            <View style={[styles.toggleSwitch, showRefreshBubble && styles.toggleSwitchOn]}>
              <View style={[styles.toggleKnob, showRefreshBubble && styles.toggleKnobOn]} />
            </View>
          </TouchableOpacity>
          <Text style={styles.toggleHint}>
            关闭后，数据更新时不再显示顶部弹窗通知
          </Text>
        </View>

        {/* Weights */}
        <View style={styles.section}>
          <WeightingConfig />
        </View>

        {/* Log Export */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>日志</Text>
          <LogExporter />
        </View>

        {/* Team List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>已添加团队 ({teams.length})</Text>
          {teams.length === 0 ? (
            <Text style={styles.emptyText}>暂无团队，请在上方添加</Text>
          ) : (
            teams.map((item) => (
              <View key={item.id} style={styles.teamItem}>
                <View style={styles.teamInfo}>
                  <Text style={styles.teamName}>{item.nickname}</Text>
                  <Text style={styles.teamUrl} numberOfLines={1}>
                    {item.url}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleRemove(item.id, item.nickname)}
                >
                  <Text style={styles.deleteText}>删除</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  section: {
    backgroundColor: Colors.surface,
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
    marginBottom: 10,
  },
  tomlInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  demoButton: {
    marginTop: 10,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
  },
  demoButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  tomlRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  tomlButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tomlButtonText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 24,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  teamInfo: {
    flex: 1,
    marginRight: 12,
  },
  teamName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  teamUrl: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFF1F0',
  },
  deleteText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchOn: {
    backgroundColor: Colors.primary,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  toggleHint: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 6,
  },
});
