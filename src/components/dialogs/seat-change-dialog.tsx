import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Portal, Dialog, Button, Text, IconButton } from 'react-native-paper';

interface UserData {
  id: number;
  name: string;
  winValues: { [opponentId: number]: number };
}

interface SeatChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserData[];
  onSave: (users: UserData[]) => void;
}

export function SeatChangeDialog({ isOpen, onClose, users, onSave }: SeatChangeDialogProps) {
  const [orderedUsers, setOrderedUsers] = useState<UserData[]>([]);

  useEffect(() => {
    if (isOpen) {
      setOrderedUsers(users);
    }
  }, [isOpen, users]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newUsers = [...orderedUsers];
    [newUsers[index - 1], newUsers[index]] = [newUsers[index], newUsers[index - 1]];
    setOrderedUsers(newUsers);
  };

  const moveDown = (index: number) => {
    if (index === orderedUsers.length - 1) return;
    const newUsers = [...orderedUsers];
    [newUsers[index], newUsers[index + 1]] = [newUsers[index + 1], newUsers[index]];
    setOrderedUsers(newUsers);
  };

  const handleSave = () => {
    onSave(orderedUsers);
    onClose();
  };

  return (
    <Portal>
      <Dialog visible={isOpen} onDismiss={onClose}>
        <Dialog.Title>換位</Dialog.Title>
        <Dialog.Content>
          <View style={styles.container}>
            {orderedUsers.map((user, index) => (
              <View key={user.id} style={styles.row}>
                <Text style={styles.position}>{index + 1}</Text>
                <Text style={styles.name}>{user.name}</Text>
                <View style={styles.controls}>
                  <IconButton
                    icon="chevron-up"
                    size={20}
                    onPress={() => moveUp(index)}
                    disabled={index === 0}
                  />
                  <IconButton
                    icon="chevron-down"
                    size={20}
                    onPress={() => moveDown(index)}
                    disabled={index === orderedUsers.length - 1}
                  />
                </View>
              </View>
            ))}
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onClose}>取消</Button>
          <Button onPress={handleSave}>確定</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    gap: 12,
  },
  position: {
    fontWeight: 'bold',
    width: 30,
  },
  name: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
  },
});
