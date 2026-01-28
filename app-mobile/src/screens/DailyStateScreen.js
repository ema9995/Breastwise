import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius } from '../theme/colors';

const screenWidth = Dimensions.get('window').width;

export default function DailyStateScreen({ navigation }) {
  const [energyLevel, setEnergyLevel] = useState(3);
  const [fatigueLevel, setFatigueLevel] = useState(3);
  const [moodLevel, setMoodLevel] = useState(3);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [todayState, setTodayState] = useState(null);
  const [period, setPeriod] = useState('7'); // '7', '30', '90'
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    loadTodayState();
    loadHistoryData();
  }, [period]);

  const loadTodayState = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_states')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (data && !error) {
        setTodayState(data);
        setEnergyLevel(data.energy_level);
        setFatigueLevel(data.fatigue_level);
        setMoodLevel(data.mood_level);
        setNote(data.note || '');
      }
    } catch (error) {
      console.error('Error loading today state:', error);
    }
  };

  const loadHistoryData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_states')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDateStr)
        .order('date', { ascending: true });

      if (error) throw error;
      setHistoryData(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Erreur', 'Vous devez être connectée pour sauvegarder');
        return;
      }

      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const stateData = {
        user_id: user.id,
        date: today,
        energy_level: energyLevel,
        fatigue_level: fatigueLevel,
        mood_level: moodLevel,
        note: note || null,
        updated_at: new Date().toISOString(),
      };

      if (todayState) {
        const { error } = await supabase
          .from('daily_states')
          .update(stateData)
          .eq('id', todayState.id);

        if (error) throw error;
        Alert.alert('Succès', 'Votre état du jour a été mis à jour');
      } else {
        const { error } = await supabase
          .from('daily_states')
          .insert(stateData);

        if (error) throw error;
        Alert.alert('Succès', 'Votre état du jour a été enregistré');
      }

      await loadTodayState();
      await loadHistoryData();
    } catch (error) {
      console.error('Error saving state:', error);
      Alert.alert('Erreur', error.message || 'Impossible de sauvegarder');
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (field) => {
    if (historyData.length === 0) {
      return {
        labels: ['Aucune donnée'],
        datasets: [{ data: [0] }],
      };
    }

    const labels = historyData.map((item) => {
      const date = new Date(item.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    const data = historyData.map((item) => item[field] || 0);

    return {
      labels,
      datasets: [{ data }],
    };
  };

  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(236, 72, 153, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  const LevelSelector = ({ label, value, setValue, gradient, emoji }) => (
    <View style={styles.levelContainer}>
      <View style={styles.levelHeader}>
        <Text style={styles.levelEmoji}>{emoji}</Text>
        <Text style={styles.levelLabel}>{label}</Text>
      </View>
      <View style={styles.levelsRow}>
        {[1, 2, 3, 4, 5].map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.levelButton,
              value === level && styles.levelButtonActive,
            ]}
            onPress={() => setValue(level)}
          >
            {value === level && (
              <LinearGradient
                colors={gradient}
                style={styles.levelButtonGradient}
              />
            )}
            <Text
              style={[
                styles.levelButtonText,
                value === level && styles.levelButtonTextActive,
              ]}
            >
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderChart = (title, field, gradient) => {
    const chartData = prepareChartData(field);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        {historyData.length > 0 ? (
          <LineChart
            data={chartData}
            width={screenWidth - spacing.md * 4}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withDots={true}
            withShadow={false}
            segments={4}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>
              Pas encore de données pour cette période
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[colors.bg, colors.bgSoft]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mon état du jour</Text>
          <Text style={styles.subtitle}>
            Comment te sens-tu aujourd'hui ?
          </Text>
        </View>

        <View style={styles.content}>
          <LevelSelector
            label="Énergie"
            value={energyLevel}
            setValue={setEnergyLevel}
            gradient={colors.gradientEnergy}
            emoji="⚡"
          />

          <LevelSelector
            label="Fatigue"
            value={fatigueLevel}
            setValue={setFatigueLevel}
            gradient={colors.gradientFatigue}
            emoji="😴"
          />

          <LevelSelector
            label="Humeur"
            value={moodLevel}
            setValue={setMoodLevel}
            gradient={colors.gradientMood}
            emoji="💜"
          />

          <View style={styles.noteContainer}>
            <Text style={styles.noteLabel}>Un mot sur ta journée ?</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Écris ce que tu veux..."
              placeholderTextColor={colors.textSoft}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Sauvegarde...' : 'Enregistrer mon état'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Section Graphiques */}
          <View style={styles.evolutionSection}>
            <Text style={styles.evolutionTitle}>📊 Évolution</Text>
            <Text style={styles.evolutionSubtitle}>
              Suivez votre évolution dans le temps
            </Text>

            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  period === '7' && styles.periodButtonActive,
                ]}
                onPress={() => setPeriod('7')}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    period === '7' && styles.periodButtonTextActive,
                  ]}
                >
                  7 jours
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  period === '30' && styles.periodButtonActive,
                ]}
                onPress={() => setPeriod('30')}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    period === '30' && styles.periodButtonTextActive,
                  ]}
                >
                  30 jours
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  period === '90' && styles.periodButtonActive,
                ]}
                onPress={() => setPeriod('90')}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    period === '90' && styles.periodButtonTextActive,
                  ]}
                >
                  3 mois
                </Text>
              </TouchableOpacity>
            </View>

            {renderChart('Énergie ⚡', 'energy_level', colors.gradientEnergy)}
            {renderChart('Fatigue 😴', 'fatigue_level', colors.gradientFatigue)}
            {renderChart('Humeur 💜', 'mood_level', colors.gradientMood)}
          </View>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  gradient: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSoft,
  },
  content: {
    gap: spacing.lg,
  },
  levelContainer: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  levelEmoji: {
    fontSize: 24,
  },
  levelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  levelsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  levelButton: {
    flex: 1,
    height: 50,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.cardLightBorder,
    backgroundColor: colors.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  levelButtonActive: {
    borderColor: colors.primary,
  },
  levelButtonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  levelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSoft,
    zIndex: 1,
  },
  levelButtonTextActive: {
    color: '#fff',
    zIndex: 1,
  },
  noteContainer: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  noteLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  noteInput: {
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  saveButtonGradient: {
    padding: spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  evolutionSection: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  evolutionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  evolutionSubtitle: {
    fontSize: 14,
    color: colors.textSoft,
    marginBottom: spacing.md,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  periodButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSoft,
  },
  periodButtonTextActive: {
    color: colors.primary,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  emptyChart: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    color: colors.textSoft,
    textAlign: 'center',
  },
});