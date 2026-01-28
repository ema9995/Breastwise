import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius } from '../theme/colors';

export default function SignupScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
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

  const translateY = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    // Validation des champs vides
    if (!firstName || !firstName.trim()) {
      Alert.alert(
        'Information',
        'Merci de renseigner votre prénom.'
      );
      return;
    }

    if (!email || !password || !confirmPassword) {
      Alert.alert(
        'Information',
        'Merci de renseigner tous les champs.'
      );
      return;
    }

    // Validation du format email
    if (!validateEmail(email)) {
      Alert.alert('Information', 'Ce format d\'e-mail ne semble pas valide.');
      return;
    }

    // Validation de la longueur du mot de passe
    if (password.length < 6) {
      Alert.alert(
        'Information',
        'Le mot de passe doit contenir au moins 6 caractères.'
      );
      return;
    }

    // Validation de la correspondance des mots de passe
    if (password !== confirmPassword) {
      Alert.alert(
        'Information',
        'Les mots de passe ne correspondent pas. Veuillez vérifier votre saisie.'
      );
      return;
    }

    setLoading(true);
    
    try {
      // Inscription avec le prénom dans les métadonnées
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
          },
        },
      });

      if (error) {
        setLoading(false);
        // Gestion des erreurs spécifiques
        let errorMessage = error.message || 'Une erreur s\'est produite lors de l\'inscription. Veuillez réessayer.';
        
        if (error.message?.includes('already registered') || 
            error.message?.includes('already exists') ||
            error.message?.includes('User already registered')) {
          errorMessage = 'Cet e-mail est déjà associé à un compte. Tu peux te connecter ou réinitialiser ton mot de passe.';
          Alert.alert(
            'Inscription',
            errorMessage,
            [
              {
                text: 'Se connecter',
                onPress: () => navigation.navigate('Login'),
              },
              {
                text: 'Mot de passe oublié',
                onPress: () => navigation.navigate('ForgotPassword'),
                style: 'cancel',
              },
            ]
          );
        } else {
          Alert.alert('Inscription', errorMessage);
        }
        return;
      }

      // Attendre un peu pour que la session soit disponible
      await new Promise(resolve => setTimeout(resolve, 500));

      // Vérifier si l'utilisateur est automatiquement connecté
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
      }
      
      // Vérifier aussi dans data.user
      const user = data?.user || session?.user;
      
      if (session && user) {
        // L'utilisateur est connecté automatiquement
        // Créer l'enregistrement dans la table users avec le prénom et onboarding_completed: false
        try {
          const { error: dbError } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email,
              first_name: firstName.trim(),
              onboarding_completed: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id'
            });

          if (dbError) {
            console.warn('Could not create user record:', dbError);
            // On continue quand même
          } else {
            console.log('✅ Utilisateur créé dans la table users avec prénom:', firstName.trim());
          }
        } catch (dbError) {
          console.warn('Could not create user record:', dbError);
          // On continue quand même
        }
        
        setLoading(false);
        
        // Ne pas naviguer manuellement - AppNavigator détectera automatiquement
        // que onboarding_completed est false et redirigera vers l'onboarding
        Alert.alert(
          'Inscription réussie ! 🌸',
          'Ton compte a été créé avec succès. Tu vas être redirigée vers l\'onboarding.',
          [{ text: 'OK' }]
        );
      } else {
        // Confirmation email requise ou pas de session immédiate
        setLoading(false);
        
        // Vérifier si un email de confirmation a été envoyé
        if (data?.user && !data.user.email_confirmed_at) {
          Alert.alert(
            'Inscription réussie',
            'Un email de confirmation a été envoyé à ' + email + '. Merci de vérifier ta boîte mail et de cliquer sur le lien pour activer ton compte. Une fois activé, tu pourras te connecter.',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Login'),
              },
            ]
          );
        } else {
          // Essayer de se connecter automatiquement
          try {
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (!loginError && loginData?.user) {
              // Créer l'enregistrement dans la table users avec le prénom et onboarding_completed: false
              try {
                await supabase
                  .from('users')
                  .upsert({
                    id: loginData.user.id,
                    email: loginData.user.email,
                    first_name: firstName.trim(),
                    onboarding_completed: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }, {
                    onConflict: 'id'
                  });
              } catch (dbError) {
                console.warn('Could not create user record:', dbError);
              }

              setLoading(false);
              
              // Ne pas naviguer manuellement - AppNavigator détectera automatiquement
              Alert.alert(
                'Inscription réussie ! 🌸',
                'Ton compte a été créé avec succès. Tu vas être redirigée vers l\'onboarding.',
                [{ text: 'OK' }]
              );
            } else {
              setLoading(false);
              Alert.alert(
                'Inscription réussie',
                'Ton compte a été créé. Tu peux maintenant te connecter.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('Login'),
                  },
                ]
              );
            }
          } catch (loginErr) {
            setLoading(false);
            console.error('Auto-login error:', loginErr);
            Alert.alert(
              'Inscription réussie',
              'Ton compte a été créé. Tu peux maintenant te connecter.',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('Login'),
                },
              ]
            );
          }
        }
      }
    } catch (err) {
      setLoading(false);
      console.error('Signup error:', err);
      Alert.alert(
        'Erreur',
        'Une erreur s\'est produite lors de l\'inscription. Veuillez réessayer.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#fce7f3', '#fdf2f8']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.card}>
              {/* Icône animée en haut */}
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ translateY }],
                  },
                ]}
              >
                <View style={styles.iconBackground}>
                  <Image
                    source={require('../../assets/logo.jpg')}
                    style={styles.logo}
                    resizeMode="cover"
                  />
                </View>
              </Animated.View>

              {/* Titre */}
              <Text style={styles.title}>Créer un compte</Text>
              
              {/* Ligne séparatrice */}
              <View style={styles.separator} />

              {/* Formulaire */}
              <View style={styles.form}>
                {/* Champ Prénom */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Prénom</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#ec4899" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Votre prénom"
                      placeholderTextColor={colors.textSoft}
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Champ Adresse e-mail */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Adresse e-mail</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#a855f7" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="vous@exemple.com"
                      placeholderTextColor={colors.textSoft}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Champ Mot de passe */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mot de passe</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#fb923c" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Votre mot de passe"
                      placeholderTextColor={colors.textSoft}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoComplete="password-new"
                      autoCorrect={false}
                    />
                  </View>
                  <Text style={styles.helpText}>
                    Le mot de passe doit contenir au moins 6 caractères.
                  </Text>
                </View>

                {/* Champ Confirmation mot de passe */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirmer le mot de passe</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#fb923c" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirmez votre mot de passe"
                      placeholderTextColor={colors.textSoft}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoComplete="password-new"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Bouton d'inscription */}
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSignup}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={loading ? ['#d1d5db', '#d1d5db'] : ['#f9a8d4', '#ec4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Inscription...' : 'Créer mon compte'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>

                {/* Lien vers la connexion */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>
                    J'ai déjà un compte
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingVertical: spacing.xl,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  separator: {
    height: 2,
    backgroundColor: colors.primary,
    width: 60,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSoft,
    marginTop: spacing.xs / 2,
  },
  button: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  linkText: {
    fontSize: 13,
    color: '#db2777',
    textDecorationLine: 'underline',
  },
});
