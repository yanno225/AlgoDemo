import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useIsFocused } from '@react-navigation/native';
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
import { listFeed, listMyLikes } from '../../services/api/feed';
import { PressableScale } from '../../components/ui/PressableScale';
import { BrandLogo } from '../../components/ui/BrandLogo';
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

/** Délai avant d'interroger le serveur pendant la frappe d'une recherche. */
const DEBOUNCE_RECHERCHE = 350;

export default function FeedScreen() {
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const { selectedThematics, searchQuery, setSearchQuery } = useFilterStore();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // Quitter l'onglet coupe TOUT (vidéo, son, lecture vocale) : une carte
  // n'est « active » que si le feed a réellement le focus.
  const isFocused = useIsFocused();
  const searchInputRef = useRef<TextInput>(null);

  const [items, setItems] = useState<FeedItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());
  // Numéro de la dernière page chargée + garde anti-chargements concurrents.
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);
  // Chaque changement de filtre invalide les réponses des requêtes en vol.
  const requeteRef = useRef(0);

  const scrollY = useSharedValue(0);
  const chromeOpacity = useSharedValue(1);

  // La carte occupe tout l'écran : la tab bar flotte par-dessus.
  const itemHeight = windowHeight;

  // RG-FEED-03 : recherche et filtre thématique côté serveur. L'API n'accepte
  // qu'UNE thématique : au-delà, on charge large et on filtre localement.
  const thematicServeur =
    selectedThematics.length === 1 ? selectedThematics[0] : undefined;

  const chargerPremierePage = useCallback(async () => {
    const requete = ++requeteRef.current;
    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      const page = await listFeed({
        page: 1,
        q: searchQuery || undefined,
        thematic: thematicServeur,
      });
      if (requete !== requeteRef.current) return; // Filtre changé entre-temps.
      pageRef.current = 1;
      setItems(page.items);
      setHasMore(page.suivante);
    } catch {
      if (requete === requeteRef.current) {
        setItems([]);
        setHasMore(false);
      }
    } finally {
      if (requete === requeteRef.current) setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [searchQuery, thematicServeur]);

  // Premier chargement + rechargement à chaque filtre, recherche débouncée.
  useEffect(() => {
    const timer = setTimeout(
      () => void chargerPremierePage(),
      searchQuery ? DEBOUNCE_RECHERCHE : 0
    );
    return () => clearTimeout(timer);
  }, [chargerPremierePage, searchQuery]);

  // Les cœurs déjà posés — chargés une fois, en parallèle du fil.
  useEffect(() => {
    listMyLikes()
      .then(setMyLikes)
      .catch(() => {
        // Sans réseau, les cœurs partent éteints : le serveur corrigera au tap.
      });
  }, []);

  const chargerPageSuivante = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;
    const requete = requeteRef.current;
    isFetchingRef.current = true;
    try {
      const page = await listFeed({
        page: pageRef.current + 1,
        q: searchQuery || undefined,
        thematic: thematicServeur,
      });
      if (requete !== requeteRef.current) return;
      pageRef.current = page.page;
      setItems((current) => {
        // Un contenu publié pendant le défilement décale la pagination :
        // on dédoublonne pour qu'aucune carte n'apparaisse deux fois.
        const connus = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !connus.has(item.id))];
      });
      setHasMore(page.suivante);
    } catch {
      // Fin de liste silencieuse : l'utilisateur retentera en défilant.
    } finally {
      isFetchingRef.current = false;
    }
  }, [hasMore, searchQuery, thematicServeur]);

  // Filtre multi-thématiques : le complément se fait localement.
  const filteredNews = useMemo(() => {
    if (selectedThematics.length <= 1) return items;
    return items.filter((item) =>
      (selectedThematics as readonly string[]).includes(item.thematicId)
    );
  }, [items, selectedThematics]);

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
        isActive={index === activeIndex && isFocused}
        topInset={insets.top + 96}
        bottomInset={TAB_BAR_CLEARANCE + insets.bottom}
        initiallyLiked={myLikes.has(item.id)}
      />
    ),
    [activeIndex, isFocused, insets.bottom, insets.top, itemHeight, myLikes, scrollY]
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
          // Pagination : la page suivante part quand il reste ~2 cartes.
          onEndReached={() => void chargerPageSuivante()}
          onEndReachedThreshold={2}
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
                <BrandLogo variant="badge" size={30} />
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
