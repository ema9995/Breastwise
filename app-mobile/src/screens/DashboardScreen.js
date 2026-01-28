import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Image,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius } from '../theme/colors';

// Imports des composants
import FeatureCard from '../components/FeatureCard';

// Citations bienveillantes pour chaque jour
const dailyMessages = [
  "Aujourd'hui, on avance à ton rythme, pas à pas.",
  "Chaque petit pas compte, même les plus petits.",
  "Tu es plus forte que tu ne le penses.",
  "Prends le temps de prendre soin de toi aujourd'hui.",
  "Il n'y a pas de bonne ou mauvaise journée, juste des jours différents.",
  "Tu mérites toute la douceur du monde.",
  "Aujourd'hui, sois douce avec toi-même.",
  "Chaque jour est une nouvelle chance de prendre soin de toi.",
  "Tu n'es pas seule dans ce parcours.",
  "Laisse-toi le temps de guérir, à ton rythme.",
  "Tu fais de ton mieux, et c'est déjà beaucoup.",
  "Aujourd'hui, célèbre chaque petite victoire.",
  "Prends soin de toi comme tu prendrais soin d'une amie.",
  "Il n'y a pas de chemin parfait, seulement ton chemin.",
  "Tu es courageuse, même quand tu ne le sens pas.",
  "Aujourd'hui, accorde-toi de la bienveillance.",
  "Chaque jour est une nouvelle page à écrire.",
  "Tu mérites de te sentir bien, aujourd'hui et toujours.",
  "Prends le temps de respirer et de t'écouter.",
  "Tu es sur le bon chemin, même si ça ne semble pas évident.",
  "Aujourd'hui, sois fière de qui tu es.",
  "Il n'y a pas de honte à prendre du temps pour soi.",
  "Tu es entourée d'amour et de soutien.",
  "Chaque jour apporte son lot de petites joies.",
  "Tu es plus résiliente que tu ne l'imagines.",
  "Aujourd'hui, écoute ton corps et ton cœur.",
  "Prends soin de toi comme une priorité, pas comme une option.",
  "Tu mérites toute la paix et le calme.",
  "Chaque étape compte, même les plus petites.",
  "Aujourd'hui, sois douce avec tes émotions.",
];

// Fonction pour obtenir le message du jour basé sur la date
const getDailyMessage = () => {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today - startOfYear;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dailyMessages[dayOfYear % dailyMessages.length];
};

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [dailyState, setDailyState] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyMessage, setDailyMessage] = useState('');
  const [lastJournalEntry, setLastJournalEntry] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [todayPlan, setTodayPlan] = useState(null);
  
  // Animations pour les emojis
  const cherryBlossomAnim = useRef(new Animated.Value(0)).current;
  const starLeftAnim = useRef(new Animated.Value(0)).current;
  const starRightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserData();
    loadTodayState();
    loadLastJournalEntry();
    loadUpcomingSessions();
    loadTodayPlan();
    setDailyMessage(getDailyMessage());
    
    // Démarrer les animations
    startAnimations();
  }, []);

  // Recharger les données quand on revient sur l'écran
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
      loadUpcomingSessions();
      loadTodayPlan();
      loadTodayState();
      loadLastJournalEntry();
    }, [])
  );

  const startAnimations = () => {
    // Animation pour le cherry blossom (🌸)
    Animated.loop(
      Animated.sequence([
        Animated.timing(cherryBlossomAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(cherryBlossomAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animation pour l'étoile de gauche (✨)
    Animated.loop(
      Animated.sequence([
        Animated.timing(starLeftAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(starLeftAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animation pour l'étoile de droite (✨)
    Animated.loop(
      Animated.sequence([
        Animated.timing(starRightAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(starRightAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Charger le prénom depuis la table users
      if (user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('first_name')
          .eq('id', user.id)
          .single();
        
        if (!error && userData?.first_name) {
          setFirstName(userData.first_name);
        } else if (user.user_metadata?.first_name) {
          setFirstName(user.user_metadata.first_name);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

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
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading daily state:', error);
      } else if (data) {
        setDailyState(data);
      }
    } catch (error) {
      console.error('Error loading daily state:', error);
    }
  };

  const loadLastJournalEntry = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading journal entry:', error);
      } else if (data) {
        setLastJournalEntry(data);
      }
    } catch (error) {
      console.error('Error loading journal entry:', error);
    }
  };

  const loadUpcomingSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('treatment_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_datetime', today.toISOString())
        .order('start_datetime', { ascending: true })
        .limit(3);

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading sessions:', error);
      } else {
        setUpcomingSessions(data || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadTodayPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Charger le plan du jour
      const { data: planData, error: planError } = await supabase
        .from('day_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (planError && planError.code !== 'PGRST116') {
        console.error('Error loading plan:', planError);
        setTodayPlan(null);
      } else if (planData) {
        // Charger les tâches du plan
        const { data: tasksData, error: tasksError } = await supabase
          .from('day_tasks')
          .select('*')
          .eq('day_plan_id', planData.id)
          .order('scheduled_time', { ascending: true });

        if (tasksError) {
          console.error('Error loading tasks:', tasksError);
          setTodayPlan({ ...planData, tasks: [] });
        } else {
          setTodayPlan({
            ...planData,
            tasks: tasksData || [],
          });
        }
      } else {
        setTodayPlan(null);
      }
    } catch (error) {
      console.error('Error loading plan:', error);
      setTodayPlan(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    await loadTodayState();
    await loadLastJournalEntry();
    await loadUpcomingSessions();
    await loadTodayPlan();
    setDailyMessage(getDailyMessage());
    setRefreshing(false);
  };

  // Transformations pour les animations
  const cherryBlossomTranslateY = cherryBlossomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const starLeftTranslateY = starLeftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const starRightTranslateY = starRightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  // Formater la date du journal
  const formatJournalDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return '';
    }
  };

  // Formater la date d'un rendez-vous
  const formatSessionDate = (dateTimeString) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Tronquer le texte du journal
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Obtenir le prochain rendez-vous
  const getNextSession = () => {
    if (upcomingSessions.length === 0) return null;
    return upcomingSessions[0];
  };

  // Obtenir le nombre de tâches complétées
  const getCompletedTasksCount = () => {
    if (!todayPlan || !todayPlan.tasks) return 0;
    return todayPlan.tasks.filter(task => task.status === 'done').length;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.gradient, { backgroundColor: colors.bg }]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.logoTitle}>BreastWise</Text>
            </View>
          </View>
        </View>

        <View style={styles.welcomeSection}>
          <View style={styles.welcomeRow}>
            <Text style={styles.welcomeText}>
              Ravie de vous revoir{firstName ? `, ${firstName}` : ''}
            </Text>
            <Animated.View
              style={[
                styles.emojiContainer,
                {
                  transform: [{ translateY: cherryBlossomTranslateY }],
                },
              ]}
            >
              <Text style={styles.emoji}>🌸</Text>
            </Animated.View>
          </View>
          
          {/* Message du jour */}
          <View style={styles.messageCard}>
            <View style={styles.messageRow}>
              <Animated.View
                style={[
                  styles.starContainer,
                  {
                    transform: [{ translateY: starLeftTranslateY }],
                  },
                ]}
              >
                <Text style={styles.starEmoji}>✨</Text>
              </Animated.View>
              <View style={styles.messageContent}>
                <Text style={styles.messageLabel}>Message du jour :</Text>
                <Text style={styles.messageQuote}>{dailyMessage}</Text>
              </View>
              <Animated.View
                style={[
                  styles.starContainer,
                  {
                    transform: [{ translateY: starRightTranslateY }],
                  },
                ]}
              >
                <Text style={styles.starEmoji}>✨</Text>
              </Animated.View>
            </View>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          {/* Carte Mon état du jour */}
          {dailyState ? (
            <View style={styles.dailyStateCard}>
              {/* Icône en haut à gauche */}
              <View style={styles.dailyStateIconContainer}>
                <View style={styles.dailyStateIconBackground}>
                  <Text style={styles.dailyStateIconEmoji}>📊</Text>
                </View>
              </View>

              {/* Titre */}
              <Text style={styles.dailyStateTitle}>Mon état du jour</Text>
              
              {/* Question */}
              <Text style={styles.dailyStateQuestion}>Comment tu te sens aujourd'hui ?</Text>

              {/* Métriques */}
              <View style={styles.metricsContainer}>
                {/* Énergie */}
                <View style={styles.metricRow}>
                  <Text style={styles.metricEmoji}>⚡</Text>
                  <Text style={styles.metricLabel}>Énergie</Text>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBarFill, styles.progressBarEnergy, { width: `${(dailyState.energy_level / 5) * 100}%` }]} />
                    <View style={[styles.progressBarEmpty, styles.progressBarEnergyEmpty]} />
                  </View>
                  <Text style={styles.metricValue}>{dailyState.energy_level}/5</Text>
                </View>

                {/* Fatigue */}
                <View style={styles.metricRow}>
                  <View style={styles.fatigueEmojiContainer}>
                    <Text style={styles.metricEmoji}>😴</Text>
                    <Text style={styles.zzzEmoji}>💤</Text>
                  </View>
                  <Text style={styles.metricLabel}>Fatigue</Text>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBarFill, styles.progressBarFatigue, { width: `${(dailyState.fatigue_level / 5) * 100}%` }]} />
                    <View style={[styles.progressBarEmpty, styles.progressBarFatigueEmpty]} />
                  </View>
                  <Text style={styles.metricValue}>{dailyState.fatigue_level}/5</Text>
                </View>

                {/* Humeur */}
                <View style={styles.metricRow}>
                  <View style={styles.moodEmojiContainer}>
                    <Text style={styles.metricEmoji}>💜</Text>
                    <Text style={styles.starEmojiSmall}>⭐</Text>
                  </View>
                  <Text style={styles.metricLabel}>Humeur</Text>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBarFill, styles.progressBarMood, { width: `${(dailyState.mood_level / 5) * 100}%` }]} />
                    <View style={[styles.progressBarEmpty, styles.progressBarMoodEmpty]} />
                  </View>
                  <Text style={styles.metricValue}>{dailyState.mood_level}/5</Text>
                </View>
              </View>

              {/* Bouton */}
              <TouchableOpacity
                style={styles.dailyStateButton}
                onPress={() => navigation.navigate('État')}
                activeOpacity={0.8}
              >
                <Text style={styles.dailyStateButtonText}>Mettre à jour mon état</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <FeatureCard
              icon="bar-chart"
              title="Mon état du jour"
              subtitle="Comment tu te sens aujourd'hui ?"
              content={
                <Text style={styles.contentText}>
                  Pas encore de données aujourd'hui
                </Text>
              }
              buttonText="Mettre à jour mon état →"
              buttonColor="#f9a8d4"
              onPress={() => navigation.navigate('État')}
            />
          )}
          
          <FeatureCard
            icon="calendar"
            title="Mon traitement"
            subtitle="Tes prochaines étapes médicales en un coup d'œil."
            content={
              getNextSession() ? (
                <View>
                  <Text style={styles.contentLabel}>PROCHAIN RENDEZ-VOUS</Text>
                  <Text style={styles.contentDate}>
                    {formatSessionDate(getNextSession().start_datetime)}
                  </Text>
                  <Text style={styles.contentText}>
                    {getNextSession().title}
                  </Text>
                  {getNextSession().location && (
                    <Text style={styles.contentLocation}>
                      📍 {getNextSession().location}
                    </Text>
                  )}
                  {upcomingSessions.length > 1 && (
                    <Text style={styles.contentMore}>
                      +{upcomingSessions.length - 1} autre{upcomingSessions.length > 2 ? 's' : ''} à venir
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.contentText}>
                  Aucun rendez-vous à venir
                </Text>
              )
            }
            buttonText="Voir mon suivi complet →"
            buttonColor="#c084fc"
            onPress={() => navigation.navigate('Traitement')}
          />
          
          <FeatureCard
            icon="list"
            title="Plan de ma journée"
            subtitle="Un petit plan adapté à ton énergie du jour."
            content={
              todayPlan && todayPlan.tasks && todayPlan.tasks.length > 0 ? (
                <View>
                  <Text style={styles.contentLabel}>PLAN D'AUJOURD'HUI</Text>
                  <Text style={styles.contentText}>
                    {getCompletedTasksCount()} / {todayPlan.tasks.length} tâches complétées
                  </Text>
                  {todayPlan.tasks.slice(0, 2).map((task, index) => (
                    <View key={index} style={styles.taskPreview}>
                      <Text style={styles.taskPreviewText}>
                        {task.status === 'done' ? '✓' : '○'} {task.title}
                      </Text>
                    </View>
                  ))}
                  {todayPlan.tasks.length > 2 && (
                    <Text style={styles.contentMore}>
                      +{todayPlan.tasks.length - 2} autre{todayPlan.tasks.length > 3 ? 's' : ''} tâche{todayPlan.tasks.length > 3 ? 's' : ''}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.contentText}>
                  Pas encore de plan pour aujourd'hui
                </Text>
              )
            }
            buttonText="Voir mon plan du jour →"
            buttonColor="#f9a8d4"
            onPress={() => navigation.navigate('Plan du jour')}
          />
          
          <FeatureCard
            icon="heart"
            title="Mon Espace Perso"
            subtitle="Un espace pour déposer ce que tu ressens."
            content={
              lastJournalEntry ? (
                <View>
                  <Text style={styles.contentLabel}>DERNIÈRE ÉCRITURE</Text>
                  <Text style={styles.contentDate}>{formatJournalDate(lastJournalEntry.created_at)}</Text>
                  <Text style={styles.contentText}>
                    {truncateText(lastJournalEntry.content)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.contentText}>
                  Aucune écriture pour le moment
                </Text>
              )
            }
            buttonText="Écrire dans mon journal →"
            buttonColor="#ec4899"
            onPress={() => navigation.navigate('Journal')}
          />
          
          <FeatureCard
            icon="flower"
            title="Prendre soin de moi"
            subtitle="Des exercices doux pour t'aider à souffler."
            content={
              <View>
                <View style={styles.suggestionHeader}>
                  <Text style={styles.suggestionLabel}>SUGGESTION DU MOMENT</Text>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>Nouveau</Text>
                  </View>
                </View>
                <Text style={styles.exerciseTitle}>Exercice de respiration</Text>
                <View style={styles.exerciseMeta}>
                  <Text style={styles.exerciseTime}>⏱️ 5 minutes</Text>
                </View>
              </View>
            }
            buttonText="Explorer les exercices →"
            buttonColor="#e9d5ff"
            onPress={() => navigation.navigate('Bien-être')}
          />
        </View>
      </View>
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
    paddingTop: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.text,
  },
  welcomeSection: {
    marginBottom: spacing.lg,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  emojiContainer: {
    marginLeft: spacing.xs,
  },
  emoji: {
    fontSize: 24,
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  starContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  starEmoji: {
    fontSize: 18,
  },
  messageContent: {
    flex: 1,
    alignItems: 'center',
  },
  messageLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  messageQuote: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.textSoft,
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  // Styles pour la carte Mon état du jour
  dailyStateCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: spacing.md,
  },
  dailyStateIconContainer: {
    marginBottom: spacing.md,
  },
  dailyStateIconBackground: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyStateIconEmoji: {
    fontSize: 28,
  },
  dailyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  dailyStateQuestion: {
    fontSize: 14,
    color: colors.textSoft,
    marginBottom: spacing.lg,
  },
  metricsContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metricLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    minWidth: 70,
  },
  metricEmoji: {
    fontSize: 20,
  },
  fatigueEmojiContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zzzEmoji: {
    position: 'absolute',
    top: -8,
    right: -4,
    fontSize: 12,
  },
  moodEmojiContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starEmojiSmall: {
    position: 'absolute',
    top: -4,
    right: -4,
    fontSize: 10,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: '#fce7f3',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarEmpty: {
    flex: 1,
    height: '100%',
    backgroundColor: '#fce7f3',
  },
  progressBarEnergy: {
    backgroundColor: '#f9a8d4',
  },
  progressBarEnergyEmpty: {
    backgroundColor: '#fce7f3',
  },
  progressBarFatigue: {
    backgroundColor: '#c084fc',
  },
  progressBarFatigueEmpty: {
    backgroundColor: '#f3e8ff',
  },
  progressBarMood: {
    backgroundColor: '#f9a8d4',
  },
  progressBarMoodEmpty: {
    backgroundColor: '#fce7f3',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    minWidth: 35,
    textAlign: 'right',
  },
  dailyStateButton: {
    backgroundColor: '#f9a8d4',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dailyStateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  contentText: {
    fontSize: 13,
    color: colors.textSoft,
    lineHeight: 18,
  },
  contentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSoft,
    marginBottom: spacing.xs / 2,
    letterSpacing: 0.5,
  },
  contentDate: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  contentLocation: {
    fontSize: 12,
    color: colors.textSoft,
    marginTop: spacing.xs,
  },
  contentMore: {
    fontSize: 11,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  taskPreview: {
    marginTop: spacing.xs,
  },
  taskPreviewText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  suggestionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSoft,
    letterSpacing: 0.5,
  },
  newBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  exerciseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  exerciseTime: {
    fontSize: 12,
    color: colors.textSoft,
  },
});