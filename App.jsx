import React, { useState, useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar, ActivityIndicator, View } from "react-native"
import { MD3LightTheme as DefaultTheme, Provider as PaperProvider } from "react-native-paper"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "./src/config/firebase"
import { getSavedCredentials } from "./src/utils/storage"
import { Colors, BorderRadius } from "./src/config/theme"

// Screens
import LoginScreen from "./src/screens/LoginScreen"
import SignupScreen from "./src/screens/SignupScreen"
import DeviceOnboardingScreen from "./src/screens/DeviceOnboardingScreen"
import HomeScreen from "./src/screens/HomeScreen"
import DevicesScreen from "./src/screens/DevicesScreen"
import AnalyticsScreen from "./src/screens/AnalyticsScreen"
import HistoryScreen from "./src/screens/HistoryScreen"
import ProfileScreen from "./src/screens/ProfileScreen"
import CostTrackingScreen from "./src/screens/CostTrackingScreen"
import SafetyScreen from "./src/screens/SafetyScreen"

const Stack = createStackNavigator()

// Enhanced custom theme with modern design tokens
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    secondary: Colors.primaryDark,
    accent: Colors.accent,
    background: Colors.background,
    surface: Colors.surface,
    text: Colors.text,
    error: Colors.danger,
    success: Colors.success,
    warning: Colors.warning,
    info: Colors.info,
    onSurface: Colors.text,
    onSurfaceVariant: Colors.textSecondary,
    outline: Colors.border,
  },
  roundness: BorderRadius.md,
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasDevice, setHasDevice] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Check for saved credentials on app launch
  useEffect(() => {
    checkSavedCredentials()
  }, [])

  const checkSavedCredentials = async () => {
    try {
      const savedCredentials = await getSavedCredentials()

      if (savedCredentials) {
        // Auto-login with saved credentials
        console.log("Found saved credentials, attempting auto-login...")
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            savedCredentials.email,
            savedCredentials.password
          )
          console.log("Auto-login successful:", userCredential.user.email)
          setIsAuthenticated(true)
        } catch (error) {
          console.log("Auto-login failed:", error.message)
          // If auto-login fails, user will see login screen
        }
      }
    } catch (error) {
      console.error("Error checking saved credentials:", error)
    } finally {
      setIsCheckingAuth(false)
    }
  }

  // Show loading screen while checking auth
  if (isCheckingAuth) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA" }}>
            <ActivityIndicator size="large" color="#4361EE" />
          </View>
        </PaperProvider>
      </SafeAreaProvider>
    )
  }

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
                <Stack.Screen name="CostTracking" component={CostTrackingScreen} />
                <Stack.Screen name="Safety" component={SafetyScreen} />
                <Stack.Screen name="Profile">
                  {(props) => <ProfileScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
                </Stack.Screen>
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  )
}
