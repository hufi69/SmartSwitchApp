import type { StackNavigationProp } from "@react-navigation/stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../../App"

// Navigation prop types
export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, "Login">
export type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, "Signup">
export type DeviceOnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, "DeviceOnboarding">
export type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">

// Route prop types
export type LoginScreenRouteProp = RouteProp<RootStackParamList, "Login">
export type SignupScreenRouteProp = RouteProp<RootStackParamList, "Signup">
export type DeviceOnboardingScreenRouteProp = RouteProp<RootStackParamList, "DeviceOnboarding">
export type HomeScreenRouteProp = RouteProp<RootStackParamList, "Home">

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface SignupFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface DeviceOnboardingFormData {
  deviceId: string
}
