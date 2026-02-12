import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Portal, Dialog, Button, TextInput, Text, DataTable } from 'react-native-paper';

interface UserData {
  id: number;
  name: string;
}

interface PayoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserData[];
  totalScores: { [key: number]: number };
}

export function PayoutDialog({ isOpen, onClose, users, totalScores }: PayoutDialogProps) {
  const [divisor, setDivisor] = useState<string>('1');
  const [manualAdjustments, setManualAdjustments] = useState<Record<number, string>>({});
  const [adjustmentSigns, setAdjustmentSigns] = useState<Record<number, '+' | '-'>>({});

  const handleDivisorChange = (text: string) => {
    setDivisor(text);
  };

  const handleAdjustmentChange = (userId: number, value: string) => {
    setManualAdjustments(prev => ({ ...prev, [userId]: value }));
  };

  const toggleAdjustmentSign = (userId: number) => {
    setAdjustmentSigns(prev => ({
      ...prev,
      [userId]: prev[userId] === '-' ? '+' : '-',
    }));
  };

  const parsedDivisor = parseFloat(divisor);
  const isValidDivisor = !isNaN(parsedDivisor) && parsedDivisor > 0;

  return (
    <Portal>
      <Dialog visible={isOpen} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>找數</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.section}>
              <Text style={styles.label}>除以</Text>
              <TextInput
                mode="outlined"
                keyboardType="numeric"
                value={divisor}
                onChangeText={handleDivisorChange}
                placeholder="輸入倍數"
                style={styles.divisorInput}
              />
              <Text style={styles.hint}>
                額外金額不會被分母影響，可用來加入檢數/手續費等。
              </Text>
            </View>

            <DataTable>
              <DataTable.Header>
                <DataTable.Title style={styles.nameColumn}>玩家</DataTable.Title>
                <DataTable.Title numeric>番數</DataTable.Title>
                <DataTable.Title style={styles.adjustmentColumn}>其他</DataTable.Title>
                <DataTable.Title numeric>$HKD</DataTable.Title>
              </DataTable.Header>

              {users.map(user => {
                const total = totalScores[user.id] || 0;
                const payout = isValidDivisor ? (total / parsedDivisor) : 0;
                const adjustmentRaw = manualAdjustments[user.id] ?? '';
                const adjustment = parseFloat(adjustmentRaw);
                const sign = adjustmentSigns[user.id] ?? '+';
                const safeAdjustment = isNaN(adjustment) ? 0 : adjustment;
                const signedAdjustment = sign === '-' ? -safeAdjustment : safeAdjustment;
                const finalPayout = payout + signedAdjustment;
                const isPositive = finalPayout > 0;
                const isNegative = finalPayout < 0;

                return (
                  <DataTable.Row key={user.id}>
                    <DataTable.Cell style={styles.nameColumn}>
                      <Text style={styles.userName}>{user.name}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric>
                      <Text>{total.toLocaleString()}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.adjustmentColumn}>
                      <View style={styles.adjustmentCell}>
                        <Button
                          mode={sign === '-' ? 'contained-tonal' : 'outlined'}
                          onPress={() => toggleAdjustmentSign(user.id)}
                          style={styles.signButton}
                          compact
                        >
                          {sign === '-' ? '−' : '+'}
                        </Button>
                        <TextInput
                          mode="outlined"
                          keyboardType="numeric"
                          value={adjustmentRaw}
                          onChangeText={(text) => handleAdjustmentChange(user.id, text)}
                          placeholder="金額"
                          style={styles.adjustmentInput}
                          dense
                        />
                      </View>
                    </DataTable.Cell>
                    <DataTable.Cell numeric>
                      <Text
                        style={[
                          styles.payoutText,
                          isPositive && styles.positiveText,
                          isNegative && styles.negativeText,
                        ]}
                      >
                        {finalPayout.toFixed(2)}
                      </Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })}
            </DataTable>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onClose}>關閉</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '90%',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 16,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  divisorInput: {
    height: 40,
  },
  hint: {
    fontSize: 12,
    opacity: 0.7,
  },
  nameColumn: {
    flex: 1.5,
  },
  adjustmentColumn: {
    flex: 2,
  },
  userName: {
    fontWeight: '600',
  },
  adjustmentCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  signButton: {
    minWidth: 36,
    height: 32,
  },
  adjustmentInput: {
    flex: 1,
    height: 32,
    fontSize: 12,
  },
  payoutText: {
    fontWeight: '600',
  },
  positiveText: {
    color: '#2e7d32',
  },
  negativeText: {
    color: '#c62828',
  },
});
