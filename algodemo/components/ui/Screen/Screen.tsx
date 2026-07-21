import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets, Edge } from 'react-native-safe-area-context';
import { useAccessibility } from '../../../hooks/useAccessibility';

/** Hauteur réservée sous le contenu pour ne pas passer sous la tab bar flottante. */
export const TAB_BAR_CLEARANCE = 92;

export interface ScreenProps {
  children: React.ReactNode;
  /** Bords où appliquer l'inset système. Par défaut : haut uniquement. */
  edges?: Edge[];
  /** Couleur de fond. Par défaut : fond du thème courant. */
  background?: string;
  style?: StyleProp<ViewStyle>;
  /**
   * Écran immersif : le contenu passe sous la barre de statut (feed plein
   * écran, lecteur vidéo). Aucun inset n'est appliqué.
   */
  immersive?: boolean;
}

/**
 * Conteneur d'écran gérant les zones sûres.
 *
 * Remplace les `paddingTop: Platform.OS === 'ios' ? spacing.xxl + 12 : spacing.xl`
 * recopiés dans chaque écran — ces valeurs devinées cassent sur les Android à
 * encoche et sur les iPhone sans Dynamic Island.
 */
export const Screen: React.FC<ScreenProps> = ({
  children,
  edges = ['top'],
  background,
  style,
  immersive = false,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAccessibility();

  const insetStyle: ViewStyle = immersive
    ? {}
    : {
        paddingTop: edges.includes('top') ? insets.top : 0,
        paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
        paddingLeft: edges.includes('left') ? insets.left : 0,
        paddingRight: edges.includes('right') ? insets.right : 0,
      };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: background ?? colors.background },
        insetStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Screen;
