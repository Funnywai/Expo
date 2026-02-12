import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Dialog, Button, TextInput, Text } from 'react-native-paper';

interface UserData {
  id: number;
  name: string;
}

interface RenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserData[];
  onSave: (users: { id: number; name: string }[]) => void;
}

export function RenameDialog({ isOpen, onClose, users, onSave }: RenameDialogProps) {
  const [userNames, setUserNames] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      setUserNames(users.map(u => ({ id: u.id, name: u.name })));
    }
  }, [isOpen, users]);

  const handleNameChange = (id: number, name: string) => {
    setUserNames(prev => prev.map(u => (u.id === id ? { ...u, name } : u)));
  };

  const handleSave = () => {
    onSave(userNames);
    onClose();
  };

  return (
    <Portal>
      <Dialog visible={isOpen} onDismiss={onClose}>
        <Dialog.Title>改名</Dialog.Title>
        <Dialog.Content>
          <View style={styles.container}>
            {userNames.map((user) => (
              <View key={user.id} style={styles.row}>
                <Text style={styles.label}>User {user.id}</Text>
                <TextInput
                  value={user.name}
                  onChangeText={(text) => handleNameChange(user.id, text)}
                  style={styles.input}
                  mode="outlined"
                />
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
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    width: 60,
    textAlign: 'right',
  },
  input: {
    flex: 1,
  },
});
