import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius } from '../theme/colors';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [initialFirstName, setInitialFirstName] = useState('');
  const [initialEmail, setInitialEmail] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting user:', error);
        throw error;
      }
      
      if (user) {
        setUser(user);
        
        // Charger le prénom depuis la table users d'abord, sinon depuis user_metadata
        try {
          const { data: userData, error: dbError } = await supabase
            .from('users')
            .select('first_name')
            .eq('id', user.id)
            .single();
          
          if (!dbError && userData?.first_name) {
            setFirstName(userData.first_name);
            setInitialFirstName(userData.first_name);
          } else {
            const name = user.user_metadata?.first_name || '';
            setFirstName(name);
            setInitialFirstName(name);
          }
        } catch (dbError) {
          // Si la table n'existe pas, utiliser user_metadata
          const name = user.user_metadata?.first_name || '';
          setFirstName(name);
          setInitialFirstName(name);
        }
        
        const userEmail = user.email || '';
        setEmail(userEmail);
        setInitialEmail(userEmail);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Erreur', 'Impossible de charger vos informations.');
    }
  };

  const handleUpdateProfile = async () => {
    if (!firstName.trim()) {
      Alert.alert('Information', 'Le prénom ne peut pas être vide.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Information', 'Veuillez saisir une adresse e-mail valide.');
      return;
    }

    // Vérifier si quelque chose a changé
    if (firstName.trim() === initialFirstName && email.trim() === initialEmail) {
      Alert.alert('Information', 'Aucune modification à enregistrer.');
      setEditingProfile(false);
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Début de la mise à jour du profil...');
      
      // Mettre à jour les métadonnées utilisateur
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
        },
      });

      if (updateError) {
        console.error('❌ Erreur updateUser:', updateError);
        throw updateError;
      }

      console.log('✅ Métadonnées utilisateur mises à jour');

      // Mettre à jour aussi la table users
      try {
        const { error: dbError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email, // Garder l'email actuel de l'utilisateur
            first_name: firstName.trim(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id'
          });

        if (dbError) {
          console.error('❌ Erreur mise à jour table users:', dbError);
          if (dbError.code !== '42P01') {
            // Si ce n'est pas une erreur de table inexistante, on affiche un avertissement
            console.warn('⚠️ La table users n\'a pas pu être mise à jour, mais les métadonnées sont à jour');
          }
        } else {
          console.log('✅ Table users mise à jour');
        }
      } catch (dbError) {
        console.warn('⚠️ Erreur lors de la mise à jour de la table users:', dbError);
        // On continue quand même car les métadonnées sont mises à jour
      }

      // Si l'email a changé, le mettre à jour
      if (email.trim() !== user.email) {
        console.log('🔄 Mise à jour de l\'email...');
        const { error: emailError } = await supabase.auth.updateUser({
          email: email.trim(),
        });

        if (emailError) {
          console.error('❌ Erreur mise à jour email:', emailError);
          Alert.alert(
            'Information',
            'L\'email a été mis à jour. Un e-mail de confirmation vous a été envoyé pour valider le changement. Votre prénom a été mis à jour avec succès.'
          );
        } else {
          console.log('✅ Email mis à jour');
          // Mettre à jour l'email dans la table users aussi
          try {
            await supabase
              .from('users')
              .upsert({
                id: user.id,
                email: email.trim(),
                first_name: firstName.trim(),
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'id'
              });
          } catch (dbError) {
            console.warn('⚠️ Erreur mise à jour email dans table users:', dbError);
          }
        }
      }

      // Recharger les données utilisateur pour avoir les dernières valeurs
      await loadUserData();
      
      Alert.alert('Succès', 'Vos informations ont été mises à jour avec succès.');
      setEditingProfile(false);
    } catch (error) {
      console.error('❌ Erreur complète mise à jour profil:', error);
      Alert.alert(
        'Erreur', 
        error.message || 'Impossible de mettre à jour vos informations. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Information', 'Veuillez remplir tous les champs.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Information', 'Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Information', 'Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Information', 'Le nouveau mot de passe doit être différent de l\'ancien.');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔄 Vérification du mot de passe actuel...');
      
      // Vérifier le mot de passe actuel en tentant une connexion
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        console.error('❌ Mot de passe actuel incorrect:', signInError);
        Alert.alert('Erreur', 'Le mot de passe actuel est incorrect.');
        setLoading(false);
        return;
      }

      console.log('✅ Mot de passe actuel vérifié');

      // Mettre à jour le mot de passe
      console.log('🔄 Mise à jour du mot de passe...');
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('❌ Erreur mise à jour mot de passe:', updateError);
        throw updateError;
      }

      console.log('✅ Mot de passe mis à jour avec succès');

      Alert.alert('Succès', 'Votre mot de passe a été modifié avec succès.');
      setChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('❌ Erreur complète changement mot de passe:', error);
      Alert.alert('Erreur', error.message || 'Impossible de modifier le mot de passe. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûre de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 Déconnexion en cours...');
              const { error } = await supabase.auth.signOut();
              
              if (error) {
                console.error('❌ Erreur déconnexion:', error);
                Alert.alert('Erreur', 'Impossible de se déconnecter. Veuillez réessayer.');
              } else {
                console.log('✅ Déconnexion réussie');
                // La redirection se fera automatiquement via onAuthStateChange dans AppNavigator
                // On peut afficher un message de confirmation
                Alert.alert('Déconnexion', 'Vous avez été déconnectée avec succès.', [
                  { text: 'OK' }
                ]);
              }
            } catch (error) {
              console.error('❌ Erreur dans handleLogout:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion.');
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[colors.bg, colors.bgSoft]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={require('../../assets/logo.jpg')}
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.headerTitle}>Mon profil</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Section Informations personnelles */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Informations personnelles</Text>
              {!editingProfile && (
                <TouchableOpacity
                  onPress={() => {
                    setEditingProfile(true);
                    setInitialFirstName(firstName);
                    setInitialEmail(email);
                  }}
                  style={styles.editButton}
                >
                  <Ionicons name="pencil" size={18} color={colors.primary} />
                  <Text style={styles.editButtonText}>Modifier</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prénom</Text>
              {editingProfile ? (
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Votre prénom"
                  placeholderTextColor={colors.textSoft}
                  editable={!loading}
                />
              ) : (
                <View style={styles.valueContainer}>
                  <Text style={styles.valueText}>{firstName || 'Non renseigné'}</Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse e-mail</Text>
              {editingProfile ? (
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="votre@email.com"
                  placeholderTextColor={colors.textSoft}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!loading}
                />
              ) : (
                <View style={styles.valueContainer}>
                  <Text style={styles.valueText}>{email}</Text>
                </View>
              )}
            </View>

            {editingProfile && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, loading && styles.buttonDisabled]}
                  onPress={() => {
                    setEditingProfile(false);
                    setFirstName(initialFirstName);
                    setEmail(initialEmail);
                  }}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, loading && styles.buttonDisabled]}
                  onPress={handleUpdateProfile}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={loading ? ['#d1d5db', '#d1d5db'] : ['#f9a8d4', '#ec4899']}
                    style={styles.saveButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Enregistrer</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Section Mot de passe */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mot de passe</Text>
              {!changingPassword && (
                <TouchableOpacity
                  onPress={() => setChangingPassword(true)}
                  style={styles.editButton}
                >
                  <Ionicons name="lock-closed" size={18} color={colors.primary} />
                  <Text style={styles.editButtonText}>Modifier</Text>
                </TouchableOpacity>
              )}
            </View>

            {changingPassword ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mot de passe actuel</Text>
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Votre mot de passe actuel"
                    placeholderTextColor={colors.textSoft}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nouveau mot de passe</Text>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Votre nouveau mot de passe"
                    placeholderTextColor={colors.textSoft}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirmez votre nouveau mot de passe"
                    placeholderTextColor={colors.textSoft}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, loading && styles.buttonDisabled]}
                    onPress={() => {
                      setChangingPassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, loading && styles.buttonDisabled]}
                    onPress={handleChangePassword}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={loading ? ['#d1d5db', '#d1d5db'] : ['#f9a8d4', '#ec4899']}
                      style={styles.saveButtonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.saveButtonText}>Modifier</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.valueContainer}>
                <Text style={styles.valueText}>••••••••</Text>
              </View>
            )}
          </View>

          {/* Bouton de déconnexion */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSoft,
    marginTop: spacing.md,
  },
  header: {
    marginBottom: spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  content: {
    gap: spacing.lg,
  },
  section: {
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
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  editButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  valueContainer: {
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
  },
  valueText: {
    fontSize: 16,
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});