import React, { useState, useEffect, useRef } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar, Alert, Animated } from "react-native"
import { Text, Card, Switch, IconButton, Button, Appbar, Avatar, ProgressBar } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { LineChart } from "react-native-chart-kit"
import SmartTimerModal from "../components/SmartTimerModal"
import CustomAlert from "../components/CustomAlert"
import { getOverallSafetyStatus, getSafetyStatusColor, getSafetyStatusIcon } from "../utils/safetyFeatures"
import { auth, realtimeDb } from "../config/firebase"
import { ref, onValue, set } from "firebase/database"
import {
  requestNotificationPermissions,
  sendOvervoltageAlert,
  sendUndervoltageAlert,
  sendHighPowerAlert,
  sendDeviceOfflineAlert,
  sendDeviceOnlineAlert,
} from "../utils/notifications"
import { calculateLESCOCost, formatCurrency, getTierInfo } from "../utils/lescoRates"
import { Colors, Gradients, Shadows, BorderRadius, Typography, Spacing } from "../config/theme"
import { pulse, fadeIn } from "../utils/animations"

const { width } = Dimensions.get("window")

const HomeScreen = ({ navigation }) => {
  const [mainSwitchOn, setMainSwitchOn] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showSmartTimerModal, setShowSmartTimerModal] = useState(false)
  const [user, setUser] = useState(null)
  const [greeting, setGreeting] = useState("Good morning")
  const [deviceOnline, setDeviceOnline] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [dailyUsage, setDailyUsage] = useState(0)
  const [dailyCost, setDailyCost] = useState(0)
  const [currentTier, setCurrentTier] = useState(null)
  const [powerHistory, setPowerHistory] = useState([0, 0, 0, 0, 0, 0])
  const [alertsSent, setAlertsSent] = useState({
    overvoltage: false,
    undervoltage: false,
    highPower: false,
    deviceOffline: false,
  })
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false)
  const [timerToDelete, setTimerToDelete] = useState(null)
  const [timers, setTimers] = useState([])
  const [safetyStatus, setSafetyStatus] = useState({
    status: 'safe',
    message: 'All Systems Safe',
    alerts: [],
    action: 'NONE'
  })
  const [manualOverride, setManualOverride] = useState(false)
  const [powerData, setPowerData] = useState({
    voltage: 220.4,
    current: 0.02,
    power: 4,
    dailyUsage: 0.1,
  })
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  
  // Start animations on mount
  useEffect(() => {
    fadeIn(fadeAnim, 500).start()
    if (mainSwitchOn) {
      pulse(pulseAnim, 0.95, 1.05, 2000).start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  useEffect(() => {
    if (mainSwitchOn) {
      pulse(pulseAnim, 0.95, 1.05, 2000).start()
    } else {
      pulseAnim.setValue(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainSwitchOn])
  const getChartData = () => {
    const now = new Date()
    const labels = powerHistory.map((_, index) => {
      const time = new Date(now.getTime() - (5 - index) * 5000)
      return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    })

    return {
      labels: labels,
      datasets: [
        {
          data: powerHistory.map(p => p || 0),
          color: () => "#4361EE",
          strokeWidth: 2,
        },
      ],
    }
  }

  useEffect(() => {
    // Get user data from Firebase
    const currentUser = auth.currentUser
    if (currentUser) {
      setUser({
        name: currentUser.displayName || "User",
        email: currentUser.email,
      })
    }

    // Set greeting based on time
    const currentHour = new Date().getHours()
    if (currentHour >= 5 && currentHour < 12) {
      setGreeting("Good morning")
    } else if (currentHour >= 12 && currentHour < 17) {
      setGreeting("Good afternoon")
    } else if (currentHour >= 17 && currentHour < 21) {
      setGreeting("Good evening")
    } else {
      setGreeting("Good night")
    }

    // Request notification permissions
    requestNotificationPermissions()

    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Reload user data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const currentUser = auth.currentUser
      if (currentUser) {
        setUser({
          name: currentUser.displayName || "User",
          email: currentUser.email,
        })
      }
    })

    return unsubscribe
  }, [navigation])

  // Calculate daily energy usage (kWh) and cost with LESCO rates
  useEffect(() => {
    if (loading) return

    const interval = setInterval(() => {
      if (mainSwitchOn && powerData.power > 0) {
        // Calculate energy consumed in this interval (1 second = 1/3600 hour)
        const energyInKWh = (powerData.power / 1000) * (1 / 3600)
        setDailyUsage((prev) => {
          const newUsage = Number((prev + energyInKWh).toFixed(6))
          // Calculate cost using LESCO rates
          const costData = calculateLESCOCost(newUsage)
          setDailyCost(costData.totalCost)
          setCurrentTier(getTierInfo(newUsage))
          return newUsage
        })
      }

      // Update power history for chart every 5 seconds
      setPowerHistory((prev) => {
        const newHistory = [...prev.slice(1), powerData.power]
        return newHistory
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [loading, mainSwitchOn, powerData.power])

  // Monitor voltage, power, and device status for alerts
  useEffect(() => {
    if (loading) return

    // Check overvoltage (>250V)
    if (powerData.voltage > 250 && !alertsSent.overvoltage) {
      sendOvervoltageAlert(powerData.voltage)
      setAlertsSent(prev => ({ ...prev, overvoltage: true }))
    } else if (powerData.voltage <= 250 && alertsSent.overvoltage) {
      setAlertsSent(prev => ({ ...prev, overvoltage: false }))
    }

    // Check undervoltage (<180V)
    if (powerData.voltage > 0 && powerData.voltage < 180 && !alertsSent.undervoltage) {
      sendUndervoltageAlert(powerData.voltage)
      setAlertsSent(prev => ({ ...prev, undervoltage: true }))
    } else if ((powerData.voltage >= 180 || powerData.voltage === 0) && alertsSent.undervoltage) {
      setAlertsSent(prev => ({ ...prev, undervoltage: false }))
    }

    // Check high power consumption (>1500W)
    if (powerData.power > 1500 && !alertsSent.highPower) {
      sendHighPowerAlert(powerData.power)
      setAlertsSent(prev => ({ ...prev, highPower: true }))
    } else if (powerData.power <= 1500 && alertsSent.highPower) {
      setAlertsSent(prev => ({ ...prev, highPower: false }))
    }

    // Check device offline (no update for 30 seconds)
    if (lastUpdated) {
      const timeSinceUpdate = Date.now() - lastUpdated.getTime()
      if (timeSinceUpdate > 30000 && deviceOnline && !alertsSent.deviceOffline) {
        setDeviceOnline(false)
        sendDeviceOfflineAlert()
        setAlertsSent(prev => ({ ...prev, deviceOffline: true }))
      }
    }

    // Check device back online
    if (deviceOnline && alertsSent.deviceOffline) {
      sendDeviceOnlineAlert()
      setAlertsSent(prev => ({ ...prev, deviceOffline: false }))
    }
  }, [loading, powerData.voltage, powerData.power, deviceOnline, lastUpdated, alertsSent])

  // Real-time data from Firebase (ESP32)
  useEffect(() => {
    if (loading) return

    // Listen to voltage
    const voltageRef = ref(realtimeDb, 'voltage')
    const voltageListener = onValue(voltageRef, (snapshot) => {
      const voltage = snapshot.val()
      if (voltage !== null) {
        setPowerData((prev) => ({ ...prev, voltage: Number(voltage) }))
        setDeviceOnline(true)
        setLastUpdated(new Date())
      }
    })

    // Listen to current
    const currentRef = ref(realtimeDb, 'current')
    const currentListener = onValue(currentRef, (snapshot) => {
      const current = snapshot.val()
      if (current !== null) {
        setPowerData((prev) => ({ ...prev, current: Number(current) }))
      }
    })

    // Listen to power
    const powerRef = ref(realtimeDb, 'power')
    const powerListener = onValue(powerRef, (snapshot) => {
      const power = snapshot.val()
      if (power !== null) {
        setPowerData((prev) => ({ ...prev, power: Number(power) }))
      }
    })

    // Listen to relay status
    const relayRef = ref(realtimeDb, 'relay')
    const relayListener = onValue(relayRef, (snapshot) => {
      const relayStatus = snapshot.val()
      if (relayStatus !== null) {
        setMainSwitchOn(relayStatus === 'on')
      }
    })

    // Cleanup listeners
    return () => {
      voltageListener()
      currentListener()
      powerListener()
      relayListener()
    }
  }, [loading])

  // Load timers from Firebase
  useEffect(() => {
    if (loading) return

    const timersRef = ref(realtimeDb, 'timers')
    const timersListener = onValue(timersRef, (snapshot) => {
      const timersData = snapshot.val()
      if (timersData) {
        const timersArray = Object.keys(timersData).map(key => ({
          id: key,
          ...timersData[key]
        }))
        setTimers(timersArray)
        console.log('Timers loaded from Firebase:', timersArray.length)
      } else {
        setTimers([])
      }
    })

    return () => timersListener()
  }, [loading])

  // Update safety status when power data changes
  useEffect(() => {
    const newSafetyStatus = getOverallSafetyStatus(
      powerData.voltage,
      powerData.current,
      powerData.power,
      powerData.temperature,
      lastUpdated
    )
    setSafetyStatus(newSafetyStatus)
  }, [powerData, lastUpdated])

  // Auto Timer Checking System
  useEffect(() => {
    if (loading || timers.length === 0 || manualOverride) return

    const checkTimers = async () => {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentDay = now.getDay() // 0=Sunday, 1=Monday, etc.
      const currentTotalMinutes = currentHour * 60 + currentMinute

      let activeTimerId = null
      let shouldTurnOn = false

      // Check all timers (enabled or not)
      for (const timer of timers) {
        // Parse start and end times
        const startDate = new Date(timer.startTime)
        const endDate = new Date(timer.endTime)
        
        const startHour = startDate.getHours()
        const startMinute = startDate.getMinutes()
        const endHour = endDate.getHours()
        const endMinute = endDate.getMinutes()
        
        const startTotalMinutes = startHour * 60 + startMinute
        const endTotalMinutes = endHour * 60 + endMinute

        // Check if current time is within timer range
        let timeMatched = false
        if (endTotalMinutes > startTotalMinutes) {
          // Normal case: same day
          timeMatched = (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes)
        } else {
          // Timer crosses midnight
          timeMatched = (currentTotalMinutes >= startTotalMinutes || currentTotalMinutes <= endTotalMinutes)
        }

        // Check if current day is in timer days
        const dayMatched = timer.days && timer.days.includes(currentDay)

        if (timeMatched && dayMatched) {
          // Auto-enable timer if not already enabled
          if (!timer.enabled) {
            console.log(`🔄 Auto-enabling timer "${timer.name}"`)
            const timerRef = ref(realtimeDb, `timers/${timer.id}/enabled`)
            await set(timerRef, true)
            setTimers(prev => prev.map(t => 
              t.id === timer.id ? { ...t, enabled: true } : t
            ))
          }
          shouldTurnOn = true
          activeTimerId = timer.id
          console.log(`✅ Timer "${timer.name}" is active!`)
          break
        } else if (timer.enabled && timeMatched === false && dayMatched) {
          // Timer was active but time has passed - auto disable
          console.log(`🔄 Auto-disabling timer "${timer.name}" (time ended)`)
          const timerRef = ref(realtimeDb, `timers/${timer.id}/enabled`)
          await set(timerRef, false)
          setTimers(prev => prev.map(t => 
            t.id === timer.id ? { ...t, enabled: false } : t
          ))
        }
      }

      // Auto-control switch based on timer
      if (shouldTurnOn && !mainSwitchOn && !manualOverride) {
        console.log('🔛 Turning relay ON (Timer activated)')
        setMainSwitchOn(true)
        await set(ref(realtimeDb, 'relay'), 'on')
        setManualOverride(false)
      } else if (!shouldTurnOn && mainSwitchOn && !manualOverride) {
        // Check if any enabled timer exists
        const hasEnabledTimer = timers.some(t => t.enabled)
        if (hasEnabledTimer) {
          console.log('🔴 Turning relay OFF (Timer ended)')
          setMainSwitchOn(false)
          await set(ref(realtimeDb, 'relay'), 'off')
          setManualOverride(false)
        }
      }
    }

    // Check timers every 10 seconds
    checkTimers() // Initial check
    const timerInterval = setInterval(checkTimers, 10000)

    return () => clearInterval(timerInterval)
  }, [loading, timers, mainSwitchOn, manualOverride])

  const toggleMainSwitch = async () => {
    const newStatus = !mainSwitchOn
    setMainSwitchOn(newStatus)
    
    // Disable manual override when turning ON manually
    // Enable manual override only when turning OFF manually
    if (!newStatus) {
      setManualOverride(true)
      console.log('🎛️ Manual OFF - Timer control paused')
      
      // Reset manual override after 30 seconds to allow next timer
      setTimeout(() => {
        setManualOverride(false)
        console.log('⏰ Timer control resumed - Ready for next timer')
      }, 30000)
    } else {
      setManualOverride(false)
      console.log('🎛️ Manual ON - Timer control active')
    }

    // Update Firebase to control ESP32
    try {
      await set(ref(realtimeDb, 'relay'), newStatus ? 'on' : 'off')
    } catch (error) {
      console.error('Error updating relay:', error)
      setMainSwitchOn(!newStatus) // Revert on error
    }
  }

  const formatTime = (timeString) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDays = (days) => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return days.map((day) => dayNames[day]).join(", ")
  }

  const handleSaveTimer = async (newTimer) => {
    try {
      // Save to Firebase
      const timerRef = ref(realtimeDb, `timers/${newTimer.id}`)
      await set(timerRef, {
        name: newTimer.name,
        startTime: newTimer.startTime,
        endTime: newTimer.endTime,
        days: newTimer.days,
        enabled: newTimer.enabled,
        createdAt: newTimer.createdAt,
        scheduleType: newTimer.scheduleType || 'custom',
        dayType: newTimer.dayType || 'all',
        scene: newTimer.scene || null,
        randomMode: newTimer.randomMode || false,
        sunriseTime: newTimer.sunriseTime || null,
        sunsetTime: newTimer.sunsetTime || null
      })
      
      // Update local state
      setTimers((prev) => [...prev, newTimer])
      console.log('Timer saved to Firebase:', newTimer.id)
    } catch (error) {
      console.error('Error saving timer:', error)
      alert('Failed to save timer. Please try again.')
    }
  }

  const handleDeleteTimer = (timerId) => {
    const timer = timers.find((t) => t.id === timerId)
    setTimerToDelete(timer)
    setDeleteAlertVisible(true)
  }

  const confirmDeleteTimer = async () => {
    if (timerToDelete) {
      try {
        // Delete from Firebase
        const timerRef = ref(realtimeDb, `timers/${timerToDelete.id}`)
        await set(timerRef, null)
        
        // Update local state
        setTimers(prev => prev.filter(timer => timer.id !== timerToDelete.id))
        console.log('Timer deleted from Firebase:', timerToDelete.id)
      } catch (error) {
        console.error('Error deleting timer:', error)
        alert('Failed to delete timer. Please try again.')
      }
      setDeleteAlertVisible(false)
      setTimerToDelete(null)
    }
  }

  const toggleTimer = async (timerId) => {
    try {
      const timer = timers.find(t => t.id === timerId)
      if (timer) {
        const newEnabledState = !timer.enabled
        
        // Update Firebase
        const timerRef = ref(realtimeDb, `timers/${timerId}/enabled`)
        await set(timerRef, newEnabledState)
        
        // Update local state
        setTimers((prev) =>
          prev.map((t) =>
            t.id === timerId ? { ...t, enabled: newEnabledState } : t
          )
        )
        
        console.log('🎛️ Timer toggled manually:', timerId, 'enabled:', newEnabledState)
        
        // If enabling timer, check if it should be active now
        if (newEnabledState) {
          const now = new Date()
          const currentHour = now.getHours()
          const currentMinute = now.getMinutes()
          const currentDay = now.getDay()
          const currentTotalMinutes = currentHour * 60 + currentMinute
          
          const startDate = new Date(timer.startTime)
          const endDate = new Date(timer.endTime)
          const startHour = startDate.getHours()
          const startMinute = startDate.getMinutes()
          const endHour = endDate.getHours()
          const endMinute = endDate.getMinutes()
          const startTotalMinutes = startHour * 60 + startMinute
          const endTotalMinutes = endHour * 60 + endMinute
          
          let timeMatched = false
          if (endTotalMinutes > startTotalMinutes) {
            timeMatched = (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes)
          } else {
            timeMatched = (currentTotalMinutes >= startTotalMinutes || currentTotalMinutes <= endTotalMinutes)
          }
          
          const dayMatched = timer.days && timer.days.includes(currentDay)
          
          // If timer is active now, turn switch ON (don't toggle, just ensure it's ON)
          if (timeMatched && dayMatched && !mainSwitchOn) {
            console.log('✅ Timer is active now - turning switch ON')
            setMainSwitchOn(true)
            await set(ref(realtimeDb, 'relay'), 'on')
          }
        }
      }
    } catch (error) {
      console.error('Error toggling timer:', error)
      alert('Failed to toggle timer. Please try again.')
    }
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
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      {/* Modern Gradient Header */}
      <LinearGradient
        colors={Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Appbar.Header style={styles.header} transparent>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <MaterialCommunityIcons name="lightning-bolt" size={28} color="#FFFFFF" />
              </Animated.View>
              <Text style={styles.headerTitle}>SmartSwitch</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.safetyIndicator}
                onPress={() => navigation.navigate("Safety")}
              >
                <MaterialCommunityIcons 
                  name={getSafetyStatusIcon(safetyStatus.status)} 
                  size={24} 
                  color={getSafetyStatusColor(safetyStatus.status)} 
                />
              </TouchableOpacity>
              <IconButton icon="bell" iconColor="#FFFFFF" onPress={() => {}} />
              <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                <Avatar.Text size={36} label={getInitials(user?.name)} style={styles.avatar} />
              </TouchableOpacity>
            </View>
          </View>
        </Appbar.Header>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section with Gradient Background */}
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={Gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <Text style={styles.greetingText}>{greeting}, {user?.name || "User"}! 👋</Text>
              <View style={styles.heroSubtextContainer}>
                <Text style={styles.heroSubtext}>Monitor and control your smart switch</Text>
                <View style={styles.statusContainer}>
                  <Animated.View 
                    style={[
                      styles.statusDot, 
                      { 
                        backgroundColor: deviceOnline ? Colors.success : Colors.danger,
                        transform: [{ scale: pulseAnim }]
                      }
                    ]} 
                  />
                  <Text style={styles.statusText}>
                    {deviceOnline ? "Device Online" : "Device Offline"}
                  </Text>
                </View>
              </View>
              
              {/* Large Power Display */}
              <View style={styles.powerDisplay}>
                <Text style={styles.powerLabel}>Current Power</Text>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Text style={styles.powerValue}>{powerData.power.toFixed(0)}</Text>
                </Animated.View>
                <Text style={styles.powerUnit}>Watts</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.controlSection}>
          {/* Modern Glass Card for Switch Control */}
          <BlurView intensity={20} tint="light" style={styles.glassCard}>
            <View style={styles.glassCardContent}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="power" size={24} color={Colors.primary} />
                <Text style={styles.cardTitle}>Switch Control</Text>
              </View>
              <View style={styles.switchContainer}>
                <View style={styles.switchInfo}>
                  <Animated.View 
                    style={[
                      styles.switchIndicator, 
                      { 
                        backgroundColor: mainSwitchOn ? Colors.success : Colors.textLight,
                        transform: [{ scale: pulseAnim }]
                      }
                    ]}
                  >
                    <MaterialCommunityIcons name="power" size={28} color="#FFFFFF" />
                  </Animated.View>
                  <View>
                    <Text style={styles.switchTitle}>Main Switch</Text>
                    <Text style={styles.switchSubtitle}>Living Room</Text>
                  </View>
                </View>
                <Switch 
                  value={mainSwitchOn} 
                  onValueChange={toggleMainSwitch} 
                  color={Colors.primary}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                />
              </View>

              <View style={styles.deviceInfo}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={[styles.infoValue, { color: deviceOnline ? Colors.success : Colors.danger }]}>
                    {deviceOnline ? "Online" : "Offline"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Last Updated</Text>
                  <Text style={styles.infoValue}>
                    {lastUpdated ? lastUpdated.toLocaleTimeString() : "--"}
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>

          {/* Modern Glass Card for Timer Scheduling */}
          <BlurView intensity={20} tint="light" style={styles.glassCard}>
            <View style={styles.glassCardContent}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="timer-outline" size={24} color={Colors.primary} />
                <Text style={styles.cardTitle}>Timer Scheduling</Text>
                <View style={styles.timerCountBadge}>
                  <Text style={styles.timerCount}>{timers.length}</Text>
                </View>
              </View>

              {timers.length > 0 ? (
                timers.map((timer) => (
                  <View key={timer.id} style={styles.scheduleItem}>
                    <View style={styles.scheduleHeader}>
                      <View style={styles.scheduleInfo}>
                        <Text style={styles.scheduleName}>{timer.name}</Text>
                        <View style={styles.scheduleTime}>
                          <MaterialCommunityIcons name="clock-outline" size={16} color="#4361EE" />
                          <Text style={styles.scheduleTimeText}>
                            {formatTime(timer.startTime)} - {formatTime(timer.endTime)}
                          </Text>
                        </View>
                        <Text style={styles.scheduleDays}>{formatDays(timer.days)}</Text>
                      </View>
                      <View style={styles.scheduleActions}>
                        <Switch
                          value={timer.enabled}
                          onValueChange={() => toggleTimer(timer.id)}
                          color="#4361EE"
                          size="small"
                        />
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteTimer(timer.id)}
                        >
                          <MaterialCommunityIcons name="delete-outline" size={18} color="#CF6679" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyTimers}>
                  <MaterialCommunityIcons name="timer-outline" size={32} color="#CCCCCC" />
                  <Text style={styles.emptyTimersText}>No timers set up yet</Text>
                  <Text style={styles.emptyTimersSubtext}>Add your first timer to get started</Text>
                </View>
              )}

              <Button 
                mode="contained" 
                icon="brain" 
                onPress={() => setShowSmartTimerModal(true)}
                style={styles.addTimerButton}
                buttonColor={Colors.primary}
                contentStyle={styles.addTimerButtonContent}
                labelStyle={styles.addTimerButtonLabel}
              >
                Add Smart Timer
              </Button>
            </View>
          </BlurView>
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
              <Text style={styles.metricValue}>{powerData.power.toFixed(2)} W</Text>
              <Text style={styles.metricLabel}>Power</Text>
              <Text style={styles.metricRange}>Today: {dailyUsage.toFixed(3)} kWh</Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.costSection}>
          <Card style={styles.costCard}>
            <Card.Content>
              <View style={styles.costHeader}>
                <MaterialCommunityIcons name="cash-multiple" size={32} color="#4361EE" />
                <View style={styles.costInfo}>
                  <Text style={styles.costLabel}>Today's Cost</Text>
                  <Text style={styles.costValue}>{formatCurrency(dailyCost)}</Text>
                </View>
              </View>
              <View style={styles.costDetails}>
                <View style={styles.costDetailItem}>
                  <Text style={styles.costDetailLabel}>Rate</Text>
                  <Text style={styles.costDetailValue}>PKR {currentTier?.rate || 0}/kWh</Text>
                </View>
                <View style={styles.costDetailItem}>
                  <Text style={styles.costDetailLabel}>Est. Monthly</Text>
                  <Text style={styles.costDetailValue}>{formatCurrency(dailyCost * 30)}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.costTrackingButton}
                onPress={() => navigation.navigate("CostTracking")}
              >
                <MaterialCommunityIcons name="chart-line" size={16} color="#4361EE" />
                <Text style={styles.costTrackingText}>View Detailed Cost Analysis</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Real-time Power Consumption</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={getChartData()}
                width={width - 60}
                height={220}
                chartConfig={{
                  backgroundColor: Colors.primary,
                  backgroundGradientFrom: Colors.primary,
                  backgroundGradientTo: Colors.primaryDark,
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: BorderRadius.lg,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#FFFFFF",
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
            <TouchableOpacity 
              style={styles.quickAccessItem} 
              onPress={() => navigation.navigate("Devices")}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={Gradients.primary}
                style={styles.quickAccessIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="devices" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.quickAccessText}>Devices</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAccessItem} 
              onPress={() => setShowSmartTimerModal(true)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={Gradients.warning}
                style={styles.quickAccessIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="brain" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.quickAccessText}>Smart Timer</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAccessItem} 
              onPress={() => navigation.navigate("Analytics")}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={Gradients.success}
                style={styles.quickAccessIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="chart-line" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.quickAccessText}>Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAccessItem} 
              onPress={() => navigation.navigate("History")}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={Gradients.danger}
                style={styles.quickAccessIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="history" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.quickAccessText}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAccessItem} 
              onPress={() => navigation.navigate("Safety")}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={Gradients.danger}
                style={styles.quickAccessIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name={getSafetyStatusIcon(safetyStatus.status)} size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.quickAccessText}>Safety</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <SmartTimerModal
        visible={showSmartTimerModal}
        onClose={() => setShowSmartTimerModal(false)}
        onSave={handleSaveTimer}
        existingTimers={timers}
      />

      {/* Custom Delete Alert */}
      <CustomAlert
        visible={deleteAlertVisible}
        onDismiss={() => setDeleteAlertVisible(false)}
        title="SmartSwitchApp"
        message={`Are you sure you want to delete "${timerToDelete?.name || 'this timer'}"?`}
        type="info"
        showCancel={true}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteTimer}
        onCancel={() => setDeleteAlertVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    color: Colors.primary,
  },
  loadingBar: {
    width: "70%",
    height: 6,
    borderRadius: 3,
  },
  headerGradient: {
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    backgroundColor: 'transparent',
    elevation: 0,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: Typography.h3.fontSize,
    fontWeight: Typography.h3.fontWeight,
    marginLeft: Spacing.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  safetyIndicator: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: Spacing.sm,
  },
  avatar: {
    backgroundColor: Colors.primaryDark,
  },
  scrollView: {
    flex: 1,
  },
  // Hero Section Styles
  heroSection: {
    marginBottom: Spacing.lg,
  },
  heroGradient: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  heroContent: {
    alignItems: 'center',
  },
  greetingText: {
    fontSize: Typography.h2.fontSize,
    fontWeight: Typography.h2.fontWeight,
    color: "#FFFFFF",
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  heroSubtextContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroSubtext: {
    fontSize: Typography.body1.fontSize,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.xs,
  },
  statusText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight,
    color: "#FFFFFF",
  },
  // Power Display Styles
  powerDisplay: {
    alignItems: 'center',
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    width: '100%',
  },
  powerLabel: {
    fontSize: Typography.body2.fontSize,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  powerValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: "#FFFFFF",
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  powerUnit: {
    fontSize: Typography.body1.fontSize,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: Spacing.xs,
  },
  // Glass Card Styles
  glassCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: Shadows.md.shadowColor,
    shadowOffset: Shadows.md.shadowOffset,
    shadowOpacity: Shadows.md.shadowOpacity,
    shadowRadius: Shadows.md.shadowRadius,
    elevation: Shadows.md.elevation,
  },
  glassCardContent: {
    backgroundColor: Colors.glassBackground,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  controlSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  controlCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    shadowColor: Shadows.md.shadowColor,
    shadowOffset: Shadows.md.shadowOffset,
    shadowOpacity: Shadows.md.shadowOpacity,
    shadowRadius: Shadows.md.shadowRadius,
    elevation: Shadows.md.elevation,
  },
  cardTitle: {
    fontSize: Typography.h4.fontSize,
    fontWeight: Typography.h4.fontWeight,
    marginLeft: Spacing.sm,
    color: Colors.text,
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
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  timerCountBadge: {
    marginLeft: 'auto',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    minWidth: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  timerCount: {
    fontSize: Typography.body2.fontSize,
    fontWeight: 'bold',
    color: "#FFFFFF",
  },
  scheduleItem: {
    backgroundColor: "rgba(67, 97, 238, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  scheduleTime: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  scheduleTimeText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
    color: "#4361EE",
  },
  scheduleDays: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 22,
  },
  scheduleActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(207, 102, 121, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  emptyTimers: {
    alignItems: "center",
    padding: 20,
    marginBottom: 16,
  },
  emptyTimersText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#757575",
    marginTop: 8,
  },
  emptyTimersSubtext: {
    fontSize: 14,
    color: "#9E9E9E",
    marginTop: 4,
    textAlign: "center",
  },
  addTimerButton: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    shadowColor: Shadows.sm.shadowColor,
    shadowOffset: Shadows.sm.shadowOffset,
    shadowOpacity: Shadows.sm.shadowOpacity,
    shadowRadius: Shadows.sm.shadowRadius,
    elevation: Shadows.sm.elevation,
  },
  addTimerButtonContent: {
    paddingVertical: Spacing.sm,
  },
  addTimerButtonLabel: {
    fontSize: Typography.body1.fontSize,
    fontWeight: '600',
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
  costSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  costCard: {
    borderRadius: 12,
    elevation: 2,
    backgroundColor: "#FFFFFF",
  },
  costHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  costInfo: {
    marginLeft: 16,
    flex: 1,
  },
  costLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  costValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4361EE",
  },
  costDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  costDetailItem: {
    alignItems: "center",
  },
  costDetailLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  costDetailValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  costTrackingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(67, 97, 238, 0.1)",
    borderRadius: 8,
  },
  costTrackingText: {
    fontSize: 14,
    color: "#4361EE",
    fontWeight: "600",
    marginLeft: 6,
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
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Shadows.md.shadowColor,
    shadowOffset: Shadows.md.shadowOffset,
    shadowOpacity: Shadows.md.shadowOpacity,
    shadowRadius: Shadows.md.shadowRadius,
    elevation: Shadows.md.elevation,
    alignItems: "center",
  },
  quickAccessIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.round,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
    shadowColor: Shadows.sm.shadowColor,
    shadowOffset: Shadows.sm.shadowOffset,
    shadowOpacity: Shadows.sm.shadowOpacity,
    shadowRadius: Shadows.sm.shadowRadius,
    elevation: Shadows.sm.elevation,
  },
  quickAccessText: {
    fontSize: Typography.body2.fontSize,
    fontWeight: Typography.body2.fontWeight,
    color: Colors.text,
  },
})

export default HomeScreen
