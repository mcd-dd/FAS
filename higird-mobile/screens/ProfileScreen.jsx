import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

export default function ProfileScreen({ route }) {
  const { user } = route.params;

  const [edit, setEdit] = useState(false);
  const [profile, setProfile] = useState({
    name: user.name,
    phone: user.phone,
    address: user.address,
    email: user.email
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <TextInput
        editable={edit}
        style={styles.input}
        value={profile.name}
        onChangeText={(v) => setProfile({ ...profile, name: v })}
      />

      <TextInput
        editable={edit}
        style={styles.input}
        value={profile.phone}
        onChangeText={(v) => setProfile({ ...profile, phone: v })}
      />

      <TextInput
        editable={false}
        style={styles.input}
        value={profile.email}
      />

      <TextInput
        editable={edit}
        style={styles.input}
        value={profile.address}
        onChangeText={(v) => setProfile({ ...profile, address: v })}
      />

      {!edit ? (
        <Button title="Edit" onPress={() => setEdit(true)} />
      ) : (
        <>
          <Button title="Save" onPress={() => setEdit(false)} />
          <Button title="Cancel" onPress={() => setEdit(false)} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, marginBottom: 20 },
  input: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    borderRadius: 8
  }
});