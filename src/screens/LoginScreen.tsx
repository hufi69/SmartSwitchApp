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
import { TextInput, Button, Text, Snackbar, IconButton } from "react-native-paper"
import { useForm, Controller } from "react-hook-form"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../../App"
import { LinearGradient } from "expo-linear-gradient"
import { MaterialCommunityIcons } from "@expo/vector-icons"

type LoginScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "Login">
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>
}

type FormData = {
  email: string
  password: string
}

const { width, height } = Dimensions.get("window")

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, setIsAuthenticated }) => {
  const [secureTextEntry, setSecureTextEntry] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [visible, setVisible] = useState(false)

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
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = (data: FormData) => {
    setLoading(true)
    // Mock login - replace with actual Firebase Auth later
    setTimeout(() => {
      setLoading(false)
      if (data.email === "test@example.com" && data.password === "password") {
        setIsAuthenticated(true)
      } else {
        setError("Invalid email or password")
        setVisible(true)
      }
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
                styles.logoContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.logoCircle}>
                <MaterialCommunityIcons name="lightning-bolt" size={48} color="#4361EE" />
              </View>
              <Text style={styles.title}>SmartSwitch</Text>
              <Text style={styles.subtitle}>Control your devices, anywhere</Text>
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

              <Controller
                control={control}
                rules={{
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
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

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                style={styles.button}
                loading={loading}
                disabled={loading}
                buttonColor="#4361EE"
              >
                Login
              </Button>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <IconButton
                  icon="google"
                  mode="contained"
                  size={24}
                  iconColor="#FFFFFF"
                  containerColor="#DB4437"
                  style={styles.socialButton}
                />
                <IconButton
                  icon="facebook"
                  mode="contained"
                  size={24}
                  iconColor="#FFFFFF"
                  containerColor="#4267B2"
                  style={styles.socialButton}
                />
                <IconButton
                  icon="apple"
                  mode="contained"
                  size={24}
                  iconColor="#FFFFFF"
                  containerColor="#000000"
                  style={styles.socialButton}
                />
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                  <Text style={styles.link}>Sign up</Text>
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
  input: {
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#4CC9F0",
    fontSize: 14,
  },
  button: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "rgba(255, 255, 255, 0.7)",
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  socialButton: {
    marginHorizontal: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
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

export default LoginScreen
