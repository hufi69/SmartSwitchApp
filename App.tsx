"use client"

import React, { useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar } from "react-native"
import { MD3LightTheme as DefaultTheme, Provider as PaperProvider } from "react-native-paper"

// Screens
import LoginScreen from "./src/screens/LoginScreen"
import SignupScreen from "./src/screens/SignupScreen"
import DeviceOnboardingScreen from "./src/screens/DeviceOnboardingScreen"
import HomeScreen from "./src/screens/HomeScreen"
import DevicesScreen from "./src/screens/DevicesScreen"
import AnalyticsScreen from "./src/screens/AnalyticsScreen"
import HistoryScreen from "./src/screens/HistoryScreen"
import ProfileScreen from "./src/screens/ProfileScreen"

// Navigation types
export type RootStackParamList = {
  Login: undefined
  Signup: undefined
  DeviceOnboarding: undefined
  Home: undefined
  Devices: undefined
  Analytics: undefined
  History: undefined
  Profile: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

// Custom theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#4361EE",
    secondary: "#3F37C9",
    accent: "#4CC9F0",
    background: "#F8F9FA",
    surface: "#FFFFFF",
    text: "#212121",
    error: "#CF6679",
    success: "#4CAF50",
    warning: "#FB8C00",
    info: "#2196F3",
  },
  roundness: 12,
}

export default function App() {
  // Auth state (would connect to Firebase in a real app)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasDevice, setHasDevice] = useState(false)

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: theme.colors.background },
            }}
          >
            {!isAuthenticated ? (
              // Auth screens
              <>
                <Stack.Screen name="Login">
                  {(props) => <LoginScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
                </Stack.Screen>
                <Stack.Screen name="Signup">
                  {(props) => <SignupScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
                </Stack.Screen>
              </>
            ) : !hasDevice ? (
              // Device onboarding
              <Stack.Screen name="DeviceOnboarding">
                {(props) => <DeviceOnboardingScreen {...props} setHasDevice={setHasDevice} />}
              </Stack.Screen>
            ) : (
              // Main app screens
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Devices" component={DevicesScreen} />
                <Stack.Screen name="Analytics" component={AnalyticsScreen} />
                <Stack.Screen name="History" component={HistoryScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  )
} 