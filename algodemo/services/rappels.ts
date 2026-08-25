import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { lightColors } from '../constants/theme';

/**
 * Rappels de débats — notifications LOCALES programmées à l'heure prévue.
 *
 * Elles sonnent même application fermée et fonctionnent dans Expo Go (le push
 * distant FCM, lui, exige un build de développement — le backend y est déjà
 * prêt : POST /notifications/devices + PushService). Les notifications
 * programmées d'Expo sont notre unique source de vérité : pas de stockage
 * parallèle à désynchroniser, on les relit à chaque affichage de l'écran.
 */

const TYPE_RAPPEL = 'rappel-debat';
const CANAL_ANDROID = 'rappels-debats';

/** Bannière + son quand l'app est au premier plan — comme un vrai push. */
export function installerAffichageNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Demande la permission et prépare le canal Android. Vrai si autorisé. */
export async function preparerRappels(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL_ANDROID, {
      name: 'Rappels de débats',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: lightColors.primary,
    });
  }

  const actuel = await Notifications.getPermissionsAsync();
  if (actuel.granted) return true;
  const demande = await Notifications.requestPermissionsAsync();
  return demande.granted;
}

/** Rappels déjà programmés : debatId → identifiant de notification. */
export async function listerRappels(): Promise<Record<string, string>> {
  const programmees = await Notifications.getAllScheduledNotificationsAsync();
  const rappels: Record<string, string> = {};
  for (const notification of programmees) {
    const donnees = notification.content.data as
      | { type?: string; debatId?: string }
      | undefined;
    if (donnees?.type === TYPE_RAPPEL && donnees.debatId) {
      rappels[donnees.debatId] = notification.identifier;
    }
  }
  return rappels;
}

/**
 * Programme le rappel à l'heure prévue du débat. Renvoie l'identifiant de la
 * notification, ou null si l'heure est déjà passée.
 */
export async function programmerRappel(debat: {
  id: string;
  title: string;
  startsAt: string;
  reminderTitle: string;
  reminderBody: string;
}): Promise<string | null> {
  const date = new Date(debat.startsAt);
  if (date.getTime() <= Date.now()) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: debat.reminderTitle,
      body: debat.reminderBody,
      sound: true,
      data: { type: TYPE_RAPPEL, debatId: debat.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: Platform.OS === 'android' ? CANAL_ANDROID : undefined,
    },
  });
}

export async function annulerRappel(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
