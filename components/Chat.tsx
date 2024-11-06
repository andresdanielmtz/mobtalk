// components/Chat.tsx
import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';
import { collection, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';

export default function Chat() {
    const [messages, setMessages] = useState<{ id: string; text: string; createdAt: Date }[]>([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map((doc) => ({
                id: doc.id,
                text: doc.data().text,
                createdAt: doc.data().createdAt.toDate(),
            }));
            setMessages(messages);
        });

        return () => unsubscribe();
    }, []);

    const sendMessage = async () => {
        if (newMessage.trim()) {
            await addDoc(collection(db, 'messages'), {
                text: newMessage,
                createdAt: new Date(),
            });
            setNewMessage('');
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <Text style={styles.message}>{item.text}</Text>}
            />
            <TextInput
                style={styles.input}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type a message"
            />
            <Button title="Send" onPress={sendMessage} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    message: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        marginBottom: 8,
    },
});