"use client"

import React, { useState, useRef } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  ImageBackground,
} from "react-native"
import { TextInput, Button, Text, Snackbar, ProgressBar } from "react-native-paper"
import { useForm, Controller } from "react-hook-form"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../../App"
import { LinearGradient } from "expo-linear-gradient"
import { MaterialCommunityIcons } from "@expo/vector-icons"

type SignupScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "Signup">
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>
}

type FormData = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

const { width, height } = Dimensions.get("window")

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation, setIsAuthenticated }) => {
  const [secureTextEntry, setSecureTextEntry] = useState(true)
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [visible, setVisible] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [currentStep, setCurrentStep] = useState(1)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const password = watch("password")

  // Calculate password strength
  React.useEffect(() => {
    if (!password) {
      setPasswordStrength(0)
      return
    }

    let strength = 0

    // Length check
    if (password.length >= 8) strength += 0.25

    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 0.25

    // Contains number
    if (/[0-9]/.test(password)) strength += 0.25

    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 0.25

    setPasswordStrength(strength)
  }, [password])

  const getStrengthColor = () => {
    if (passwordStrength < 0.25) return "#CF6679"
    if (passwordStrength < 0.5) return "#FB8C00"
    if (passwordStrength < 0.75) return "#FFC107"
    return "#4CAF50"
  }

  const getStrengthText = () => {
    if (passwordStrength < 0.25) return "Weak"
    if (passwordStrength < 0.5) return "Fair"
    if (passwordStrength < 0.75) return "Good"
    return "Strong"
  }

  const onSubmit = (data: FormData) => {
    setLoading(true)
    // Mock signup - replace with actual Firebase Auth later
    setTimeout(() => {
      setLoading(false)
      // Simulate successful signup
      setIsAuthenticated(true)
    }, 1500)
  }

  return (
    <ImageBackground
      source={{ uri: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?q=80&w=2070" }}
      style={styles.backgroundImage}
      blurRadius={5}
    >
      <LinearGradient colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.8)"]} style={styles.gradient}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Animated.View
              style={[
                styles.headerContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Login")}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Sign up to control your smart devices</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.stepIndicator}>
                <View style={[styles.stepDot, currentStep >= 1 && styles.activeStepDot]} />
                <View style={styles.stepLine} />
                <View style={[styles.stepDot, currentStep >= 2 && styles.activeStepDot]} />
              </View>

              {currentStep === 1 ? (
                <>
                  <Text style={styles.stepTitle}>Personal Information</Text>

                  <Controller
                    control={control}
                    rules={{
                      required: "Full name is required",
                      minLength: {
                        value: 3,
                        message: "Name must be at least 3 characters",
                      },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        label="Full Name"
                        mode="outlined"
                        left={<TextInput.Icon icon="account" />}
                        style={styles.input}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={!!errors.fullName}
                        outlineColor="rgba(255,255,255,0.3)"
                        activeOutlineColor="#4361EE"
                        textColor="#FFFFFF"
                        theme={{ colors: { onSurfaceVariant: "#FFFFFF" } }}
                      />
                    )}
                    name="fullName"
                  />
                  {errors.fullName && <Text style={styles.errorText}>{errors.fullName.message}</Text>}

                  <Controller
                    control={control}
                    rules={{
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        label="Email"
                        mode="outlined"
                        left={<TextInput.Icon icon="email" />}
                        style={styles.input}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={!!errors.email}
                        outlineColor="rgba(255,255,255,0.3)"
                        activeOutlineColor="#4361EE"
                        textColor="#FFFFFF"
                        theme={{ colors: { onSurfaceVariant: "#FFFFFF" } }}
                      />
                    )}
                    name="email"
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

                  <Button
                    mode="contained"
                    onPress={() => setCurrentStep(2)}
                    style={styles.button}
                    buttonColor="#4361EE"
                  >
                    Continue
                  </Button>
                </>
              ) : (
                <>
                  <Text style={styles.stepTitle}>Create Password</Text>

                  <Controller
                    control={control}
                    rules={{
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        label="Password"
                        mode="outlined"
                        left={<TextInput.Icon icon="lock" />}
                        right={
                          <TextInput.Icon
                            icon={secureTextEntry ? "eye" : "eye-off"}
                            onPress={() => setSecureTextEntry(!secureTextEntry)}
                          />
                        }
                        style={styles.input}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={secureTextEntry}
                        error={!!errors.password}
                        outlineColor="rgba(255,255,255,0.3)"
                        activeOutlineColor="#4361EE"
                        textColor="#FFFFFF"
                        theme={{ colors: { onSurfaceVariant: "#FFFFFF" } }}
                      />
                    )}
                    name="password"
                  />
                  {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

                  {password && (
                    <View style={styles.strengthContainer}>
                      <ProgressBar progress={passwordStrength} color={getStrengthColor()} style={styles.strengthBar} />
                      <Text style={[styles.strengthText, { color: getStrengthColor() }]}>{getStrengthText()}</Text>
                    </View>
                  )}

                  <Controller
                    control={control}
                    rules={{
                      required: "Please confirm your password",
                      validate: (value) => value === password || "Passwords do not match",
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        label="Confirm Password"
                        mode="outlined"
                        left={<TextInput.Icon icon="lock-check" />}
                        right={
                          <TextInput.Icon
                            icon={confirmSecureTextEntry ? "eye" : "eye-off"}
                            onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
                          />
                        }
                        style={styles.input}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={confirmSecureTextEntry}
                        error={!!errors.confirmPassword}
                        outlineColor="rgba(255,255,255,0.3)"
                        activeOutlineColor="#4361EE"
                        textColor="#FFFFFF"
                        theme={{ colors: { onSurfaceVariant: "#FFFFFF" } }}
                      />
                    )}
                    name="confirmPassword"
                  />
                  {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}

                  <View style={styles.buttonRow}>
                    <Button
                      mode="outlined"
                      onPress={() => setCurrentStep(1)}
                      style={[styles.button, styles.backBtn]}
                      textColor="#FFFFFF"
                    >
                      Back
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleSubmit(onSubmit)}
                      style={[styles.button, styles.nextBtn]}
                      loading={loading}
                      disabled={loading}
                      buttonColor="#4361EE"
                    >
                      Sign Up
                    </Button>
                  </View>
                </>
              )}

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.link}>Login</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>

          <Snackbar
            visible={visible}
            onDismiss={() => setVisible(false)}
            duration={3000}
            style={styles.snackbar}
            action={{
              label: "Close",
              onPress: () => setVisible(false),
            }}
          >
            {error}
          </Snackbar>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  headerContainer: {
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  formContainer: {
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 16,
    padding: 20,
    backdropFilter: "blur(10px)",
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  activeStepDot: {
    backgroundColor: "#4361EE",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 8,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  strengthContainer: {
    marginBottom: 16,
  },
  strengthBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  strengthText: {
    fontSize: 12,
    textAlign: "right",
  },
  button: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backBtn: {
    flex: 1,
    marginRight: 8,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  nextBtn: {
    flex: 2,
    marginLeft: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  link: {
    color: "#4CC9F0",
    fontWeight: "bold",
  },
  errorText: {
    color: "#CF6679",
    marginBottom: 10,
    marginLeft: 5,
  },
  snackbar: {
    marginBottom: 20,
  },
})

export default SignupScreen
