import React from "react"
import { View, StyleSheet } from "react-native"
import { Text } from "react-native-paper"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../../App"

type HistoryScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "History">
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text>History Screen</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})

export default HistoryScreen 