import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Portal, Dialog, Button, TextInput, Text } from 'react-native-paper';

interface UserData {
  id: number;
  name: string;
}

interface Payouts {
  [opponentId: number]: number;
}

interface SpecialActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mainUser: UserData | null;
  users: UserData[];
  onSave: (mainUserId: number, action: 'collect' | 'pay', amount: number) => void;
  onSaveZhaHu: (mainUserId: number, payouts: Payouts) => void;
}

export function SpecialActionDialog({ isOpen, onClose, mainUser, users, onSave, onSaveZhaHu }: SpecialActionDialogProps) {
  const [amount, setAmount] = useState('5');
  const [isZhaHuMode, setIsZhaHuMode] = useState(false);
  const [payouts, setPayouts] = useState<Payouts>({});
  const [selectedUserId, setSelectedUserId] = useState<number | null>(mainUser?.id ?? null);

  useEffect(() => {
    if (isOpen) {
      setIsZhaHuMode(false);
      setAmount('5');
      setPayouts({});
      setSelectedUserId(mainUser?.id ?? users[0]?.id ?? null);
    }
  }, [isOpen, mainUser, users]);

  const activeUser = selectedUserId ? users.find(u => u.id === selectedUserId) : null;
  const opponents = activeUser ? users.filter(u => u.id !== activeUser.id) : [];

  const handleSave = (action: 'collect' | 'pay') => {
    if (!activeUser) return;
    const parsedAmount = parseInt(amount, 10);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      onSave(activeUser.id, action, parsedAmount);
      onClose();
    }
  };

  const handleZhaHuSave = () => {
    if (!activeUser) return;
    const allPayoutsValid = opponents.every(opp => {
      const value = payouts[opp.id];
      return value !== undefined && value >= 0;
    });

    if (allPayoutsValid) {
      onSaveZhaHu(activeUser.id, payouts);
      onClose();
    } else {
      console.error("Please enter a valid payout for every user.");
    }
  };

  const handleNumpadClick = (num: string) => {
    setAmount(prev => prev + num);
  };

  const handleClear = () => {
    setAmount('');
  };

  const handleBackspace = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handlePayoutChange = (opponentId: number, value: string) => {
    const parsedValue = parseInt(value, 10);
    setPayouts(prev => ({
        ...prev,
        [opponentId]: isNaN(parsedValue) ? 0 : parsedValue,
    }));
  };

  const numpadButtons = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];

  return (
    <Portal>
      <Dialog visible={isOpen} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>特別賞罰</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.section}>
              <Text style={styles.label}>玩家</Text>
              <View style={styles.buttonGrid}>
                {users.map(user => (
                  <Button
                    key={user.id}
                    mode={selectedUserId === user.id ? 'contained' : 'outlined'}
                    onPress={() => setSelectedUserId(user.id)}
                    style={styles.gridButton}
                  >
                    {user.name}
                  </Button>
                ))}
              </View>
            </View>

            {isZhaHuMode ? (
              <View style={styles.section}>
                <View style={styles.payoutsList}>
                  {opponents.map(opponent => (
                    <View key={opponent.id} style={styles.payoutRow}>
                      <Text style={styles.payoutLabel}>{opponent.name}</Text>
                      <TextInput
                        mode="outlined"
                        keyboardType="numeric"
                        value={payouts[opponent.id]?.toString() ?? ''}
                        onChangeText={(text) => handlePayoutChange(opponent.id, text)}
                        placeholder="番數"
                        style={styles.payoutInput}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.label}>番數:</Text>
                <TextInput
                  mode="outlined"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="輸入番數"
                  style={styles.valueInput}
                  textAlign="center"
                />
                <View style={styles.numpad}>
                  {numpadButtons.map(num => (
                    <Button
                      key={num}
                      mode="outlined"
                      onPress={() => handleNumpadClick(num)}
                      style={styles.numpadButton}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    mode="outlined"
                    onPress={handleClear}
                    style={styles.numpadButton}
                  >
                    清除
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => handleNumpadClick('0')}
                    style={styles.numpadButton}
                  >
                    0
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={handleBackspace}
                    style={styles.numpadButton}
                    icon="backspace"
                  >
                    ⌫
                  </Button>
                </View>
                <View style={styles.actionButtons}>
                  <Button 
                    mode="contained" 
                    onPress={() => handleSave('collect')} 
                    disabled={!activeUser}
                    style={styles.actionButton}
                  >
                    收
                  </Button>
                  <Button 
                    mode="contained" 
                    onPress={() => handleSave('pay')} 
                    disabled={!activeUser}
                    style={styles.actionButton}
                    buttonColor="#d32f2f"
                  >
                    賠
                  </Button>
                  <Button 
                    mode="contained-tonal" 
                    onPress={() => setIsZhaHuMode(true)} 
                    disabled={!activeUser}
                    style={styles.actionButton}
                  >
                    炸胡
                  </Button>
                </View>
              </View>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          {isZhaHuMode ? (
            <>
              <Button onPress={() => setIsZhaHuMode(false)}>返回</Button>
              <Button onPress={handleZhaHuSave} disabled={!activeUser}>
                確定
              </Button>
            </>
          ) : (
            <Button onPress={onClose}>取消</Button>
          )}
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
    gap: 16,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridButton: {
    flex: 1,
    minWidth: '22%',
  },
  valueInput: {
    fontSize: 18,
    height: 48,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  numpadButton: {
    width: '30%',
    flexGrow: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
  payoutsList: {
    gap: 12,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  payoutLabel: {
    width: 80,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
  },
  payoutInput: {
    flex: 1,
  },
});
