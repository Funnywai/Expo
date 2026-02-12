import { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Portal, Dialog, Button, TextInput, Text, Card, IconButton } from 'react-native-paper';

interface UserData {
  id: number;
  name: string;
  winValues: { [opponentId: number]: number };
}

interface WinActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mainUser: UserData;
  users: UserData[];
  currentWinnerId: number | null;
  dealerId: number;
  consecutiveWins: number;
  onSave: (mainUserId: number, value: number, targetUserId?: number) => void;
  onLaunchMultiHit: (loserId?: number) => void;
}

interface ScorePreview {
  base: number;
  dealerBonus: number;
  laBonus: number;
  total: number;
}

export function WinActionDialog({ 
  isOpen, 
  onClose, 
  mainUser, 
  users, 
  currentWinnerId,
  dealerId,
  consecutiveWins,
  onSave,
  onLaunchMultiHit,
}: WinActionDialogProps) {
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [isZimo, setIsZimo] = useState(false);
  const [value, setValue] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTargetUserId(null);
      setIsZimo(false);
      setValue('');
    }
  }, [isOpen]);

  const opponentUsers = useMemo(() => users.filter(u => u.id !== mainUser.id), [users, mainUser]);

  const scorePreview = useMemo<ScorePreview | null>(() => {
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue) || parsedValue <= 0 || (!targetUserId && !isZimo)) {
      return null;
    }

    let base = parsedValue;
    let dealerBonus = 0;
    let laBonus = 0;

    const dealerBonusValue = 2 * consecutiveWins - 1;
    
    const usersWithActiveWinValues = users.filter(
      u => u.id !== mainUser.id && Object.values(u.winValues).some(score => score > 0)
    );
    const isNewWinner = usersWithActiveWinValues.length > 0;

    if (isZimo) {
        let totalLaBonus = 0;
        let totalDealerBonus = 0;

        opponentUsers.forEach(opponent => {
            let currentScoreForOpponent = parsedValue;
            if (mainUser.id === dealerId) {
                totalDealerBonus += dealerBonusValue;
                currentScoreForOpponent += dealerBonusValue;
            } else if (opponent.id === dealerId) {
                totalDealerBonus += dealerBonusValue;
                currentScoreForOpponent += dealerBonusValue;
            }
            
            const previousScore = mainUser.winValues[opponent.id] || 0;
            if (previousScore > 0) {
                const bonus = Math.round(previousScore * 0.5);
                totalLaBonus += bonus;
            } else if (isNewWinner) {
                const previousScoreOnWinner = opponent.winValues[mainUser.id] || 0;
                if (previousScoreOnWinner > 0) {
                    totalLaBonus += Math.floor(previousScoreOnWinner / 2);
                }
            }
        });

        base = parsedValue * opponentUsers.length;
        dealerBonus = totalDealerBonus;
        laBonus = totalLaBonus;
        
    } else if (targetUserId) {
        let currentScore = parsedValue;
        const parsedTargetId = parseInt(targetUserId, 10);

        if (mainUser.id === dealerId) {
            dealerBonus = dealerBonusValue;
            currentScore += dealerBonus;
        } else if (parsedTargetId === dealerId) {
            dealerBonus = dealerBonusValue;
            currentScore += dealerBonus;
        }

        const previousScore = mainUser.winValues[parsedTargetId] || 0;
        if (previousScore > 0) {
            laBonus = Math.round(previousScore * 0.5);
        } else if (isNewWinner) {
            const targetUser = users.find(u => u.id === parsedTargetId);
            const previousScoreOnWinner = targetUser?.winValues[mainUser.id] || 0;
            if (previousScoreOnWinner > 0) {
                laBonus = Math.floor(previousScoreOnWinner / 2);
            }
        }
    }
    
    return {
        base,
        dealerBonus,
        laBonus,
        total: base + dealerBonus + laBonus
    };
  }, [value, targetUserId, isZimo, mainUser, users, dealerId, consecutiveWins, opponentUsers]);

  const handleSave = () => {
    if (value && (targetUserId || isZimo)) {
      onSave(mainUser.id, parseInt(value, 10), isZimo ? undefined : parseInt(targetUserId!, 10));
      onClose();
    }
  };

  const handleUserSelect = (userId: string) => {
    setTargetUserId(userId);
    setIsZimo(false);
  };
  
  const handleZimoSelect = () => {
    setIsZimo(true);
    setTargetUserId(null);
  };

  const handleNumpadClick = (num: string) => {
    setValue(prev => prev + num);
  };

  const handleClear = () => {
    setValue('');
  };

  const handleBackspace = () => {
    setValue(prev => prev.slice(0, -1));
  };

  if (!mainUser) return null;

  const numpadButtons = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];

  return (
    <Portal>
      <Dialog visible={isOpen} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>食胡</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.section}>
              <Text style={styles.label}>輸家:</Text>
              <View style={styles.buttonGrid}>
                {opponentUsers.map(user => (
                  <Button
                    key={user.id}
                    mode={targetUserId === user.id.toString() ? 'contained' : 'outlined'}
                    onPress={() => handleUserSelect(user.id.toString())}
                    style={styles.gridButton}
                  >
                    {user.name}
                  </Button>
                ))}
                <Button
                  key="zimo"
                  mode={isZimo ? 'contained' : 'outlined'}
                  onPress={handleZimoSelect}
                  style={styles.gridButton}
                >
                  自摸
                </Button>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>番數:</Text>
              <TextInput
                mode="outlined"
                keyboardType="numeric"
                value={value}
                onChangeText={setValue}
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
            </View>

            <Card style={styles.multiHitCard}>
              <Card.Content style={styles.multiHitContent}>
                <View style={styles.multiHitText}>
                  <Text style={styles.multiHitBadge}>MULTI</Text>
                  <Text style={styles.multiHitLabel}>一炮多響</Text>
                </View>
                <Button
                  mode="contained-tonal"
                  onPress={() => {
                    onLaunchMultiHit(targetUserId ? parseInt(targetUserId, 10) : undefined);
                    onClose();
                  }}
                >
                  開啟
                </Button>
              </Card.Content>
            </Card>

            {scorePreview && (
              <Card style={styles.previewCard}>
                <Card.Content style={styles.previewContent}>
                  <View style={styles.previewGrid}>
                    <View style={styles.previewColumn}>
                      <Text style={styles.previewHeader}>番</Text>
                      <Text style={styles.previewValue}>{scorePreview.base}</Text>
                    </View>
                    <View style={styles.previewColumn}>
                      <Text style={styles.previewHeader}>莊</Text>
                      <Text style={styles.previewValue}>{scorePreview.dealerBonus}</Text>
                    </View>
                    <View style={styles.previewColumn}>
                      <Text style={styles.previewHeader}>拉</Text>
                      <Text style={styles.previewValue}>{scorePreview.laBonus}</Text>
                    </View>
                    <View style={styles.previewColumn}>
                      <Text style={styles.previewHeader}>總</Text>
                      <Text style={styles.previewValueBold}>{scorePreview.total}</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onClose}>取消</Button>
          <Button 
            onPress={handleSave} 
            disabled={!value || (!targetUserId && !isZimo)}
          >
            確定
          </Button>
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
  multiHitCard: {
    marginVertical: 8,
  },
  multiHitContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  multiHitText: {
    flexDirection: 'column',
    gap: 4,
  },
  multiHitBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  multiHitLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewCard: {
    marginTop: 8,
  },
  previewContent: {
    paddingVertical: 8,
  },
  previewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  previewColumn: {
    alignItems: 'center',
    flex: 1,
  },
  previewHeader: {
    fontSize: 12,
    opacity: 0.7,
  },
  previewValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  previewValueBold: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
