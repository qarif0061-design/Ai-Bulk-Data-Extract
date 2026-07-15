import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useThemeStore } from '../hooks/use-theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const Star: React.FC<{
  filled: boolean;
  onPress: () => void;
  index: number;
  activeColor: string;
  inactiveColor: string;
}> = ({ filled, onPress, index, activeColor, inactiveColor }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (filled) {
      scale.value = withSpring(1.3, { damping: 8, stiffness: 300 }, () => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      });
    }
  }, [filled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchableOpacity
      onPress={onPress}
      style={[styles.starContainer, animatedStyle]}
      activeOpacity={0.7}
      delayPressIn={0}
    >
      <Text
        style={[
          styles.star,
          { color: filled ? activeColor : inactiveColor },
        ]}
      >
        ★
      </Text>
    </AnimatedTouchableOpacity>
  );
};

const CheckmarkAnimation: React.FC<{ visible: boolean; color: string }> = ({
  visible,
  color,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.checkmarkContainer, animatedStyle]}>
      <View style={[styles.checkmarkCircle, { backgroundColor: color }]}>
        <Text style={styles.checkmarkText}>✓</Text>
      </View>
      <Text style={[styles.thankYouText, { color }]}>Thank you!</Text>
    </Animated.View>
  );
};

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { colors } = useThemeStore();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [phase, setPhase] = useState<'form' | 'thankyou' | 'hidden'>('hidden');

  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);

  const animateIn = useCallback(() => {
    backdropOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    cardScale.value = withSpring(1, { damping: 15, stiffness: 200 });
    cardOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
  }, []);

  const animateOut = useCallback(
    (callback?: () => void) => {
      backdropOpacity.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.cubic) });
      cardScale.value = withTiming(0.85, { duration: 250, easing: Easing.in(Easing.cubic) });
      cardOpacity.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.cubic) }, () => {
        if (callback) runOnJS(callback)();
      });
    },
    []
  );

  useEffect(() => {
    if (visible) {
      setPhase('form');
      setRating(0);
      setFeedback('');
      animateIn();
    } else {
      setPhase('hidden');
    }
  }, [visible, animateIn]);

  const handleStarPress = useCallback((index: number) => {
    setRating(index + 1);
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit(rating, feedback);
    setPhase('thankyou');
    setTimeout(() => {
      animateOut(() => {
        onClose();
      });
    }, 1000);
  }, [rating, feedback, onSubmit, onClose, animateOut]);

  const handleSkip = useCallback(() => {
    animateOut(() => {
      onClose();
    });
  }, [onClose, animateOut]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  if (!visible && phase === 'hidden') return null;

  const primaryColor = '#4F6BED';
  const starInactive = colors.border || '#D1D5DB';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleSkip}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleSkip}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.surface || '#FFFFFF', shadowColor: '#000' },
            cardAnimatedStyle,
          ]}
        >
          {phase === 'thankyou' ? (
            <CheckmarkAnimation visible={true} color={primaryColor} />
          ) : (
            <>
              <Text style={[styles.title, { color: colors.textPrimary || '#111827' }]}>
                Rate Your Experience
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary || '#6B7280' }]}>
                How was the data extraction?
              </Text>

              <View style={styles.starsRow}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    index={i}
                    filled={i < rating}
                    onPress={() => handleStarPress(i)}
                    activeColor={primaryColor}
                    inactiveColor={starInactive}
                  />
                ))}
              </View>

              {rating > 0 && (
                <View>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.background || '#F3F4F6',
                        color: colors.textPrimary || '#111827',
                        borderColor: colors.border || '#E5E7EB',
                      },
                    ]}
                    placeholder="Optional feedback..."
                    placeholderTextColor={colors.textSecondary || '#9CA3AF'}
                    value={feedback}
                    onChangeText={setFeedback}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: primaryColor },
                  rating === 0 && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={rating === 0}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
                <Text style={[styles.skipText, { color: colors.textSecondary || '#6B7280' }]}>
                  Skip
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 48, 380),
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  starContainer: {
    padding: 4,
  },
  star: {
    fontSize: 40,
  },
  textInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 20,
    minHeight: 80,
  },
  submitButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 4,
  },
  checkmarkContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  checkmarkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
  thankYouText: {
    fontSize: 20,
    fontWeight: '600',
  },
});

export { FeedbackModal };
export default FeedbackModal;
