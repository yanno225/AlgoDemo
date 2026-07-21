import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le dossier parent contient un `package-lock.json` résiduel (vide) laissé
  // par un `npm install` lancé au mauvais endroit. Sans cette ligne, Turbopack
  // en déduit que la racine du projet est `AlgoDemo/` et remonte trop haut.
  turbopack: {
    root: path.resolve(__dirname),
  },

  images: {
    // TODO(backend) : remplacer par le domaine de stockage des médias
    // (photos de signalement, visuels de débat) une fois l'API livrée.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
