import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  useWindowDimensions,
  ViewToken,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useFilterStore } from '../../stores/filterStore';
import { ThematicFilterBar } from '../../components/feature/feed/ThematicFilterBar';
import { ImmersiveCard, FeedItem } from '../../components/feature/feed/ImmersiveCard';
import { PressableScale } from '../../components/ui/PressableScale';
import { Skeleton } from '../../components/ui/Skeleton';
import { TAB_BAR_CLEARANCE } from '../../components/ui/Screen';
import {
  spacing,
  typography,
  borderRadius,
  motion,
  topScrimGradient,
  withAlpha,
} from '../../constants/theme';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<FeedItem>);

// ─── Contenus de démonstration ───────────────────────────────────────
// TODO(backend) : remplacer par GET /feed (pagination + filtres serveur).
const MOCK_NEWS: FeedItem[] = [
  {
    id: 'news_1',
    title: 'Adoption de la nouvelle loi sur la protection des données personnelles',
    summary:
      'Le parlement ivoirien a voté un nouveau cadre renforçant les sanctions contre les fuites de données et définissant les droits numériques des citoyens.',
    body: "Le parlement de Côte d'Ivoire a adopté hier à l'unanimité la nouvelle loi sur la protection des données à caractère personnel. Cette loi impose des amendes sévères aux entreprises en cas de violation de la vie privée et crée une autorité indépendante de régulation. Les citoyens disposent désormais d'un droit de regard et de suppression direct sur leurs informations stockées.",
    thematicId: 'droit',
    source: 'Ministère de la Transition Numérique (CI)',
    verificationLevel: 3,
    isOfficial: true,
    date: '15 Juillet 2026',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1080',
    likesCount: 142,
    commentsCount: 18,
  },
  {
    id: 'news_2',
    title: 'Rumeur sur la hausse du prix du cacao : le Conseil Café-Cacao dément',
    summary:
      "Une fausse note d'information circulant sur les réseaux sociaux annonçait une augmentation immédiate de 15% du prix garanti aux producteurs.",
    body: "Le Conseil Café-Cacao dément catégoriquement la hausse de 15% diffusée hier sur WhatsApp. Le prix garanti reste fixé conformément au barème officiel de la campagne en cours. L'institution appelle les agriculteurs à la vigilance et à ne se référer qu'aux communiqués officiels diffusés dans les médias nationaux.",
    thematicId: 'societe_vivant',
    source: "Conseil Café-Cacao Côte d'Ivoire",
    verificationLevel: 2,
    isOfficial: true,
    date: '14 Juillet 2026',
    imageUrl: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?q=80&w=1080',
    likesCount: 89,
    commentsCount: 34,
  },
  {
    id: 'news_3',
    title: "Lancement du Forum National de la Jeunesse et de l'Emploi à Yamoussoukro",
    summary:
      "Plus de 2 000 jeunes se réunissent pour échanger avec des mentors et postuler à des offres de stage et d'emploi directes.",
    body: "Le Forum de la Jeunesse et de l'Emploi a ouvert ses portes à Yamoussoukro ce matin. Organisé par le Ministère de la Jeunesse, cet événement propose des ateliers de formation sur le codage numérique, l'agriculture moderne et l'entrepreneuriat vert. Des stands de recrutement direct sont également disponibles.",
    thematicId: 'jeunesse_societe',
    source: 'Agence Emploi Jeunes',
    verificationLevel: 3,
    isOfficial: true,
    date: '12 Juillet 2026',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1080',
    likesCount: 256,
    commentsCount: 41,
  },
  {
    id: 'news_4',
    title: 'Débat houleux sur la parité homme-femme dans les conseils régionaux',
    summary:
      "Une proposition de loi vise à imposer 50% de candidates sur les listes électorales locales sous peine d'invalidation.",
    body: "Les débats parlementaires concernant la représentation équitable des genres dans les instances locales s'intensifient. La commission des affaires sociales examine un texte de loi prévoyant la parité stricte sur les listes électorales des conseils régionaux et municipaux, une mesure soutenue par de nombreuses ONG de défense des droits des femmes.",
    thematicId: 'genre_societe',
    source: "Observatoire National de l'Équité",
    verificationLevel: 1,
    isOfficial: false,
    date: '10 Juillet 2026',
    imageUrl: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=1080',
    likesCount: 73,
    commentsCount: 96,
  },
];

export default function FeedScreen() {
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const { selectedThematics, searchQuery, setSearchQuery } = useFilterStore();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchInputRef = useRef<TextInput>(null);

  const scrollY = useSharedValue(0);
  const chromeOpacity = useSharedValue(1);

  // La carte occupe tout l'écran : la tab bar flotte par-dessus.
  const itemHeight = windowHeight;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  // RG-FEED-03 : filtrage combiné thématiques + mot-clé.
  const filteredNews = useMemo(() => {
    let result = MOCK_NEWS;

    if (selectedThematics.length > 0) {
      result = result.filter((item) => selectedThematics.includes(item.thematicId as any));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.summary.toLowerCase().includes(query) ||
          item.body.toLowerCase().includes(query)
      );
    }

    return result;
  }, [selectedThematics, searchQuery]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
    onBeginDrag: () => {
      // L'habillage s'efface pendant le défilement pour laisser le média
      // occuper tout l'écran, puis revient à l'arrêt.
      chromeOpacity.value = withTiming(0, { duration: motion.durations.micro });
    },
    onMomentumEnd: () => {
      chromeOpacity.value = withTiming(1, { duration: motion.durations.base });
    },
    onEndDrag: () => {
      chromeOpacity.value = withTiming(1, { duration: motion.durations.base });
    },
  });

  const chromeStyle = useAnimatedStyle(() => ({ opacity: chromeOpacity.value }));

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setActiveIndex(first.index);
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const renderItem = useCallback(
    ({ item, index }: { item: FeedItem; index: number }) => (
      <ImmersiveCard
        item={item}
        index={index}
        scrollY={scrollY}
        itemHeight={itemHeight}
        isActive={index === activeIndex}
        topInset={insets.top + 96}
        bottomInset={TAB_BAR_CLEARANCE + insets.bottom}
      />
    ),
    [activeIndex, insets.bottom, insets.top, itemHeight, scrollY]
  );

  // Chaque élément a une hauteur fixe : la fournir évite à la liste de
  // mesurer au vol, ce qui provoquait des à-coups au défilement rapide.
  const getItemLayout = useCallback(
    (_: ArrayLike<FeedItem> | null | undefined, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
    [itemHeight]
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {isLoading ? (
        <View style={[styles.loading, { backgroundColor: colors.background }]}>
          <Skeleton width="100%" height={windowHeight} radius={0} />
        </View>
      ) : filteredNews.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.background }]}>
          <MaterialCommunityIcons name="newspaper-variant-outline" size={56} color={colors.textTertiary} />
          <Text
            style={[
              styles.emptyText,
              {
                color: colors.textSecondary,
                fontSize: getFontSize(typography.sizes.body),
                fontFamily: typography.families.body,
              },
            ]}
          >
            {t('common.empty')}
          </Text>
        </View>
      ) : (
        <AnimatedFlatList
          data={filteredNews}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          pagingEnabled
          decelerationRate="fast"
          snapToInterval={itemHeight}
          snapToAlignment="start"
          disableIntervalMomentum
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          // Une seule carte est visible : garder un voisin de chaque côté
          // suffit et évite de monter quatre médias plein écran en mémoire.
          windowSize={3}
          maxToRenderPerBatch={2}
          initialNumToRender={1}
          removeClippedSubviews
        />
      )}

      {/* ─── Habillage flottant ──────────────────────────────────────── */}
      <Animated.View
        style={[styles.chrome, { paddingTop: insets.top }, chromeStyle]}
        pointerEvents="box-none"
      >
        <LinearGradient
          colors={topScrimGradient}
          style={[styles.topScrim, { height: insets.top + 150 }]}
          pointerEvents="none"
        />

        <View style={styles.header}>
          {!isSearchOpen ? (
            <>
              <View style={styles.brandRow}>
                <View style={[styles.brandMark, { backgroundColor: withAlpha('#FFFFFF', 0.18) }]}>
                  <MaterialCommunityIcons name="scale-balance" size={17} color="#FFFFFF" />
                </View>
                <Text
                  style={[
                    styles.brandText,
                    {
                      fontSize: getFontSize(typography.sizes.h4),
                      fontFamily: typography.families.headingSemiBold,
                    },
                  ]}
                >
                  {t('auth.brand.name')}
                </Text>
              </View>

              <PressableScale
                onPress={() => {
                  setIsSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 120);
                }}
                scaleTo={motion.scale.chip}
                accessibilityRole="button"
                accessibilityLabel={t('feed.searchPlaceholder')}
                style={[styles.iconButton, { backgroundColor: withAlpha('#000000', 0.32) }]}
              >
                <Ionicons name="search" size={20} color="#FFFFFF" />
              </PressableScale>
            </>
          ) : (
            <View style={styles.searchRow}>
              <PressableScale
                onPress={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                scaleTo={motion.scale.chip}
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}
                style={[styles.iconButton, { backgroundColor: withAlpha('#000000', 0.32) }]}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </PressableScale>

              <View style={[styles.searchBox, { backgroundColor: withAlpha('#000000', 0.42) }]}>
                <Ionicons name="search" size={18} color={withAlpha('#FFFFFF', 0.7)} />
                <TextInput
                  ref={searchInputRef}
                  placeholder={t('feed.searchPlaceholder')}
                  placeholderTextColor={withAlpha('#FFFFFF', 0.55)}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  accessibilityLabel={t('feed.searchPlaceholder')}
                  style={[
                    styles.searchInput,
                    {
                      fontSize: getFontSize(typography.sizes.bodySmall),
                      fontFamily: typography.families.body,
                    },
                  ]}
                />
                {searchQuery.length > 0 && (
                  <PressableScale
                    onPress={() => setSearchQuery('')}
                    scaleTo={motion.scale.chip}
                    haptic="none"
                    accessibilityRole="button"
                    accessibilityLabel={t('common.cancel')}
                  >
                    <Ionicons name="close-circle" size={18} color={withAlpha('#FFFFFF', 0.7)} />
                  </PressableScale>
                )}
              </View>
            </View>
          )}
        </View>

        <ThematicFilterBar variant="overlay" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C100A',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
  },
  empty: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  emptyText: {
    textAlign: 'center',
  },
  chrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.sm + 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    color: '#FFFFFF',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    paddingVertical: 0,
  },
});
