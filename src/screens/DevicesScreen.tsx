"use client"

import type React from "react"
import { useState } from "react"
import { View, StyleSheet, ScrollView, StatusBar } from "react-native"
import { Text, Card, Switch, Button, Appbar, FAB, Searchbar, Chip, Divider } from "react-native-paper"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../../App"
import { MaterialCommunityIcons } from "@expo/vector-icons"

type DevicesScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "Devices">
}

type Device = {
  id: string
  name: string
  location: string
  type: string
  status: "Connected" | "Disconnected"
  isOn: boolean
  lastActive: string
  icon: string
}

const DevicesScreen: React.FC<DevicesScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("All")
  const [devices, setDevices] = useState<Device[]>([
    {
      id: "1",
      name: "Living Room Switch",
      location: "Living Room",
      type: "Smart Switch",
      status: "Connected",
      isOn: true,
      lastActive: "2 minutes ago",
      icon: "power-socket",
    },
    {
      id: "2",
      name: "Kitchen Light",
      location: "Kitchen",
      type: "Smart Light",
      status: "Connected",
      isOn: false,
      lastActive: "1 hour ago",
      icon: "lightbulb",
    },
    {
      id: "3",
      name: "Bedroom Fan",
      location: "Bedroom",
      type: "Smart Fan",
      status: "Disconnected",
      isOn: true,
      lastActive: "3 days ago",
      icon: "fan",
    },
    {
      id: "4",
      name: "Bathroom Light",
      location: "Bathroom",
      type: "Smart Light",
      status: "Connected",
      isOn: false,
      lastActive: "5 hours ago",
      icon: "lightbulb",
    },
  ])

  const onChangeSearch = (query: string) => setSearchQuery(query)

  const toggleDevice = (id: string) => {
    setDevices(devices.map((device) => (device.id === id ? { ...device, isOn: !device.isOn } : device)))
  }

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      selectedFilter === "All" ||
      (selectedFilter === "On" && device.isOn) ||
      (selectedFilter === "Off" && !device.isOn) ||
      selectedFilter === device.location

    return matchesSearch && matchesFilter
  })

  const locations = [...new Set(devices.map((device) => device.location))]

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3F37C9" />

      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Devices" />
        <Appbar.Action icon="dots-vertical" onPress={() => {}} />
      </Appbar.Header>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search devices"
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchbar}
          iconColor="#4361EE"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        <Chip
          selected={selectedFilter === "All"}
          onPress={() => setSelectedFilter("All")}
          style={styles.filterChip}
          selectedColor="#4361EE"
        >
          All
        </Chip>
        <Chip
          selected={selectedFilter === "On"}
          onPress={() => setSelectedFilter("On")}
          style={styles.filterChip}
          selectedColor="#4361EE"
        >
          On
        </Chip>
        <Chip
          selected={selectedFilter === "Off"}
          onPress={() => setSelectedFilter("Off")}
          style={styles.filterChip}
          selectedColor="#4361EE"
        >
          Off
        </Chip>
        {locations.map((location) => (
          <Chip
            key={location}
            selected={selectedFilter === location}
            onPress={() => setSelectedFilter(location)}
            style={styles.filterChip}
            selectedColor="#4361EE"
          >
            {location}
          </Chip>
        ))}
      </ScrollView>

      <Divider />

      <ScrollView style={styles.deviceList}>
        <Text style={styles.sectionTitle}>Manage your connected devices</Text>

        {filteredDevices.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="devices" size={64} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>No devices found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
          </View>
        ) : (
          filteredDevices.map((device) => (
            <Card key={device.id} style={styles.deviceCard}>
              <Card.Content>
                <View style={styles.deviceHeader}>
                  <View style={[styles.deviceIconContainer, { backgroundColor: device.isOn ? "#4361EE" : "#757575" }]}>
                    <MaterialCommunityIcons name={device.icon as any} size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.deviceLocation}>{device.location}</Text>
                  </View>
                  <Switch
                    value={device.isOn}
                    onValueChange={() => toggleDevice(device.id)}
                    color="#4361EE"
                    disabled={device.status === "Disconnected"}
                  />
                </View>

                <View style={styles.deviceDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>{device.type}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text
                      style={[styles.detailValue, { color: device.status === "Connected" ? "#4CAF50" : "#CF6679" }]}
                    >
                      {device.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.deviceFooter}>
                  <Text style={styles.lastActive}>Last active: {device.lastActive}</Text>
                  <View style={styles.deviceActions}>
                    <Button mode="text" compact onPress={() => {}} style={styles.actionButton}>
                      Edit
                    </Button>
                    <Button mode="text" compact textColor="#CF6679" onPress={() => {}} style={styles.actionButton}>
                      Remove
                    </Button>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={() => {}} color="#FFFFFF" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#4361EE",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  searchbar: {
    elevation: 0,
    backgroundColor: "#F0F0F0",
  },
  filtersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  filterChip: {
    marginRight: 8,
  },
  deviceList: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#212121",
  },
  deviceCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  deviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  deviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  deviceLocation: {
    fontSize: 14,
    color: "#757575",
  },
  deviceDetails: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  deviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
    paddingTop: 12,
  },
  lastActive: {
    fontSize: 12,
    color: "#757575",
  },
  deviceActions: {
    flexDirection: "row",
  },
  actionButton: {
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#757575",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9E9E9E",
    marginTop: 8,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#4361EE",
  },
})

export default DevicesScreen 