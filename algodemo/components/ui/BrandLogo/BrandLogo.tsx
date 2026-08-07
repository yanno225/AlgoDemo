import React from 'react';
import { StyleProp } from 'react-native';
import { Image, ImageStyle } from 'expo-image';

/**
 * Logo de la Fondation de l'Innovation pour la Démocratie (FID).
 *
 * Deux variantes selon le fond :
 * - `mark`  : pictogramme seul, fond transparent — pour les fonds clairs ;
 * - `badge` : pictogramme sur pastille blanche — pour les fonds sombres ou
 *   colorés, comme sur le site officiel de la fondation.
 */

const MARK = require('../../../assets/brand/fid-mark.png');
const BADGE = require('../../../assets/brand/fid-badge.png');

interface BrandLogoProps {
  /** Côté du carré rendu, en points. */
  size?: number;
  variant?: 'mark' | 'badge';
  style?: StyleProp<ImageStyle>;
}

export function BrandLogo({ size = 24, variant = 'mark', style }: BrandLogoProps) {
  return (
    <Image
      source={variant === 'badge' ? BADGE : MARK}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
      accessibilityLabel="Fondation de l'Innovation pour la Démocratie"
    />
  );
}
