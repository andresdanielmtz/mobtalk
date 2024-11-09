import { StyleSheet } from "react-native";
import Chat from "@/components/Chat";
import { ThemedView } from "@/components/ThemedView";
export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <Chat />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%", 
    backgroundColor: "#f5f5f5",
  },
});
