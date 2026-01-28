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
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius } from '../theme/colors';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const iconAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation de bas en haut pour le logo
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

  const handleSendEmail = async () => {
    if (!email || !email.trim()) {
      Alert.alert('Information', 'Merci de renseigner ton adresse e-mail.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Information', 'Ce format d\'e-mail ne semble pas valide.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'breastwise://reset-password',
      });

      if (error) {
        // Message neutre même en cas d'erreur (sécurité)
        console.error('Error sending reset email:', error);
      }

      // Toujours afficher le même message de succès (sécurité)
      setEmailSent(true);
      setCanResend(false);
      
      // Réactiver le bouton après 60 secondes
      setTimeout(() => {
        setCanResend(true);
      }, 60000);

      Alert.alert(
        'E-mail envoyé',
        'Si un compte existe avec cette adresse, tu recevras un e-mail avec un lien pour réinitialiser ton mot de passe. Pense à vérifier tes spams.'
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert(
        'Erreur',
        'Le service est temporairement indisponible. Réessaie dans quelques minutes.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (canResend) {
      handleSendEmail();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#fce7f3', '#fdf2f8']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Logo animé */}
            <View style={styles.logoContainer}>
              <Animated.View style={[styles.logoWrapper, { transform: [{ translateY }] }]}>
                <Image
                  source={require('../../assets/logo.jpg')}
                  style={styles.logo}
                />
              </Animated.View>
            </View>

            {/* Titre */}
            <Text style={styles.title}>On va t'aider à te reconnecter.</Text>
            
            <View style={styles.separator} />

            {/* Texte introductif */}
            <Text style={styles.introText}>
              Indique l'adresse e-mail de ton compte. Nous t'enverrons un lien pour choisir un nouveau mot de passe.
            </Text>

            {!emailSent ? (
              <>
                {/* Champ email */}
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#f9a8d4" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="vous@exemple.com"
                    placeholderTextColor={colors.textSoft}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <Text style={styles.helpText}>
                  Utilise l'adresse que tu as choisie à la création du compte.
                </Text>

                {/* Bouton Envoyer */}
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendEmail}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#f9a8d4', '#ec4899']}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <Text style={styles.buttonText}>Envoi en cours…</Text>
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Envoyer le lien</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Message de confirmation */}
                <View style={styles.confirmationBox}>
                  <Ionicons name="checkmark-circle" size={48} color="#10b981" style={styles.successIcon} />
                  <Text style={styles.confirmationText}>
                    Si un compte existe avec cette adresse, tu recevras un e-mail avec un lien pour réinitialiser ton mot de passe. Pense à vérifier tes spams.
                  </Text>
                </View>

                {/* Bouton Renvoyer */}
                <TouchableOpacity
                  style={[styles.resendButton, !canResend && styles.buttonDisabled]}
                  onPress={handleResend}
                  disabled={!canResend || loading}
                >
                  <Text style={styles.resendButtonText}>
                    {canResend ? 'Renvoyer l\'e-mail' : 'Attends un peu avant de renvoyer'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Lien retour */}
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.backLinkText}>Me connecter</Text>
            </TouchableOpacity>
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
    padding: spacing.lg,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderSoft,
    marginBottom: spacing.lg,
  },
  introText: {
    fontSize: 16,
    color: colors.textSoft,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSoft,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#fce7f3',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: colors.text,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSoft,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  button: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  buttonIcon: {
    marginLeft: spacing.xs,
  },
  confirmationBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  successIcon: {
    marginBottom: spacing.md,
  },
  confirmationText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  resendButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resendButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  backLink: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  backLinkText: {
    color: colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});