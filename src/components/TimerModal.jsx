import React, { useState } from "react"
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native"
import {
  Text,
  Card,
  Button,
  TextInput,
  IconButton,
  Switch,
  Chip,
  Divider,
} from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import CustomAlert from "./CustomAlert"

const TimerModal = ({ visible, onClose, onSave, existingTimers = [] }) => {
  const [timerName, setTimerName] = useState("")
  const [startTime, setStartTime] = useState(() => {
    const now = new Date()
    now.setHours(8, 0, 0, 0) // Default to 8:00 AM
    return now
  })
  const [endTime, setEndTime] = useState(() => {
    const now = new Date()
    now.setHours(17, 0, 0, 0) // Default to 5:00 PM
    return now
  })
  const [selectedDays, setSelectedDays] = useState([])
  const [isEnabled, setIsEnabled] = useState(true)
  const [showStartTimePicker, setShowStartTimePicker] = useState(false)
  const [showEndTimePicker, setShowEndTimePicker] = useState(false)
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState({})

  const days = [
    { id: 1, label: "Mon", fullName: "Monday" },
    { id: 2, label: "Tue", fullName: "Tuesday" },
    { id: 3, label: "Wed", fullName: "Wednesday" },
    { id: 4, label: "Thu", fullName: "Thursday" },
    { id: 5, label: "Fri", fullName: "Friday" },
    { id: 6, label: "Sat", fullName: "Saturday" },
    { id: 0, label: "Sun", fullName: "Sunday" },
  ]

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const toggleDay = (dayId) => {
    setSelectedDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((id) => id !== dayId)
        : [...prev, dayId]
    )
  }

  const handleStartTimeChange = (event, selectedDate) => {
    // On Android, only process when user confirms or dismisses
    if (Platform.OS === "android") {
      if (event.type === "set" && selectedDate) {
        setStartTime(selectedDate)
        setShowStartTimePicker(false)
      } else if (event.type === "dismissed") {
        setShowStartTimePicker(false)
      }
    } else {
      // iOS behavior - keep picker open and update immediately
      setShowStartTimePicker(true)
      if (selectedDate) {
        setStartTime(selectedDate)
      }
    }
  }

  const handleEndTimeChange = (event, selectedDate) => {
    // On Android, only process when user confirms or dismisses
    if (Platform.OS === "android") {
      if (event.type === "set" && selectedDate) {
        setEndTime(selectedDate)
        setShowEndTimePicker(false)
      } else if (event.type === "dismissed") {
        setShowEndTimePicker(false)
      }
    } else {
      // iOS behavior - keep picker open and update immediately
      setShowEndTimePicker(true)
      if (selectedDate) {
        setEndTime(selectedDate)
      }
    }
  }

  const showAlert = (message, type = 'error', onConfirm) => {
    setAlertConfig({
      message,
      type,
      onConfirm: onConfirm || (() => setAlertVisible(false))
    })
    setAlertVisible(true)
  }

  const handleSave = () => {
    if (!timerName.trim()) {
      showAlert("Please enter a timer name", 'info')
      return
    }

    if (selectedDays.length === 0) {
      showAlert("Please select at least one day", 'info')
      return
    }

    if (startTime >= endTime) {
      showAlert("End time must be after start time", 'info')
      return
    }

    const newTimer = {
      id: Date.now().toString(),
      name: timerName.trim(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      days: selectedDays.sort(),
      enabled: isEnabled,
      createdAt: new Date().toISOString(),
    }

    onSave(newTimer)
    showAlert("Timer created successfully!", 'success', () => {
      setAlertVisible(false)
      handleClose()
    })
  }

  const handleClose = () => {
    setTimerName("")
    // Reset to default times
    const defaultStart = new Date()
    defaultStart.setHours(8, 0, 0, 0) // 8:00 AM
    const defaultEnd = new Date()
    defaultEnd.setHours(17, 0, 0, 0) // 5:00 PM
    setStartTime(defaultStart)
    setEndTime(defaultEnd)
    setSelectedDays([])
    setIsEnabled(true)
    setShowStartTimePicker(false)
    setShowEndTimePicker(false)
    onClose()
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="close" onPress={handleClose} />
          <Text style={styles.headerTitle}>Add New Timer</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Timer Details</Text>
              
              <TextInput
                label="Timer Name"
                value={timerName}
                onChangeText={setTimerName}
                style={styles.input}
                mode="outlined"
                placeholder="e.g., Morning Routine, Night Light"
                left={<TextInput.Icon icon="timer-outline" />}
              />

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Enable Timer</Text>
                <Switch
                  value={isEnabled}
                  onValueChange={setIsEnabled}
                  color="#4361EE"
                />
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Time Schedule</Text>
              
              <View style={styles.timeRow}>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>Start Time</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#4361EE" />
                    <Text style={styles.timeText}>{formatTime(startTime)}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>End Time</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#4361EE" />
                    <Text style={styles.timeText}>{formatTime(endTime)}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showStartTimePicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={handleStartTimeChange}
                />
              )}

              {showEndTimePicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={handleEndTimeChange}
                />
              )}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Repeat Days</Text>
              <Text style={styles.sectionSubtitle}>Select the days when this timer should be active</Text>
              
              <View style={styles.daysContainer}>
                {days.map((day) => (
                  <Chip
                    key={day.id}
                    selected={selectedDays.includes(day.id)}
                    onPress={() => toggleDay(day.id)}
                    style={[
                      styles.dayChip,
                      selectedDays.includes(day.id) && styles.selectedDayChip,
                    ]}
                    selectedColor="#FFFFFF"
                    textStyle={[
                      styles.dayChipText,
                      selectedDays.includes(day.id) && styles.selectedDayChipText,
                    ]}
                  >
                    {day.label}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Timer Preview</Text>
              <View style={styles.previewContainer}>
                <View style={styles.previewItem}>
                  <MaterialCommunityIcons name="timer" size={20} color="#4361EE" />
                  <Text style={styles.previewText}>
                    {timerName || "Timer Name"} • {formatTime(startTime)} - {formatTime(endTime)}
                  </Text>
                </View>
                <View style={styles.previewItem}>
                  <MaterialCommunityIcons name="calendar-week" size={20} color="#4361EE" />
                  <Text style={styles.previewText}>
                    {selectedDays.length === 0
                      ? "No days selected"
                      : selectedDays
                          .map((dayId) => days.find((d) => d.id === dayId)?.label)
                          .join(", ")}
                  </Text>
                </View>
                <View style={styles.previewItem}>
                  <MaterialCommunityIcons
                    name={isEnabled ? "check-circle" : "close-circle"}
                    size={20}
                    color={isEnabled ? "#4CAF50" : "#CF6679"}
                  />
                  <Text style={[styles.previewText, { color: isEnabled ? "#4CAF50" : "#CF6679" }]}>
                    {isEnabled ? "Enabled" : "Disabled"}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={handleClose}
            style={styles.cancelButton}
            textColor="#757575"
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            buttonColor="#4361EE"
          >
            Save Timer
          </Button>
        </View>
      </View>
      </Modal>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        onDismiss={() => setAlertVisible(false)}
        {...alertConfig}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: "#212121",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  timeInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  timeLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  timeText: {
    fontSize: 16,
    color: "#212121",
    marginLeft: 8,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayChip: {
    marginRight: 8,
    marginBottom: 8,
    borderColor: "#E0E0E0",
  },
  selectedDayChip: {
    backgroundColor: "#4361EE",
    borderColor: "#4361EE",
  },
  dayChipText: {
    color: "#757575",
  },
  selectedDayChipText: {
    color: "#FFFFFF",
  },
  previewContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
  },
  previewItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: "#212121",
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    borderColor: "#E0E0E0",
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
})

export default TimerModal
