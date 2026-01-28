import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius } from '../theme/colors';

export default function DayPlanScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailyState, setDailyState] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'quotidien',
    priority: 'medium',
  });

  useEffect(() => {
    loadTodayPlan();
    loadTodayState();
  }, []);

  const loadTodayState = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('daily_states')
        .select('*')
        .eq('date', today)
        .single();
      
      if (data) {
        setDailyState(data);
      }
    } catch (error) {
      console.error('Error loading daily state:', error);
    }
  };

  const loadTodayPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      // Charger le plan du jour
      const { data: planData } = await supabase
        .from('day_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (planData) {
        // Charger les tâches du plan
        const { data: tasksData } = await supabase
          .from('day_tasks')
          .select('*')
          .eq('day_plan_id', planData.id)
          .order('scheduled_time', { ascending: true });

        setTasks(tasksData || []);
      } else {
        // Générer un plan automatique si aucun plan n'existe
        generatePlan();
      }
    } catch (error) {
      console.error('Error loading plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      // Créer le plan du jour
      const { data: planData, error: planError } = await supabase
        .from('day_plans')
        .insert({
          user_id: user.id,
          date: today,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Générer des tâches basées sur l'état du jour
      const suggestedTasks = getSuggestedTasks(dailyState);
      
      if (suggestedTasks.length > 0) {
        const tasksToInsert = suggestedTasks.map(task => ({
          day_plan_id: planData.id,
          user_id: user.id,
          ...task,
        }));

        const { error: tasksError } = await supabase
          .from('day_tasks')
          .insert(tasksToInsert);

        if (tasksError) throw tasksError;
      }

      loadTodayPlan();
    } catch (error) {
      console.error('Error generating plan:', error);
      Alert.alert('Erreur', 'Impossible de générer le plan');
    }
  };

  const getSuggestedTasks = (state) => {
    const baseTasks = [
      { title: 'Prendre un moment pour soi', category: 'bien_etre', priority: 'high', status: 'todo' },
      { title: 'Boire de l\'eau régulièrement', category: 'quotidien', priority: 'medium', status: 'todo' },
    ];

    if (!state) return baseTasks;

    // Adapter selon l'énergie
    if (state.energy_level <= 2) {
      baseTasks.push(
        { title: 'Faire une sieste si besoin', category: 'repos', priority: 'high', status: 'todo' },
        { title: 'Repos et détente', category: 'repos', priority: 'high', status: 'todo' }
      );
    } else if (state.energy_level >= 4) {
      baseTasks.push(
        { title: 'Activité douce (marche, étirements)', category: 'bien_etre', priority: 'medium', status: 'todo' }
      );
    }

    // Adapter selon la fatigue
    if (state.fatigue_level >= 4) {
      baseTasks.push(
        { title: 'Éviter les activités fatigantes', category: 'repos', priority: 'high', status: 'todo' }
      );
    }

    return baseTasks;
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      // Vérifier si un plan existe
      let { data: planData } = await supabase
        .from('day_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (!planData) {
        const { data: newPlan } = await supabase
          .from('day_plans')
          .insert({
            user_id: user.id,
            date: today,
          })
          .select()
          .single();
        planData = newPlan;
      }

      const { error } = await supabase
        .from('day_tasks')
        .insert({
          day_plan_id: planData.id,
          user_id: user.id,
          title: newTask.title,
          description: newTask.description || null,
          category: newTask.category,
          priority: newTask.priority,
          status: 'todo',
        });

      if (error) throw error;

      setShowAddTask(false);
      setNewTask({ title: '', description: '', category: 'quotidien', priority: 'medium' });
      loadTodayPlan();
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter la tâche');
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'done' ? 'todo' : 'done';
      const { error } = await supabase
        .from('day_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      loadTodayPlan();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'medical':
        return 'medical';
      case 'bien_etre':
        return 'heart';
      case 'repos':
        return 'moon';
      case 'quotidien':
        return 'checkmark-circle';
      default:
        return 'list';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return colors.textSoft;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[colors.bg, colors.bgSoft]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Plan de ma journée</Text>
          <Text style={styles.subtitle}>
            Adapté à ton état du moment
          </Text>
        </View>

        {dailyState && (
          <View style={styles.stateInfo}>
            <Text style={styles.stateInfoText}>
              Énergie: {dailyState.energy_level}/5 • 
              Fatigue: {dailyState.fatigue_level}/5 • 
              Humeur: {dailyState.mood_level}/5
            </Text>
          </View>
        )}

        {!showAddTask ? (
          <>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddTask(true)}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Ajouter une tâche</Text>
              </LinearGradient>
            </TouchableOpacity>

            {tasks.length > 0 ? (
              <View style={styles.tasksContainer}>
                {tasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.taskCard,
                      task.status === 'done' && styles.taskCardDone,
                    ]}
                    onPress={() => handleToggleTask(task.id, task.status)}
                  >
                    <View style={styles.taskHeader}>
                      <View style={styles.taskIconContainer}>
                        <Ionicons
                          name={getCategoryIcon(task.category)}
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.taskContent}>
                        <Text
                          style={[
                            styles.taskTitle,
                            task.status === 'done' && styles.taskTitleDone,
                          ]}
                        >
                          {task.title}
                        </Text>
                        {task.description && (
                          <Text style={styles.taskDescription}>
                            {task.description}
                          </Text>
                        )}
                      </View>
                      <View style={styles.taskActions}>
                        <View
                          style={[
                            styles.priorityBadge,
                            { backgroundColor: getPriorityColor(task.priority) + '20' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.priorityText,
                              { color: getPriorityColor(task.priority) },
                            ]}
                          >
                            {task.priority === 'high' ? 'Haute' : 
                             task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                          </Text>
                        </View>
                        <Ionicons
                          name={task.status === 'done' ? 'checkmark-circle' : 'ellipse-outline'}
                          size={24}
                          color={task.status === 'done' ? colors.gradientEnergy[0] : colors.textSoft}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color={colors.textSoft} />
                <Text style={styles.emptyText}>Aucun plan pour aujourd'hui</Text>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={generatePlan}
                >
                  <LinearGradient
                    colors={colors.gradientPrimary}
                    style={styles.generateButtonGradient}
                  >
                    <Text style={styles.generateButtonText}>Générer mon plan</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <View style={styles.newTaskContainer}>
            <Text style={styles.newTaskTitle}>Nouvelle tâche</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Titre de la tâche"
              placeholderTextColor={colors.textSoft}
              value={newTask.title}
              onChangeText={(text) => setNewTask({ ...newTask, title: text })}
            />

            <TextInput
              style={styles.textArea}
              placeholder="Description (optionnel)"
              placeholderTextColor={colors.textSoft}
              value={newTask.description}
              onChangeText={(text) => setNewTask({ ...newTask, description: text })}
              multiline
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddTask(false);
                  setNewTask({ title: '', description: '', category: 'quotidien', priority: 'medium' });
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddTask}
              >
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>Ajouter</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    marginBottom: spacing.lg,
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
  stateInfo: {
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  stateInfoText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
  },
  addButton: {
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  addButtonGradient: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  tasksContainer: {
    gap: spacing.md,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskCardDone: {
    opacity: 0.6,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  taskIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
  },
  taskDescription: {
    fontSize: 14,
    color: colors.textSoft,
  },
  taskActions: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  generateButton: {
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
  },
  generateButtonGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  newTaskContainer: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  newTaskTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  textArea: {
    backgroundColor: colors.bg,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textSoft,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
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
});