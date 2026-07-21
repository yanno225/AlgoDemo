import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../../stores/authStore';

export const API_BASE_URL = 'https://api.algodemo.org/v1/';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour attacher le token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour gérer les erreurs d'authentification
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Si l'erreur est 401 (Non autorisé) et qu'on n'a pas déjà tenté de refresh
    if (error.response?.status === 401) {
      // Déconnexion automatique de l'utilisateur si la session expire
      await useAuthStore.getState().clearSession();
      // On pourrait implémenter ici un mécanisme de refresh token si le backend le supporte
    }

    // Traduction technique des messages d'erreur courants pour l'utilisateur
    let userMessage = 'Une erreur réseau est survenue. Veuillez vérifier votre connexion.';

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      if (status === 400) {
        userMessage = data?.message || 'Requête incorrecte.';
      } else if (status === 403) {
        userMessage = 'Vous n\'avez pas l\'autorisation d\'effectuer cette action.';
      } else if (status === 404) {     
        userMessage = 'La ressource demandée est introuvable.';
      } else if (status === 409) {
        userMessage = data?.message || 'Un conflit est survenu (ex: vote déjà enregistré).';
      } else if (status === 422) {
        userMessage = 'Les données saisies sont invalides.';
      } else if (status >= 500) {
        userMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.';
      }
    }

    // On attache le message d'erreur lisible pour le récupérer facilement dans l'UI
    const enrichedError = new Error(userMessage);
    (enrichedError as any).status = error.response?.status;
    (enrichedError as any).originalError = error;

    return Promise.reject(enrichedError);
  }
);
