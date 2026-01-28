import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../theme/colors';

export default function StatCard({ label, value, max, gradient }) {
  const percentage = (value / max) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}/{max}</Text>
      </View>
      <View style={styles.barContainer}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${percentage}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 12,
    color: colors.textSoft,
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  barContainer: {
    height: 6,
    borderRadius: borderRadius.pill,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.pill,
  },
});