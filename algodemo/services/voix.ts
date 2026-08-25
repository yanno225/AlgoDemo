import * as Speech from 'expo-speech';

/**
 * Voix de la plateforme — une seule porte d'entrée pour toute la synthèse
 * vocale, afin que l'app parle PARTOUT avec la meilleure voix disponible.
 *
 * Le moteur du téléphone embarque plusieurs voix françaises très inégales :
 * la voix par défaut est souvent la plus robotique, alors que les voix
 * « réseau » de Google (Android) et « Enhanced » (iOS) sont naturelles et
 * agréables. On les découvre une fois, on garde la meilleure, et on donne un
 * léger relief (débit/hauteur) pour éviter la lecture monocorde.
 *
 * Limite honnête d'Expo Go : on choisit la meilleure voix DU téléphone, on
 * n'en fabrique pas. Pour une voix « waouh » identique chez tout le monde
 * (type ElevenLabs), il faudra un service de TTS neuronal côté backend —
 * l'architecture est prête (champ urlAudio des contenus).
 */

let meilleureVoixPromise: Promise<string | null> | null = null;

function scoreVoix(voix: Speech.Voice): number {
  const langue = voix.language?.toLowerCase() ?? '';
  if (!langue.startsWith('fr')) return -1;

  let score = 0;
  const id = (voix.identifier ?? '').toLowerCase();
  const nom = (voix.name ?? '').toLowerCase();

  // iOS : les voix « Enhanced » sont les plus naturelles.
  if (voix.quality === Speech.VoiceQuality.Enhanced) score += 60;
  // Android : les voix réseau de Google surclassent nettement les locales.
  if (id.includes('network') || nom.includes('network')) score += 50;
  // Le français de France comme pivot (les 19 pays sont majoritairement
  // francophones) — les variantes restent acceptées.
  if (langue === 'fr-fr') score += 10;
  // À égalité, une voix féminine « fra » de Google sonne souvent mieux que
  // la voix par défaut ; léger bonus aux identifiants les plus récents.
  if (id.includes('#female') || id.includes('fra-x-fr')) score += 5;

  return score;
}

/** Découvre (une fois) la meilleure voix française du téléphone. */
function meilleureVoix(): Promise<string | null> {
  if (!meilleureVoixPromise) {
    meilleureVoixPromise = Speech.getAvailableVoicesAsync()
      .then((voix) => {
        const candidates = voix
          .map((v) => ({ v, score: scoreVoix(v) }))
          .filter((x) => x.score >= 0)
          .sort((a, b) => b.score - a.score);
        return candidates[0]?.v.identifier ?? null;
      })
      .catch(() => null);
  }
  return meilleureVoixPromise;
}

/**
 * Lit un texte avec la meilleure voix disponible et un rendu vivant.
 * Remplace tout appel direct à Speech.speak.
 *
 * Filet de sécurité : si la voix choisie échoue (voix réseau indisponible
 * hors connexion, identifiant refusé par le moteur…), on relit aussitôt avec
 * la voix par défaut — l'utilisateur entend TOUJOURS quelque chose.
 */
export async function dire(
  texte: string,
  options?: Pick<Speech.SpeechOptions, 'onDone' | 'onError' | 'onStopped'>
): Promise<void> {
  const voix = await meilleureVoix();
  Speech.stop();

  const parler = (identifiant: string | null) => {
    Speech.speak(texte, {
      language: 'fr-FR',
      ...(identifiant ? { voice: identifiant } : {}),
      // Léger relief : un débit naturel et une hauteur à peine relevée cassent
      // la monotonie sans tomber dans la caricature.
      rate: 1.0,
      pitch: 1.06,
      onDone: options?.onDone,
      onStopped: options?.onStopped,
      onError: (erreur) => {
        if (identifiant) {
          // La voix premium a échoué : repli immédiat sur la voix par défaut.
          meilleureVoixPromise = Promise.resolve(null);
          parler(null);
        } else {
          options?.onError?.(erreur);
        }
      },
    });
  };

  parler(voix);
}

/** Coupe toute lecture en cours. */
export function taire(): void {
  Speech.stop();
}
