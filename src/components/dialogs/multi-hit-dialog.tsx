import { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Portal, Dialog, Button, TextInput, Text, Card, Badge } from 'react-native-paper';

interface UserData {
  id: number;
  name: string;
  winValues: { [opponentId: number]: number };
}

interface MultiHitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialLoserId?: number | null;
  users: UserData[];
  dealerId: number;
  consecutiveWins: number;
  onSave: (loserUserId: number, winners: number[], values: Record<number, number>) => void;
}

interface ScorePreview {
  winnerId: number;
  winnerName: string;
  base: number;
  dealerBonus: number;
  laBonus: number;
  total: number;
}

export function MultiHitDialog({
  isOpen,
  onClose,
  initialLoserId,
  users,
  dealerId,
  consecutiveWins,
  onSave,
}: MultiHitDialogProps) {
  const [selectedWinners, setSelectedWinners] = useState<number[]>([]);
  const [selectedLoserId, setSelectedLoserId] = useState<number | null>(null);
  const [winnerValues, setWinnerValues] = useState<Record<number, string>>({});

  useEffect(() => {
    if (isOpen) {
      setSelectedWinners([]);
      setWinnerValues({});
      setSelectedLoserId(initialLoserId ?? null);
    }
  }, [isOpen, initialLoserId]);

  useEffect(() => {
    setSelectedWinners([]);
    setWinnerValues({});
  }, [selectedLoserId]);

  const activeLoser = useMemo(() => selectedLoserId ? users.find(u => u.id === selectedLoserId) || null : null, [selectedLoserId, users]);

  const opposingUsers = useMemo(
    () => (selectedLoserId ? users.filter(u => u.id !== selectedLoserId) : []),
    [users, selectedLoserId]
  );

  const toggleWinner = (userId: number) => {
    setSelectedWinners(prev => {
      if (prev.includes(userId)) {
        const next = prev.filter(id => id !== userId);
        setWinnerValues(values => {
          const updated = { ...values };
          delete updated[userId];
          return updated;
        });
        return next;
      } else {
        if (prev.length < 3) {
          return [...prev, userId];
        }
        return prev;
      }
    });
  };

  const handleValueChange = (winnerId: number, val: string) => {
    setWinnerValues(prev => ({ ...prev, [winnerId]: val }));
  };

  const scoresPreviews = useMemo<ScorePreview[]>(() => {
    const previews: ScorePreview[] = [];
    const dealerBonusValue = 2 * consecutiveWins - 1;

    if (!activeLoser) return previews;

    const usersWithActiveWinValues = users.filter(
      u => !selectedWinners.includes(u.id) && u.id !== activeLoser.id && Object.values(u.winValues).some(score => score > 0)
    );
    const hasOtherUsersWithScores = usersWithActiveWinValues.length > 0;

    selectedWinners.forEach(winnerId => {
      const winner = users.find(u => u.id === winnerId);
      if (!winner) return;

      const parsedValue = parseInt(winnerValues[winnerId] || '', 10);
      if (isNaN(parsedValue) || parsedValue <= 0) return;

      let base = parsedValue;
      let dealerBonus = 0;
      let laBonus = 0;

      if (winnerId === dealerId) {
        dealerBonus = dealerBonusValue;
        base += dealerBonus;
      } else if (activeLoser.id === dealerId) {
        dealerBonus = dealerBonusValue;
        base += dealerBonus;
      }

      const previousScore = winner.winValues[activeLoser.id] || 0;
      if (previousScore > 0) {
        laBonus = Math.round(previousScore * 0.5);
        base += laBonus;
      } else if (hasOtherUsersWithScores) {
        const previousScoreOnWinner = activeLoser.winValues[winnerId] || 0;
        if (previousScoreOnWinner > 0) {
          laBonus = Math.floor(previousScoreOnWinner / 2);
          base += laBonus;
        }
      }

      previews.push({
        winnerId,
        winnerName: winner.name,
        base: base - dealerBonus - laBonus,
        dealerBonus,
        laBonus,
        total: base,
      });
    });

    return previews;
  }, [selectedWinners, activeLoser, users, dealerId, consecutiveWins, winnerValues]);

  const handleSave = () => {
    if (selectedWinners.length < 2 || selectedWinners.length > 3 || !activeLoser) return;

    const parsedValues: Record<number, number> = {};
    let allValid = true;

    selectedWinners.forEach(id => {
      const parsed = parseInt(winnerValues[id] || '', 10);
      if (isNaN(parsed) || parsed <= 0) {
        allValid = false;
      } else {
        parsedValues[id] = parsed;
      }
    });

    if (!allValid) return;

    onSave(activeLoser.id, selectedWinners, parsedValues);
    onClose();
  };

  return (
    <Portal>
      <Dialog visible={isOpen} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>一炮多響</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.section}>
              <Text style={styles.label}>輸家</Text>
              <View style={styles.buttonGrid}>
                {users.map(user => (
                  <Button
                    key={user.id}
                    mode={selectedLoserId === user.id ? 'contained' : 'outlined'}
                    onPress={() => setSelectedLoserId(user.id)}
                    style={styles.gridButton}
                  >
                    {user.name}
                  </Button>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>
                贏家: ({selectedWinners.length}/2-3)
              </Text>
              <View style={styles.buttonGrid}>
                {opposingUsers.map(user => {
                  const isSelected = selectedWinners.includes(user.id);
                  const winnerIndex = selectedWinners.indexOf(user.id);
                  return (
                    <View key={user.id} style={styles.winnerButtonContainer}>
                      <Button
                        mode={isSelected ? 'contained' : 'outlined'}
                        onPress={() => toggleWinner(user.id)}
                        disabled={!isSelected && selectedWinners.length >= 3}
                        style={styles.gridButton}
                      >
                        {user.name}
                      </Button>
                      {isSelected && (
                        <View style={styles.badgeContainer}>
                          <Badge size={20}>{winnerIndex + 1}</Badge>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {selectedWinners.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.label}>番數 (每位贏家可不同):</Text>
                <View style={styles.valuesList}>
                  {selectedWinners.map((winnerId, idx) => {
                    const winner = users.find(u => u.id === winnerId);
                    return (
                      <View key={winnerId} style={styles.valueRow}>
                        <Badge size={24} style={styles.indexBadge}>{idx + 1}</Badge>
                        <Text style={styles.winnerName}>{winner?.name}</Text>
                        <TextInput
                          mode="outlined"
                          keyboardType="numeric"
                          value={winnerValues[winnerId] || ''}
                          onChangeText={(text) => handleValueChange(winnerId, text)}
                          placeholder="番數"
                          style={styles.valueInput}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {scoresPreviews.length > 0 && (
              <Card style={styles.previewCard}>
                <Card.Content>
                  <View style={styles.previewsList}>
                    {scoresPreviews.map((preview, index) => (
                      <View 
                        key={preview.winnerId} 
                        style={[
                          styles.previewItem,
                          index < scoresPreviews.length - 1 && styles.previewItemBorder
                        ]}
                      >
                        <Text style={styles.previewWinnerName}>{preview.winnerName}</Text>
                        <View style={styles.previewGrid}>
                          <View style={styles.previewColumn}>
                            <Text style={styles.previewHeader}>番</Text>
                            <Text style={styles.previewValue}>{preview.base}</Text>
                          </View>
                          <View style={styles.previewColumn}>
                            <Text style={styles.previewHeader}>莊</Text>
                            <Text style={styles.previewValue}>{preview.dealerBonus}</Text>
                          </View>
                          <View style={styles.previewColumn}>
                            <Text style={styles.previewHeader}>拉</Text>
                            <Text style={styles.previewValue}>{preview.laBonus}</Text>
                          </View>
                          <View style={styles.previewColumn}>
                            <Text style={styles.previewHeader}>總</Text>
                            <Text style={styles.previewValueBold}>{preview.total}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
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
            disabled={selectedWinners.length < 2 || selectedWinners.length > 3 || !activeLoser}
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
  winnerButtonContainer: {
    position: 'relative',
    flex: 1,
    minWidth: '22%',
  },
  badgeContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  valuesList: {
    gap: 12,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indexBadge: {
    width: 28,
  },
  winnerName: {
    minWidth: 80,
    fontSize: 14,
    fontWeight: '600',
  },
  valueInput: {
    flex: 1,
    height: 40,
  },
  previewCard: {
    marginTop: 8,
  },
  previewsList: {
    gap: 12,
  },
  previewItem: {
    paddingVertical: 8,
  },
  previewItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  previewWinnerName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
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
    fontSize: 10,
    opacity: 0.7,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  previewValueBold: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
