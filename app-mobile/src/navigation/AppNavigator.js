import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { supabase } from '../services/supabase';
import { colors } from '../theme/colors';

// Imports uniformisés - tous sans extension .js et en PascalCase
import DashboardScreen from '../screens/DashboardScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import DailyStateScreen from '../screens/DailyStateScreen';
import TreatmentScreen from '../screens/TreatmentScreen';
import JournalScreen from '../screens/JournalScreen';
import DayPlanScreen from '../screens/DayPlanScreen';
import WellbeingScreen from '../screens/WellbeingScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSoft,
        tabBarStyle: {
          backgroundColor: colors.bgSoft,
          borderTopColor: colors.borderSoft,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: colors.bg,
          borderBottomColor: colors.borderSoft,
          borderBottomWidth: 1,
        },
        headerTintColor: colors.text,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="État"
        component={DailyStateScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text>,
          title: 'Mon état du jour',
        }}
      />
      <Tab.Screen
        name="Traitement"
        component={TreatmentScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📅</Text>,
          title: 'Mon traitement',
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>💝</Text>,
          title: 'Mon espace perso',
        }}
      />
      <Tab.Screen
        name="Bien-être"
        component={WellbeingScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🌸</Text>,
          title: 'Exercices bien-être',
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>💅</Text>,
          title: 'Mon profil',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true); // Par défaut true pour éviter le blocage

  // Fonction pour vérifier le statut d'onboarding
  const checkOnboardingStatus = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Aucune ligne trouvée - utilisateur n'existe pas encore dans la table
          return false;
        }
        console.error('Error checking onboarding:', error);
        return null;
      }

      return data?.onboarding_completed ?? false;
    } catch (error) {
      console.error('Error in checkOnboardingStatus:', error);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutId;
    let pollingInterval = null;

    // Timeout de sécurité : après 5 secondes, on arrête le loading
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log('⏱️ Timeout: Arrêt du loading après 5 secondes');
        setLoading(false);
        setOnboardingCompleted(true); // Par défaut, considérer comme complété
      }
    }, 5000);

    // Vérifier la session et le statut d'onboarding
    const checkAuthAndOnboarding = async () => {
      try {
        console.log('🔍 Vérification de la session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Erreur session:', sessionError);
          if (isMounted) {
            setSession(null);
            setOnboardingCompleted(null);
            setLoading(false);
          }
          return;
        }

        console.log('✅ Session:', session ? 'Connecté' : 'Non connecté');
        
        if (isMounted) {
          setSession(session);
        }

        if (session) {
          try {
            console.log('🔍 Vérification de l\'onboarding...');
            // Timeout pour la requête Supabase (3 secondes max)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 3000)
            );

            const queryPromise = checkOnboardingStatus(session.user.id);

            const result = await Promise.race([
              Promise.resolve(queryPromise),
              timeoutPromise
            ]);

            if (result === null || result === undefined) {
              // Timeout ou erreur
              console.warn('⏱️ Timeout ou erreur lors de la vérification de l\'onboarding');
              if (isMounted) {
                setOnboardingCompleted(true); // Par défaut complété en cas de timeout
              }
            } else {
              console.log('✅ Onboarding:', result ? 'Complété' : 'Non complété');
              if (isMounted) {
                setOnboardingCompleted(result);
                
                // Si l'onboarding n'est pas complété, démarrer le polling
                if (!result) {
                  console.log('🔄 Démarrage du polling pour détecter la fin de l\'onboarding...');
                  pollingInterval = setInterval(async () => {
                    if (isMounted && session) {
                      const status = await checkOnboardingStatus(session.user.id);
                      if (status === true && isMounted) {
                        console.log('✅ Onboarding complété détecté !');
                        setOnboardingCompleted(true);
                        clearInterval(pollingInterval);
                      }
                    }
                  }, 2000); // Vérifier toutes les 2 secondes
                }
              }
            }
          } catch (error) {
            if (error.message === 'Timeout') {
              console.warn('⏱️ Timeout lors de la vérification de l\'onboarding');
              if (isMounted) {
                setOnboardingCompleted(true); // Par défaut complété en cas de timeout
              }
            } else {
              console.error('❌ Erreur dans checkAuthAndOnboarding:', error);
              if (isMounted) {
                setOnboardingCompleted(true); // Par défaut en cas d'erreur
              }
            }
          }
        } else {
          if (isMounted) {
            setOnboardingCompleted(null);
          }
        }
      } catch (error) {
        console.error('❌ Erreur générale:', error);
        if (isMounted) {
          setSession(null);
          setOnboardingCompleted(null);
        }
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuthAndOnboarding();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('🔄 Changement d\'état d\'authentification');
        if (isMounted) {
          setSession(session);
        }
        
        if (session) {
          try {
            const status = await checkOnboardingStatus(session.user.id);
            if (isMounted) {
              setOnboardingCompleted(status ?? false);
              
              // Si l'onboarding n'est pas complété, démarrer le polling
              if (status === false && !pollingInterval) {
                console.log('🔄 Démarrage du polling pour détecter la fin de l\'onboarding...');
                pollingInterval = setInterval(async () => {
                  if (isMounted && session) {
                    const newStatus = await checkOnboardingStatus(session.user.id);
                    if (newStatus === true && isMounted) {
                      console.log('✅ Onboarding complété détecté !');
                      setOnboardingCompleted(true);
                      clearInterval(pollingInterval);
                      pollingInterval = null;
                    }
                  }
                }, 2000); // Vérifier toutes les 2 secondes
              }
            }
          } catch (error) {
            console.error('Erreur lors du changement d\'état:', error);
          }
        } else {
          if (isMounted) {
            setOnboardingCompleted(null);
            if (pollingInterval) {
              clearInterval(pollingInterval);
              pollingInterval = null;
            }
          }
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Écran de chargement avec timeout
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
        }}
      >
        {session ? (
          // Utilisateur connecté
          onboardingCompleted ? (
            // Onboarding complété - accès normal
            <>
              <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
              <Stack.Screen 
                name="Plan du jour" 
                component={DayPlanScreen} 
                options={{ 
                  title: 'Plan de ma journée',
                  headerStyle: { backgroundColor: colors.bg },
                  headerTintColor: colors.text,
                }} 
              />
              <Stack.Screen 
                name="Bien-être" 
                component={WellbeingScreen} 
                options={{ 
                  title: 'Exercices bien-être',
                  headerStyle: { backgroundColor: colors.bg },
                  headerTintColor: colors.text,
                }} 
              />
              <Stack.Screen 
                name="Profil" 
                component={ProfileScreen} 
                options={{ 
                  title: 'Mon profil',
                  headerStyle: { backgroundColor: colors.bg },
                  headerTintColor: colors.text,
                }} 
              />
            </>
          ) : (
            // Onboarding non complété - rediriger vers onboarding
            <Stack.Screen 
              name="Onboarding" 
              component={OnboardingScreen} 
              options={{ headerShown: false }} 
            />
          )
        ) : (
          // Utilisateur non connecté
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
            <Stack.Screen 
              name="ForgotPassword" 
              component={ForgotPasswordScreen} 
              options={{ 
                title: 'Mot de passe oublié',
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
              }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSoft,
  },
});
