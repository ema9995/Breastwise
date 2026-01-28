import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius } from '../theme/colors';

export default function OnboardingScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState(null);
  
  // Étape 2 - État du jour
  const [energyLevel, setEnergyLevel] = useState(3);
  const [fatigueLevel, setFatigueLevel] = useState(3);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [dailyNote, setDailyNote] = useState('');
  
  // Étape 3 - Traitement
  const [treatmentStatus, setTreatmentStatus] = useState('');
  const [selectedTreatmentTypes, setSelectedTreatmentTypes] = useState([]);
  
  // Détails chimiothérapie
  const [chimioData, setChimioData] = useState({
    start_date: null,
    total_sessions: '',
    current_session: '',
    frequency: '',
    next_session: null,
    location: '',
    oncologist: '',
  });
  
  // Détails radiothérapie
  const [radioData, setRadioData] = useState({
    start_date: null,
    total_sessions: '',
    current_session: '',
    frequency: '',
    next_session: null,
    location: '',
    radiologist: '',
  });
  
  // Chirurgie
  const [surgeryData, setSurgeryData] = useState({
    status: '',
    operation_date: null,
    operation_types: [],
    location: '',
    surgeon: '',
  });
  
  // Autres rendez-vous
  const [otherAppointments, setOtherAppointments] = useState([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    type: 'consultation',
    title: '',
    datetime: null,
    with_who: '',
    location: '',
    notes: '',
  });
  
  // Équipe médicale
  const [medicalTeam, setMedicalTeam] = useState([]);
  const [showTeamMemberModal, setShowTeamMemberModal] = useState(false);
  const [newTeamMember, setNewTeamMember] = useState({
    name: '',
    specialty: '',
    location: '',
  });
  
  // Étape 4 - Plan du jour
  const [wantPlan, setWantPlan] = useState(null);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [planTasks, setPlanTasks] = useState([]);
  
  // Date pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('date');
  const [datePickerField, setDatePickerField] = useState('');

  const specialties = [
    'Oncologue',
    'Chirurgien',
    'Radiothérapeute',
    'Médecin généraliste',
    'Infirmière',
    'Psychologue',
    'Kinésithérapeute',
    'Autre',
  ];

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  // Fonction corrigée : ne fait plus de navigation manuelle
  // AppNavigator gère automatiquement la navigation via le polling
  const checkOnboardingStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();
      
      // Ne pas utiliser navigation.reset() car l'écran 'Main' n'est pas dans la pile
      // AppNavigator détecte automatiquement le changement via le polling
      // et redirige l'utilisateur vers l'écran Main
      if (data?.onboarding_completed) {
        console.log('✅ Onboarding complété - AppNavigator gérera la navigation automatiquement');
        // La navigation sera gérée automatiquement par AppNavigator
        // qui détecte le changement via le polling toutes les 2 secondes
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const moods = [
    { id: 'calme', emoji: '😌', label: 'Calme' },
    { id: 'anxieuse', emoji: '😰', label: 'Anxieuse' },
    { id: 'fatiguee', emoji: '😴', label: 'Fatiguée' },
    { id: 'motivee', emoji: '💪', label: 'Motivée' },
    { id: 'triste', emoji: '😢', label: 'Triste' },
    { id: 'sereine', emoji: '☺️', label: 'Sereine' },
    { id: 'inquiete', emoji: '😟', label: 'Inquiète' },
    { id: 'optimiste', emoji: '🌟', label: 'Optimiste' },
  ];

  const treatmentStatusOptions = [
    { id: 'none', label: 'Je n\'ai pas encore commencé de traitement' },
    { id: 'diagnostic', label: 'Je suis en cours de diagnostic' },
    { id: 'in_treatment', label: 'Je suis en cours de traitement' },
    { id: 'follow_up', label: 'Je suis en suivi post-traitement' },
    { id: 'unknown', label: 'Je préfère ne pas répondre' },
  ];

  const treatmentTypeOptions = [
    { id: 'chimio', label: 'Chimiothérapie' },
    { id: 'radio', label: 'Radiothérapie' },
    { id: 'surgery', label: 'Chirurgie (opération)' },
    { id: 'hormone', label: 'Hormonothérapie' },
    { id: 'immuno', label: 'Immunothérapie' },
    { id: 'other', label: 'Autre traitement' },
  ];

  const handleMoodToggle = (moodId) => {
    if (selectedMoods.includes(moodId)) {
      setSelectedMoods(selectedMoods.filter(id => id !== moodId));
    } else {
      setSelectedMoods([...selectedMoods, moodId]);
    }
  };

  const handleTreatmentTypeToggle = (typeId) => {
    if (selectedTreatmentTypes.includes(typeId)) {
      setSelectedTreatmentTypes(selectedTreatmentTypes.filter(id => id !== typeId));
    } else {
      setSelectedTreatmentTypes([...selectedTreatmentTypes, typeId]);
    }
  };

  const saveStep2 = async () => {
    if (!user) return;
    
    if (selectedMoods.length === 0) {
      Alert.alert('Information', 'Merci de sélectionner au moins une humeur.');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Utiliser upsert pour éviter les doublons
      const { error } = await supabase
        .from('daily_states')
        .upsert({
          user_id: user.id,
          date: today,
          energy_level: energyLevel,
          fatigue_level: fatigueLevel,
          mood_level: 3,
          note: dailyNote || null,
        }, {
          onConflict: 'user_id,date'
        });

      if (error) {
        console.error('Error saving daily state:', error);
        // Si la table n'existe pas, on continue quand même
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Table daily_states does not exist, continuing anyway');
          setCurrentStep(3);
          return;
        }
        throw error;
      }
      
      setCurrentStep(3);
    } catch (error) {
      console.error('Error saving daily state:', error);
      // Permettre de continuer même en cas d'erreur
      Alert.alert(
        'Information',
        'L\'état du jour n\'a pas pu être sauvegardé, mais tu peux continuer. Tu pourras le compléter plus tard.',
        [
          { text: 'Continuer quand même', onPress: () => setCurrentStep(3) },
          { text: 'Réessayer', onPress: saveStep2 }
        ]
      );
    }
  };

  const saveStep3 = async () => {
    if (!user) return;

    try {
      // Sauvegarder le statut de traitement si fourni
      if (treatmentStatus) {
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            first_name: user.user_metadata?.first_name || null,
            treatment_status: treatmentStatus,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id'
          });

        if (userError && userError.code !== '42P01') {
          console.warn('Could not save treatment status:', userError);
        }
      }

      // Sauvegarder les sessions de traitement
      const sessionsToInsert = [];

      if (selectedTreatmentTypes.includes('chimio') && chimioData.next_session) {
        sessionsToInsert.push({
          user_id: user.id,
          type: 'chimio',
          title: `Séance de chimiothérapie #${chimioData.current_session || 1}`,
          start_datetime: chimioData.next_session.toISOString(),
          location: chimioData.location || null,
          doctor_name: chimioData.oncologist || null,
          status: 'scheduled',
        });
      }

      if (selectedTreatmentTypes.includes('radio') && radioData.next_session) {
        sessionsToInsert.push({
          user_id: user.id,
          type: 'radio',
          title: `Séance de radiothérapie #${radioData.current_session || 1}`,
          start_datetime: radioData.next_session.toISOString(),
          location: radioData.location || null,
          doctor_name: radioData.radiologist || null,
          status: 'scheduled',
        });
      }

      if (selectedTreatmentTypes.includes('surgery') && surgeryData.operation_date) {
        sessionsToInsert.push({
          user_id: user.id,
          type: 'surgery',
          title: 'Opération',
          start_datetime: surgeryData.operation_date.toISOString(),
          location: surgeryData.location || null,
          doctor_name: surgeryData.surgeon || null,
          status: surgeryData.status === 'done' ? 'completed' : 'scheduled',
        });
      }

      // Ajouter les autres rendez-vous
      for (const appointment of otherAppointments) {
        if (appointment.datetime) {
          sessionsToInsert.push({
            user_id: user.id,
            type: appointment.type,
            title: appointment.title,
            start_datetime: appointment.datetime.toISOString(),
            location: appointment.location || null,
            doctor_name: appointment.with_who || null,
            notes: appointment.notes || null,
            status: 'scheduled',
          });
        }
      }

      // Insérer toutes les sessions en une seule fois
      if (sessionsToInsert.length > 0) {
        const { error: sessionsError } = await supabase
          .from('treatment_sessions')
          .insert(sessionsToInsert);

        if (sessionsError) {
          console.warn('Could not save treatment sessions:', sessionsError);
          // On continue quand même
        }
      }

      // Toujours passer à l'étape suivante
      setCurrentStep(4);
    } catch (error) {
      console.error('Error saving treatment data:', error);
      // Permettre de continuer même en cas d'erreur
      Alert.alert(
        'Information',
        'Certaines informations n\'ont pas pu être sauvegardées, mais tu peux continuer. Tu pourras les compléter plus tard.',
        [
          { text: 'Continuer quand même', onPress: () => setCurrentStep(4) },
          { text: 'Réessayer', onPress: saveStep3 }
        ]
      );
    }
  };

  const generatePlan = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: dailyState } = await supabase
        .from('daily_states')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      const { data: todaySessions } = await supabase
        .from('treatment_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_datetime', `${today}T00:00:00`)
        .lt('start_datetime', `${today}T23:59:59`);

      const tasks = [];
      
      if (dailyState) {
        const energy = dailyState.energy_level;
        const fatigue = dailyState.fatigue_level;

        if (energy <= 2 || fatigue >= 4) {
          tasks.push({
            title: 'Faire une sieste de 20-30 minutes',
            category: 'repos',
            priority: 'high',
          });
          tasks.push({
            title: 'Faire un exercice de respiration douce',
            category: 'bien-être',
            priority: 'high',
          });
        } else if (energy >= 4 && fatigue <= 2) {
          tasks.push({
            title: 'Noter les questions pour ton prochain rendez-vous',
            category: 'médical',
            priority: 'medium',
          });
          tasks.push({
            title: 'Faire un exercice de respiration',
            category: 'bien-être',
            priority: 'medium',
          });
          tasks.push({
            title: 'Appeler une personne qui te fait du bien',
            category: 'quotidien',
            priority: 'low',
          });
        } else {
          tasks.push({
            title: 'Faire un exercice de respiration',
            category: 'bien-être',
            priority: 'medium',
          });
          tasks.push({
            title: 'Écrire quelques lignes dans ton journal',
            category: 'bien-être',
            priority: 'low',
          });
        }
      }

      if (todaySessions && todaySessions.length > 0) {
        tasks.unshift({
          title: 'Préparer mon rendez-vous (questions, documents)',
          category: 'médical',
          priority: 'high',
        });
        tasks.push({
          title: 'Temps de récupération après le rendez-vous',
          category: 'repos',
          priority: 'high',
        });
      }

      setPlanTasks(tasks);
      setGeneratedPlan(true);
    } catch (error) {
      console.error('Error generating plan:', error);
      Alert.alert('Erreur', 'Impossible de générer le plan. Réessaie plus tard.');
    }
  };

  const savePlan = async () => {
    if (!user || planTasks.length === 0) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Vérifier si un plan existe déjà pour aujourd'hui
      const { data: existingPlan } = await supabase
        .from('day_plans')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      let planId;
      
      if (existingPlan) {
        // Utiliser le plan existant
        planId = existingPlan.id;
      } else {
        // Créer un nouveau plan
        const { data: planData, error: planError } = await supabase
          .from('day_plans')
          .insert({
            user_id: user.id,
            date: today,
          })
          .select()
          .single();

        if (planError) {
          console.error('Error creating plan:', planError);
          throw planError;
        }
        
        planId = planData.id;
      }

      // Préparer les tâches avec user_id inclus
      const tasksToInsert = planTasks.map(task => ({
        day_plan_id: planId,
        user_id: user.id, // Ajouter user_id ici
        title: task.title,
        category: task.category,
        priority: task.priority,
        status: 'pending',
      }));

      const { error: tasksError } = await supabase
        .from('day_tasks')
        .insert(tasksToInsert);

      if (tasksError) {
        console.error('Error inserting tasks:', tasksError);
        throw tasksError;
      }

      completeOnboarding();
    } catch (error) {
      console.error('Error saving plan:', error);
      Alert.alert(
        'Erreur', 
        `Impossible de sauvegarder le plan. ${error.message || 'Réessaie plus tard.'}`
      );
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    
    try {
      // Utiliser upsert pour créer ou mettre à jour l'enregistrement
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error completing onboarding:', error);
        // Si la table n'existe pas, on continue quand même
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Table users does not exist, continuing anyway');
          Alert.alert(
            'Information',
            'L\'onboarding est terminé. L\'application va se recharger automatiquement.',
            [{ text: 'OK' }]
          );
          return;
        }
        throw error;
      }
      
      // Afficher un message de succès
      Alert.alert(
        'Félicitations ! 🌸',
        'Ton onboarding est terminé. Tu vas être redirigée vers ton tableau de bord.',
        [{ text: 'OK' }]
      );
      
      // Ne pas naviguer manuellement - AppNavigator détectera automatiquement
      // le changement via le polling et redirigera l'utilisateur
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert(
        'Information',
        'L\'onboarding est terminé. L\'application va se recharger automatiquement.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderStepIndicator = () => {
    const steps = [1, 2, 3, 4];
    return (
      <View style={styles.stepIndicator}>
        <View style={styles.stepIndicatorRow}>
          {steps.map((step) => (
            <React.Fragment key={step}>
              <View
                style={[
                  styles.stepCircle,
                  step < currentStep && styles.stepCompleted,
                  step === currentStep && styles.stepCurrent,
                ]}
              >
                {step < currentStep ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <Text style={styles.stepNumber}>{step}</Text>
                )}
              </View>
              {step < steps.length && (
                <View
                  style={[
                    styles.stepLine,
                    step < currentStep && styles.stepLineCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.stepText}>Étape {currentStep} sur 4</Text>
      </View>
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>
        Bienvenue, {user?.user_metadata?.first_name || user?.email?.split('@')[0] || ''} ! 🌸
      </Text>
      <Text style={styles.stepDescription}>
        On va faire connaissance en quelques questions simples. Tu peux passer certaines étapes si tu préfères les compléter plus tard dans ton espace.
      </Text>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setCurrentStep(2)}
      >
        <LinearGradient
          colors={['#f9a8d4', '#ec4899']}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Commencer</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Bouton pour revenir à l'inscription */}
      <TouchableOpacity
        style={styles.backToSignupButton}
        onPress={async () => {
          Alert.alert(
            'Quitter l\'onboarding',
            'Souhaites-tu quitter l\'onboarding et revenir à la page de connexion ? Tu pourras compléter l\'onboarding plus tard.',
            [
              {
                text: 'Annuler',
                style: 'cancel',
              },
              {
                text: 'Quitter',
                style: 'destructive',
                onPress: async () => {
                  try {
                    // Se déconnecter pour revenir à la page de connexion
                    await supabase.auth.signOut();
                  } catch (error) {
                    console.error('Error signing out:', error);
                  }
                },
              },
            ]
          );
        }}
      >
        <Text style={styles.backToSignupText}>
          Revenir à la page de connexion
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Comment te sens-tu aujourd'hui ?</Text>
      <Text style={styles.stepDescription}>
        Cette information nous aide à mieux t'accompagner. C'est la seule étape obligatoire.
      </Text>

      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>
          Sur une échelle de 1 à 5, comment évalues-tu ton niveau d'énergie aujourd'hui ?
        </Text>
        <View style={styles.sliderButtons}>
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.sliderButton,
                energyLevel === value && styles.sliderButtonActive,
              ]}
              onPress={() => setEnergyLevel(value)}
            >
              <Text style={[
                styles.sliderButtonText,
                energyLevel === value && styles.sliderButtonTextActive,
              ]}>
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sliderValue}>
          {energyLevel === 1 && 'Très faible'}
          {energyLevel === 2 && 'Faible'}
          {energyLevel === 3 && 'Moyen'}
          {energyLevel === 4 && 'Bon'}
          {energyLevel === 5 && 'Très bonne'}
        </Text>
      </View>

      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Et ton niveau de fatigue ?</Text>
        <View style={styles.sliderButtons}>
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.sliderButton,
                fatigueLevel === value && styles.sliderButtonActive,
              ]}
              onPress={() => setFatigueLevel(value)}
            >
              <Text style={[
                styles.sliderButtonText,
                fatigueLevel === value && styles.sliderButtonTextActive,
              ]}>
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sliderValue}>
          {fatigueLevel === 1 && 'Pas fatiguée'}
          {fatigueLevel === 2 && 'Légèrement fatiguée'}
          {fatigueLevel === 3 && 'Modérément fatiguée'}
          {fatigueLevel === 4 && 'Très fatiguée'}
          {fatigueLevel === 5 && 'Extrêmement fatiguée'}
        </Text>
      </View>

      <View style={styles.moodContainer}>
        <Text style={styles.sliderLabel}>
          Comment te sens-tu émotionnellement ? (tu peux en sélectionner plusieurs)
        </Text>
        <View style={styles.moodGrid}>
          {moods.map((mood) => (
            <TouchableOpacity
              key={mood.id}
              style={[
                styles.moodButton,
                selectedMoods.includes(mood.id) && styles.moodButtonActive,
              ]}
              onPress={() => handleMoodToggle(mood.id)}
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={[
                styles.moodLabel,
                selectedMoods.includes(mood.id) && styles.moodLabelActive,
              ]}>
                {mood.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.noteContainer}>
        <Text style={styles.noteLabel}>Un mot sur ta journée ? (optionnel)</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Comment s'est passée ta journée ?"
          placeholderTextColor={colors.textSoft}
          value={dailyNote}
          onChangeText={setDailyNote}
          multiline
          maxLength={500}
          numberOfLines={4}
        />
        <Text style={styles.noteCounter}>{dailyNote.length}/500</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setCurrentStep(1)}
        >
          <Text style={styles.secondaryButtonText}>Précédent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, selectedMoods.length === 0 && styles.buttonDisabled]}
          onPress={saveStep2}
          disabled={selectedMoods.length === 0}
        >
          <LinearGradient
            colors={['#f9a8d4', '#ec4899']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continuer</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Parle-moi de ton parcours médical</Text>
      <Text style={styles.stepDescription}>
        Ces informations nous aideront à mieux t'accompagner. Tu peux passer cette étape et compléter plus tard si tu préfères.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Où en es-tu dans ton parcours ?</Text>
        <View style={styles.optionsList}>
          {treatmentStatusOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                treatmentStatus === option.id && styles.optionButtonActive,
              ]}
              onPress={() => setTreatmentStatus(option.id)}
            >
              <Text style={[
                styles.optionButtonText,
                treatmentStatus === option.id && styles.optionButtonTextActive,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {treatmentStatus === 'in_treatment' && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quels types de traitement fais-tu actuellement ?</Text>
            <View style={styles.optionsList}>
              {treatmentTypeOptions.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.checkboxOption,
                    selectedTreatmentTypes.includes(type.id) && styles.checkboxOptionActive,
                  ]}
                  onPress={() => handleTreatmentTypeToggle(type.id)}
                >
                  <Ionicons
                    name={selectedTreatmentTypes.includes(type.id) ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={selectedTreatmentTypes.includes(type.id) ? colors.primary : colors.textSoft}
                  />
                  <Text style={[
                    styles.checkboxOptionText,
                    selectedTreatmentTypes.includes(type.id) && styles.checkboxOptionTextActive,
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {selectedTreatmentTypes.includes('chimio') && (
            <View style={styles.treatmentDetailsContainer}>
              <Text style={styles.subtitle}>Détails sur ta chimiothérapie</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date de début</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setDatePickerField('chimio_start');
                    setDatePickerMode('date');
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.dateButtonText}>
                    {chimioData.start_date
                      ? chimioData.start_date.toLocaleDateString('fr-FR')
                      : 'Sélectionner une date'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre total de séances prévues</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 6"
                  keyboardType="numeric"
                  value={chimioData.total_sessions}
                  onChangeText={(text) => setChimioData({ ...chimioData, total_sessions: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>À quelle séance es-tu ?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 3"
                  keyboardType="numeric"
                  value={chimioData.current_session}
                  onChangeText={(text) => setChimioData({ ...chimioData, current_session: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fréquence</Text>
                <View style={styles.optionsList}>
                  {['Hebdomadaire', 'Toutes les 2 semaines', 'Toutes les 3 semaines', 'Autre'].map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.optionButton,
                        chimioData.frequency === freq && styles.optionButtonActive,
                      ]}
                      onPress={() => setChimioData({ ...chimioData, frequency: freq })}
                    >
                      <Text style={[
                        styles.optionButtonText,
                        chimioData.frequency === freq && styles.optionButtonTextActive,
                      ]}>
                        {freq}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Prochaine séance</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setDatePickerField('chimio_next');
                    setDatePickerMode('datetime');
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.dateButtonText}>
                    {chimioData.next_session
                      ? chimioData.next_session.toLocaleString('fr-FR')
                      : 'Sélectionner date et heure'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Lieu</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nom du centre ou de l'hôpital"
                  value={chimioData.location}
                  onChangeText={(text) => setChimioData({ ...chimioData, location: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Oncologue (optionnel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Dr. [Nom]"
                  value={chimioData.oncologist}
                  onChangeText={(text) => setChimioData({ ...chimioData, oncologist: text })}
                />
              </View>
            </View>
          )}

          {selectedTreatmentTypes.includes('radio') && (
            <View style={styles.treatmentDetailsContainer}>
              <Text style={styles.subtitle}>Détails sur ta radiothérapie</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date de début</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setDatePickerField('radio_start');
                    setDatePickerMode('date');
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.dateButtonText}>
                    {radioData.start_date
                      ? radioData.start_date.toLocaleDateString('fr-FR')
                      : 'Sélectionner une date'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre total de séances prévues</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 25"
                  keyboardType="numeric"
                  value={radioData.total_sessions}
                  onChangeText={(text) => setRadioData({ ...radioData, total_sessions: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>À quelle séance es-tu ?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 10"
                  keyboardType="numeric"
                  value={radioData.current_session}
                  onChangeText={(text) => setRadioData({ ...radioData, current_session: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fréquence</Text>
                <View style={styles.optionsList}>
                  {['Quotidienne (du lundi au vendredi)', 'Autre'].map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.optionButton,
                        radioData.frequency === freq && styles.optionButtonActive,
                      ]}
                      onPress={() => setRadioData({ ...radioData, frequency: freq })}
                    >
                      <Text style={[
                        styles.optionButtonText,
                        radioData.frequency === freq && styles.optionButtonTextActive,
                      ]}>
                        {freq}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Prochaine séance</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setDatePickerField('radio_next');
                    setDatePickerMode('datetime');
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.dateButtonText}>
                    {radioData.next_session
                      ? radioData.next_session.toLocaleString('fr-FR')
                      : 'Sélectionner date et heure'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Lieu</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nom du centre ou de l'hôpital"
                  value={radioData.location}
                  onChangeText={(text) => setRadioData({ ...radioData, location: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Radiothérapeute (optionnel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Dr. [Nom]"
                  value={radioData.radiologist}
                  onChangeText={(text) => setRadioData({ ...radioData, radiologist: text })}
                />
              </View>
            </View>
          )}

          {selectedTreatmentTypes.includes('surgery') && (
            <View style={styles.treatmentDetailsContainer}>
              <Text style={styles.subtitle}>Informations sur ta chirurgie</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>As-tu déjà eu une opération ?</Text>
                <View style={styles.optionsList}>
                  {[
                    { id: 'done', label: 'Oui, j\'ai déjà été opérée' },
                    { id: 'planned', label: 'Non, mais une opération est prévue' },
                    { id: 'unknown', label: 'Je ne sais pas encore' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionButton,
                        surgeryData.status === option.id && styles.optionButtonActive,
                      ]}
                      onPress={() => setSurgeryData({ ...surgeryData, status: option.id })}
                    >
                      <Text style={[
                        styles.optionButtonText,
                        surgeryData.status === option.id && styles.optionButtonTextActive,
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {(surgeryData.status === 'done' || surgeryData.status === 'planned') && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Type d'opération</Text>
                    <View style={styles.optionsList}>
                      {[
                        'Tumorectomie',
                        'Mastectomie partielle',
                        'Mastectomie totale',
                        'Reconstruction mammaire',
                        'Autre',
                      ].map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.checkboxOption,
                            surgeryData.operation_types.includes(type) && styles.checkboxOptionActive,
                          ]}
                          onPress={() => {
                            if (surgeryData.operation_types.includes(type)) {
                              setSurgeryData({
                                ...surgeryData,
                                operation_types: surgeryData.operation_types.filter(t => t !== type),
                              });
                            } else {
                              setSurgeryData({
                                ...surgeryData,
                                operation_types: [...surgeryData.operation_types, type],
                              });
                            }
                          }}
                        >
                          <Ionicons
                            name={surgeryData.operation_types.includes(type) ? 'checkbox' : 'square-outline'}
                            size={20}
                            color={surgeryData.operation_types.includes(type) ? colors.primary : colors.textSoft}
                          />
                          <Text style={[
                            styles.checkboxOptionText,
                            surgeryData.operation_types.includes(type) && styles.checkboxOptionTextActive,
                          ]}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {surgeryData.status === 'planned' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Date de l'opération</Text>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => {
                          setDatePickerField('surgery_date');
                          setDatePickerMode('date');
                          setShowDatePicker(true);
                        }}
                      >
                        <Text style={styles.dateButtonText}>
                          {surgeryData.operation_date
                            ? surgeryData.operation_date.toLocaleDateString('fr-FR')
                            : 'Sélectionner une date'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Lieu</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nom du centre ou de l'hôpital"
                      value={surgeryData.location}
                      onChangeText={(text) => setSurgeryData({ ...surgeryData, location: text })}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Chirurgien (optionnel)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Dr. [Nom]"
                      value={surgeryData.surgeon}
                      onChangeText={(text) => setSurgeryData({ ...surgeryData, surgeon: text })}
                    />
                  </View>
                </>
              )}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>As-tu d'autres rendez-vous médicaux à venir ?</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setNewAppointment({
                  type: 'consultation',
                  title: '',
                  datetime: null,
                  with_who: '',
                  location: '',
                  notes: '',
                });
                setShowAppointmentModal(true);
              }}
            >
              <LinearGradient
                colors={['#f9a8d4', '#ec4899']}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Ajouter un rendez-vous</Text>
              </LinearGradient>
            </TouchableOpacity>

            {otherAppointments.length > 0 && (
              <View style={styles.appointmentsList}>
                {otherAppointments.map((apt, index) => (
                  <View key={index} style={styles.appointmentItem}>
                    <Text style={styles.appointmentItemText}>
                      {apt.title} - {apt.datetime ? apt.datetime.toLocaleString('fr-FR') : 'Date non définie'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setOtherAppointments(otherAppointments.filter((_, i) => i !== index));
                      }}
                    >
                      <Ionicons name="close-circle" size={24} color={colors.textSoft} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Veux-tu enregistrer les membres de ton équipe médicale ?</Text>
            <Text style={styles.helpText}>C'est optionnel, tu pourras les ajouter plus tard si tu préfères.</Text>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setNewTeamMember({ name: '', specialty: '', location: '' });
                setShowTeamMemberModal(true);
              }}
            >
              <LinearGradient
                colors={['#f9a8d4', '#ec4899']}
                style={styles.addButtonGradient}
              >
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Ajouter un professionnel</Text>
              </LinearGradient>
            </TouchableOpacity>

            {medicalTeam.length > 0 && (
              <View style={styles.teamList}>
                {medicalTeam.map((member, index) => (
                  <View key={index} style={styles.teamMemberItem}>
                    <Text style={styles.teamMemberText}>
                      {member.name} - {member.specialty}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setMedicalTeam(medicalTeam.filter((_, i) => i !== index));
                      }}
                    >
                      <Ionicons name="close-circle" size={24} color={colors.textSoft} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setCurrentStep(2)}
        >
          <Text style={styles.secondaryButtonText}>Précédent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={saveStep3}
        >
          <LinearGradient
            colors={['#f9a8d4', '#ec4899']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continuer</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => setCurrentStep(4)}
        >
          <Text style={styles.skipButtonText}>Passer cette étape</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Veux-tu qu'on te propose un plan pour aujourd'hui ?</Text>
      <Text style={styles.stepDescription}>
        Basé sur ton état du jour et tes rendez-vous, on peut te suggérer un plan adapté. Tu peux aussi le faire plus tard.
      </Text>

      <View style={styles.inputGroup}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            wantPlan === true && styles.optionButtonActive,
          ]}
          onPress={() => {
            setWantPlan(true);
            generatePlan();
          }}
        >
          <Text style={[
            styles.optionButtonText,
            wantPlan === true && styles.optionButtonTextActive,
          ]}>
            Oui, génère-moi un plan pour aujourd'hui
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            wantPlan === false && styles.optionButtonActive,
          ]}
          onPress={() => {
            setWantPlan(false);
            setGeneratedPlan(false);
          }}
        >
          <Text style={[
            styles.optionButtonText,
            wantPlan === false && styles.optionButtonTextActive,
          ]}>
            Non, je préfère le faire plus tard
          </Text>
        </TouchableOpacity>
      </View>

      {generatedPlan && planTasks.length > 0 && (
        <View style={styles.planContainer}>
          <Text style={styles.subtitle}>Voici ton plan pour aujourd'hui</Text>
          
          {planTasks.map((task, index) => (
            <View key={index} style={styles.taskItem}>
              <View style={styles.taskCheckbox}>
                <Ionicons name="square-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskCategory}>{task.category}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addTaskButton}
            onPress={() => {
              const newTask = {
                title: 'Nouvelle tâche',
                category: 'quotidien',
                priority: 'medium',
              };
              setPlanTasks([...planTasks, newTask]);
            }}
          >
            <Text style={styles.addTaskButtonText}>+ Ajouter une tâche personnalisée</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setCurrentStep(3)}
        >
          <Text style={styles.secondaryButtonText}>Précédent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            if (generatedPlan && planTasks.length > 0) {
              savePlan();
            } else {
              completeOnboarding();
            }
          }}
        >
          <LinearGradient
            colors={['#f9a8d4', '#ec4899']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {generatedPlan ? 'Valider ce plan' : 'Finaliser'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        {!generatedPlan && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={completeOnboarding}
          >
            <Text style={styles.skipButtonText}>Passer cette étape</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFinalStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>C'est tout ! Ton espace est prêt 🌸</Text>
      <Text style={styles.stepDescription}>
        Bravo, tu as complété ton onboarding ! Ton espace est maintenant personnalisé pour t'accompagner au mieux.
      </Text>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          <Text style={styles.summaryText}>État du jour enregistré</Text>
        </View>
        {treatmentStatus && (
          <View style={styles.summaryItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.summaryText}>Informations de traitement enregistrées</Text>
          </View>
        )}
        {generatedPlan && (
          <View style={styles.summaryItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.summaryText}>Plan du jour créé</Text>
          </View>
        )}
      </View>

      <Text style={styles.reassuringText}>
        Tu peux modifier ou compléter ces informations à tout moment depuis ton tableau de bord.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={completeOnboarding}
      >
        <LinearGradient
          colors={['#f9a8d4', '#ec4899']}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Accéder à mon tableau de bord</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      // Vérifier que event existe avant d'accéder à event.type
      if (event && event.type === 'dismissed') return;
    }
    
    if (date) {
      switch (datePickerField) {
        case 'chimio_start':
          setChimioData({ ...chimioData, start_date: date });
          break;
        case 'chimio_next':
          setChimioData({ ...chimioData, next_session: date });
          break;
        case 'radio_start':
          setRadioData({ ...radioData, start_date: date });
          break;
        case 'radio_next':
          setRadioData({ ...radioData, next_session: date });
          break;
        case 'surgery_date':
          setSurgeryData({ ...surgeryData, operation_date: date });
          break;
        case 'appointment_datetime':
          setNewAppointment({ ...newAppointment, datetime: date });
          break;
        }
    }
    
    if (Platform.OS === 'ios') {
      setShowDatePicker(false);
    }
  };

  const addAppointment = () => {
    if (!newAppointment.title || !newAppointment.datetime) {
      Alert.alert('Information', 'Merci de renseigner le titre et la date du rendez-vous.');
      return;
    }
    setOtherAppointments([...otherAppointments, { ...newAppointment }]);
    setNewAppointment({
      type: 'consultation',
      title: '',
      datetime: null,
      with_who: '',
      location: '',
      notes: '',
    });
    setShowAppointmentModal(false);
  };

  const addTeamMember = () => {
    if (!newTeamMember.name || !newTeamMember.specialty) {
      Alert.alert('Information', 'Merci de renseigner le nom et la spécialité.');
      return;
    }
    setMedicalTeam([...medicalTeam, { ...newTeamMember }]);
    setNewTeamMember({ name: '', specialty: '', location: '' });
    setShowTeamMemberModal(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient
        colors={['#fce7f3', '#fdf2f8']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepIndicator()}
          
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderFinalStep()}
        </ScrollView>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={
              datePickerField.includes('chimio')
                ? (datePickerField.includes('next') ? chimioData.next_session || new Date() : chimioData.start_date || new Date())
                : datePickerField.includes('radio')
                ? (datePickerField.includes('next') ? radioData.next_session || new Date() : radioData.start_date || new Date())
                : datePickerField === 'surgery_date'
                ? surgeryData.operation_date || new Date()
                : datePickerField === 'appointment_datetime'
                ? newAppointment.datetime || new Date()
                : new Date()
            }
            mode={datePickerMode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            locale="fr-FR"
          />
        )}

        {/* Modal Ajouter rendez-vous */}
        <Modal
          visible={showAppointmentModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAppointmentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajouter un rendez-vous</Text>
                <TouchableOpacity onPress={() => setShowAppointmentModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Type</Text>
                  <View style={styles.optionsList}>
                    {['Consultation', 'Examen', 'Autre rendez-vous médical'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.optionButton,
                          newAppointment.type === type.toLowerCase().replace(' ', '-') && styles.optionButtonActive,
                        ]}
                        onPress={() => setNewAppointment({ ...newAppointment, type: type.toLowerCase().replace(' ', '-') })}
                      >
                        <Text style={[
                          styles.optionButtonText,
                          newAppointment.type === type.toLowerCase().replace(' ', '-') && styles.optionButtonTextActive,
                        ]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Titre *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Consultation avec Dr. Martin"
                    value={newAppointment.title}
                    onChangeText={(text) => setNewAppointment({ ...newAppointment, title: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Date et heure *</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      setDatePickerField('appointment_datetime');
                      setDatePickerMode('datetime');
                      setShowDatePicker(true);
                    }}
                  >
                    <Text style={styles.dateButtonText}>
                      {newAppointment.datetime
                        ? newAppointment.datetime.toLocaleString('fr-FR')
                        : 'Sélectionner date et heure'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Avec qui (optionnel)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nom du médecin ou professionnel"
                    value={newAppointment.with_who}
                    onChangeText={(text) => setNewAppointment({ ...newAppointment, with_who: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Lieu (optionnel)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nom du centre ou de l'hôpital"
                    value={newAppointment.location}
                    onChangeText={(text) => setNewAppointment({ ...newAppointment, location: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Notes (optionnel)</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Notes personnelles sur ce rendez-vous"
                    value={newAppointment.notes}
                    onChangeText={(text) => setNewAppointment({ ...newAppointment, notes: text })}
                    multiline
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setShowAppointmentModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveButton}
                    onPress={addAppointment}
                  >
                    <LinearGradient
                      colors={['#f9a8d4', '#ec4899']}
                      style={styles.modalSaveButtonGradient}
                    >
                      <Text style={styles.modalSaveButtonText}>Ajouter ce rendez-vous</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal Ajouter membre équipe */}
        <Modal
          visible={showTeamMemberModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTeamMemberModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajouter un professionnel</Text>
                <TouchableOpacity onPress={() => setShowTeamMemberModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nom *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Dr. [Nom]"
                    value={newTeamMember.name}
                    onChangeText={(text) => setNewTeamMember({ ...newTeamMember, name: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Spécialité *</Text>
                  <View style={styles.optionsList}>
                    {specialties.map((spec) => (
                      <TouchableOpacity
                        key={spec}
                        style={[
                          styles.optionButton,
                          newTeamMember.specialty === spec && styles.optionButtonActive,
                        ]}
                        onPress={() => setNewTeamMember({ ...newTeamMember, specialty: spec })}
                      >
                        <Text style={[
                          styles.optionButtonText,
                          newTeamMember.specialty === spec && styles.optionButtonTextActive,
                        ]}>
                          {spec}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Lieu de consultation (optionnel)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nom du centre ou de l'hôpital"
                    value={newTeamMember.location}
                    onChangeText={(text) => setNewTeamMember({ ...newTeamMember, location: text })}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setShowTeamMemberModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveButton}
                    onPress={addTeamMember}
                  >
                    <LinearGradient
                      colors={['#f9a8d4', '#ec4899']}
                      style={styles.modalSaveButtonGradient}
                    >
                      <Text style={styles.modalSaveButtonText}>Ajouter ce professionnel</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  stepIndicator: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.textSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCompleted: {
    backgroundColor: colors.primary,
  },
  stepCurrent: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#f9a8d4',
  },
  stepNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.textSoft,
    marginHorizontal: spacing.xs,
  },
  stepLineCompleted: {
    backgroundColor: colors.primary,
  },
  stepText: {
    fontSize: 12,
    color: colors.textSoft,
    fontWeight: '600',
  },
  stepContent: {
    paddingBottom: spacing.md,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 15,
    color: colors.textSoft,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  helpText: {
    fontSize: 13,
    color: colors.textSoft,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  treatmentDetailsContainer: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
  },
  optionsList: {
    gap: spacing.xs,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
  },
  optionButtonActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  optionButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  optionButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    gap: spacing.xs,
  },
  checkboxOptionActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  checkboxOptionText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  checkboxOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    fontSize: 15,
    color: colors.text,
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonText: {
    fontSize: 15,
    color: colors.text,
  },
  sliderContainer: {
    marginBottom: spacing.md,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sliderButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    alignItems: 'center',
  },
  sliderButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sliderButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sliderButtonTextActive: {
    color: '#fff',
  },
  sliderValue: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  moodContainer: {
    marginBottom: spacing.md,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  moodButton: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    alignItems: 'center',
    minWidth: '45%',
    flex: 1,
  },
  moodButtonActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs / 2,
  },
  moodLabel: {
    fontSize: 13,
    color: colors.text,
  },
  moodLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  noteContainer: {
    marginBottom: spacing.md,
  },
  noteLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  noteInput: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  noteCounter: {
    fontSize: 11,
    color: colors.textSoft,
    textAlign: 'right',
    marginTop: spacing.xs / 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    flexWrap: 'wrap',
  },
  primaryButton: {
    flex: 1,
    minWidth: 120,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    backgroundColor: '#fff',
    alignItems: 'center',
    minWidth: 80,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  skipButton: {
    padding: spacing.sm,
    alignItems: 'center',
    width: '100%',
  },
  skipButtonText: {
    color: colors.textSoft,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  backToSignupButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  backToSignupText: {
    color: colors.textSoft,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  addButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  appointmentsList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
  },
  appointmentItemText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  teamList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  teamMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
  },
  teamMemberText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  planContainer: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  taskCheckbox: {
    width: 20,
    height: 20,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  taskCategory: {
    fontSize: 11,
    color: colors.textSoft,
    marginTop: spacing.xs / 2,
  },
  addTaskButton: {
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  addTaskButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  summaryText: {
    fontSize: 15,
    color: colors.text,
  },
  reassuringText: {
    fontSize: 13,
    color: colors.textSoft,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalForm: {
    maxHeight: 500,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.textSoft,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 2,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  modalSaveButtonGradient: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});