import React, { useEffect, useState, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Surface, Text, useTheme, Avatar } from "react-native-paper";
import { supabase } from "../constants/supabaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { RealtimeChannel } from "@supabase/supabase-js";
import { TextInput as PaperTextInput } from "react-native-paper";

interface Message {
  id: string;
  text: string;
  createdat: string;
  user_id: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const theme = useTheme();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Initialize user ID
  useEffect(() => {
    const initializeUserId = async () => {
      try {
        let storedUserId = await AsyncStorage.getItem("chat_user_id");
        if (!storedUserId) {
          storedUserId = uuidv4().slice(0, 8);
          await AsyncStorage.setItem("chat_user_id", storedUserId);
        }
        setUserId(storedUserId);
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing user ID:", error);
        setIsLoading(false);
      }
    };
    initializeUserId();
  }, []);

  // Fetch initial messages
  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching messages...");
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("createdat", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        console.log("Fetched messages:", data);
        setMessages(data || []);
      }
    } catch (error) {
      console.error("Error in fetchMessages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Real time subscription : )
  useEffect(() => {
    if (!userId) return;

    fetchMessages();

    if (channelRef.current) {
      console.log("Cleaning up previous subscription");
      channelRef.current.unsubscribe();
    }

    console.log("Setting up new subscription");
    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("Received real-time update:", payload);

          if (payload.eventType === "INSERT") {
            setMessages((currentMessages) => [
              ...currentMessages,
              payload.new as Message,
            ]);
          } else if (payload.eventType === "DELETE") {
            setMessages((currentMessages) =>
              currentMessages.filter((message) => message.id !== payload.old.id)
            );
          } else if (payload.eventType === "UPDATE") {
            setMessages((currentMessages) =>
              currentMessages.map((message) =>
                message.id === payload.new.id
                  ? { ...message, ...payload.new }
                  : message
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log("Cleaning up subscription");
      channel.unsubscribe();
    };
  }, [userId]);

  const sendMessage = async () => {
    if (!userId || !newMessage.trim()) return;

    try {
      console.log("Sending message...");
      const messageToSend = {
        text: newMessage.trim(),
        user_id: userId,
      };

      const { data, error } = await supabase
        .from("messages")
        .insert([messageToSend])
        .select();

      if (error) {
        console.error("Error sending message:", error);
      } else {
        console.log("Message sent successfully:", data);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error in sendMessage:", error);
    }
  };

  const getInitials = (id: string | null) => {
    if (!id) return "??";
    return id.slice(0, 2).toUpperCase();
  };

  // Scroll to bottom when new messages arrive
  const flatListRef = useRef<FlatList>(null);
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => {
    if (!userId) return null;
    const isCurrentUser = item.user_id === userId;

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}
      >
        <View style={styles.messageContent}>
          {!isCurrentUser && (
            <Avatar.Text
              size={32}
              label={getInitials(item.user_id)}
              style={styles.avatar}
            />
          )}
          <View
            style={[
              styles.messageBubble,
              isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isCurrentUser ? styles.currentUserText : null,
              ]}
            >
              {item.text}
            </Text>
            <Text
              style={[
                styles.timestamp,
                isCurrentUser ? styles.currentUserTimestamp : null,
              ]}
            >
              {new Date(item.createdat).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Surface style={styles.header} elevation={2}>
          <Text style={styles.headerText}>Mobtalk - Chat Room</Text>
        </Surface>

        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            onLayout={() => flatListRef.current?.scrollToEnd()}
            refreshing={isLoading}
            onRefresh={fetchMessages}
          />
        </View>

        <Surface style={styles.inputContainer} elevation={4}>
          <PaperTextInput
            mode="outlined"
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message"
            style={styles.input}
            right={
              <PaperTextInput.Icon
                icon="send"
                onPress={sendMessage}
                disabled={!newMessage.trim()}
              />
            }
            onSubmitEditing={sendMessage}
            theme={{
              roundness: 10, // Adjust the roundness value as needed
            }}
          />
        </Surface>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: "100%",
  },
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#f5f5f5",
  },
  header: {
    width: "100%",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  chatContainer: {
    flex: 1,
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 4,
    width: "100%",
  },
  messageContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    maxWidth: "80%",
  },
  currentUserMessage: {
    alignItems: "flex-end",
    alignSelf: "flex-end",
  },
  otherUserMessage: {
    alignItems: "flex-start",
    alignSelf: "flex-start",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 4,
    maxWidth: "100%",
  },
  currentUserBubble: {
    backgroundColor: "#2196F3",
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: "white",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  currentUserText: {
    color: "white",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  currentUserTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  avatar: {
    marginRight: 8,
    backgroundColor: "#e0e0e0",
  },
  inputContainer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  input: {
    backgroundColor: "white",
    margin: 8,
  },
});
