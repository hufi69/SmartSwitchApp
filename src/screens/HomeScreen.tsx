"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar } from "react-native"
import { Text, Card, Switch, IconButton, Button, Appbar, Avatar, ProgressBar } from "react-native-paper"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../../App"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { LineChart } from "react-native-chart-kit"

type HomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "Home">
}

const { width } = Dimensions.get("window")

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [mainSwitchOn, setMainSwitchOn] = useState(true)
  const [loading, setLoading] = useState(true)
  const [powerData, setPowerData] = useState({
    voltage: 220.4,
    current: 0.02,
    power: 4,
    dailyUsage: 0.1,
  })
  const [chartData, setChartData] = useState({
    labels: ["6am", "9am", "12pm", "3pm", "6pm", "9pm"],
    datasets: [
      {
        data: [2, 3, 4, 3, 5, 4],
        color: () => "#4361EE",
        strokeWidth: 2,
      },
    ],
  })

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Simulate real-time updates
  useEffect(() => {
    if (loading) return

    const interval = setInterval(() => {
      if (mainSwitchOn) {
        setPowerData((prev) => ({
          ...prev,
          voltage: prev.voltage + (Math.random() * 0.4 - 0.2),
          current: prev.current + (Math.random() * 0.002 - 0.001),
          power: Number.parseFloat((prev.voltage * prev.current).toFixed(2)),
          dailyUsage: Number.parseFloat((prev.dailyUsage + 0.001).toFixed(3)),
        }))
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [loading, mainSwitchOn])

  const toggleMainSwitch = () => {
    setMainSwitchOn(!mainSwitchOn)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="lightning-bolt" size={48} color="#4361EE" />
        <Text style={styles.loadingText}>Loading your Smart Switch...</Text>
        <ProgressBar indeterminate color="#4361EE" style={styles.loadingBar} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3F37C9" />

      <Appbar.Header style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="lightning-bolt" size={24} color="#FFFFFF" />
            <Text style={styles.headerTitle}>SmartSwitch</Text>
          </View>
          <View style={styles.headerRight}>
            <IconButton icon="bell" iconColor="#FFFFFF" onPress={() => {}} />
            <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
              <Avatar.Text size={36} label="MH" style={styles.avatar} />
            </TouchableOpacity>
          </View>
        </View>
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Good morning, Muhammad!</Text>
          <Text style={styles.greetingSubtext}>Monitor and control your smart switch</Text>
        </View>

        <View style={styles.controlSection}>
          <Card style={styles.controlCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Switch Control</Text>
              <View style={styles.switchContainer}>
                <View style={styles.switchInfo}>
                  <View style={[styles.switchIndicator, { backgroundColor: mainSwitchOn ? "#4CAF50" : "#757575" }]}>
                    <MaterialCommunityIcons name="power" size={24} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.switchTitle}>Main Switch</Text>
                    <Text style={styles.switchSubtitle}>Living Room</Text>
                  </View>
                </View>
                <Switch value={mainSwitchOn} onValueChange={toggleMainSwitch} color="#4361EE" />
              </View>

              <View style={styles.deviceInfo}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Connected Device</Text>
                  <Text style={styles.infoValue}>Table Lamp</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Last Activated</Text>
                  <Text style={styles.infoValue}>Just now</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.timerCard}>
            <Card.Content>
              <View style={styles.timerHeader}>
                <Text style={styles.cardTitle}>Timer Scheduling</Text>
                <IconButton icon="plus" size={20} iconColor="#FFFFFF" style={styles.addButton} onPress={() => {}} />
              </View>

              <View style={styles.scheduleItem}>
                <View style={styles.scheduleTime}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#4361EE" />
                  <Text style={styles.scheduleTimeText}>08:00 - 17:00</Text>
                </View>
                <Text style={styles.scheduleDays}>Mon, Tue, Wed, Thu, Fri</Text>
              </View>

              <Button mode="outlined" icon="plus" style={styles.addTimerButton} textColor="#4361EE" onPress={() => {}}>
                Add Another Timer
              </Button>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.metricsSection}>
          <View style={styles.metricsRow}>
            <Card style={[styles.metricCard, styles.voltageCard]}>
              <Card.Content style={styles.metricContent}>
                <MaterialCommunityIcons name="flash" size={24} color="#FB8C00" />
                <Text style={styles.metricValue}>{powerData.voltage.toFixed(1)} V</Text>
                <Text style={styles.metricLabel}>Voltage</Text>
                <Text style={styles.metricRange}>Normal range: 210-230V</Text>
              </Card.Content>
            </Card>

            <Card style={[styles.metricCard, styles.currentCard]}>
              <Card.Content style={styles.metricContent}>
                <MaterialCommunityIcons name="current-ac" size={24} color="#4361EE" />
                <Text style={styles.metricValue}>{powerData.current.toFixed(2)} A</Text>
                <Text style={styles.metricLabel}>Current</Text>
                <Text style={styles.metricRange}>Normal range: 0-10A</Text>
              </Card.Content>
            </Card>
          </View>

          <Card style={styles.powerCard}>
            <Card.Content style={styles.metricContent}>
              <MaterialCommunityIcons name="lightning-bolt-circle" size={24} color="#4CAF50" />
              <Text style={styles.metricValue}>{powerData.power} W</Text>
              <Text style={styles.metricLabel}>Power</Text>
              <Text style={styles.metricRange}>Daily usage: {powerData.dailyUsage} kWh</Text>
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Performance Metrics</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={chartData}
                width={width - 60}
                height={220}
                chartConfig={{
                  backgroundColor: "#1E2923",
                  backgroundGradientFrom: "#1E2923",
                  backgroundGradientTo: "#08130D",
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(67, 97, 238, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#4361EE",
                  },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          </Card.Content>
        </Card>

        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            <TouchableOpacity style={styles.quickAccessItem} onPress={() => navigation.navigate("Devices")}>
              <View style={[styles.quickAccessIcon, { backgroundColor: "#4361EE" }]}>
                <MaterialCommunityIcons name="devices" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickAccessText}>Devices</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAccessItem} onPress={() => {}}>
              <View style={[styles.quickAccessIcon, { backgroundColor: "#FB8C00" }]}>
                <MaterialCommunityIcons name="timer-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickAccessText}>Timer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAccessItem} onPress={() => navigation.navigate("Analytics")}>
              <View style={[styles.quickAccessIcon, { backgroundColor: "#4CAF50" }]}>
                <MaterialCommunityIcons name="chart-line" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickAccessText}>Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAccessItem} onPress={() => navigation.navigate("History")}>
              <View style={[styles.quickAccessIcon, { backgroundColor: "#CF6679" }]}>
                <MaterialCommunityIcons name="history" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickAccessText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    color: "#4361EE",
  },
  loadingBar: {
    width: "70%",
    height: 6,
    borderRadius: 3,
  },
  header: {
    backgroundColor: "#4361EE",
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#3F37C9",
  },
  scrollView: {
    flex: 1,
  },
  greeting: {
    padding: 16,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
  },
  greetingSubtext: {
    fontSize: 16,
    color: "#757575",
    marginTop: 4,
  },
  controlSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  controlCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#212121",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  switchInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  switchSubtitle: {
    fontSize: 14,
    color: "#757575",
  },
  deviceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  timerCard: {
    borderRadius: 12,
    elevation: 2,
  },
  timerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: "#4361EE",
    margin: 0,
  },
  scheduleItem: {
    backgroundColor: "rgba(67, 97, 238, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  scheduleTime: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  scheduleTimeText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#212121",
  },
  scheduleDays: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 28,
  },
  addTimerButton: {
    borderColor: "#4361EE",
    borderRadius: 8,
  },
  metricsSection: {
    padding: 16,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    elevation: 2,
  },
  voltageCard: {
    marginRight: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FB8C00",
  },
  currentCard: {
    marginLeft: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4361EE",
  },
  powerCard: {
    borderRadius: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  metricContent: {
    alignItems: "flex-start",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
    color: "#212121",
  },
  metricLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  metricRange: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  chartCard: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  chartContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  chart: {
    borderRadius: 16,
  },
  quickAccessSection: {
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#212121",
  },
  quickAccessGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickAccessItem: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    alignItems: "center",
  },
  quickAccessIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
})

export default HomeScreen
