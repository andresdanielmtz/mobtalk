import { StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import * as React from "react";
import { Card, Text, ActivityIndicator, Button } from "react-native-paper";
import { useState, useEffect } from "react";

export default function TabTwoScreen() {
  const [avatar, setAvatar] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("https://github.com/andresdanielmtz.png?size=200")
      .then((response) => response.blob())
      .then((blob) => {
        setAvatar(URL.createObjectURL(blob));
        setLoading(false);
      })
      .catch(() => setLoading(false)); // Handle errors
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.screenTitle}>
        Credits
      </ThemedText>

      <Card style={styles.cardContainer}>
        <Card.Title title="Andrés Martínez" subtitle="A00227463" />
        <Card.Content>
          <Text variant="bodyMedium">Thank you for using my app!</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#0000ff" />
          ) : (
            <Card.Cover source={{ uri: avatar }} style={styles.cardImage} />
          )}
        </Card.Content>
      </Card>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  screenTitle: {
    marginBottom: 20,
    fontSize: 24,
    fontWeight: "bold",
  },
  cardContainer: {
    width: "100%",
    maxWidth: 500,
    marginVertical: 10,
    elevation: 5, // Shadow effect
    borderRadius: 10, // Rounded corners
  },
  cardImage: {
    marginTop: 10,
    height: 300,
    borderRadius: 10,
  },
});
