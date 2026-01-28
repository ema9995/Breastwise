import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
  Linking,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { colors, spacing, borderRadius } from '../theme/colors';

const categories = [
  { id: 'all', name: 'Tous' },
  { id: 'respiration', name: 'Respiration' },
  { id: 'visualisation', name: 'Visualisation' },
  { id: 'meditation', name: 'Méditation' },
  { id: 'creatif', name: 'Créatif' },
  { id: 'mouvement', name: 'Mouvement doux' },
  { id: 'ancrage', name: 'Ancrage' },
  { id: 'apaisement', name: 'Apaisement' },
  { id: 'energie', name: 'Énergie' },
];

// Musiques douces - Lofi et Ghibli qui changent chaque jour
const dailyMusicPlaylist = [
  { url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', title: 'Lofi Hip Hop - Chill Beats' },
  { url: 'https://www.youtube.com/watch?v=DWcJFNfaw9c', title: 'Studio Ghibli - Relaxing Music' },
  { url: 'https://www.youtube.com/watch?v=5qap5aO4i9A', title: 'Lofi Girl - 24/7 Radio' },
  { url: 'https://www.youtube.com/watch?v=kgx4WGK0oNU', title: 'Studio Ghibli - Piano Collection' },
  { url: 'https://www.youtube.com/watch?v=7NOSDKb0HlE', title: 'Lofi Chill - Relaxing Vibes' },
  { url: 'https://www.youtube.com/watch?v=Yx57A0kX5iU', title: 'Studio Ghibli - Nature Sounds' },
  { url: 'https://www.youtube.com/watch?v=1ot9tO84m0E', title: 'Lofi Beats - Cozy Vibes' },
  { url: 'https://www.youtube.com/watch?v=4rO3J82ZfK0', title: 'Studio Ghibli - Calm & Peaceful' },
  { url: 'https://www.youtube.com/watch?v=5yx6BWlEVcY', title: 'Lofi Hip Hop - Study Session' },
  { url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY', title: 'Studio Ghibli - Meditation Music' },
];

const getDailyMusic = () => {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today - startOfYear;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dailyMusicPlaylist[dayOfYear % dailyMusicPlaylist.length];
};

// Tutoriels YouTube pour crochet/tricot par niveau
const crochetTutorials = {
  debutant: [
    { url: 'https://www.youtube.com/watch?v=JwPptEwX4DE', title: 'Crochet débutant - Les bases' },
    { url: 'https://www.youtube.com/watch?v=qpYAyn68Zjg', title: 'Crochet débutant - Première maille' },
    { url: 'https://www.youtube.com/watch?v=lze5S-Sk2g4', title: 'Crochet débutant - Techniques de base' },
  ],
  intermediaire: [
    { url: 'https://www.youtube.com/watch?v=jSThpcmbyig', title: 'Crochet intermédiaire - Motifs' },
    { url: 'https://www.youtube.com/watch?v=nuyTMDIPPwI', title: 'Crochet intermédiaire - Augmentations' },
    { url: 'https://www.youtube.com/watch?v=Um82jehMQKY', title: 'Crochet intermédiaire - Techniques avancées' },
  ],
  avance: [
    { url: 'https://www.youtube.com/watch?v=IfnROBVdwEA', title: 'Crochet avancé - Techniques complexes' },
    { url: 'https://www.youtube.com/watch?v=qfcagn191gw', title: 'Crochet avancé - Motifs sophistiqués' },
    { url: 'https://www.youtube.com/watch?v=44pxrfO51_w', title: 'Crochet avancé - Projets complexes' },
  ],
};

const tricotTutorials = {
  debutant: [
    { url: 'https://www.youtube.com/watch?v=o4Let1KyWX4', title: 'Tricot débutant - Monter les mailles' },
    { url: 'https://www.youtube.com/watch?v=rV9h09xsr7w', title: 'Tricot débutant - Point jersey' },
    { url: 'https://www.youtube.com/watch?v=p7QUKjDNenk', title: 'Tricot débutant - Techniques de base' },
  ],
  intermediaire: [
    { url: 'https://www.youtube.com/watch?v=3v6IG2xy268', title: 'Tricot intermédiaire - Augmentations' },
    { url: 'https://www.youtube.com/watch?v=EosvysATl3I', title: 'Tricot intermédiaire - Diminutions' },
    { url: 'https://www.youtube.com/watch?v=AzZJIATJOfI', title: 'Tricot intermédiaire - Techniques avancées' },
  ],
  avance: [
    { url: 'https://www.youtube.com/watch?v=cRwfU1E1SKk', title: 'Tricot avancé - Cables' },
    { url: 'https://www.youtube.com/watch?v=wWnzbEpEKMw', title: 'Tricot avancé - Motifs complexes' },
    { url: 'https://www.youtube.com/watch?v=bWg8AlLSwgw', title: 'Tricot avancé - Techniques expertes' },
  ],
};

// URLs de coloriages apaisants
const coloringPages = [
  'https://www.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2022/01/mandala-coloring-page-1.png',
  'https://www.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2022/01/mandala-coloring-page-2.png',
  'https://www.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2022/01/flower-mandala-coloring-page.png',
];

const exercises = [
  // RESPIRATION
  {
    id: 1,
    title: 'Respiration profonde',
    icon: 'leaf',
    category: 'respiration',
    duration: '5 min',
    description: 'Exercice de respiration pour calmer l\'anxiété et réduire le stress.',
    steps: [
      'Asseyez-vous confortablement',
      'Inspirez profondément par le nez (4 secondes)',
      'Retenez votre souffle (4 secondes)',
      'Expirez lentement par la bouche (6 secondes)',
      'Répétez 5 à 10 fois',
    ],
    guidanceSteps: [
      { time: 0, message: 'Prenez un moment pour vous installer confortablement. Fermez doucement les yeux si vous le souhaitez.' },
      { time: 10, message: 'Commencez par prendre conscience de votre respiration. Laissez-la être naturelle, sans forcer.' },
      { time: 20, message: 'Maintenant, inspirez très doucement par le nez. Laissez l\'air remplir vos poumons lentement, un, deux, trois, quatre.' },
      { time: 30, message: 'Retenez votre souffle quelques instants, en douceur. Un, deux, trois, quatre.' },
      { time: 40, message: 'Expirez maintenant très lentement par la bouche. Laissez l\'air sortir tout doucement, un, deux, trois, quatre, cinq, six.' },
      { time: 50, message: 'Reprenez une respiration naturelle. Laissez votre corps se détendre.' },
      { time: 70, message: 'Quand vous êtes prête, recommencez ce cycle. Inspirez doucement par le nez, un, deux, trois, quatre.' },
      { time: 80, message: 'Retenez votre souffle en douceur, un, deux, trois, quatre.' },
      { time: 90, message: 'Expirez lentement par la bouche, un, deux, trois, quatre, cinq, six.' },
      { time: 120, message: 'Continuez à votre rythme. L\'important est la douceur et la lenteur de votre respiration.' },
      { time: 180, message: 'Vous êtes à mi-parcours. Laissez-vous baigner dans cette sensation de calme profond.' },
      { time: 240, message: 'Dernière minute. Profitez de ces derniers instants de paix et de sérénité.' },
    ],
  },
  {
    id: 2,
    title: 'Respiration carrée',
    icon: 'square',
    category: 'respiration',
    duration: '8 min',
    description: 'Technique de respiration en quatre temps pour équilibrer votre système nerveux.',
    steps: [
      'Inspirez par le nez (4 secondes)',
      'Retenez votre souffle (4 secondes)',
      'Expirez par la bouche (4 secondes)',
      'Pause avant la prochaine inspiration (4 secondes)',
      'Répétez le cycle',
    ],
    guidanceSteps: [
      { time: 0, message: 'Installez-vous confortablement. Cette technique de respiration carrée va vous aider à vous recentrer.' },
      { time: 15, message: 'Inspirez doucement par le nez en comptant jusqu\'à quatre. Un, deux, trois, quatre.' },
      { time: 25, message: 'Retenez votre souffle en comptant jusqu\'à quatre. Un, deux, trois, quatre.' },
      { time: 35, message: 'Expirez lentement par la bouche en comptant jusqu\'à quatre. Un, deux, trois, quatre.' },
      { time: 45, message: 'Faites une pause avant la prochaine inspiration, en comptant jusqu\'à quatre. Un, deux, trois, quatre.' },
      { time: 60, message: 'Recommencez ce cycle. Inspirez, retenez, expirez, pause. Tout en douceur.' },
      { time: 120, message: 'Continuez à votre rythme. Laissez cette respiration carrée vous apaiser profondément.' },
      { time: 240, message: 'Vous êtes à mi-parcours. Ressentez l\'équilibre qui s\'installe en vous.' },
      { time: 420, message: 'Dernière minute. Profitez de cette sensation de stabilité et de paix.' },
    ],
  },
  {
    id: 3,
    title: 'Respiration ventrale',
    icon: 'body',
    category: 'respiration',
    duration: '6 min',
    description: 'Respiration profonde par le ventre pour activer la relaxation.',
    steps: [
      'Placez une main sur votre ventre',
      'Inspirez en gonflant le ventre',
      'Expirez en rentrant le ventre',
      'Ressentez le mouvement',
      'Continuez à votre rythme',
    ],
    guidanceSteps: [
      { time: 0, message: 'Placez une main sur votre ventre. Fermez doucement les yeux.' },
      { time: 10, message: 'Inspirez très doucement par le nez en laissant votre ventre se gonfler comme un ballon.' },
      { time: 20, message: 'Expirez lentement par la bouche en laissant votre ventre se dégonfler doucement.' },
      { time: 35, message: 'Ressentez le mouvement de votre main qui monte et descend avec votre respiration.' },
      { time: 50, message: 'Continuez cette respiration ventrale. Laissez votre corps se détendre avec chaque expiration.' },
      { time: 120, message: 'Vous êtes à mi-parcours. Laissez cette respiration profonde vous apaiser.' },
      { time: 300, message: 'Dernière minute. Profitez de cette sensation de détente profonde.' },
    ],
  },
  
  // VISUALISATION
  {
    id: 4,
    title: 'Visualisation positive',
    icon: 'eye',
    category: 'visualisation',
    duration: '10 min',
    description: 'Visualisez un endroit apaisant pour vous détendre mentalement.',
    steps: [
      'Fermez les yeux',
      'Imaginez un endroit qui vous apaise',
      'Visualisez tous les détails (couleurs, sons, sensations)',
      'Ressentez la paix et la sérénité',
      'Restez dans cet état quelques minutes',
    ],
    guidanceSteps: [
      { time: 0, message: 'Fermez doucement les yeux. Prenez quelques respirations profondes et lentes.' },
      { time: 15, message: 'Laissez votre esprit imaginer un endroit qui vous apaise profondément. Cela peut être un lieu réel ou imaginaire.' },
      { time: 40, message: 'Visualisez maintenant les couleurs de cet endroit. Quelles teintes douces vous apaisent ? Laissez ces couleurs vous envelopper.' },
      { time: 80, message: 'Ajoutez maintenant les sons. Entendez-vous le bruit doux des vagues, le chant apaisant des oiseaux, ou le silence bienfaisant ?' },
      { time: 120, message: 'Ressentez les sensations sur votre peau. La chaleur douce du soleil, la brise légère, la douceur du sol sous vos pieds.' },
      { time: 180, message: 'Laissez-vous complètement baigner dans cette paix. Vous êtes en sécurité, vous êtes apaisée.' },
      { time: 300, message: 'Continuez à explorer cet endroit en douceur. Découvrez de nouveaux détails apaisants, sans vous presser.' },
      { time: 450, message: 'Vous êtes à mi-parcours. Profitez pleinement de ce moment de sérénité profonde.' },
      { time: 540, message: 'Gardez cette sensation de paix avec vous. Elle vous accompagne et vous protège.' },
      { time: 570, message: 'Dernière minute. Imprégnez-vous bien de cette sensation de bien-être et de calme intérieur.' },
    ],
  },
  {
    id: 5,
    title: 'Visualisation de la lumière',
    icon: 'sunny',
    category: 'visualisation',
    duration: '8 min',
    description: 'Visualisez une lumière douce qui vous enveloppe et vous réchauffe.',
    steps: [
      'Fermez les yeux',
      'Imaginez une lumière douce et chaude',
      'Laissez-la vous envelopper',
      'Ressentez sa chaleur bienfaisante',
      'Laissez-la pénétrer dans tout votre corps',
    ],
    guidanceSteps: [
      { time: 0, message: 'Fermez doucement les yeux. Prenez quelques respirations profondes.' },
      { time: 15, message: 'Imaginez maintenant une lumière douce et chaude, comme celle du soleil au coucher. Elle est douce, apaisante.' },
      { time: 40, message: 'Laissez cette lumière vous envelopper progressivement. Elle vous entoure de toute part, comme une couverture douce.' },
      { time: 80, message: 'Ressentez sa chaleur bienfaisante sur votre peau. Cette chaleur douce qui vous réchauffe et vous apaise.' },
      { time: 120, message: 'Laissez cette lumière pénétrer dans tout votre corps. Elle remplit chaque partie de vous de douceur et de paix.' },
      { time: 240, message: 'Vous êtes à mi-parcours. Laissez-vous baigner dans cette lumière apaisante.' },
      { time: 420, message: 'Dernière minute. Imprégnez-vous de cette sensation de chaleur et de bien-être.' },
    ],
  },
  
  // MÉDITATION
  {
    id: 6,
    title: 'Méditation guidée',
    icon: 'flower',
    category: 'meditation',
    duration: '15 min',
    description: 'Méditation pour vous reconnecter à vous-même et trouver la paix intérieure.',
    steps: [
      'Installez-vous dans un endroit calme',
      'Fermez les yeux et respirez naturellement',
      'Portez attention à votre respiration',
      'Laissez les pensées passer sans les juger',
      'Revenez doucement à l\'instant présent',
    ],
    guidanceSteps: [
      { time: 0, message: 'Installez-vous dans un endroit calme. Fermez doucement les yeux.' },
      { time: 15, message: 'Respirez naturellement, sans forcer. Laissez votre respiration être ce qu\'elle est, douce et naturelle.' },
      { time: 45, message: 'Portez maintenant attention à votre respiration. Suivez doucement l\'air qui entre et qui sort, sans effort.' },
      { time: 90, message: 'Si des pensées arrivent, laissez-les passer sans les juger. Comme des nuages qui passent dans le ciel, doucement.' },
      { time: 150, message: 'Revenez doucement à votre respiration. C\'est votre point d\'ancrage, votre refuge de paix.' },
      { time: 240, message: 'Vous êtes ici, maintenant. Dans cet instant présent, il n\'y a que la paix et la sérénité.' },
      { time: 420, message: 'Vous êtes à mi-parcours. Continuez à observer votre respiration avec bienveillance et douceur.' },
      { time: 600, message: 'Laissez-vous baigner dans cette sensation de calme intérieur profond.' },
      { time: 780, message: 'Vous êtes connectée à vous-même. Profitez de cette connexion profonde et apaisante.' },
      { time: 870, message: 'Dernière minute. Imprégnez-vous bien de cette paix intérieure qui vous habite.' },
    ],
  },
  {
    id: 7,
    title: 'Méditation de pleine conscience',
    icon: 'leaf',
    category: 'meditation',
    duration: '12 min',
    description: 'Pratique de pleine conscience pour être présente à l\'instant.',
    steps: [
      'Asseyez-vous confortablement',
      'Portez attention à votre corps',
      'Observez vos sensations sans jugement',
      'Revenez à l\'instant présent',
      'Ressentez la paix intérieure',
    ],
    guidanceSteps: [
      { time: 0, message: 'Asseyez-vous confortablement. Fermez doucement les yeux.' },
      { time: 15, message: 'Portez maintenant attention à votre corps. Ressentez les points de contact avec le sol ou la chaise.' },
      { time: 60, message: 'Observez vos sensations sans jugement. Qu\'est-ce que vous ressentez ? Laissez les sensations être ce qu\'elles sont.' },
      { time: 120, message: 'Revenez doucement à l\'instant présent. Vous êtes ici, maintenant, dans ce moment précis.' },
      { time: 240, message: 'Ressentez la paix intérieure qui s\'installe. Cette sensation de présence et de calme.' },
      { time: 420, message: 'Vous êtes à mi-parcours. Continuez à observer avec bienveillance.' },
      { time: 600, message: 'Dernière minute. Profitez de cette sensation de présence et de paix.' },
    ],
  },
  
  // CRÉATIF
  {
    id: 8,
    title: 'Dessin méditatif',
    icon: 'color-palette',
    category: 'creatif',
    duration: '10 min',
    description: 'Laissez votre créativité s\'exprimer à travers le dessin libre.',
    steps: [
      'Prenez un papier et un crayon',
      'Laissez votre main dessiner librement',
      'Sans objectif, sans jugement',
      'Ressentez le mouvement de votre main',
      'Laissez les formes émerger naturellement',
    ],
    guidanceSteps: [
      { time: 0, message: 'Prenez un papier et un crayon. Installez-vous confortablement.' },
      { time: 15, message: 'Laissez votre main dessiner librement. Pas besoin de créer quelque chose de précis, juste laissez votre main bouger.' },
      { time: 60, message: 'Sans objectif, sans jugement. Laissez les lignes et les formes émerger naturellement.' },
      { time: 120, message: 'Ressentez le mouvement de votre main. Cette sensation de fluidité et de liberté.' },
      { time: 240, message: 'Laissez les formes émerger naturellement. Observez ce qui apparaît sans chercher à contrôler.' },
      { time: 420, message: 'Vous êtes à mi-parcours. Continuez à laisser votre créativité s\'exprimer.' },
      { time: 540, message: 'Dernière minute. Profitez de ce moment de création libre et apaisante.' },
    ],
  },
  {
    id: 9,
    title: 'Écriture intuitive',
    icon: 'create',
    category: 'creatif',
    duration: '8 min',
    description: 'Écrivez librement ce qui vous vient à l\'esprit, sans filtre.',
    steps: [
      'Prenez un carnet et un stylo',
      'Écrivez tout ce qui vous passe par la tête',
      'Sans vous censurer',
      'Laissez les mots couler',
      'Ressentez la libération',
    ],
    guidanceSteps: [
      { time: 0, message: 'Prenez un carnet et un stylo. Installez-vous confortablement.' },
      { time: 15, message: 'Écrivez tout ce qui vous passe par la tête. Laissez les mots couler librement.' },
      { time: 60, message: 'Sans vous censurer. Écrivez ce qui vous vient, même si cela semble confus ou incohérent.' },
      { time: 120, message: 'Laissez les mots couler. Cette écriture est pour vous, personne d\'autre ne la lira.' },
      { time: 240, message: 'Ressentez la libération. Cette sensation de laisser sortir ce qui est en vous.' },
      { time: 360, message: 'Vous êtes à mi-parcours. Continuez à écrire librement.' },
      { time: 450, message: 'Dernière minute. Laissez les derniers mots s\'exprimer.' },
    ],
  },
  {
    id: 18,
    title: 'Musique douce',
    icon: 'musical-notes',
    category: 'creatif',
    duration: 'Variable',
    description: 'Laissez-vous bercer par une musique douce Lofi ou Ghibli qui change chaque jour.',
    steps: [
      'Installez-vous confortablement',
      'Fermez les yeux si vous le souhaitez',
      'Lancez la musique du jour',
      'Laissez-vous porter par les mélodies',
      'Ressentez la détente',
    ],
    guidanceSteps: [
      { time: 0, message: 'Installez-vous confortablement. Cette musique douce va vous accompagner.' },
      { time: 30, message: 'Fermez doucement les yeux si vous le souhaitez. Laissez la musique vous envelopper.' },
      { time: 60, message: 'Laissez-vous porter par les mélodies. Laissez votre corps se détendre au rythme de la musique.' },
      { time: 180, message: 'Ressentez la détente qui s\'installe. Cette musique douce vous apaise et vous ressource.' },
    ],
    specialType: 'music',
  },
  {
    id: 19,
    title: 'Crochet ou Tricot',
    icon: 'create',
    category: 'creatif',
    duration: 'Variable',
    description: 'Apprenez le crochet ou le tricot avec des tutoriels adaptés à votre niveau.',
    steps: [
      'Choisissez votre activité (crochet ou tricot)',
      'Sélectionnez votre niveau',
      'Regardez le tutoriel adapté',
      'Suivez les instructions à votre rythme',
      'Profitez de ce moment créatif',
    ],
    guidanceSteps: [
      { time: 0, message: 'Choisissez votre activité préférée. Crochet ou tricot, les deux sont apaisants.' },
      { time: 30, message: 'Sélectionnez votre niveau. Débutant, intermédiaire ou avancé, il y a un tutoriel pour vous.' },
      { time: 60, message: 'Regardez le tutoriel adapté à votre niveau. Prenez votre temps, il n\'y a pas de pression.' },
      { time: 120, message: 'Suivez les instructions à votre rythme. Chaque point, chaque maille est un moment de calme.' },
      { time: 240, message: 'Profitez de ce moment créatif. Le crochet et le tricot sont des activités méditatives et apaisantes.' },
    ],
    specialType: 'craft',
  },
  {
    id: 20,
    title: 'Coloriage apaisant',
    icon: 'color-palette',
    category: 'creatif',
    duration: 'Variable',
    description: 'Téléchargez et imprimez un coloriage apaisant pour vous détendre.',
    steps: [
      'Choisissez un coloriage',
      'Téléchargez-le',
      'Imprimez-le si vous le souhaitez',
      'Colorez à votre rythme',
      'Ressentez la détente',
    ],
    guidanceSteps: [
      { time: 0, message: 'Choisissez un coloriage qui vous plaît. Il y en a pour tous les goûts.' },
      { time: 30, message: 'Téléchargez le coloriage. Vous pourrez l\'imprimer ensuite si vous le souhaitez.' },
      { time: 60, message: 'Colorez à votre rythme. Pas besoin de vous presser, prenez votre temps.' },
      { time: 180, message: 'Ressentez la détente qui s\'installe. Le coloriage est une activité méditative et apaisante.' },
    ],
    specialType: 'coloring',
  },
  
  // MOUVEMENT DOUX
  {
    id: 10,
    title: 'Étirements doux',
    icon: 'fitness',
    category: 'mouvement',
    duration: '15 min',
    description: 'Mouvements doux pour détendre votre corps et réduire les tensions.',
    steps: [
      'Commencez par des rotations douces du cou',
      'Étirez vos bras vers le ciel',
      'Faites des rotations des épaules',
      'Étirez doucement votre dos',
      'Terminez par des étirements des jambes',
    ],
    guidanceSteps: [
      { time: 0, message: 'Commencez très doucement par des rotations lentes du cou. Tournez la tête très lentement de gauche à droite, sans forcer.' },
      { time: 40, message: 'Maintenant, levez très doucement vos bras vers le ciel. Tenez cette position en douceur pendant 10 secondes, puis relâchez lentement.' },
      { time: 80, message: 'Faites des rotations très lentes des épaules. Cinq fois en avant, très doucement, puis cinq fois en arrière, tout en douceur.' },
      { time: 150, message: 'Étirez maintenant doucement votre dos. Penchez-vous très lentement en avant, sans forcer, puis relevez-vous tout doucement.' },
      { time: 220, message: 'Terminez par des étirements très doux des jambes. Étirez une jambe lentement, puis l\'autre, en écoutant votre corps.' },
      { time: 360, message: 'Répétez ces mouvements à votre rythme, très lentement. L\'important est la douceur et l\'écoute de votre corps.' },
      { time: 600, message: 'Vous êtes à mi-parcours. Continuez ces mouvements doux et fluides, sans vous presser.' },
      { time: 750, message: 'Prenez votre temps. Écoutez votre corps et respectez ses limites. Chaque mouvement doit être doux et apaisant.' },
    ],
  },
  {
    id: 11,
    title: 'Yoga doux',
    icon: 'body',
    category: 'mouvement',
    duration: '20 min',
    description: 'Séquence de postures de yoga douces pour détendre le corps.',
    steps: [
      'Commencez par la posture de l\'enfant',
      'Passez à la posture du chat-vache',
      'Faites une torsion douce',
      'Terminez en position allongée',
      'Ressentez la détente',
    ],
    guidanceSteps: [
      { time: 0, message: 'Commencez par la posture de l\'enfant. Asseyez-vous sur vos talons, penchez-vous en avant, les bras le long du corps.' },
      { time: 60, message: 'Passez maintenant à la posture du chat-vache. À quatre pattes, arrondissez puis creusez doucement votre dos.' },
      { time: 180, message: 'Faites une torsion douce. Assise, tournez doucement le torse vers la droite, puis vers la gauche.' },
      { time: 360, message: 'Terminez en position allongée. Allongez-vous sur le dos, les bras le long du corps, les jambes détendues.' },
      { time: 600, message: 'Ressentez la détente dans tout votre corps. Laissez chaque muscle se relâcher complètement.' },
      { time: 900, message: 'Vous êtes à mi-parcours. Continuez ces mouvements doux et respectueux de votre corps.' },
      { time: 1080, message: 'Dernière minute. Profitez de cette sensation de détente profonde.' },
    ],
  },
  
  // ANCRAGE
  {
    id: 12,
    title: 'Ancrage 5-4-3-2-1',
    icon: 'footsteps',
    category: 'ancrage',
    duration: '5 min',
    description: 'Technique d\'ancrage pour revenir au moment présent.',
    steps: [
      'Nommez 5 choses que vous voyez',
      'Nommez 4 choses que vous touchez',
      'Nommez 3 choses que vous entendez',
      'Nommez 2 choses que vous sentez',
      'Nommez 1 chose que vous goûtez',
    ],
    guidanceSteps: [
      { time: 0, message: 'Prenez un moment pour vous ancrer dans le présent. Ouvrez doucement les yeux si vous les aviez fermés.' },
      { time: 10, message: 'Nommez maintenant 5 choses que vous voyez autour de vous. Prenez votre temps pour les identifier.' },
      { time: 40, message: 'Nommez 4 choses que vous pouvez toucher. Ressentez la texture de chaque objet sous vos doigts.' },
      { time: 70, message: 'Nommez 3 choses que vous entendez. Écoutez attentivement les sons qui vous entourent.' },
      { time: 100, message: 'Nommez 2 choses que vous sentez. Portez attention aux odeurs autour de vous.' },
      { time: 130, message: 'Nommez 1 chose que vous goûtez. Prenez conscience du goût dans votre bouche.' },
      { time: 180, message: 'Ressentez maintenant votre présence dans cet instant. Vous êtes ici, maintenant, ancrée dans le présent.' },
      { time: 240, message: 'Dernière minute. Profitez de cette sensation d\'ancrage et de présence.' },
    ],
  },
  {
    id: 13,
    title: 'Ancrage par la respiration',
    icon: 'leaf',
    category: 'ancrage',
    duration: '6 min',
    description: 'Utilisez votre respiration comme point d\'ancrage au présent.',
    steps: [
      'Portez attention à votre respiration',
      'Ressentez l\'air entrer et sortir',
      'Comptez chaque respiration',
      'Revenez à la respiration si vous vous perdez',
      'Ressentez votre présence',
    ],
    guidanceSteps: [
      { time: 0, message: 'Portez maintenant attention à votre respiration. C\'est votre point d\'ancrage.' },
      { time: 15, message: 'Ressentez l\'air entrer et sortir de vos narines. Cette sensation douce et régulière.' },
      { time: 40, message: 'Comptez chaque respiration. Un à l\'inspiration, deux à l\'expiration. Recommencez jusqu\'à dix.' },
      { time: 80, message: 'Si votre esprit s\'égare, revenez doucement à votre respiration. C\'est normal, c\'est votre ancre.' },
      { time: 120, message: 'Ressentez votre présence dans cet instant. Vous êtes ici, maintenant, ancrée par votre respiration.' },
      { time: 240, message: 'Vous êtes à mi-parcours. Continuez à vous ancrer dans votre respiration.' },
      { time: 300, message: 'Dernière minute. Profitez de cette sensation d\'ancrage profond.' },
    ],
  },
  
  // APAISEMENT
  {
    id: 14,
    title: 'Relaxation musculaire',
    icon: 'body',
    category: 'apaisement',
    duration: '10 min',
    description: 'Technique de relaxation progressive pour libérer les tensions.',
    steps: [
      'Allongez-vous confortablement',
      'Tendez chaque groupe musculaire (5 secondes)',
      'Relâchez complètement (10 secondes)',
      'Commencez par les pieds, remontez jusqu\'à la tête',
      'Ressentez la détente dans tout votre corps',
    ],
    guidanceSteps: [
      { time: 0, message: 'Allongez-vous confortablement. Fermez doucement les yeux et prenez quelques respirations lentes.' },
      { time: 15, message: 'Commencez par les pieds. Tendez très doucement tous les muscles de vos pieds pendant 5 secondes. Un, deux, trois, quatre, cinq.' },
      { time: 25, message: 'Relâchez maintenant complètement. Ressentez la détente profonde pendant 10 secondes. Laissez la tension s\'échapper.' },
      { time: 45, message: 'Maintenant, les mollets. Tendez très doucement pendant 5 secondes. Un, deux, trois, quatre, cinq.' },
      { time: 55, message: 'Relâchez complètement. Ressentez la détente qui s\'installe.' },
      { time: 75, message: 'Les cuisses maintenant. Tendez doucement pendant 5 secondes, puis relâchez complètement. Ressentez la détente.' },
      { time: 100, message: 'Le ventre. Tendez très doucement, puis relâchez. Ressentez la détente profonde.' },
      { time: 130, message: 'Les mains et les bras. Tendez tous les muscles en douceur, puis relâchez complètement. Laissez la tension s\'échapper.' },
      { time: 160, message: 'Les épaules et le cou. Tendez très doucement, puis relâchez. Ressentez la détente profonde qui s\'installe.' },
      { time: 200, message: 'Le visage maintenant. Tendez tous les muscles du visage en douceur, puis relâchez complètement.' },
      { time: 240, message: 'Ressentez maintenant la détente dans tout votre corps. Vous êtes complètement détendue, en paix.' },
      { time: 360, message: 'Vous êtes à mi-parcours. Continuez à ressentir cette détente profonde qui vous envahit.' },
      { time: 540, message: 'Dernière minute. Profitez de cette sensation de bien-être complet et de paix intérieure.' },
    ],
  },
  {
    id: 15,
    title: 'Bain sonore apaisant',
    icon: 'musical-notes',
    category: 'apaisement',
    duration: '12 min',
    description: 'Laissez-vous bercer par des sons apaisants pour vous détendre.',
    steps: [
      'Installez-vous confortablement',
      'Fermez les yeux',
      'Portez attention aux sons',
      'Laissez-les vous envelopper',
      'Ressentez la détente',
    ],
    guidanceSteps: [
      { time: 0, message: 'Installez-vous confortablement. Fermez doucement les yeux.' },
      { time: 15, message: 'Portez maintenant attention aux sons qui vous entourent. Écoutez-les sans jugement.' },
      { time: 60, message: 'Laissez ces sons vous envelopper. Comme une couverture douce qui vous apaise.' },
      { time: 180, message: 'Ressentez la détente qui s\'installe. Laissez les sons vous bercer doucement.' },
      { time: 360, message: 'Vous êtes à mi-parcours. Continuez à vous laisser bercer par ces sons apaisants.' },
      { time: 600, message: 'Dernière minute. Profitez de cette sensation de paix et de sérénité.' },
    ],
  },
  
  // ÉNERGIE
  {
    id: 16,
    title: 'Gratitude',
    icon: 'heart',
    category: 'energie',
    duration: '5 min',
    description: 'Pratique de gratitude pour cultiver des émotions positives.',
    steps: [
      'Prenez un moment de calme',
      'Pensez à 3 choses pour lesquelles vous êtes reconnaissante',
      'Écrivez-les ou visualisez-les',
      'Ressentez la gratitude dans votre corps',
      'Gardez cette sensation avec vous',
    ],
    guidanceSteps: [
      { time: 0, message: 'Prenez un moment de calme profond. Fermez doucement les yeux et respirez lentement.' },
      { time: 20, message: 'Pensez maintenant à une première chose pour laquelle vous êtes reconnaissante. Laissez cette pensée s\'installer doucement en vous.' },
      { time: 60, message: 'Ajoutez une deuxième chose. Peut-être une personne chère, un moment précieux, ou une qualité que vous appréciez en vous.' },
      { time: 100, message: 'Pensez à une troisième chose. Même les petites choses comptent. Laissez la gratitude grandir en vous.' },
      { time: 150, message: 'Ressentez maintenant la gratitude dans votre corps. Où la sentez-vous ? Laissez cette sensation douce vous envahir.' },
      { time: 210, message: 'Laissez cette sensation de gratitude grandir et s\'étendre dans tout votre être.' },
      { time: 270, message: 'Gardez cette sensation avec vous. Elle vous accompagne et vous réchauffe le cœur tout au long de la journée.' },
    ],
  },
  {
    id: 17,
    title: 'Affirmations positives',
    icon: 'sparkles',
    category: 'energie',
    duration: '7 min',
    description: 'Répétez des affirmations positives pour nourrir votre énergie.',
    steps: [
      'Choisissez une affirmation qui résonne',
      'Répétez-la doucement à voix haute',
      'Ressentez-la dans votre corps',
      'Laissez-la s\'ancrer en vous',
      'Portez-la avec vous',
    ],
    guidanceSteps: [
      { time: 0, message: 'Choisissez une affirmation qui résonne avec vous. Par exemple : "Je suis forte et capable" ou "Je mérite le bonheur".' },
      { time: 20, message: 'Répétez cette affirmation doucement à voix haute. Laissez les mots résonner en vous.' },
      { time: 60, message: 'Ressentez cette affirmation dans votre corps. Où la sentez-vous ? Laissez cette sensation grandir.' },
      { time: 120, message: 'Laissez cette affirmation s\'ancrer en vous. Répétez-la encore, en ressentant sa vérité.' },
      { time: 240, message: 'Portez cette affirmation avec vous. Elle vous accompagne et vous renforce.' },
      { time: 360, message: 'Vous êtes à mi-parcours. Continuez à nourrir cette énergie positive.' },
      { time: 420, message: 'Dernière minute. Imprégnez-vous bien de cette sensation de force et de bien-être.' },
    ],
  },
];

export default function WellbeingScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasReadAllSteps, setHasReadAllSteps] = useState(false);
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(true);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [dailyMusic, setDailyMusic] = useState(null);
  const guidanceIndexRef = useRef(0);
  const lastGuidanceTimeRef = useRef(-1);

  useEffect(() => {
    setDailyMusic(getDailyMusic());
  }, []);

  const filteredExercises = selectedCategory === 'all' 
    ? exercises 
    : exercises.filter(ex => ex.category === selectedCategory);

  useEffect(() => {
    let interval = null;
    if (isTimerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((time) => {
          if (time <= 1) {
            setIsTimerActive(false);
            Speech.stop();
            Alert.alert(
              'Exercice terminé ! 🌸',
              'Félicitations, vous avez terminé l\'exercice. Prenez un moment pour ressentir les bienfaits.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    finishExercise();
                  },
                },
              ]
            );
            return 0;
          }
          return time - 1;
        });
        setTotalTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else if (!isTimerActive && timeRemaining !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeRemaining]);

  useEffect(() => {
    if (isActive && selectedExercise && currentStep === selectedExercise.steps.length - 1) {
      setHasReadAllSteps(true);
    }
  }, [currentStep, isActive, selectedExercise]);

  useEffect(() => {
    if (isActive && selectedExercise && voiceoverEnabled && !isTimerActive) {
      const currentStepText = selectedExercise.steps[currentStep];
      Speech.stop();
      const timeout = setTimeout(() => {
        Speech.speak(currentStepText, {
          language: 'fr-FR',
          pitch: 1.1,
          rate: 0.9,
        });
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [currentStep, isActive, selectedExercise, voiceoverEnabled, isTimerActive]);

  useEffect(() => {
    if (!isTimerActive || !selectedExercise || !voiceoverEnabled || !selectedExercise.guidanceSteps) {
      return;
    }

    const guidanceSteps = selectedExercise.guidanceSteps;
    
    const nextGuidance = guidanceSteps.find(
      (step, index) => 
        step.time <= totalTimeElapsed && 
        index >= guidanceIndexRef.current &&
        step.time !== lastGuidanceTimeRef.current
    );

    if (nextGuidance) {
      const currentIndex = guidanceSteps.indexOf(nextGuidance);
      
      if (currentIndex >= guidanceIndexRef.current && nextGuidance.time !== lastGuidanceTimeRef.current) {
        const timeout = setTimeout(() => {
          Speech.stop();
          Speech.speak(nextGuidance.message, {
            language: 'fr-FR',
            pitch: 1.1,
            rate: 0.9,
          });
          guidanceIndexRef.current = currentIndex + 1;
          lastGuidanceTimeRef.current = nextGuidance.time;
        }, 800);

        return () => clearTimeout(timeout);
      }
    }
  }, [totalTimeElapsed, isTimerActive, selectedExercise, voiceoverEnabled]);

  // Fonction améliorée pour ouvrir YouTube (app ou navigateur)
  const openYouTube = async (url) => {
    try {
      // Extraire l'ID de la vidéo YouTube
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;
      
      if (!videoId) {
        Alert.alert('Erreur', 'URL YouTube invalide.');
        return;
      }

      // Essayer d'ouvrir dans l'app YouTube d'abord (Android)
      if (Platform.OS === 'android') {
        const youtubeAppUrl = `vnd.youtube:${videoId}`;
        try {
          const canOpenApp = await Linking.canOpenURL(youtubeAppUrl);
          if (canOpenApp) {
            await Linking.openURL(youtubeAppUrl);
            return;
          }
        } catch (e) {
          // Si l'app n'est pas disponible, continuer avec le navigateur
        }
      }

      // Pour iOS, essayer l'app YouTube
      if (Platform.OS === 'ios') {
        const youtubeAppUrl = `youtube://watch?v=${videoId}`;
        try {
          const canOpenApp = await Linking.canOpenURL(youtubeAppUrl);
          if (canOpenApp) {
            await Linking.openURL(youtubeAppUrl);
            return;
          }
        } catch (e) {
          // Si l'app n'est pas disponible, continuer avec le navigateur
        }
      }

      // Sinon, ouvrir dans le navigateur mobile
      const youtubeMobileUrl = `https://m.youtube.com/watch?v=${videoId}`;
      const supported = await Linking.canOpenURL(youtubeMobileUrl);
      if (supported) {
        await Linking.openURL(youtubeMobileUrl);
      } else {
        // Dernier recours : URL desktop
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening YouTube:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir la vidéo YouTube. Vérifiez votre connexion internet et que l\'application YouTube est installée.'
      );
    }
  };

  const openMusic = async () => {
    if (dailyMusic) {
      await openYouTube(dailyMusic.url);
    }
  };

  const openTutorial = async (url) => {
    await openYouTube(url);
  };

  const downloadColoring = async (url) => {
    Alert.alert(
      'Télécharger le coloriage',
      'Le coloriage va s\'ouvrir dans votre navigateur. Vous pourrez le télécharger depuis là.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Ouvrir',
          onPress: async () => {
            try {
              const supported = await Linking.canOpenURL(url);
              if (supported) {
                await Linking.openURL(url);
              } else {
                Alert.alert('Erreur', 'Impossible d\'ouvrir le coloriage.');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'ouvrir le coloriage.');
            }
          },
        },
      ]
    );
  };

  const handleCraftExercise = (exercise) => {
    setSelectedExercise(exercise);
    setShowLevelModal(true);
  };

  const selectLevel = (level) => {
    setShowLevelModal(false);
    Alert.alert(
      'Choisissez votre activité',
      'Préférez-vous le crochet ou le tricot ?',
      [
        {
          text: 'Crochet',
          onPress: () => {
            const tutorials = crochetTutorials[level];
            if (tutorials && tutorials.length > 0) {
              const randomTutorial = tutorials[Math.floor(Math.random() * tutorials.length)];
              openTutorial(randomTutorial.url);
            } else {
              Alert.alert('Erreur', 'Aucun tutoriel disponible pour ce niveau.');
            }
            setSelectedExercise(null);
          },
        },
        {
          text: 'Tricot',
          onPress: () => {
            const tutorials = tricotTutorials[level];
            if (tutorials && tutorials.length > 0) {
              const randomTutorial = tutorials[Math.floor(Math.random() * tutorials.length)];
              openTutorial(randomTutorial.url);
            } else {
              Alert.alert('Erreur', 'Aucun tutoriel disponible pour ce niveau.');
            }
            setSelectedExercise(null);
          },
        },
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => setSelectedExercise(null),
        },
      ]
    );
  };

  const startExercise = (exercise) => {
    if (exercise.specialType === 'music') {
      openMusic();
      return;
    }
    
    if (exercise.specialType === 'craft') {
      handleCraftExercise(exercise);
      return;
    }
    
    if (exercise.specialType === 'coloring') {
      const randomColoring = coloringPages[Math.floor(Math.random() * coloringPages.length)];
      downloadColoring(randomColoring);
      return;
    }

    setSelectedExercise(exercise);
    setCurrentStep(0);
    setIsActive(true);
    setIsTimerActive(false);
    setHasReadAllSteps(false);
    setTotalTimeElapsed(0);
    guidanceIndexRef.current = 0;
    lastGuidanceTimeRef.current = -1;
    
    const durationMatch = exercise.duration.match(/(\d+)/);
    const minutes = durationMatch ? parseInt(durationMatch[1]) : 5;
    setTimeRemaining(minutes * 60);
  };

  const startTimer = () => {
    if (hasReadAllSteps) {
      setIsTimerActive(true);
      setTotalTimeElapsed(0);
      guidanceIndexRef.current = 0;
      lastGuidanceTimeRef.current = -1;
      if (voiceoverEnabled) {
        setTimeout(() => {
          Speech.speak('Prenez un moment pour vous installer confortablement. Je vais vous guider doucement tout au long de cet exercice. Respirez profondément et laissez-vous porter.', {
            language: 'fr-FR',
            pitch: 1.1,
            rate: 0.9,
          });
        }, 500);
      }
    }
  };

  const nextStep = () => {
    if (selectedExercise && currentStep < selectedExercise.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (!hasReadAllSteps) {
        setHasReadAllSteps(true);
      }
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setHasReadAllSteps(false);
    }
  };

  const finishExercise = () => {
    Speech.stop();
    setIsActive(false);
    setIsTimerActive(false);
    setCurrentStep(0);
    setTimeRemaining(0);
    setHasReadAllSteps(false);
    setTotalTimeElapsed(0);
    guidanceIndexRef.current = 0;
    lastGuidanceTimeRef.current = -1;
    setSelectedExercise(null);
  };

  const resetExercise = () => {
    Alert.alert(
      'Recommencer l\'exercice ?',
      'Voulez-vous recommencer depuis le début ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Recommencer',
          onPress: () => {
            Speech.stop();
            setCurrentStep(0);
            setIsActive(true);
            setIsTimerActive(false);
            setHasReadAllSteps(false);
            setTotalTimeElapsed(0);
            guidanceIndexRef.current = 0;
            lastGuidanceTimeRef.current = -1;
            const durationMatch = selectedExercise.duration.match(/(\d+)/);
            const minutes = durationMatch ? parseInt(durationMatch[1]) : 5;
            setTimeRemaining(minutes * 60);
          },
        },
      ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'respiration':
        return '#f9a8d4';
      case 'meditation':
        return '#e9d5ff';
      case 'mouvement':
        return '#c084fc';
      case 'visualisation':
        return '#f0abfc';
      case 'creatif':
        return '#f9a8d4';
      case 'ancrage':
        return '#e9d5ff';
      case 'apaisement':
        return '#c084fc';
      case 'energie':
        return '#ec4899';
      default:
        return '#ec4899';
    }
  };

  const renderExercise = (exercise) => (
    <TouchableOpacity
      key={exercise.id}
      style={styles.exerciseCard}
      onPress={() => setSelectedExercise(exercise)}
    >
      <View
        style={[
          styles.exerciseIconContainer,
          { backgroundColor: getCategoryColor(exercise.category) },
        ]}
      >
        <Ionicons name={exercise.icon} size={28} color="#fff" />
      </View>
      <View style={styles.exerciseContent}>
        <Text style={styles.exerciseTitle}>{exercise.title}</Text>
        <Text style={styles.exerciseDescription}>{exercise.description}</Text>
        <View style={styles.exerciseMeta}>
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text style={styles.durationText}>{exercise.duration}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSoft} />
    </TouchableOpacity>
  );

  // Vue détaillée de l'exercice (avant de commencer)
  if (selectedExercise && !isActive) {
    // Exercice Musique
    if (selectedExercise.specialType === 'music') {
      return (
        <ScrollView style={styles.container}>
          <LinearGradient
            colors={['#ffffff', '#fdf2f8']}
            style={styles.gradient}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedExercise(null)}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>

            <View style={styles.exerciseDetailHeader}>
              <View
                style={[
                  styles.detailIconContainer,
                  { backgroundColor: getCategoryColor(selectedExercise.category) },
                ]}
              >
                <Ionicons name={selectedExercise.icon} size={40} color="#fff" />
              </View>
              <Text style={styles.detailTitle}>{selectedExercise.title}</Text>
              <Text style={styles.detailDescription}>
                {selectedExercise.description}
              </Text>
              {dailyMusic && (
                <Text style={styles.musicTitle}>🎵 {dailyMusic.title}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={openMusic}
            >
              <LinearGradient
                colors={['#f9a8d4', '#ec4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startButtonGradient}
              >
                <Ionicons name="musical-notes" size={20} color="#fff" />
                <Text style={styles.startButtonText}>Écouter la musique du jour</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
      );
    }

    // Exercice Coloriage
    if (selectedExercise.specialType === 'coloring') {
      return (
        <ScrollView style={styles.container}>
          <LinearGradient
            colors={['#ffffff', '#fdf2f8']}
            style={styles.gradient}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedExercise(null)}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>

            <View style={styles.exerciseDetailHeader}>
              <View
                style={[
                  styles.detailIconContainer,
                  { backgroundColor: getCategoryColor(selectedExercise.category) },
                ]}
              >
                <Ionicons name={selectedExercise.icon} size={40} color="#fff" />
              </View>
              <Text style={styles.detailTitle}>{selectedExercise.title}</Text>
              <Text style={styles.detailDescription}>
                {selectedExercise.description}
              </Text>
            </View>

            <View style={styles.coloringContainer}>
              <Text style={styles.coloringInstructions}>
                Choisissez un coloriage à télécharger et imprimer. Vous pourrez ensuite le colorier à votre rythme.
              </Text>
              {coloringPages.map((url, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.coloringButton}
                  onPress={() => downloadColoring(url)}
                >
                  <Ionicons name="download" size={20} color={colors.primary} />
                  <Text style={styles.coloringButtonText}>
                    Télécharger le coloriage {index + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>
        </ScrollView>
      );
    }

    // Exercice Crochet/Tricot
    if (selectedExercise.specialType === 'craft') {
      return (
        <>
          <ScrollView style={styles.container}>
            <LinearGradient
              colors={['#ffffff', '#fdf2f8']}
              style={styles.gradient}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setSelectedExercise(null)}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
                <Text style={styles.backButtonText}>Retour</Text>
              </TouchableOpacity>

              <View style={styles.exerciseDetailHeader}>
                <View
                  style={[
                    styles.detailIconContainer,
                    { backgroundColor: getCategoryColor(selectedExercise.category) },
                  ]}
                >
                  <Ionicons name={selectedExercise.icon} size={40} color="#fff" />
                </View>
                <Text style={styles.detailTitle}>{selectedExercise.title}</Text>
                <Text style={styles.detailDescription}>
                  {selectedExercise.description}
                </Text>
              </View>

              <View style={styles.stepsContainer}>
                <Text style={styles.stepsTitle}>Étapes</Text>
                {selectedExercise.steps.map((step, index) => (
                  <View key={index} style={styles.stepCard}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.startButton}
                onPress={() => handleCraftExercise(selectedExercise)}
              >
                <LinearGradient
                  colors={['#f9a8d4', '#ec4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startButtonGradient}
                >
                  <Ionicons name="play" size={20} color="#fff" />
                  <Text style={styles.startButtonText}>Choisir mon niveau</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </ScrollView>

          <Modal
            visible={showLevelModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => {
              setShowLevelModal(false);
              setSelectedExercise(null);
            }}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Choisissez votre niveau</Text>
                <TouchableOpacity
                  style={styles.levelButton}
                  onPress={() => selectLevel('debutant')}
                >
                  <Text style={styles.levelButtonText}>Débutant</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.levelButton}
                  onPress={() => selectLevel('intermediaire')}
                >
                  <Text style={styles.levelButtonText}>Intermédiaire</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.levelButton}
                  onPress={() => selectLevel('avance')}
                >
                  <Text style={styles.levelButtonText}>Avancé</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setShowLevelModal(false);
                    setSelectedExercise(null);
                  }}
                >
                  <Text style={styles.modalCloseButtonText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      );
    }

    // Exercices normaux
    return (
      <ScrollView style={styles.container}>
        <LinearGradient
          colors={['#ffffff', '#fdf2f8']}
          style={styles.gradient}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedExercise(null)}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>

          <View style={styles.exerciseDetailHeader}>
            <View
              style={[
                styles.detailIconContainer,
                { backgroundColor: getCategoryColor(selectedExercise.category) },
              ]}
            >
              <Ionicons name={selectedExercise.icon} size={40} color="#fff" />
            </View>
            <Text style={styles.detailTitle}>{selectedExercise.title}</Text>
            <Text style={styles.detailDescription}>
              {selectedExercise.description}
            </Text>
            <View style={styles.detailMeta}>
              <View style={styles.detailDurationBadge}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={styles.detailDurationText}>
                  {selectedExercise.duration}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>Étapes</Text>
            {selectedExercise.steps.map((step, index) => (
              <View key={index} style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={styles.voiceoverToggle}>
            <View style={styles.voiceoverToggleContent}>
              <Ionicons name="volume-high" size={20} color={colors.primary} />
              <Text style={styles.voiceoverLabel}>Voiceover (lecture vocale)</Text>
            </View>
            <Switch
              value={voiceoverEnabled}
              onValueChange={setVoiceoverEnabled}
              trackColor={{ false: colors.textSoft, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={() => startExercise(selectedExercise)}
          >
            <LinearGradient
              colors={['#f9a8d4', '#ec4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startButtonGradient}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.startButtonText}>Commencer l'exercice</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    );
  }

  // Vue active de l'exercice (pendant l'exécution)
  if (selectedExercise && isActive) {
    return (
      <ScrollView style={styles.container}>
        <LinearGradient
          colors={['#ffffff', '#fdf2f8']}
          style={styles.gradient}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Alert.alert(
                'Quitter l\'exercice ?',
                'Voulez-vous vraiment quitter ? Votre progression sera perdue.',
                [
                  {
                    text: 'Continuer',
                    style: 'cancel',
                  },
                  {
                    text: 'Quitter',
                    onPress: () => {
                      Speech.stop();
                      finishExercise();
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>

          <View style={styles.exerciseDetailHeader}>
            <View
              style={[
                styles.detailIconContainer,
                { backgroundColor: getCategoryColor(selectedExercise.category) },
              ]}
            >
              <Ionicons name={selectedExercise.icon} size={40} color="#fff" />
            </View>
            <Text style={styles.detailTitle}>{selectedExercise.title}</Text>
            
            {isTimerActive && timeRemaining > 0 && (
              <View style={styles.timerContainer}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
              </View>
            )}
            
            {hasReadAllSteps && !isTimerActive && (
              <TouchableOpacity
                style={styles.startTimerButton}
                onPress={startTimer}
              >
                <Ionicons name="play-circle" size={24} color={colors.primary} />
                <Text style={styles.startTimerText}>Démarrer le timer</Text>
              </TouchableOpacity>
            )}
          </View>

          {!isTimerActive && (
            <View style={styles.currentStepContainer}>
              <Text style={styles.stepIndicator}>
                Étape {currentStep + 1} sur {selectedExercise.steps.length}
              </Text>
              <View style={styles.currentStepCard}>
                <Text style={styles.currentStepText}>
                  {selectedExercise.steps[currentStep]}
                </Text>
              </View>
              
              {voiceoverEnabled && (
                <View style={styles.voiceoverIndicator}>
                  <Ionicons name="volume-high" size={16} color={colors.primary} />
                  <Text style={styles.voiceoverIndicatorText}>Lecture vocale activée</Text>
                </View>
              )}
            </View>
          )}

          {isTimerActive && (
            <View style={styles.guidanceContainer}>
              <Text style={styles.guidanceTitle}>Guidage en cours</Text>
              <View style={styles.guidanceCard}>
                <Ionicons name="volume-high" size={24} color={colors.primary} />
                <Text style={styles.guidanceText}>
                  Écoutez les instructions vocales qui vous guident doucement pas à pas.
                </Text>
              </View>
            </View>
          )}

          {!isTimerActive && (
            <View style={styles.progressContainer}>
              {selectedExercise.steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index < currentStep && styles.progressDotCompleted,
                    index === currentStep && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {!isTimerActive && (
            <View style={styles.navigationButtons}>
              {currentStep > 0 && (
                <TouchableOpacity
                  style={styles.prevButton}
                  onPress={previousStep}
                >
                  <Ionicons name="chevron-back" size={20} color={colors.primary} />
                  <Text style={styles.prevButtonText}>Précédent</Text>
                </TouchableOpacity>
              )}
              
              {currentStep < selectedExercise.steps.length - 1 ? (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={nextStep}
                >
                  <LinearGradient
                    colors={['#f9a8d4', '#ec4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.nextButtonGradient}
                  >
                    <Text style={styles.nextButtonText}>Suivant</Text>
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.finishButton}
                  onPress={finishExercise}
                >
                  <LinearGradient
                    colors={['#f9a8d4', '#ec4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.finishButtonGradient}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.finishButtonText}>Terminer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!isTimerActive && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetExercise}
            >
              <Text style={styles.resetButtonText}>Recommencer</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </ScrollView>
    );
  }

  // Vue liste des exercices avec filtres
  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#ffffff', '#fdf2f8']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Espace bien-être</Text>
          <Text style={styles.subtitle}>
            Des exercices doux pour respirer, apaiser, te ressourcer. Choisis ce qui te fait du bien, à ton rythme.
          </Text>
        </View>

        {/* Barre de filtres */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.filterButton,
                selectedCategory === category.id && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              {selectedCategory === category.id ? (
                <LinearGradient
                  colors={['#f9a8d4', '#ec4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.filterButtonGradient}
                >
                  <Text style={styles.filterButtonTextActive}>{category.name}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.filterButtonText}>{category.name}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.exercisesContainer}>
          {filteredExercises.length > 0 ? (
            filteredExercises.map(renderExercise)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Aucun exercice dans cette catégorie</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  gradient: {
    flex: 1,
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSoft,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  filtersContainer: {
    marginBottom: spacing.lg,
  },
  filtersContent: {
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    marginRight: spacing.sm,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f9a8d4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  filterButtonActive: {
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  exercisesContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSoft,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: spacing.md,
  },
  exerciseIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  exerciseDescription: {
    fontSize: 14,
    color: colors.textSoft,
    marginBottom: spacing.xs,
  },
  exerciseMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    gap: spacing.xs / 2,
  },
  durationText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  exerciseDetailHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  detailIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  detailDescription: {
    fontSize: 16,
    color: colors.textSoft,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  detailMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  detailDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    gap: spacing.xs,
  },
  detailDurationText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  stepsContainer: {
    marginBottom: spacing.xl,
  },
  stepsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    gap: spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  voiceoverToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
  },
  voiceoverToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  voiceoverLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  voiceoverIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  voiceoverIndicatorText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  startButton: {
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  startButtonGradient: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
  startTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  startTimerText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  currentStepContainer: {
    marginBottom: spacing.xl,
  },
  stepIndicator: {
    fontSize: 14,
    color: colors.textSoft,
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  currentStepCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 120,
    justifyContent: 'center',
  },
  currentStepText: {
    fontSize: 20,
    color: colors.text,
    lineHeight: 30,
    textAlign: 'center',
    fontWeight: '500',
  },
  guidanceContainer: {
    marginBottom: spacing.xl,
  },
  guidanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  guidanceCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardLightBorder,
    alignItems: 'center',
    gap: spacing.sm,
  },
  guidanceText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.cardLightBorder,
  },
  progressDotCompleted: {
    backgroundColor: colors.primary,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  prevButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#fff',
    gap: spacing.xs,
  },
  prevButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  nextButton: {
    flex: 2,
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  finishButton: {
    flex: 2,
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
  },
  finishButtonGradient: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  finishButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  resetButton: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  resetButtonText: {
    color: colors.textSoft,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  musicTitle: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  coloringContainer: {
    marginBottom: spacing.xl,
  },
  coloringInstructions: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  coloringButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  coloringButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
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
    padding: spacing.xl,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  levelButton: {
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  levelButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: colors.textSoft,
  },
});