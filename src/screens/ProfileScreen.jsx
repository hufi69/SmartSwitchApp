import React, { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from "react-native"
import { Text, Avatar, Button, Divider, List, TextInput } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { auth } from "../config/firebase"
import { clearUserCredentials } from "../utils/storage"
import { signOut, updateProfile } from "firebase/auth"

const ProfileScreen = ({ navigation, setIsAuthenticated }) => {
  const [user, setUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [newName, setNewName] = useState("")
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = () => {
    // Get current user from Firebase
    const currentUser = auth.currentUser
    if (currentUser) {
      const userData = {
        name: currentUser.displayName || "User",
        email: currentUser.email,
        photoURL: currentUser.photoURL,
      }
      setUser(userData)
      setNewName(userData.name)
    }
  }

  const handleEditProfile = () => {
    setShowEditModal(true)
  }

  const handleSaveProfile = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Name cannot be empty")
      return
    }

    setUpdating(true)
    try {
      const currentUser = auth.currentUser
      if (currentUser) {
        await updateProfile(currentUser, {
          displayName: newName.trim(),
        })

        // Reload user data
        loadUserData()
        setShowEditModal(false)
        Alert.alert("Success", "Profile updated successfully!")
      }
    } catch (error) {
      console.error("Update profile error:", error)
      Alert.alert("Error", "Failed to update profile. Please try again.")
    } finally {
      setUpdating(false)
    }
  }

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear saved credentials
              await clearUserCredentials()
              // Sign out from Firebase
              await signOut(auth)
              console.log("User logged out successfully")
              // Set authentication to false to show login screen
              if (setIsAuthenticated) {
                setIsAuthenticated(false)
              }
            } catch (error) {
              console.error("Logout error:", error)
              Alert.alert("Error", "Failed to logout. Please try again.")
            }
          },
        },
      ],
      { cancelable: true }
    )
  }

  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.photoURL ? (
              <Avatar.Image size={100} source={{ uri: user.photoURL }} />
            ) : (
              <Avatar.Text size={100} label={getInitials(user?.name)} style={styles.avatar} />
            )}
          </View>

          <Text style={styles.userName}>{user?.name || "User"}</Text>
          <Text style={styles.userEmail}>{user?.email || "email@example.com"}</Text>

          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <MaterialCommunityIcons name="pencil" size={16} color="#4361EE" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

          <List.Item
            title="Personal Information"
            description="Update your details"
            left={(props) => <List.Icon {...props} icon="account" color="#4361EE" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
            style={styles.listItem}
          />

          <Divider />

          <List.Item
            title="Change Password"
            description="Update your password"
            left={(props) => <List.Icon {...props} icon="lock" color="#4361EE" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
            style={styles.listItem}
          />

          <Divider />

          <List.Item
            title="Notifications"
            description="Manage notifications"
            left={(props) => <List.Icon {...props} icon="bell" color="#4361EE" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
            style={styles.listItem}
          />
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          <List.Item
            title="Privacy & Security"
            description="Manage your privacy"
            left={(props) => <List.Icon {...props} icon="shield-check" color="#4361EE" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
            style={styles.listItem}
          />

          <Divider />

          <List.Item
            title="Help & Support"
            description="Get help and support"
            left={(props) => <List.Icon {...props} icon="help-circle" color="#4361EE" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
            style={styles.listItem}
          />

          <Divider />

          <List.Item
            title="About"
            description="App version 1.0.0"
            left={(props) => <List.Icon {...props} icon="information" color="#4361EE" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
            style={styles.listItem}
          />
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            buttonColor="#F44336"
            icon="logout"
            contentStyle={{ paddingVertical: 8 }}
          >
            Logout
          </Button>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                label="Full Name"
                value={newName}
                onChangeText={setNewName}
                mode="outlined"
                style={styles.modalInput}
                activeOutlineColor="#4361EE"
                left={<TextInput.Icon icon="account" />}
              />

              <Text style={styles.modalHint}>
                This name will be displayed on your profile
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <Button
                mode="outlined"
                onPress={() => setShowEditModal(false)}
                style={styles.modalCancelButton}
                textColor="#757575"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveProfile}
                style={styles.modalSaveButton}
                buttonColor="#4361EE"
                loading={updating}
                disabled={updating}
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: "#4361EE",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 16,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4361EE",
  },
  editButtonText: {
    fontSize: 14,
    color: "#4361EE",
    fontWeight: "600",
    marginLeft: 4,
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F5F5F5",
  },
  listItem: {
    backgroundColor: "#FFFFFF",
  },
  logoutContainer: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  logoutButton: {
    borderRadius: 12,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  modalBody: {
    padding: 20,
  },
  modalInput: {
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  modalCancelButton: {
    flex: 1,
    marginRight: 8,
    borderColor: "#E0E0E0",
  },
  modalSaveButton: {
    flex: 1,
    marginLeft: 8,
  },
})

export default ProfileScreen
