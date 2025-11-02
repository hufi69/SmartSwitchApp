import { Animated } from 'react-native'

/**
 * Fade in animation
 * @param {Animated.Value} value - The animated value
 * @param {number} duration - Animation duration in ms (default: 300)
 * @returns {Animated.CompositeAnimation}
 */
export const fadeIn = (value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    useNativeDriver: true,
  })
}

/**
 * Fade out animation
 * @param {Animated.Value} value - The animated value
 * @param {number} duration - Animation duration in ms (default: 300)
 * @returns {Animated.CompositeAnimation}
 */
export const fadeOut = (value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  })
}

/**
 * Pulse animation - continuously loops between min and max scale
 * @param {Animated.Value} value - The animated value
 * @param {number} min - Minimum scale (default: 0.8)
 * @param {number} max - Maximum scale (default: 1.2)
 * @param {number} duration - Animation duration in ms (default: 1000)
 * @returns {Animated.CompositeAnimation}
 */
export const pulse = (value, min = 0.8, max = 1.2, duration = 1000) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: max,
        duration: duration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: min,
        duration: duration / 2,
        useNativeDriver: true,
      }),
    ])
  )
}

/**
 * Scale in animation
 * @param {Animated.Value} value - The animated value
 * @param {number} duration - Animation duration in ms (default: 300)
 * @returns {Animated.CompositeAnimation}
 */
export const scaleIn = (value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    useNativeDriver: true,
  })
}

/**
 * Scale out animation
 * @param {Animated.Value} value - The animated value
 * @param {number} duration - Animation duration in ms (default: 300)
 * @returns {Animated.CompositeAnimation}
 */
export const scaleOut = (value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  })
}

/**
 * Slide in from bottom animation
 * @param {Animated.Value} value - The animated value
 * @param {number} distance - Slide distance (default: 100)
 * @param {number} duration - Animation duration in ms (default: 300)
 * @returns {Animated.CompositeAnimation}
 */
export const slideInUp = (value, distance = 100, duration = 300) => {
  value.setValue(distance)
  return Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  })
}

/**
 * Slide out to bottom animation
 * @param {Animated.Value} value - The animated value
 * @param {number} distance - Slide distance (default: 100)
 * @param {number} duration - Animation duration in ms (default: 300)
 * @returns {Animated.CompositeAnimation}
 */
export const slideOutDown = (value, distance = 100, duration = 300) => {
  return Animated.timing(value, {
    toValue: distance,
    duration,
    useNativeDriver: true,
  })
}

