import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

import type { AuthStatus } from "@sidewalk/types";

const authMilestone: AuthStatus = {
  phase: "foundation",
  ready: false,
  nextStep: "Use this workspace to implement mobile signup, login, and recovery during Batch 1."
};

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Mobile Workspace</Text>
        <Text style={styles.title}>Authentication starts here too.</Text>
        <Text style={styles.body}>{authMilestone.nextStep}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4efe4",
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    backgroundColor: "#fffaf3",
    padding: 24,
    shadowColor: "#7a3414",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  eyebrow: {
    marginBottom: 12,
    color: "#7a3414",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase"
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#22170e"
  },
  body: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: "#574a3d"
  }
});
