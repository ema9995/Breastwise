import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius } from '../theme/colors';

const writingModes = {
  free: 'libre',
  guided: 'guidé',
  template: 'template',
};

const guidedContexts = [
  { id: 'difficile', label: 'Un jour difficile', emoji: '😔' },
  { id: 'joie', label: 'Un jour de joie', emoji: '😊' },
  { id: 'commencer', label: 'Je ne sais pas par où commencer', emoji: '🤔' },
  { id: 'libre', label: 'Je veux juste écrire librement', emoji: '✍️' },
];

const guidedQuestions = {
  difficile: [
    "Qu'est-ce qui rend cette journée difficile ?",
    "Qu'est-ce qui t'a aidée aujourd'hui, même un tout petit peu ?",
    "Qu'est-ce que tu aimerais laisser partir ?",
    "Qui ou quoi t'a soutenue aujourd'hui ?",
  ],
  joie: [
    "Qu'est-ce qui t'a fait sourire ou te sentir bien aujourd'hui ?",
    "Quelle petite victoire veux-tu célébrer ?",
    "Qui ou quoi t'a apporté de la lumière aujourd'hui ?",
    "Comment veux-tu te souvenir de ce moment ?",
  ],
  commencer: [
    "Comment te sens-tu en ce moment, physiquement et émotionnellement ?",
    "Qu'est-ce qui occupe ton esprit en ce moment ?",
    "Qu'est-ce qui t'a marquée aujourd'hui, même de façon subtile ?",
    "Pour quoi es-tu reconnaissante aujourd'hui ?",
  ],
  libre: [],
};

const templates = [
  {
    id: 'futur',
    title: 'Lettre à mon futur moi',
    description: 'Écris une lettre à la personne que tu seras dans 3 ou 6 mois. Que veux-tu lui dire ?',
    duration: '10-15 minutes',
  },
  {
    id: 'forces',
    title: 'Mes forces intérieures',
    description: 'Liste tes ressources, tes qualités, ce qui te fait tenir. Reviens-y quand tu en as besoin.',
    duration: '5-10 minutes',
  },
  {
    id: 'gratitude',
    title: 'Journal de gratitude',
    description: 'Note 3 choses pour lesquelles tu es reconnaissante aujourd\'hui, même petites.',
    duration: '5 minutes',
  },
  {
    id: 'liberation',
    title: 'Libération émotionnelle',
    description: 'Écris ce que tu veux laisser partir aujourd\'hui. Puis, symboliquement, tu peux "brûler" cette page (supprimer) ou la garder.',
    duration: '10 minutes',
  },
];

const welcomeMessages = [
  "Prends le temps dont tu as besoin. Cet espace est à toi. 🌸",
  "Il n'y a pas de bonne ou de mauvaise façon d'écrire. Laisse-toi guider.",
  "Cet espace est à toi. Personne ne le lira sans ton accord.",
  "Toutes tes émotions sont valides. Il n'y a pas de bonne ou de mauvaise façon de ressentir.",
];

export default function JournalScreen({ navigation }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [writingMode, setWritingMode] = useState(null);
  const [selectedContext, setSelectedContext] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [entryContent, setEntryContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [welcomeMessage] = useState(
    welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
  );

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const handleSaveEntry = async (context = null) => {
    // Permettre la sauvegarde même si le contenu est vide
    // L'utilisatrice peut vouloir sauvegarder une entrée vide pour plus tard

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setLoading(true);
      const { error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          content: entryContent.trim() || '', // Permettre le contenu vide
          context: context || selectedContext || null,
          title: selectedTemplate ? selectedTemplate.title : null,
        });

      if (error) throw error;

      // Message de soutien personnalisé seulement si du contenu
      if (entryContent.trim()) {
        showSupportMessage(entryContent);
      } else {
        Alert.alert(
          'Enregistré',
          'Ton entrée a été sauvegardée. Tu peux y revenir plus tard pour compléter.'
        );
      }
      
      // Reset
      setWritingMode(null);
      setSelectedContext(null);
      setCurrentQuestionIndex(0);
      setEntryContent('');
      setSelectedTemplate(null);
      await loadEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Information', 'Impossible de sauvegarder pour le moment. Tu peux réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const showSupportMessage = (content) => {
    const lowerContent = content.toLowerCase();
    let message = "Tu as pris le temps d'écrire aujourd'hui. C'est déjà un acte de bienveillance envers toi-même. 🌸";
    
    if (lowerContent.includes('difficile') || lowerContent.includes('dur') || lowerContent.includes('fatigue')) {
      message = "Tu as traversé une journée difficile. C'est normal de ressentir cela. Tu es forte, même quand tu ne le sens pas. 🌸";
    } else if (lowerContent.includes('joie') || lowerContent.includes('heureux') || lowerContent.includes('bien')) {
      message = "C'est beau de voir ces moments de lumière. Garde-les précieusement, ils font partie de ta force.";
    }

    Alert.alert('Merci pour ton partage', message, [
      {
        text: 'Faire un exercice de respiration',
        onPress: () => navigation.navigate('Bien-être'),
      },
      {
        text: 'Continuer',
        style: 'cancel',
      },
    ]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hier";
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  };

  const handleDeleteEntry = (entryId) => {
    Alert.alert(
      'Supprimer cette entrée ?',
      'Es-tu sûre de vouloir supprimer cette entrée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('journal_entries')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', entryId);
              
              if (error) throw error;
              await loadEntries();
            } catch (error) {
              Alert.alert('Information', 'Impossible de supprimer pour le moment.');
            }
          },
        },
      ]
    );
  };

  const renderEntry = ({ item }) => {
    const excerpt = item.content.length > 150 
      ? item.content.substring(0, 150) + '...' 
      : item.content;

    return (
      <TouchableOpacity
        style={styles.entryCard}
        onPress={() => {
          Alert.alert(
            item.title || 'Entrée du journal',
            item.content,
            [
              { text: 'Fermer', style: 'cancel' },
              {
                text: 'Supprimer',
                style: 'destructive',
                onPress: () => handleDeleteEntry(item.id),
              },
            ]
          );
        }}
      >
        <View style={styles.entryHeader}>
          <Text style={styles.entryDate}>{formatDate(item.created_at)}</Text>
          {item.context && (
            <View style={styles.contextBadge}>
              <Text style={styles.contextText}>{item.context}</Text>
            </View>
          )}
        </View>
        <Text style={styles.entryExcerpt}>{excerpt}</Text>
      </TouchableOpacity>
    );
  };

  const renderWritingMode = () => {
    if (writingMode === 'free') {
      return (
        <View style={styles.writingContainer}>
          <Text style={styles.writingTitle}>Écrire librement</Text>
          <Text style={styles.writingSubtitle}>
            Écris ce qui te passe par la tête. Il n'y a pas de règles ici.
          </Text>
          <TextInput
            style={styles.writingTextArea}
            placeholder="Écris ce qui te passe par la tête..."
            placeholderTextColor={colors.textSoft}
            value={entryContent}
            onChangeText={setEntryContent}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.writingActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setWritingMode(null);
                setEntryContent('');
              }}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSaveEntry()}
              disabled={loading}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (writingMode === 'guided') {
      if (!selectedContext) {
        return (
          <View style={styles.writingContainer}>
            <Text style={styles.writingTitle}>Choisis un contexte</Text>
            <View style={styles.contextList}>
              {guidedContexts.map((context) => (
                <TouchableOpacity
                  key={context.id}
                  style={styles.contextCard}
                  onPress={() => {
                    setSelectedContext(context.id);
                    setCurrentQuestionIndex(0);
                  }}
                >
                  <Text style={styles.contextEmoji}>{context.emoji}</Text>
                  <Text style={styles.contextLabel}>{context.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setWritingMode(null)}
            >
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
          </View>
        );
      }

      const questions = guidedQuestions[selectedContext] || [];
      const currentQuestion = questions[currentQuestionIndex];

      return (
        <View style={styles.writingContainer}>
          <Text style={styles.writingTitle}>Question guidée</Text>
          <Text style={styles.questionText}>{currentQuestion}</Text>
          <TextInput
            style={styles.writingTextArea}
            placeholder="Ta réponse..."
            placeholderTextColor={colors.textSoft}
            value={entryContent}
            onChangeText={setEntryContent}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.guidedActions}>
            {currentQuestionIndex > 0 && (
              <TouchableOpacity
                style={styles.prevButton}
                onPress={() => {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                  setEntryContent('');
                }}
              >
                <Text style={styles.prevButtonText}>← Précédente</Text>
              </TouchableOpacity>
            )}
            {currentQuestionIndex < questions.length - 1 ? (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                  setEntryContent('');
                }}
              >
                <Text style={styles.nextButtonText}>Suivante →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.finishButton}
                onPress={() => handleSaveEntry(selectedContext)}
                disabled={loading}
              >
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.finishButtonGradient}
                >
                  <Text style={styles.finishButtonText}>
                    {loading ? 'Enregistrement...' : "J'ai fini de répondre"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    if (writingMode === 'template') {
      if (!selectedTemplate) {
        return (
          <View style={styles.writingContainer}>
            <Text style={styles.writingTitle}>Choisis un template</Text>
            <View style={styles.templateList}>
              {templates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateCard}
                  onPress={() => setSelectedTemplate(template)}
                >
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  <Text style={styles.templateDescription}>
                    {template.description}
                  </Text>
                  <Text style={styles.templateDuration}>{template.duration}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setWritingMode(null)}
            >
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <View style={styles.writingContainer}>
          <Text style={styles.writingTitle}>{selectedTemplate.title}</Text>
          <Text style={styles.templateDescription}>
            {selectedTemplate.description}
          </Text>
          <TextInput
            style={styles.writingTextArea}
            placeholder="Écris ta réponse..."
            placeholderTextColor={colors.textSoft}
            value={entryContent}
            onChangeText={setEntryContent}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.writingActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setSelectedTemplate(null);
                setEntryContent('');
              }}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSaveEntry()}
              disabled={loading}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[colors.bg, colors.bgSoft]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mon espace perso</Text>
          <Text style={styles.subtitle}>
            Un espace pour déposer ce que tu ressens
          </Text>
        </View>

        {/* Message bienveillant */}
        <View style={styles.welcomeMessage}>
          <Text style={styles.welcomeText}>{welcomeMessage}</Text>
        </View>

        {/* Bouton Pause */}
        <TouchableOpacity
          style={styles.pauseButton}
          onPress={() => setShowPauseModal(true)}
        >
          <LinearGradient
            colors={colors.gradientWellbeing}
            style={styles.pauseButtonGradient}
          >
            <Ionicons name="leaf" size={20} color="#fff" />
            <Text style={styles.pauseButtonText}>Prendre une pause</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Mode d'écriture sélectionné */}
        {writingMode ? (
          renderWritingMode()
        ) : (
          <>
            {/* Choix du mode d'écriture */}
            <View style={styles.modeSelection}>
              <Text style={styles.sectionTitle}>Écrire aujourd'hui</Text>
              <View style={styles.modeButtons}>
                <TouchableOpacity
                  style={styles.modeButton}
                  onPress={() => setWritingMode('free')}
                >
                  <Ionicons name="create" size={24} color={colors.primary} />
                  <Text style={styles.modeButtonText}>Mode libre</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modeButton}
                  onPress={() => setWritingMode('guided')}
                >
                  <Ionicons name="help-circle" size={24} color={colors.primary} />
                  <Text style={styles.modeButtonText}>Mode guidé</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modeButton}
                  onPress={() => setWritingMode('template')}
                >
                  <Ionicons name="document-text" size={24} color={colors.primary} />
                  <Text style={styles.modeButtonText}>Template</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Mes écrits */}
            <View style={styles.entriesSection}>
              <Text style={styles.sectionTitle}>Mes écrits</Text>
              {entries.length > 0 ? (
                <FlatList
                  data={entries}
                  renderItem={renderEntry}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="book-outline" size={64} color={colors.textSoft} />
                  <Text style={styles.emptyText}>
                    Cet espace t'attend
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Tu peux commencer par écrire librement ou répondre à une question guidée.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Modal Pause */}
        <Modal
          visible={showPauseModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPauseModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Prendre une pause</Text>
              <Text style={styles.modalText}>
                Tu es prête à écrire quand tu veux. Prends le temps dont tu as besoin.
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowPauseModal(false);
                  navigation.navigate('Bien-être');
                }}
              >
                <LinearGradient
                  colors={colors.gradientWellbeing}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>
                    Faire un exercice de respiration
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPauseModal(false)}
              >
                <Text style={styles.modalCloseText}>Continuer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  welcomeMessage: {
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  welcomeText: {
    fontSize: 15,
    color: colors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  pauseButton: {
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  pauseButtonGradient: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pauseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modeSelection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    gap: spacing.xs,
  },
  modeButtonText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  writingContainer: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    marginBottom: spacing.lg,
  },
  writingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  writingSubtitle: {
    fontSize: 14,
    color: colors.textSoft,
    marginBottom: spacing.md,
  },
  writingTextArea: {
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    minHeight: 200,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  writingActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  contextList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  contextCard: {
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
  },
  contextEmoji: {
    fontSize: 24,
  },
  contextLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: 26,
  },
  guidedActions: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  prevButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
  },
  prevButtonText: {
    color: colors.textSoft,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  nextButtonText: {
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  finishButton: {
    flex: 1,
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
  },
  finishButtonGradient: {
    padding: spacing.md,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  templateList: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  templateCard: {
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  templateDescription: {
    fontSize: 14,
    color: colors.textSoft,
    marginBottom: spacing.xs,
  },
  templateDuration: {
    fontSize: 12,
    color: colors.textSoft,
    fontStyle: 'italic',
  },
  backButton: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  entriesSection: {
    marginTop: spacing.xl,
  },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    marginBottom: spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  entryDate: {
    fontSize: 12,
    color: colors.textSoft,
    fontWeight: '600',
  },
  contextBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  contextText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  entryExcerpt: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
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
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSoft,
    textAlign: 'center',
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalText: {
    fontSize: 15,
    color: colors.textSoft,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  modalButton: {
    width: '100%',
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  modalButtonGradient: {
    padding: spacing.md,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalCloseButton: {
    padding: spacing.sm,
  },
  modalCloseText: {
    color: colors.primary,
    fontSize: 14,
  },
});