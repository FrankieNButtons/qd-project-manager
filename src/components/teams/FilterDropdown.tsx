import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Colors } from '../../constants/colors';

export type SortField = 'overall' | string;
export type SortOrder = 'desc' | 'asc';
export type FilterType = 'all' | 'completed' | 'incomplete' | 'condition';
export type Operator = '>' | '>=' | '<' | '<=';

export interface FilterState {
  sortField: SortField;
  sortOrder: SortOrder;
  filterType: FilterType;
  conditionIndicator: string;
  conditionOperator: Operator;
  conditionValue: string;
}

interface Props {
  indicators: string[];
  state: FilterState;
  onChange: (state: FilterState) => void;
}

export const defaultFilterState: FilterState = {
  sortField: 'overall',
  sortOrder: 'desc',
  filterType: 'all',
  conditionIndicator: '',
  conditionOperator: '>',
  conditionValue: '',
};

export function FilterDropdown({ indicators, state, onChange }: Props) {
  const [visible, setVisible] = useState(false);

  const sortLabel =
    state.sortField === 'overall'
      ? '综合进度'
      : state.sortField;
  const sortOrderLabel = state.sortOrder === 'desc' ? '降序' : '升序';
  const filterLabel =
    state.filterType === 'all'
      ? '全部'
      : state.filterType === 'completed'
        ? '已完成'
        : state.filterType === 'incomplete'
          ? '未完成'
          : '条件筛选';

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setVisible(true)}>
        <Text style={styles.triggerText}>
          排序: {sortLabel} {sortOrderLabel} | 筛选: {filterLabel}
        </Text>
        <Text style={styles.triggerArrow}>▼</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.dropdown} onStartShouldSetResponder={() => true}>
            <View style={styles.columns}>
              {/* Sort column */}
              <View style={styles.column}>
                <Text style={styles.columnTitle}>排序</Text>

                <TouchableOpacity
                  style={[styles.option, state.sortField === 'overall' && styles.optionActive]}
                  onPress={() => onChange({ ...state, sortField: 'overall' })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      state.sortField === 'overall' && styles.optionTextActive,
                    ]}
                  >
                    综合进度
                  </Text>
                </TouchableOpacity>

                {indicators.map((ind) => (
                  <TouchableOpacity
                    key={ind}
                    style={[styles.option, state.sortField === ind && styles.optionActive]}
                    onPress={() => onChange({ ...state, sortField: ind })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        state.sortField === ind && styles.optionTextActive,
                      ]}
                    >
                      {ind}
                    </Text>
                  </TouchableOpacity>
                ))}

                <View style={styles.divider} />
                <View style={styles.orderRow}>
                  <TouchableOpacity
                    style={[styles.orderBtn, state.sortOrder === 'desc' && styles.orderActive]}
                    onPress={() => onChange({ ...state, sortOrder: 'desc' })}
                  >
                    <Text
                      style={[
                        styles.orderText,
                        state.sortOrder === 'desc' && styles.orderTextActive,
                      ]}
                    >
                      降序
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.orderBtn, state.sortOrder === 'asc' && styles.orderActive]}
                    onPress={() => onChange({ ...state, sortOrder: 'asc' })}
                  >
                    <Text
                      style={[
                        styles.orderText,
                        state.sortOrder === 'asc' && styles.orderTextActive,
                      ]}
                    >
                      升序
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Filter column */}
              <View style={styles.column}>
                <Text style={styles.columnTitle}>筛选</Text>

                {(['all', 'completed', 'incomplete', 'condition'] as FilterType[]).map((ft) => {
                  const label =
                    ft === 'all'
                      ? '全部'
                      : ft === 'completed'
                        ? '已完成'
                        : ft === 'incomplete'
                          ? '未完成'
                          : '按条件筛选';
                  return (
                    <TouchableOpacity
                      key={ft}
                      style={[styles.option, state.filterType === ft && styles.optionActive]}
                      onPress={() => onChange({ ...state, filterType: ft })}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          state.filterType === ft && styles.optionTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {state.filterType === 'condition' && (
                  <View style={styles.conditionSection}>
                    <View style={styles.conditionRow}>
                      {indicators.map((ind) => (
                        <TouchableOpacity
                          key={ind}
                          style={[
                            styles.condChip,
                            state.conditionIndicator === ind && styles.condChipActive,
                          ]}
                          onPress={() => onChange({ ...state, conditionIndicator: ind })}
                        >
                          <Text
                            style={[
                              styles.condChipText,
                              state.conditionIndicator === ind && styles.condChipTextActive,
                            ]}
                          >
                            {ind}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.conditionRow}>
                      {(['>', '>=', '<', '<='] as Operator[]).map((op) => (
                        <TouchableOpacity
                          key={op}
                          style={[
                            styles.condChip,
                            state.conditionOperator === op && styles.condChipActive,
                          ]}
                          onPress={() => onChange({ ...state, conditionOperator: op })}
                        >
                          <Text
                            style={[
                              styles.condChipText,
                              state.conditionOperator === op && styles.condChipTextActive,
                            ]}
                          >
                            {op}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      style={styles.condInput}
                      placeholder="输入数值"
                      placeholderTextColor={Colors.textTertiary}
                      value={state.conditionValue}
                      onChangeText={(v) => onChange({ ...state, conditionValue: v })}
                      keyboardType="numeric"
                    />
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.doneButton} onPress={() => setVisible(false)}>
              <Text style={styles.doneText}>完成</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  triggerText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  triggerArrow: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
  },
  dropdown: {
    backgroundColor: Colors.surface,
    marginTop: 100,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    maxHeight: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  columns: {
    flexDirection: 'row',
    gap: 16,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  optionActive: {
    backgroundColor: Colors.primaryLight,
  },
  optionText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  optionTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  orderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  orderBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  orderActive: {
    backgroundColor: Colors.primaryLight,
  },
  orderText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  orderTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  conditionSection: {
    marginTop: 8,
    gap: 8,
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  condChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.background,
  },
  condChipActive: {
    backgroundColor: Colors.primaryLight,
  },
  condChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  condChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  condInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: Colors.text,
  },
  doneButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
