import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// Remplacer cet import :
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius } from '../theme/colors';
// Note: Tesseract.js nécessite un environnement web ou Node.js
// Pour React Native, on utilisera une approche via Edge Function Supabase
// ou on peut utiliser react-native-tesseract-ocr si disponible

const treatmentTypes = [
  { id: 'consultation', label: 'Consultation', icon: 'person' },
  { id: 'chimio', label: 'Séance de chimiothérapie', icon: 'medical' },
  { id: 'radio', label: 'Séance de radiothérapie', icon: 'radio' },
  { id: 'examen', label: 'Examen (IRM, scanner, etc.)', icon: 'document-text' },
  { id: 'autre', label: 'Autre', icon: 'calendar' },
];

const documentTypes = [
  { id: 'compte-rendu', label: 'Compte-rendu de consultation' },
  { id: 'ordonnance', label: 'Ordonnance' },
  { id: 'resultat-examen', label: 'Résultat d\'examen (IRM, scanner, prise de sang, etc.)' },
  { id: 'courrier', label: 'Courrier médical' },
  { id: 'autre', label: 'Autre' },
];

export default function TreatmentScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [newSession, setNewSession] = useState({
    type: 'consultation',
    title: '',
    description: '',
    start_datetime: '',
    location: '',
    doctor_name: '',
    notes: '',
  });

  // États pour les documents
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [newDocument, setNewDocument] = useState({
    title: '',
    type: 'compte-rendu',
    treatment_session_id: null,
    document_date: null,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentSummary, setDocumentSummary] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [processingOCR, setProcessingOCR] = useState(false);

  useEffect(() => {
    loadSessions();
    loadDocuments();
  }, []);

  const loadSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('treatment_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_datetime', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Essayer d'abord avec les jointures
      const { data, error } = await supabase
        .from('documents')
        .select('*, document_summaries(*), treatment_sessions(id, title, start_datetime)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Si la table n'existe pas ou si les relations échouent, essayer sans jointures
        if (error.code === '42P01' || error.message?.includes('does not exist') || error.code === 'PGRST116') {
          console.warn('Documents table or relations do not exist, continuing without documents');
          setDocuments([]);
          return;
        }
        
        // Si c'est une erreur de relation, essayer sans les jointures
        if (error.message?.includes('relation') || error.message?.includes('foreign key')) {
          console.warn('Document relations failed, trying without joins');
          const { data: simpleData, error: simpleError } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (simpleError) {
            if (simpleError.code === '42P01' || simpleError.message?.includes('does not exist')) {
              console.warn('Documents table does not exist');
              setDocuments([]);
              return;
            }
            throw simpleError;
          }
          
          setDocuments(simpleData || []);
          return;
        }
        
        throw error;
      }
      
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    }
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePickerModal(false);
      if (event && event.type === 'dismissed') {
        return;
      }
    }
    if (date) {
      setSelectedDate(date);
      const newDateTime = new Date(date);
      if (newSession.start_datetime) {
        try {
          const [datePart, timePart] = newSession.start_datetime.split(' ');
          if (timePart) {
            const [hours, minutes] = timePart.split(':');
            newDateTime.setHours(parseInt(hours) || 9);
            newDateTime.setMinutes(parseInt(minutes) || 0);
          } else {
            newDateTime.setHours(selectedTime.getHours() || 9);
            newDateTime.setMinutes(selectedTime.getMinutes() || 0);
          }
        } catch {
          newDateTime.setHours(selectedTime.getHours() || 9);
          newDateTime.setMinutes(selectedTime.getMinutes() || 0);
        }
      } else {
        newDateTime.setHours(selectedTime.getHours() || 9);
        newDateTime.setMinutes(selectedTime.getMinutes() || 0);
      }
      updateDateTimeString(newDateTime);
    }
  };

  const handleTimeChange = (event, time) => {
    if (Platform.OS === 'android') {
      setShowTimePickerModal(false);
      if (event && event.type === 'dismissed') {
        return;
      }
    }
    if (time) {
      setSelectedTime(time);
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(time.getHours());
      newDateTime.setMinutes(time.getMinutes());
      updateDateTimeString(newDateTime);
    }
  };

  const updateDateTimeString = (dateTime) => {
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, '0');
    const day = String(dateTime.getDate()).padStart(2, '0');
    const hours = String(dateTime.getHours()).padStart(2, '0');
    const minutes = String(dateTime.getMinutes()).padStart(2, '0');
    const datetimeString = `${year}-${month}-${day} ${hours}:${minutes}`;
    setNewSession({ ...newSession, start_datetime: datetimeString });
  };

  const formatDisplayDateOnly = (dateString) => {
    if (!dateString) return 'Sélectionner une date';
    try {
      const [datePart, timePart] = dateString.split(' ');
      const [year, month, day] = datePart.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Sélectionner une date';
    }
  };

  const formatDisplayTime = (dateString) => {
    if (!dateString) return 'Sélectionner une heure';
    try {
      const [datePart, timePart] = dateString.split(' ');
      if (timePart) {
        const [hours, minutes] = timePart.split(':');
        return `${hours}:${minutes}`;
      }
      return 'Sélectionner une heure';
    } catch {
      return 'Sélectionner une heure';
    }
  };

  const handleAddSession = async () => {
    if (!newSession.title || !newSession.title.trim()) {
      Alert.alert('Information', 'Merci de renseigner le titre du rendez-vous.');
      return;
    }
    
    if (!newSession.start_datetime || !newSession.start_datetime.trim()) {
      Alert.alert('Information', 'Merci de sélectionner une date et une heure pour le rendez-vous.');
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        Alert.alert('Erreur', 'Impossible de vérifier votre connexion. Veuillez vous reconnecter.');
        return;
      }
      
      if (!user) {
        Alert.alert('Erreur', 'Vous devez être connecté pour ajouter un rendez-vous.');
        return;
      }

      setLoading(true);
      
      let datetimeISO;
      try {
        const dateTimeStr = newSession.start_datetime.trim();
        const [datePart, timePart] = dateTimeStr.split(' ');
        if (!datePart || !timePart) {
          throw new Error('Format de date invalide');
        }
        
        const [year, month, day] = datePart.split('-');
        const [hours, minutes] = timePart.split(':');
        
        const dateObj = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours) || 9,
          parseInt(minutes) || 0
        );
        
        datetimeISO = dateObj.toISOString();
        
        if (isNaN(dateObj.getTime())) {
          throw new Error('Date invalide');
        }
      } catch (dateError) {
        console.error('Error parsing date:', dateError, newSession.start_datetime);
        Alert.alert('Erreur', 'La date sélectionnée n\'est pas valide. Veuillez réessayer.');
        setLoading(false);
        return;
      }
      
      const insertData = {
        user_id: user.id,
        type: newSession.type,
        title: newSession.title.trim(),
        description: newSession.description?.trim() || null,
        start_datetime: datetimeISO,
        location: newSession.location?.trim() || null,
        doctor_name: newSession.doctor_name?.trim() || null,
        notes: newSession.notes?.trim() || null,
        status: 'scheduled',
      };
      
      const { data, error } = await supabase
        .from('treatment_sessions')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Error adding session:', error);
        Alert.alert('Erreur', `Impossible d'ajouter le rendez-vous: ${error.message}`);
        setLoading(false);
        return;
      }

      Alert.alert('Succès', 'Rendez-vous ajouté avec succès.');
      
      setShowAddModal(false);
      const now = new Date();
      setNewSession({
        type: 'consultation',
        title: '',
        description: '',
        start_datetime: '',
        location: '',
        doctor_name: '',
        notes: '',
      });
      setSelectedDate(now);
      setSelectedTime(now);
      
      await loadSessions();
    } catch (error) {
      console.error('Error adding session:', error);
      Alert.alert('Erreur', `Impossible d'ajouter le rendez-vous.\n\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.start_datetime);
    
    if (session.status === 'completed') {
      return { label: '✅ Passé', color: colors.gradientEnergy?.[0] || colors.primary };
    }
    if (session.status === 'cancelled') {
      return { label: 'Annulé', color: colors.textSoft };
    }
    if (sessionDate < now) {
      return { label: '⏳ En cours', color: colors.gradientFatigue?.[0] || colors.textSoft };
    }
    return { label: '📅 À venir', color: colors.primary };
  };

  const getTypeIcon = (type) => {
    const typeObj = treatmentTypes.find(t => t.id === type);
    return typeObj ? typeObj.icon : 'calendar';
  };

  const getProgressInfo = () => {
    if (sessions.length === 0) {
      return null;
    }

    const chimioSessions = sessions.filter(s => s.type === 'chimio' && s.status === 'completed');
    const totalChimio = sessions.filter(s => s.type === 'chimio').length;
    
    if (totalChimio > 0) {
      return `Tu es à la ${chimioSessions.length + 1}ème séance de chimiothérapie sur ${totalChimio} prévues.`;
    }
    
    const upcoming = sessions.filter(s => 
      s.status === 'scheduled' && new Date(s.start_datetime) > new Date()
    ).sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
    
    if (upcoming.length > 0) {
      const next = upcoming[0];
      const nextDate = formatDate(next.start_datetime);
      return `Prochaine étape : ${next.title} le ${nextDate.split(' à ')[0]}.`;
    }
    
    const allCompleted = sessions.every(s => s.status === 'completed');
    if (allCompleted) {
      return "Tu as terminé tous tes rendez-vous programmés. Bravo ! 🌸";
    }
    
    return "Tu as des rendez-vous enregistrés. Consulte la timeline ci-dessous pour les voir.";
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setSelectedFile(file);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier. Réessaie plus tard.');
    }
  };

  const handleDocumentUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Information', 'Merci de sélectionner un fichier.');
      return;
    }

    if (!newDocument.title || !newDocument.title.trim()) {
      Alert.alert('Information', 'Merci de renseigner le titre du document.');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Erreur', 'Vous devez être connecté pour ajouter un document.');
        setUploading(false);
        return;
      }

      // Lire le fichier
      const fileContent = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const byteCharacters = atob(fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: selectedFile.mimeType || 'application/pdf' });

      const fileName = `${user.id}/${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Vérifier si le bucket existe
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.id === 'medical-documents');
      
      if (!bucketExists) {
        // Essayer de créer le bucket
        const { error: createError } = await supabase.storage.createBucket('medical-documents', {
          public: false,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
        });
        
        if (createError && !createError.message?.includes('already exists')) {
          Alert.alert(
            'Configuration requise',
            'Le bucket "medical-documents" n\'existe pas. Veuillez le créer dans Supabase Storage.'
          );
          setUploading(false);
          return;
        }
      }

      // Upload du fichier
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('medical-documents')
        .upload(fileName, blob, {
          contentType: selectedFile.mimeType || 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          Alert.alert(
            'Configuration requise',
            'Le bucket "medical-documents" n\'existe pas. Veuillez le créer dans Supabase Storage (Dashboard > Storage > Create bucket).'
          );
          setUploading(false);
          return;
        }
        
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('medical-documents')
        .getPublicUrl(fileName);

      // Insérer dans la table documents
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title: newDocument.title.trim(),
          type: newDocument.type,
          file_url: urlData.publicUrl,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          treatment_session_id: newDocument.treatment_session_id || null,
          document_date: newDocument.document_date || new Date().toISOString(),
        })
        .select()
        .single();

      if (docError) {
        if (docError.code === '42P01' || docError.message?.includes('does not exist')) {
          Alert.alert(
            'Information',
            'Le document a été uploadé mais la table "documents" n\'existe pas encore. Veuillez créer la table dans Supabase.'
          );
          setUploading(false);
          return;
        }
        throw docError;
      }

      // Générer le résumé avec OCR (Tesseract via Edge Function)
      await vulgarizeDocument(docData.id, urlData.publicUrl, selectedFile.mimeType, selectedFile.uri);

      Alert.alert('Succès', 'Document ajouté avec succès. L\'analyse OCR est en cours...');
      setShowDocumentModal(false);
      setSelectedFile(null);
      setNewDocument({ title: '', type: 'compte-rendu', treatment_session_id: null, document_date: null });
      loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert(
        'Erreur',
        `Impossible d'ajouter le document.\n\n${error.message || 'Erreur inconnue'}\n\nVérifiez que le bucket "medical-documents" existe dans Supabase Storage.`
      );
    } finally {
      setUploading(false);
    }
  };

  const vulgarizeDocument = async (documentId, fileUrl, mimeType, localUri) => {
    try {
      setProcessingOCR(true);
      
      // Option 1: Utiliser une Edge Function Supabase avec Tesseract.js
      // (Recommandé car Tesseract.js nécessite Node.js)
      try {
        const { data, error } = await supabase.functions.invoke('ocr-document', {
          body: {
            document_id: documentId,
            file_url: fileUrl,
            mime_type: mimeType,
          },
        });

        if (!error && data) {
          // Mettre à jour le résumé avec les résultats OCR
          const { error: updateError } = await supabase
            .from('document_summaries')
            .upsert({
              document_id: documentId,
              summary: data.summary || data.text || 'Texte extrait du document.',
              simplified_explanation: data.simplified_explanation || this.simplifyMedicalText(data.text || data.summary || ''),
              status: 'completed',
            }, {
              onConflict: 'document_id'
            });

          if (updateError && updateError.code !== '42P01') {
            console.error('Error updating summary:', updateError);
          }
          return;
        }
      } catch (edgeError) {
        console.warn('Edge Function not available, trying local OCR:', edgeError);
      }

      // Option 2: OCR local (si Tesseract.js est disponible côté client)
      // Note: Cela ne fonctionnera que si vous utilisez react-native-tesseract-ocr
      // ou si vous avez un wrapper pour Tesseract.js
      
      // Pour l'instant, créer un résumé basique
      const { error: insertError } = await supabase
        .from('document_summaries')
        .insert({
          document_id: documentId,
          summary: 'Analyse OCR en attente. Veuillez configurer l\'Edge Function "ocr-document" dans Supabase pour activer la reconnaissance de texte.',
          simplified_explanation: 'Pour activer l\'analyse automatique des documents, configurez une Edge Function Supabase avec Tesseract.js.',
          status: 'pending',
        });

      if (insertError && insertError.code !== '42P01') {
        console.warn('Could not create summary entry:', insertError);
      }
    } catch (error) {
      console.error('Error vulgarizing document:', error);
    } finally {
      setProcessingOCR(false);
    }
  };

  // Fonction helper pour simplifier le texte médical
  const simplifyMedicalText = (text) => {
    if (!text) return '';
    
    // Remplacer les termes médicaux complexes par des explications simples
    const replacements = {
      'chimiothérapie': 'traitement médicamenteux',
      'radiothérapie': 'traitement par rayons',
      'mastectomie': 'ablation du sein',
      'tumorectomie': 'ablation de la tumeur',
      'biopsie': 'prélèvement d\'un échantillon',
      'métastase': 'propagation de la maladie',
      'récidive': 'retour de la maladie',
    };
    
    let simplified = text;
    Object.keys(replacements).forEach(term => {
      const regex = new RegExp(term, 'gi');
      simplified = simplified.replace(regex, replacements[term]);
    });
    
    return simplified;
  };

  const viewDocumentSummary = async (documentId) => {
    try {
      const { data, error } = await supabase
        .from('document_summaries')
        .select('*')
        .eq('document_id', documentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          Alert.alert('Information', 'Le résumé n\'est pas encore disponible.');
          return;
        }
        throw error;
      }
      
      setDocumentSummary(data);
      setShowSummaryModal(true);
    } catch (error) {
      console.error('Error loading summary:', error);
      Alert.alert('Information', 'Le résumé n\'est pas encore disponible.');
    }
  };

  const upcomingSessions = sessions
    .filter(s => s.status === 'scheduled' && new Date(s.start_datetime) > new Date())
    .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))
    .slice(0, 3);

  const renderSession = ({ item }) => {
    const statusInfo = getStatusInfo(item);
    
    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => {
          Alert.alert(
            item.title,
            `${item.description || ''}\n\n${item.notes ? `Notes: ${item.notes}` : ''}`,
            [
              { text: 'Fermer', style: 'cancel' },
              {
                text: 'Marquer comme terminé',
                onPress: async () => {
                  try {
                    const { error } = await supabase
                      .from('treatment_sessions')
                      .update({ status: 'completed' })
                      .eq('id', item.id);
                    
                    if (error) throw error;
                    await loadSessions();
                  } catch (error) {
                    Alert.alert('Information', 'Impossible de mettre à jour pour le moment.');
                  }
                },
              },
            ]
          );
        }}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionIconContainer}>
            <Ionicons name={getTypeIcon(item.type)} size={24} color={colors.primary} />
          </View>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>{item.title}</Text>
            <Text style={styles.sessionDate}>{formatDate(item.start_datetime)}</Text>
            {item.location && (
              <Text style={styles.sessionLocation}>📍 {item.location}</Text>
            )}
            {item.doctor_name && (
              <Text style={styles.sessionDoctor}>👤 {item.doctor_name}</Text>
            )}
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusInfo.color + '20' },
            ]}
          >
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>
        {item.description && (
          <Text style={styles.sessionDescription}>{item.description}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[colors.bg, colors.bgSoft]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mon traitement</Text>
          <Text style={styles.subtitle}>
            Suivez vos rendez-vous et séances
          </Text>
        </View>

        {getProgressInfo() && (
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Où en es-tu ?</Text>
            <Text style={styles.progressText}>{getProgressInfo()}</Text>
          </View>
        )}

        {upcomingSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prochains rendez-vous</Text>
            <FlatList
              data={upcomingSessions}
              renderItem={renderSession}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline du traitement</Text>
          {sessions.length > 0 ? (
            <FlatList
              data={sessions}
              renderItem={renderSession}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={colors.textSoft} />
              <Text style={styles.emptyText}>
                Tu n'as pas de rendez-vous programmé pour le moment
              </Text>
              <Text style={styles.emptySubtext}>
                Tu peux en ajouter un si besoin
              </Text>
            </View>
          )}
        </View>

        {/* Section Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes documents médicaux</Text>
          
          <TouchableOpacity
            style={styles.addDocumentButton}
            onPress={() => {
              setSelectedFile(null);
              setNewDocument({ title: '', type: 'compte-rendu', treatment_session_id: null, document_date: null });
              setShowDocumentModal(true);
            }}
          >
            <LinearGradient
              colors={['#f9a8d4', '#ec4899']}
              style={styles.addDocumentButtonGradient}
            >
              <Ionicons name="document-attach" size={20} color="#fff" />
              <Text style={styles.addDocumentButtonText}>Ajouter un document médical</Text>
            </LinearGradient>
          </TouchableOpacity>

          {documents.length > 0 ? (
            <View style={styles.documentsList}>
              {documents.slice(0, 5).map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={styles.documentCard}
                  onPress={() => viewDocumentSummary(doc.id)}
                >
                  <View style={styles.documentIcon}>
                    <Ionicons name="document-text" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentTitle}>{doc.title}</Text>
                    <Text style={styles.documentType}>
                      {documentTypes.find(t => t.id === doc.type)?.label || doc.type}
                    </Text>
                    <Text style={styles.documentDate}>
                      {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  {doc.document_summaries && doc.document_summaries.length > 0 && (
                    <Ionicons name="information-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color={colors.textSoft} />
              <Text style={styles.emptyText}>
                Tu peux ajouter tes documents médicaux ici pour les garder à portée de main.
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            const now = new Date();
            setSelectedDate(now);
            setSelectedTime(now);
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const datetimeString = `${year}-${month}-${day} ${hours}:${minutes}`;
            setNewSession({
              type: 'consultation',
              title: '',
              description: '',
              start_datetime: datetimeString,
              location: '',
              doctor_name: '',
              notes: '',
            });
            setShowAddModal(true);
          }}
        >
          <LinearGradient
            colors={colors.gradientPrimary || ['#f9a8d4', '#ec4899']}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Ajouter un rendez-vous</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Modal Ajouter rendez-vous */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajouter un rendez-vous</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Type</Text>
                  <View style={styles.typeSelector}>
                    {treatmentTypes.map((type) => (
                      <TouchableOpacity
                        key={type.id}
                        style={[
                          styles.typeButton,
                          newSession.type === type.id && styles.typeButtonActive,
                        ]}
                        onPress={() => setNewSession({ ...newSession, type: type.id })}
                      >
                        <Ionicons
                          name={type.icon}
                          size={20}
                          color={newSession.type === type.id ? '#fff' : colors.primary}
                        />
                        <Text
                          style={[
                            styles.typeButtonText,
                            newSession.type === type.id && styles.typeButtonTextActive,
                          ]}
                        >
                          {type.label}
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
                    placeholderTextColor={colors.textSoft}
                    value={newSession.title}
                    onChangeText={(text) => setNewSession({ ...newSession, title: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Date *</Text>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => setShowDatePickerModal(true)}
                  >
                    <Ionicons name="calendar" size={24} color={colors.primary} />
                    <View style={styles.dateTimeInfo}>
                      <Text style={styles.dateTimeText}>
                        {formatDisplayDateOnly(newSession.start_datetime)}
                      </Text>
                      {newSession.start_datetime && (
                        <Text style={styles.dateTimeSubtext}>
                          {formatDisplayTime(newSession.start_datetime)}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSoft} />
                  </TouchableOpacity>
                </View>

                {newSession.start_datetime && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Heure *</Text>
                    <TouchableOpacity
                      style={styles.dateTimeButton}
                      onPress={() => setShowTimePickerModal(true)}
                    >
                      <Ionicons name="time" size={24} color={colors.primary} />
                      <View style={styles.dateTimeInfo}>
                        <Text style={styles.dateTimeText}>
                          {formatDisplayTime(newSession.start_datetime)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textSoft} />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Avec qui</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nom du médecin / professionnel"
                    placeholderTextColor={colors.textSoft}
                    value={newSession.doctor_name}
                    onChangeText={(text) => setNewSession({ ...newSession, doctor_name: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Lieu</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nom du centre, adresse"
                    placeholderTextColor={colors.textSoft}
                    value={newSession.location}
                    onChangeText={(text) => setNewSession({ ...newSession, location: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Notes sur ce rendez-vous"
                    placeholderTextColor={colors.textSoft}
                    value={newSession.description}
                    onChangeText={(text) => setNewSession({ ...newSession, description: text })}
                    multiline
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => {
                      setShowAddModal(false);
                      const now = new Date();
                      setNewSession({
                        type: 'consultation',
                        title: '',
                        description: '',
                        start_datetime: '',
                        location: '',
                        doctor_name: '',
                        notes: '',
                      });
                      setSelectedDate(now);
                      setSelectedTime(now);
                    }}
                  >
                    <Text style={styles.modalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveButton}
                    onPress={handleAddSession}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={colors.gradientPrimary || ['#f9a8d4', '#ec4899']}
                      style={styles.modalSaveButtonGradient}
                    >
                      <Text style={styles.modalSaveButtonText}>
                        {loading ? 'Ajout...' : 'Ajouter ce rendez-vous'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal Documents */}
        <Modal
          visible={showDocumentModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDocumentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajouter un document médical</Text>
                <TouchableOpacity onPress={() => setShowDocumentModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Titre *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Compte-rendu consultation du 15 mars"
                    placeholderTextColor={colors.textSoft}
                    value={newDocument.title}
                    onChangeText={(text) => setNewDocument({ ...newDocument, title: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Type de document *</Text>
                  <View style={styles.typeSelector}>
                    {documentTypes.map((type) => (
                      <TouchableOpacity
                        key={type.id}
                        style={[
                          styles.typeButton,
                          newDocument.type === type.id && styles.typeButtonActive,
                        ]}
                        onPress={() => setNewDocument({ ...newDocument, type: type.id })}
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            newDocument.type === type.id && styles.typeButtonTextActive,
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Fichier *</Text>
                  <TouchableOpacity
                    style={styles.filePickerButton}
                    onPress={handlePickDocument}
                  >
                    <Ionicons name="document-attach" size={24} color={colors.primary} />
                    <View style={styles.filePickerInfo}>
                      <Text style={styles.filePickerText}>
                        {selectedFile ? selectedFile.name : 'Choisir un fichier (PDF, JPG, PNG)'}
                      </Text>
                      {selectedFile && (
                        <Text style={styles.filePickerSize}>
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSoft} />
                  </TouchableOpacity>
                </View>

                {processingOCR && (
                  <View style={styles.processingIndicator}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.processingText}>Analyse OCR en cours...</Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => {
                      setShowDocumentModal(false);
                      setSelectedFile(null);
                      setNewDocument({ title: '', type: 'compte-rendu', treatment_session_id: null, document_date: null });
                    }}
                  >
                    <Text style={styles.modalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveButton}
                    onPress={handleDocumentUpload}
                    disabled={uploading || !selectedFile || !newDocument.title || processingOCR}
                  >
                    <LinearGradient
                      colors={colors.gradientPrimary || ['#f9a8d4', '#ec4899']}
                      style={styles.modalSaveButtonGradient}
                    >
                      <Text style={styles.modalSaveButtonText}>
                        {uploading ? 'Upload...' : processingOCR ? 'Analyse...' : 'Ajouter ce document'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal Résumé Document */}
        <Modal
          visible={showSummaryModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSummaryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Résumé du document</Text>
                <TouchableOpacity onPress={() => setShowSummaryModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm}>
                {documentSummary ? (
                  <>
                    <View style={styles.summarySection}>
                      <Text style={styles.summaryTitle}>Résumé</Text>
                      <Text style={styles.summaryText}>
                        {documentSummary.summary || 'Résumé en cours de génération...'}
                      </Text>
                    </View>

                    <View style={styles.summarySection}>
                      <Text style={styles.summaryTitle}>Explication simplifiée</Text>
                      <Text style={styles.summaryText}>
                        {documentSummary.simplified_explanation || 'Explication en cours de génération...'}
                      </Text>
                    </View>

                    {documentSummary.status === 'processing' && (
                      <View style={styles.processingBox}>
                        <Text style={styles.processingText}>
                          ⏳ Le document est en cours d'analyse. Le résumé sera disponible sous peu.
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.summaryText}>Chargement du résumé...</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Date Picker */}
        {showDatePickerModal && Platform.OS === 'android' && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="calendar"
            onChange={handleDateChange}
            minimumDate={new Date()}
            locale="fr-FR"
          />
        )}

        {Platform.OS === 'ios' && (
          <Modal
            visible={showDatePickerModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDatePickerModal(false)}
          >
            <View style={styles.pickerModalOverlay}>
              <View style={styles.pickerModalContent}>
                <View style={styles.pickerModalHeader}>
                  <Text style={styles.pickerModalTitle}>Sélectionner une date</Text>
                  <TouchableOpacity onPress={() => setShowDatePickerModal(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                    locale="fr-FR"
                    style={styles.picker}
                  />
                </View>
                <TouchableOpacity
                  style={styles.pickerConfirmButton}
                  onPress={() => {
                    handleDateChange(null, selectedDate);
                    setShowDatePickerModal(false);
                  }}
                >
                  <Text style={styles.pickerConfirmText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Time Picker */}
        {showTimePickerModal && Platform.OS === 'android' && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="clock"
            onChange={handleTimeChange}
            locale="fr-FR"
          />
        )}

        {Platform.OS === 'ios' && (
          <Modal
            visible={showTimePickerModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowTimePickerModal(false)}
          >
            <View style={styles.pickerModalOverlay}>
              <View style={styles.pickerModalContent}>
                <View style={styles.pickerModalHeader}>
                  <Text style={styles.pickerModalTitle}>Sélectionner une heure</Text>
                  <TouchableOpacity onPress={() => setShowTimePickerModal(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    display="spinner"
                    onChange={handleTimeChange}
                    locale="fr-FR"
                    style={styles.picker}
                  />
                </View>
                <TouchableOpacity
                  style={styles.pickerConfirmButton}
                  onPress={() => {
                    handleTimeChange(null, selectedTime);
                    setShowTimePickerModal(false);
                  }}
                >
                  <Text style={styles.pickerConfirmText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
  progressSection: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    marginBottom: spacing.lg,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  progressText: {
    fontSize: 15,
    color: colors.textSoft,
    lineHeight: 22,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    marginBottom: spacing.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  sessionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  sessionDate: {
    fontSize: 14,
    color: colors.textSoft,
    marginBottom: spacing.xs / 2,
  },
  sessionLocation: {
    fontSize: 13,
    color: colors.textSoft,
  },
  sessionDoctor: {
    fontSize: 13,
    color: colors.textSoft,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sessionDescription: {
    fontSize: 14,
    color: colors.textSoft,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardLightBorder,
  },
  addButton: {
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
    marginBottom: spacing.xl,
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
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSoft,
    textAlign: 'center',
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
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  modalForm: {
    maxHeight: 500,
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
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#fff',
    gap: spacing.xs,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    fontSize: 16,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    gap: spacing.md,
  },
  dateTimeInfo: {
    flex: 1,
  },
  dateTimeText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  dateTimeSubtext: {
    fontSize: 14,
    color: colors.textSoft,
    marginTop: spacing.xs / 2,
  },
  textArea: {
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalCancelButton: {
    flex: 1,
    padding: spacing.md,
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
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
  },
  modalSaveButtonGradient: {
    padding: spacing.md,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pickerModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  pickerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  picker: {
    width: '100%',
    height: 200,
  },
  pickerConfirmButton: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  pickerConfirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  addDocumentButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  addDocumentButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  addDocumentButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  documentsList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  documentType: {
    fontSize: 14,
    color: colors.textSoft,
    marginBottom: spacing.xs / 2,
  },
  documentDate: {
    fontSize: 12,
    color: colors.textSoft,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    gap: spacing.md,
  },
  filePickerInfo: {
    flex: 1,
  },
  filePickerText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  filePickerSize: {
    fontSize: 12,
    color: colors.textSoft,
    marginTop: spacing.xs / 2,
  },
  summarySection: {
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summaryText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  processingBox: {
    backgroundColor: '#fff3cd',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  processingText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
});