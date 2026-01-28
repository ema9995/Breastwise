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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
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

  const handleLogin = async () => {
    // Validation des champs vides
    if (!email || !password) {
      Alert.alert(
        'Information',
        'Merci de renseigner votre e-mail et votre mot de passe.'
      );
      return;
    }

    // Validation du format email
    if (!validateEmail(email)) {
      Alert.alert('Information', 'Ce format d\'e-mail ne semble pas valide.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      Alert.alert(
        'Connexion',
        'Nous ne reconnaissons pas ces identifiants. Vous pouvez vérifier vos informations ou réessayer plus tard.'
      );
      return;
    }

    setLoading(false);
    // La redirection vers le dashboard se fait automatiquement via AppNavigator
    // Le prénom sera chargé automatiquement depuis la base de données dans DashboardScreen
  };

  const handleForgotPassword = async () => {
    if (!email || !email.trim()) {
      Alert.alert(
        'Information',
        'Veuillez d\'abord saisir votre adresse e-mail dans le champ ci-dessus.'
      );
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Information', 'Ce format d\'e-mail ne semble pas valide.');
      return;
    }

    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'breastwise://reset-password',
    });

    setResetLoading(false);

    if (error) {
      Alert.alert(
        'Erreur',
        'Une erreur s\'est produite lors de l\'envoi de l\'e-mail de réinitialisation. Veuillez réessayer plus tard.'
      );
    } else {
      Alert.alert(
        'E-mail envoyé',
        'Un e-mail de réinitialisation de mot de passe a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception.'
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
              {/* Logo animé en haut */}
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
              <Text style={styles.title}>Ravie de vous revoir</Text>
              
              {/* Ligne séparatrice */}
              <View style={styles.separator} />

              {/* Formulaire */}
              <View style={styles.form}>
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
                  <Text style={styles.helpText}>
                    Utilisez l'adresse avec laquelle vous avez créé votre compte.
                  </Text>
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
                      autoComplete="password"
                      autoCorrect={false}
                    />
                  </View>
                  {/* Lien mot de passe oublié sous le champ */}
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    disabled={resetLoading}
                    style={styles.forgotPasswordLink}
                  >
                    <Text style={styles.forgotPasswordText}>
                      {resetLoading ? 'Envoi en cours...' : 'J\'ai oublié mon mot de passe'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Bouton de connexion */}
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={loading ? ['#d1d5db', '#d1d5db'] : ['#f9a8d4', '#ec4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Connexion...' : 'Accéder à mon compte'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>

                {/* Lien vers l'inscription */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('Signup')}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>
                    Je n'ai pas encore de compte
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
    fontWeight: '700',
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
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
    paddingVertical: spacing.xs / 2,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#db2777',
    textDecorationLine: 'underline',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  linkText: {
    fontSize: 13,
    color: '#db2777',
    textDecorationLine: 'underline',
  },
});
