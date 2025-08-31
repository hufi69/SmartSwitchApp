import React from "react"
import { View, StyleSheet } from "react-native"
import { Text } from "react-native-paper"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../../App"

type ProfileScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "Profile">
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text>Profile Screen</Text>
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

export default ProfileScreen 