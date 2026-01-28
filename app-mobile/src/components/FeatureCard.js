import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/colors';

export default function FeatureCard({ icon, title, subtitle, content, buttonText, buttonColor, onPress }) {
  const iconAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation de bas en haut pour l'icône
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(iconAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const iconTranslateY = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  // Mapping des icônes avec leurs couleurs unies claires
  const iconConfig = {
    'bar-chart': {
      color: '#f9a8d4', // Rose clair
      emoji: '📊',
    },
    'calendar': {
      color: '#c084fc', // Violet clair
      emoji: '📅',
    },
    'list': {
      color: '#f9a8d4', // Rose clair
      emoji: '📝',
    },
    'heart': {
      color: '#ec4899', // Rose moyen
      emoji: '💝',
    },
    'flower': {
      color: '#e9d5ff', // Violet très clair
      emoji: '🌸',
    },
  };

  const config = iconConfig[icon] || {
    color: colors.primary,
    emoji: '✨',
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.iconWrapper}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ translateY: iconTranslateY }],
              backgroundColor: config.color,
            },
          ]}
        >
          <Text style={styles.iconEmoji}>{config.emoji}</Text>
        </Animated.View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {content && (
          <View style={styles.contentBox}>
            {content}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: buttonColor || config.color },
          ]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{buttonText || 'Voir plus →'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: spacing.md,
  },
  iconWrapper: {
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSoft,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  contentBox: {
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    minHeight: 60,
    justifyContent: 'center',
  },
  button: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
