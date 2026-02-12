import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Portal, Dialog, Button, TextInput, Text, DataTable } from 'react-native-paper';
import { format } from 'date-fns';
import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';

interface UserData {
  id: number;
  name: string;
}

interface ScoreChange {
  userId: number;
  change: number;
}

interface GameState {
  action: string;
  scoreChanges: ScoreChange[];
}

interface HistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  history: GameState[];
  users: UserData[];
}

export function HistoryDialog({ isOpen, onClose, history, users }: HistoryDialogProps) {
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      setFileName(`${format(today, 'yyyy-MM-dd')}`);
    }
  }, [isOpen]);

  const handleExportCSV = async () => {
    if (!history.length || !users.length) return;

    const headers = [...users.map(u => u.name)];
    let csvContent = headers.join(',') + '\n';

    history.slice().reverse().forEach(state => {
      const scoreChanges = users.map(user => {
        return state.scoreChanges.find(sc => sc.userId === user.id)?.change ?? 0;
      });
      const row = scoreChanges.join(',');
      csvContent += row + '\n';
    });

    try {
      const file = new File(Paths.cache, `${fileName}.csv`);
      await file.create();
      await file.write(csvContent);

      if (await isAvailableAsync()) {
        await shareAsync(file.uri);
      } else {
        console.log('Sharing is not available on this platform');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  return (
    <Portal>
      <Dialog visible={isOpen} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>歷史記錄</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView style={styles.scrollView}>
            <DataTable>
              <DataTable.Header>
                {users.map(user => (
                  <DataTable.Title key={user.id} style={styles.headerCell} numeric>
                    {user.name}
                  </DataTable.Title>
                ))}
              </DataTable.Header>

              {history.slice().reverse().map((state, index) => (
                <DataTable.Row key={index}>
                  {users.map(user => {
                    const change = state.scoreChanges.find(sc => sc.userId === user.id)?.change ?? 0;
                    const isPositive = change > 0;
                    const isNegative = change < 0;
                    return (
                      <DataTable.Cell 
                        key={user.id} 
                        style={styles.cell}
                        numeric
                      >
                        <Text 
                          style={[
                            styles.cellText,
                            isPositive && styles.positiveText,
                            isNegative && styles.negativeText,
                          ]}
                        >
                          {isPositive ? `+${change}` : (change !== 0 ? change : '-')}
                        </Text>
                      </DataTable.Cell>
                    );
                  })}
                </DataTable.Row>
              ))}
            </DataTable>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={styles.actions}>
          <View style={styles.actionsContainer}>
            <TextInput
              mode="outlined"
              value={fileName}
              onChangeText={setFileName}
              style={styles.fileNameInput}
              dense
            />
            <View style={styles.buttonGroup}>
              <Button 
                mode="outlined" 
                onPress={handleExportCSV} 
                disabled={history.length === 0}
                icon="download"
              >
                儲存
              </Button>
              <Button mode="contained" onPress={onClose}>
                關閉
              </Button>
            </View>
          </View>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '90%',
  },
  scrollView: {
    maxHeight: 400,
  },
  headerCell: {
    justifyContent: 'center',
  },
  cell: {
    justifyContent: 'center',
  },
  cellText: {
    fontWeight: '600',
  },
  positiveText: {
    color: '#2e7d32',
  },
  negativeText: {
    color: '#c62828',
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingHorizontal: 16,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  fileNameInput: {
    width: '100%',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
