import { StyleSheet, View } from 'react-native';
import Chat from '@/components/Chat';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Chat />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%', // Make sure it takes full width
    backgroundColor: '#f5f5f5',
  },
});