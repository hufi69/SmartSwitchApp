import React, { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, Dimensions, StatusBar, TouchableOpacity, Alert } from "react-native"
import { Text, Card, Button, Appbar, SegmentedButtons, IconButton, Chip, List } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { BarChart, LineChart } from "react-native-chart-kit"
import { realtimeDb } from "../config/firebase"
import { ref, onValue } from "firebase/database"
import { calculateLESCOCost, formatCurrency, getTierInfo } from "../utils/lescoRates"
import CustomAlert from "../components/CustomAlert"
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import * as Clipboard from 'expo-clipboard'

const { width } = Dimensions.get("window")

const HistoryScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('daily')
  const [usageData, setUsageData] = useState([])
  const [historyData, setHistoryData] = useState({
    daily: [],
    weekly: [],
    monthly: []
  })
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isGeneratingCSV, setIsGeneratingCSV] = useState(false)
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState({})

  useEffect(() => {
    // Listen to power data for history tracking
    const powerRef = ref(realtimeDb, 'power')
    const listener = onValue(powerRef, (snapshot) => {
      const power = snapshot.val()
      if (power !== null) {
        updateUsageData(power)
      }
    })

    return () => listener()
  }, [])

  const updateUsageData = (power) => {
    const now = new Date()
    const energyInKWh = (power / 1000) * (1 / 3600) // Convert to kWh for 1 second

    setUsageData(prev => {
      const updated = [...prev, { time: now, power, energy: energyInKWh }]
      // Keep last 365 days for history
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      return updated.filter(item => item.time > oneYearAgo)
    })
  }

  // Process data for different time periods
  useEffect(() => {
    if (usageData.length > 0) {
      processHistoryData()
    }
  }, [usageData, processHistoryData])

  const processHistoryData = useCallback(() => {
    const now = new Date()
    const dailyData = []
    const weeklyData = []
    const monthlyData = []

    // Process daily data (last 30 days)
    for (let i = 29; i >= 0; i--) {
      const dayAgo = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayData = usageData.filter(item =>
        item.time.toDateString() === dayAgo.toDateString()
      )
      const totalEnergy = dayData.reduce((sum, item) => sum + item.energy, 0)
      const costData = calculateLESCOCost(totalEnergy)
      
      dailyData.push({
        date: dayAgo,
        usage: totalEnergy,
        cost: costData.totalCost,
        tier: getTierInfo(totalEnergy)
      })
    }

    // Process weekly data (last 12 weeks)
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      const weekData = usageData.filter(item =>
        item.time >= weekStart && item.time < weekEnd
      )
      const totalEnergy = weekData.reduce((sum, item) => sum + item.energy, 0)
      const costData = calculateLESCOCost(totalEnergy)
      
      weeklyData.push({
        week: `Week ${12-i}`,
        startDate: weekStart,
        usage: totalEnergy,
        cost: costData.totalCost,
        tier: getTierInfo(totalEnergy)
      })
    }

    // Process monthly data (last 12 months)
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthData = usageData.filter(item =>
        item.time >= monthStart && item.time < monthEnd
      )
      const totalEnergy = monthData.reduce((sum, item) => sum + item.energy, 0)
      const costData = calculateLESCOCost(totalEnergy)
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        startDate: monthStart,
        usage: totalEnergy,
        cost: costData.totalCost,
        tier: getTierInfo(totalEnergy)
      })
    }

    setHistoryData({ daily: dailyData, weekly: weeklyData, monthly: monthlyData })
  }, [usageData])

  const getCurrentData = () => {
    return historyData[selectedPeriod] || []
  }

  const getChartData = () => {
    const data = getCurrentData()
    
    if (selectedPeriod === 'daily') {
      return {
        labels: data.map(item => item.date.getDate().toString()).filter((_, i) => i % 5 === 0),
        datasets: [{
          data: data.map(item => item.cost).filter((_, i) => i % 5 === 0),
          color: () => "#4361EE",
          strokeWidth: 2,
        }]
      }
    } else if (selectedPeriod === 'weekly') {
      return {
        labels: data.map(item => item.week),
        datasets: [{
          data: data.map(item => item.cost),
          color: () => "#4361EE",
          strokeWidth: 2,
        }]
      }
    } else {
      return {
        labels: data.map(item => item.month),
        datasets: [{
          data: data.map(item => item.cost),
          color: () => "#4361EE",
          strokeWidth: 2,
        }]
      }
    }
  }

  const getTotalStats = () => {
    const data = getCurrentData()
    const totalUsage = data.reduce((sum, item) => sum + item.usage, 0)
    const totalCost = data.reduce((sum, item) => sum + item.cost, 0)
    const avgDailyCost = selectedPeriod === 'daily' ? totalCost / data.length : totalCost / (data.length * 7)
    
    return { totalUsage, totalCost, avgDailyCost }
  }

  const showAlert = (message, type = 'info', onConfirm) => {
    setAlertConfig({
      message,
      type,
      onConfirm: onConfirm || (() => setAlertVisible(false))
    })
    setAlertVisible(true)
  }

  const generateDetailedReport = async () => {
    if (isGeneratingPDF) {
      showAlert('A PDF is already being generated. Please wait for it to complete.', 'info')
      return
    }

    setIsGeneratingPDF(true)
    try {
      const data = getCurrentData()
      const stats = getTotalStats()
      const now = new Date()

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Smart Switch History Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .data-table { margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4361EE; color: white; }
            .total { font-weight: bold; background-color: #e8f4fd; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Smart Switch History Report</h1>
            <p>Generated: ${now.toLocaleString()}</p>
            <p>Period: ${selectedPeriod.toUpperCase()}</p>
          </div>
          
          <div class="summary">
            <h2>Summary</h2>
            <p><strong>Total Usage:</strong> ${stats.totalUsage.toFixed(3)} kWh</p>
            <p><strong>Total Cost:</strong> ${formatCurrency(stats.totalCost)}</p>
            <p><strong>Average Daily Cost:</strong> ${formatCurrency(stats.avgDailyCost)}</p>
          </div>
          
          <div class="data-table">
            <h3>Detailed ${selectedPeriod.toUpperCase()} Data</h3>
            <table>
              <tr>
                <th>Date</th>
                <th>Usage (kWh)</th>
                <th>Cost (PKR)</th>
                <th>Tier</th>
                <th>Rate (PKR/kWh)</th>
              </tr>
              ${data.map(item => `
                <tr>
                  <td>${selectedPeriod === 'daily' ? item.date.toLocaleDateString() : item.week || item.month}</td>
                  <td>${item.usage.toFixed(3)}</td>
                  <td>${formatCurrency(item.cost)}</td>
                  <td>${item.tier.tier}</td>
                  <td>${item.tier.rate}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        </body>
        </html>
      `

      const { uri } = await Print.printToFileAsync({ html })
      // Small delay to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 500))
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' })
    } catch (error) {
      console.error('Error generating report:', error)
      showAlert('Failed to generate detailed report', 'error')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const exportCSVData = async () => {
    if (isGeneratingCSV) {
      showAlert('A CSV is already being generated. Please wait for it to complete.', 'info')
      return
    }

    setIsGeneratingCSV(true)
    try {
      const data = getCurrentData()
      const stats = getTotalStats()
      const now = new Date()
      
      const csv = `Smart Switch History Report
Period: ${selectedPeriod.toUpperCase()}
Generated: ${now.toLocaleString()}

Summary
Total Usage,${stats.totalUsage.toFixed(3)} kWh
Total Cost,${formatCurrency(stats.totalCost)}
Average Daily Cost,${formatCurrency(stats.avgDailyCost)}

${selectedPeriod.toUpperCase()} Data
Date,Usage (kWh),Cost (PKR),Tier,Rate (PKR/kWh)
${data.map(item => `${selectedPeriod === 'daily' ? item.date.toLocaleDateString() : item.week || item.month},${item.usage.toFixed(3)},${formatCurrency(item.cost)},${item.tier.tier},${item.tier.rate}`).join('\n')}
`

      await Clipboard.setStringAsync(csv)
      showAlert('History data copied to clipboard! You can paste it in any app.', 'success')
    } catch (error) {
      console.error('Error exporting CSV:', error)
      showAlert('Failed to export CSV data', 'error')
    } finally {
      setIsGeneratingCSV(false)
    }
  }

  const stats = getTotalStats()
  const data = getCurrentData()

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4361EE" />

      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#FFFFFF" />
        <Appbar.Content title="Usage History" titleStyle={styles.headerTitle} />
        <IconButton icon="file-download" iconColor="#FFFFFF" onPress={generateDetailedReport} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        <View style={styles.periodSelector}>
          <SegmentedButtons
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            buttons={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Summary Stats */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryHeader}>
              <MaterialCommunityIcons name="chart-histogram" size={32} color="#4361EE" />
              <Text style={styles.summaryTitle}>{selectedPeriod.toUpperCase()} SUMMARY</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Usage</Text>
                <Text style={styles.statValue}>{stats.totalUsage.toFixed(3)} kWh</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Cost</Text>
                <Text style={styles.statValue}>{formatCurrency(stats.totalCost)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Avg Daily Cost</Text>
                <Text style={styles.statValue}>{formatCurrency(stats.avgDailyCost)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Cost Trend</Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={getChartData()}
                width={width - 60}
                height={220}
                chartConfig={{
                  backgroundColor: "#4361EE",
                  backgroundGradientFrom: "#4361EE",
                  backgroundGradientTo: "#3F37C9",
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: { borderRadius: 16 },
                }}
                style={styles.chart}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Data List */}
        <Card style={styles.dataCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Detailed Records</Text>
            {data.length > 0 ? (
              data.slice(0, 10).map((item, index) => (
                <List.Item
                  key={index}
                  title={selectedPeriod === 'daily' ? item.date.toLocaleDateString() : item.week || item.month}
                  description={`${item.usage.toFixed(3)} kWh • Tier ${item.tier.tier}`}
                  right={() => (
                    <View style={styles.listRight}>
                      <Text style={styles.costText}>{formatCurrency(item.cost)}</Text>
                      <Text style={styles.rateText}>PKR {item.tier.rate}/kWh</Text>
                    </View>
                  )}
                  left={() => (
                    <MaterialCommunityIcons 
                      name="lightning-bolt" 
                      size={24} 
                      color="#4361EE" 
                    />
                  )}
                  style={styles.listItem}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="chart-line" size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>No data available</Text>
                <Text style={styles.emptySubtext}>Start using your smart switch to see history</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Export Options */}
        <View style={styles.exportSection}>
          <Text style={styles.exportTitle}>Export Reports</Text>
          <View style={styles.exportButtons}>
            <Button
              mode="contained"
              icon="file-pdf-box"
              onPress={generateDetailedReport}
              style={styles.exportButton}
              buttonColor="#F44336"
              loading={isGeneratingPDF}
              disabled={isGeneratingPDF || isGeneratingCSV}
            >
              {isGeneratingPDF ? 'Generating...' : 'PDF Report'}
            </Button>
            <Button
              mode="contained"
              icon="file-excel"
              onPress={exportCSVData}
              style={styles.exportButton}
              buttonColor="#4CAF50"
              loading={isGeneratingCSV}
              disabled={isGeneratingPDF || isGeneratingCSV}
            >
              {isGeneratingCSV ? 'Generating...' : 'CSV Data'}
            </Button>
          </View>
        </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#4361EE",
    elevation: 4,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  periodSelector: {
    padding: 16,
  },
  segmentedButtons: {
    backgroundColor: "#FFFFFF",
  },
  summaryCard: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: "#FFFFFF",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4361EE",
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#212121",
  },
  chartContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  chart: {
    borderRadius: 16,
  },
  dataCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  listItem: {
    backgroundColor: "#FFFFFF",
  },
  listRight: {
    alignItems: "flex-end",
  },
  costText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4361EE",
  },
  rateText: {
    fontSize: 12,
    color: "#757575",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#757575",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9E9E9E",
    marginTop: 8,
    textAlign: "center",
  },
  exportSection: {
    padding: 16,
    marginBottom: 24,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 12,
  },
  exportButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exportButton: {
    flex: 1,
    marginHorizontal: 4,
  },
})

export default HistoryScreen
