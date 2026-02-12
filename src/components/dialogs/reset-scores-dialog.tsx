import { View, StyleSheet, ScrollView } from 'react-native';
import { Portal, Dialog, Text, DataTable, Button } from 'react-native-paper';

interface UserData {
  id: number;
  name: string;
}

interface ScoresToResetEntry {
  previousWinnerName: string;
  previousWinnerId: number;
  scores: { [opponentId: number]: number };
}

interface ScoresToReset {
  currentWinnerName: string;
  currentWinnerId: number;
  winners: ScoresToResetEntry[];
}

interface ResetScoresDialogProps {
  isOpen: boolean;
  onClose: () => void;
  scoresToReset: ScoresToReset | null;
  users: UserData[];
}

export function ResetScoresDialog({ isOpen, onClose, scoresToReset, users }: ResetScoresDialogProps) {
  if (!scoresToReset) return null;

  return (
    <Portal>
      <Dialog visible={isOpen} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>{scoresToReset.currentWinnerName} 開新莊，清除籌碼</Dialog.Title>
        <Dialog.Content>
          <ScrollView horizontal>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title style={styles.headerCell}>Winner</DataTable.Title>
                {users.map(user => (
                  <DataTable.Title key={user.id} style={styles.headerCell} numeric>
                    {user.name}
                  </DataTable.Title>
                ))}
              </DataTable.Header>

              {scoresToReset.winners.map(entry => (
                <DataTable.Row key={entry.previousWinnerId}>
                  <DataTable.Cell style={styles.cell}>
                    <Text style={styles.winnerName}>{entry.previousWinnerName}</Text>
                  </DataTable.Cell>
                  {users.map(user => (
                    <DataTable.Cell key={user.id} style={styles.cell} numeric>
                      <Text style={styles.scoreText}>
                        {entry.previousWinnerId === user.id 
                          ? '-' 
                          : ((entry.scores[user.id]) || 0).toLocaleString()}
                      </Text>
                    </DataTable.Cell>
                  ))}
                </DataTable.Row>
              ))}
            </DataTable>
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onClose}>關閉</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 600,
  },
  headerCell: {
    minWidth: 100,
  },
  cell: {
    minWidth: 100,
  },
  winnerName: {
    fontWeight: 'bold',
  },
  scoreText: {
    fontWeight: 'bold',
    color: '#dc2626',
  },
});
