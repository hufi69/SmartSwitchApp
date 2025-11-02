import React, { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, StatusBar, TouchableOpacity, Dimensions } from "react-native"
import { Text, Card, Switch, Appbar, IconButton, Chip, Button, FAB } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { realtimeDb } from "../config/firebase"
import { ref, onValue, set } from "firebase/database"
import CustomAlert from "../components/CustomAlert"

const { width } = Dimensions.get("window")

const DevicesScreen = ({ navigation }) => {
  const [devices, setDevices] = useState({})
  const [loading, setLoading] = useState(true)
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState({})

  // Room organization
  const rooms = {
    "Living Room": ["device1", "device2", "device3"],
    "Bedroom": ["device4"],
    "Kitchen": [],
    "Bathroom": []
  }

  useEffect(() => {
    // Listen to all devices
    const devicesRef = ref(realtimeDb, 'devices')
    const listener = onValue(devicesRef, (snapshot) => {
      const devicesData = snapshot.val()
      if (devicesData) {
        setDevices(devicesData)
      }
      setLoading(false)
    })

    return () => listener()
  }, [])

  const showAlert = (message, type = 'info', onConfirm) => {
    setAlertConfig({
      message,
      type,
      onConfirm: onConfirm || (() => setAlertVisible(false))
    })
    setAlertVisible(true)
  }

  const toggleDevice = async (deviceId) => {
    const device = devices[deviceId]
    const newStatus = device.status === 'on' ? 'off' : 'on'
    
    try {
      await set(ref(realtimeDb, `devices/${deviceId}/status`), newStatus)
      showAlert(
        `${device.name} turned ${newStatus.toUpperCase()}`,
        'success'
      )
    } catch (error) {
      console.error('Error toggling device:', error)
      showAlert('Failed to control device', 'error')
    }
  }

  const toggleAllDevices = async (turnOn) => {
    const promises = Object.keys(devices).map(deviceId => 
      set(ref(realtimeDb, `devices/${deviceId}/status`), turnOn ? 'on' : 'off')
    )
    
    try {
      await Promise.all(promises)
      showAlert(
        `All devices turned ${turnOn ? 'ON' : 'OFF'}`,
        'success'
      )
    } catch (error) {
      console.error('Error toggling all devices:', error)
      showAlert('Failed to control devices', 'error')
    }
  }

  const getRoomDevices = (roomName) => {
    const deviceIds = rooms[roomName] || []
    return deviceIds.map(id => ({ id, ...devices[id] })).filter(device => device.name)
  }

  const getTotalDevices = () => Object.keys(devices).length
  const getOnlineDevices = () => Object.values(devices).filter(device => device.status === 'on').length

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="devices" size={48} color="#4361EE" />
        <Text style={styles.loadingText}>Loading devices...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4361EE" />
      
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#FFFFFF" />
        <Appbar.Content title="Device Control" titleStyle={styles.headerTitle} />
        <IconButton icon="refresh" iconColor="#FFFFFF" onPress={() => setLoading(true)} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <MaterialCommunityIcons name="devices" size={24} color="#4361EE" />
              <View style={styles.summaryText}>
                <Text style={styles.summaryValue}>{getTotalDevices()}</Text>
                <Text style={styles.summaryLabel}>Total Devices</Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <MaterialCommunityIcons name="power" size={24} color="#4CAF50" />
              <View style={styles.summaryText}>
                <Text style={styles.summaryValue}>{getOnlineDevices()}</Text>
                <Text style={styles.summaryLabel}>Online</Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Bulk Controls */}
        <Card style={styles.bulkCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Bulk Control</Text>
            <View style={styles.bulkButtons}>
              <Button
                mode="contained"
                icon="power-on"
                onPress={() => toggleAllDevices(true)}
                style={styles.bulkButton}
                buttonColor="#4CAF50"
              >
                Turn All ON
              </Button>
              <Button
                mode="contained"
                icon="power-off"
                onPress={() => toggleAllDevices(false)}
                style={styles.bulkButton}
                buttonColor="#F44336"
              >
                Turn All OFF
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Room-wise Device Organization */}
        {Object.keys(rooms).map(roomName => {
          const roomDevices = getRoomDevices(roomName)
          if (roomDevices.length === 0) return null

          return (
            <Card key={roomName} style={styles.roomCard}>
              <Card.Content>
                <View style={styles.roomHeader}>
                  <Text style={styles.roomTitle}>{roomName}</Text>
                  <Chip 
                    icon="devices" 
                    style={styles.roomChip}
                    textStyle={styles.roomChipText}
                  >
                    {roomDevices.length} device{roomDevices.length !== 1 ? 's' : ''}
                  </Chip>
                </View>

                {roomDevices.map(device => (
                  <View key={device.id} style={styles.deviceItem}>
                    <View style={styles.deviceInfo}>
                      <View style={styles.deviceIcon}>
                        <MaterialCommunityIcons 
                          name={getDeviceIcon(device.name)} 
                          size={24} 
                          color={device.status === 'on' ? "#4CAF50" : "#757575"} 
                        />
                      </View>
                      <View style={styles.deviceDetails}>
                        <Text style={styles.deviceName}>{device.name}</Text>
                        <Text style={styles.deviceStatus}>
                          {device.status === 'on' ? 'Online' : 'Offline'}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={device.status === 'on'}
                      onValueChange={() => toggleDevice(device.id)}
                      color="#4361EE"
                    />
                  </View>
                ))}
              </Card.Content>
            </Card>
          )
        })}

        {/* Add Device Button */}
        <Card style={styles.addDeviceCard}>
          <Card.Content style={styles.addDeviceContent}>
            <MaterialCommunityIcons name="plus-circle" size={32} color="#4361EE" />
            <Text style={styles.addDeviceText}>Add New Device</Text>
            <Text style={styles.addDeviceSubtext}>Connect more devices to your extension board</Text>
            <Button
              mode="outlined"
              onPress={() => showAlert('To add a new device, connect it to your ESP32 extension board and update the code', 'info')}
              style={styles.addDeviceButton}
            >
              Learn How
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        onDismiss={() => setAlertVisible(false)}
        {...alertConfig}
      />
    </View>
  )
}

const getDeviceIcon = (deviceName) => {
  const name = deviceName.toLowerCase()
  if (name.includes('laptop') || name.includes('computer')) return 'laptop'
  if (name.includes('phone') || name.includes('mobile')) return 'cellphone'
  if (name.includes('bulb') || name.includes('light')) return 'lightbulb'
  if (name.includes('fan')) return 'fan'
  if (name.includes('tv')) return 'television'
  if (name.includes('ac') || name.includes('air')) return 'air-conditioner'
  return 'power-plug'
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
    marginTop: 16,
  },
  header: {
    backgroundColor: "#4361EE",
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    elevation: 2,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  summaryText: {
    marginLeft: 12,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: "#1A1A1A",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666666",
  },
  bulkCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: "#1A1A1A",
    marginBottom: 16,
  },
  bulkButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  bulkButton: {
    flex: 1,
  },
  roomCard: {
    marginBottom: 16,
    elevation: 2,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: "#1A1A1A",
  },
  roomChip: {
    backgroundColor: "#E3F2FD",
  },
  roomChipText: {
    color: "#4361EE",
    fontSize: 12,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIcon: {
    marginRight: 12,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: "#1A1A1A",
  },
  deviceStatus: {
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },
  addDeviceCard: {
    marginBottom: 16,
    elevation: 2,
  },
  addDeviceContent: {
    alignItems: 'center',
    padding: 24,
  },
  addDeviceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: "#1A1A1A",
    marginTop: 12,
  },
  addDeviceSubtext: {
    fontSize: 14,
    color: "#666666",
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  addDeviceButton: {
    borderColor: "#4361EE",
  },
})

export default DevicesScreen