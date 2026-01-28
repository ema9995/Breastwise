# Breastwise

Breastwise est une application mobile d’accompagnement autour du cancer du sein.  
Elle propose du suivi, des exercices de bien-être (musique douce, tutoriels tricot/crochet, etc.) et un onboarding guidé pour aider les utilisatrices au quotidien.

## Fonctionnalités principales

- **Onboarding personnalisé**  
  - Questions de départ et enregistrement en base (Supabase)  
  - Suivi de l’état `onboarding_completed` pour adapter la navigation

- **Écran Bien-être (`Wellbeing`)**  
  - **Musiques douces** : playlist de musiques Lofi / Ghibli (YouTube)  
  - **Tutoriels tricot / crochet** selon le niveau, via des vidéos YouTube  
  - Ouverture intelligente des liens YouTube (application native si possible, sinon navigateur mobile)

- **Navigation**  
  - Navigation avec React Navigation (stack + bottom tabs)  
  - Gestion de l’état d’onboarding par l’`AppNavigator`

- **Backend & données**  
  - **Supabase** pour l’authentification et le stockage des données utilisateur

## Stack technique

- **Framework** : React Native avec **Expo**
- **SDK Expo** : 54
- **Langage** : JavaScript (React)
- **Navigation** : `@react-navigation/native`, `@react-navigation/stack`, `@react-navigation/bottom-tabs`
- **Animations** : `react-native-reanimated` (new architecture activée)
- **Backend** : Supabase (`@supabase/supabase-js`)
- **Build mobile** : Expo **EAS Build** (Android APK, iOS possible)

## Installation et lancement en local

### 1. Cloner le projet

git clone https://github.com/ema9995/Breastwise.git
cd Breastwise/app-mobile### 2. Installer les dépendances

npm install### 3. Lancer l’application en développement

npm start
# ou
npx expo startEnsuite, scanner le QR code avec l’application **Expo Go** (SDK 54) ou lancer sur un émulateur.

## Build Android avec EAS

Assure-toi d’être dans `app-mobile` :

cd app-mobile
npx eas-cli build --platform android --profile productionLe binaire (APK) sera disponible sur ton tableau de bord Expo, dans la section **Builds** du projet.

## Configuration importante

- **`app.json`**
  - Nom de l’app : `Breastwise`
  - `slug` : `app-mobile`
  - `android.package` / `ios.bundleIdentifier` : `com.breastwise.app`
  - `newArchEnabled: true` pour la nouvelle architecture React Native

- **`eas.json`**
  - Profils `development`, `preview`, `production`
  - Variables d’environnement pour EAS :  
    - `EAS_NO_VCS=1`  
    - `NPM_CONFIG_LEGACY_PEER_DEPS=true` (pour éviter certains conflits de dépendances)

- **`babel.config.js`**
  - Plugin `react-native-reanimated/plugin` ajouté **en dernier**

- **`android/gradle.properties`**
  - Forçage de version Kotlin / KSP compatible
  - `newArchEnabled=true` pour être aligné avec `app.json`

## Scripts NPM utiles

Depuis le dossier `app-mobile` :

npm start        # Lancer Metro / Expo en dev
npm run android  # Lancer sur un appareil ou émulateur Android (expo run:android)
npm run ios      # Lancer sur iOS (si environnement configuré)## Contribuer / continuer le développement

1. Créer une branche pour chaque nouvelle fonctionnalité :
  
   git checkout -b feature/ma-fonctionnalite
   2. Faire les modifications, puis :
  
   git add .
   git commit -m "Ajoute ma fonctionnalité"
   git push origin feature/ma-fonctionnalite
   ## Licence

Projet privé / personnel (non destiné pour l’instant à une diffusion publique sous licence open source).
