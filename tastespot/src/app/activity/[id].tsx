import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import { Image } from 'expo-image'
import * as ImageManipulator from 'expo-image-manipulator'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { ScreenHeader } from '@/components/ScreenHeader'
import { SmileRating } from '@/components/SmileRating'
import { useActivitiesStore } from '@/stores/activitiesStore'
import { useTypesStore } from '@/stores/typesStore'
import {
  useReviewsStore,
  ReviewWithType,
  calcActivityAvgScore,
  calcCategoryAvgs,
  scoreToSmileIndex,
} from '@/stores/reviewsStore'
import { api } from '@/lib/api'
import { logger } from '@/lib/logger'
import { ActivityPhoto } from '@/types'
import { theme } from '@/theme'

const PHOTO_STRIP_RATIO = 0.45

const SMILES = ['\uD83D\uDE1E', '\uD83D\uDE15', '\uD83D\uDE10', '\uD83D\uDE42', '\uD83D\uDE1B'] as const

const fmtScore = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(1))

type TypeReviewCardProps = {
  type: { id: string; name: string; icon_key: string }
  review: ReviewWithType | null
  onNavigate: () => void
}

function TypeReviewCard({ type, review, onNavigate }: TypeReviewCardProps) {
  const [expandedLiked, setExpandedLiked] = useState(false)
  const [expandedDisliked, setExpandedDisliked] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState(false)
  const [scoresOpen, setScoresOpen] = useState(false)

  const typeAvg = review ? calcActivityAvgScore([review]) : null
  const typeSmile = typeAvg !== null ? scoreToSmileIndex(typeAvg) : null

  return (
    <View style={rstyles.typeCard}>
      <View style={rstyles.typeCardHeader}>
        <Ionicons name={type.icon_key as 'restaurant-outline'} size={16} color={theme.colors.primary} />
        <Text style={rstyles.typeCardTitle}>{type.name}</Text>
        {typeSmile !== null && typeAvg !== null && (
          <TouchableOpacity
            style={rstyles.typeScoreChip}
            onPress={() => setScoresOpen((v) => !v)}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Text style={rstyles.typeSmile}>{SMILES[typeSmile]}</Text>
            <Text style={rstyles.typeScoreNum}>{typeAvg.toFixed(1)}</Text>
            <Ionicons
              name={scoresOpen ? 'chevron-up' : 'chevron-down'}
              size={13}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {review ? (
        <View style={rstyles.reviewData}>
          {scoresOpen && (
            <View style={rstyles.reviewScoreRow}>
              {([
                ['Location', review.score_location],
                ['Cibo', review.score_food],
                ['Servizio', review.score_service],
                ['Conto', review.score_price],
              ] as [string, number | null][]).map(([label, val]) =>
                val !== null ? (
                  <View key={label} style={rstyles.miniScore}>
                    <Text style={rstyles.miniScoreLabel}>{label}</Text>
                    <Text style={rstyles.miniScoreEmoji}>{SMILES[scoreToSmileIndex(val)]}</Text>
                    <Text style={rstyles.miniScoreNum}>{fmtScore(val)}</Text>
                  </View>
                ) : null
              )}
            </View>
          )}

          {review.cost_per_person != null && (
            <View style={rstyles.costRow}>
              <Ionicons name="wallet-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={rstyles.costText}>€{fmtScore(review.cost_per_person)} a persona</Text>
            </View>
          )}

          {review.liked ? (
            <View style={rstyles.textRow}>
              <Text style={rstyles.textRowLabel}>Cosa ti è piaciuto</Text>
              <Text style={rstyles.textRowContent} numberOfLines={expandedLiked ? undefined : 2}>
                {review.liked}
              </Text>
              {review.liked.length > 60 && (
                <TouchableOpacity onPress={() => setExpandedLiked((v) => !v)}>
                  <Text style={rstyles.expandBtn}>{expandedLiked ? 'Mostra meno ↑' : 'Mostra tutto ↓'}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {review.disliked ? (
            <View style={rstyles.textRow}>
              <Text style={rstyles.textRowLabel}>Cosa non ti è piaciuto</Text>
              <Text style={rstyles.textRowContent} numberOfLines={expandedDisliked ? undefined : 2}>
                {review.disliked}
              </Text>
              {review.disliked.length > 60 && (
                <TouchableOpacity onPress={() => setExpandedDisliked((v) => !v)}>
                  <Text style={rstyles.expandBtn}>{expandedDisliked ? 'Mostra meno ↑' : 'Mostra tutto ↓'}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {review.notes ? (
            <View style={rstyles.textRow}>
              <Text style={rstyles.textRowLabel}>Note</Text>
              <Text style={rstyles.textRowContent} numberOfLines={expandedNotes ? undefined : 2}>
                {review.notes}
              </Text>
              {review.notes.length > 60 && (
                <TouchableOpacity onPress={() => setExpandedNotes((v) => !v)}>
                  <Text style={rstyles.expandBtn}>{expandedNotes ? 'Mostra meno ↑' : 'Mostra tutto ↓'}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          <View style={rstyles.reviewFooter}>
            <Text style={rstyles.reviewDate}>
              {formatReviewDate(review.created_at)}
              {review.updated_at !== review.created_at
                ? `  \u00B7  mod. ${formatReviewDate(review.updated_at)}`
                : ''}
            </Text>
            <TouchableOpacity style={rstyles.reviewBtn} onPress={onNavigate} activeOpacity={0.7}>
              <Text style={rstyles.reviewBtnText}>Modifica</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={rstyles.reviewBtnPrimary} onPress={onNavigate} activeOpacity={0.7}>
          <Ionicons name="add" size={16} color={theme.colors.surface} />
          <Text style={rstyles.reviewBtnPrimaryText}>Aggiungi recensione</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

type ReviewSectionProps = {
  activityId: string
  activityTypes: { id: string; name: string; icon_key: string }[]
  reviews: ReviewWithType[]
  scoreDropdownOpen: boolean
  onToggleDropdown: () => void
  onNavigateReview: (typeId: string, typeName: string) => void
}

function ReviewSection({
  activityTypes,
  reviews,
  scoreDropdownOpen,
  onToggleDropdown,
  onNavigateReview,
}: ReviewSectionProps) {
  const avgScore = calcActivityAvgScore(reviews)
  const categoryAvgs = calcCategoryAvgs(reviews)
  const smileIndex = avgScore !== null ? scoreToSmileIndex(avgScore) : null

  return (
    <View style={rstyles.container}>
      {/* Overall score header */}
      <TouchableOpacity
        style={rstyles.scoreHeader}
        onPress={reviews.length > 0 ? onToggleDropdown : undefined}
        activeOpacity={reviews.length > 0 ? 0.7 : 1}
      >
        <Text style={rstyles.smileIcon}>
          {smileIndex !== null ? SMILES[smileIndex] : '\uD83D\uDE10'}
        </Text>
        <View style={rstyles.scoreTextCol}>
          <Text style={[rstyles.scoreLabel, smileIndex === null && rstyles.scoreLabelGray]}>
            {avgScore !== null ? avgScore.toFixed(1) : 'Non valutato'}
          </Text>
          <Text style={rstyles.scoreSub}>Punteggio medio</Text>
        </View>
        {reviews.length > 0 && (
          <Ionicons
            name={scoreDropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.colors.textSecondary}
          />
        )}
      </TouchableOpacity>

      {scoreDropdownOpen && reviews.length > 0 && (
        <View style={rstyles.dropdown}>
          {([
            ['Location', categoryAvgs.location],
            ['Cibo', categoryAvgs.food],
            ['Servizio', categoryAvgs.service],
            ['Conto', categoryAvgs.price],
          ] as [string, number | null][]).map(([label, val]) => (
            <View key={label} style={rstyles.dropdownRow}>
              <Text style={rstyles.dropdownLabel}>{label}</Text>
              <Text style={rstyles.dropdownValue}>
                {val !== null ? val.toFixed(1) : '—'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Per-type review cards */}
      {activityTypes.map((type) => (
        <TypeReviewCard
          key={type.id}
          type={type}
          review={reviews.find((r) => r.activity_type_id === type.id) ?? null}
          onNavigate={() => onNavigateReview(type.id, type.name)}
        />
      ))}
    </View>
  )
}

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

const rstyles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  // ── Overall score header ──────────────────────────────────────────
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  smileIcon: {
    fontSize: 32,
    opacity: 0.85,
  },
  scoreTextCol: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  scoreLabelGray: {
    color: theme.colors.textSecondary,
  },
  scoreSub: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  // ── Dropdown average breakdown ────────────────────────────────────
  dropdown: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  dropdownLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  dropdownValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  // ── Per-type card ─────────────────────────────────────────────────
  typeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  typeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  typeCardTitle: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  typeScoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeSmile: {
    fontSize: 20,
  },
  typeScoreNum: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  // ── Category score chips ──────────────────────────────────────────
  reviewData: {
    gap: theme.spacing.sm,
  },
  reviewScoreRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  miniScore: {
    alignItems: 'center',
    gap: 2,
    minWidth: 48,
  },
  miniScoreLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  miniScoreEmoji: {
    fontSize: 20,
  },
  miniScoreNum: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  // ── Cost row ──────────────────────────────────────────────────────
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: 2,
  },
  costText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  // ── Expandable text fields ────────────────────────────────────────
  textRow: {
    gap: 2,
  },
  textRowLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textRowContent: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  expandBtn: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    marginTop: 2,
  },
  // ── Footer: date + edit button ────────────────────────────────────
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  reviewDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  reviewBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  reviewBtnText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  reviewBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
  },
  reviewBtnPrimaryText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.surface,
  },
})

function PhotoImage({
  uri,
  width,
  height,
  resizeMode,
  storagePath,
}: {
  uri: string
  width: number
  height: number
  resizeMode: 'cover' | 'contain'
  storagePath?: string
}) {
  const [loading, setLoading] = useState(true)
  return (
    <View style={{ width, height }}>
      <Image
        source={uri}
        style={{ width, height }}
        contentFit={resizeMode}
        cachePolicy="disk"
        onLoadEnd={() => setLoading(false)}
        onError={(e) => {
          setLoading(false)
          logger.warn('Photos', 'load error:', storagePath, e.error)
        }}
      />
      {loading && (
        <View style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a' }}>
          <ActivityIndicator size="large" color="#666" />
        </View>
      )}
    </View>
  )
}

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = useWindowDimensions()
  const PHOTO_STRIP_HEIGHT = SCREEN_HEIGHT * PHOTO_STRIP_RATIO

  const { activities, remove, update, toggleFavorite, updateLastViewed, addPhoto, removePhoto } =
    useActivitiesStore()
  const { types } = useTypesStore()

  const activity = activities.find((a) => a.id === id)

  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [galleryVisible, setGalleryVisible] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [editingTags, setEditingTags] = useState(false)
  const [tagsDraft, setTagsDraft] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [savingTags, setSavingTags] = useState(false)

  const galleryListRef = useRef<FlatList<ActivityPhoto>>(null)

  useEffect(() => {
    if (id) updateLastViewed(id)
  }, [id, updateLastViewed])

  const { fetch: fetchReviews, getForActivity, getForType } = useReviewsStore()
  useEffect(() => {
    if (id) fetchReviews(id)
  }, [id, fetchReviews])
  const reviews = getForActivity(id)

  const [scoreDropdownOpen, setScoreDropdownOpen] = useState(false)

  const activityId = activity?.id
  useEffect(() => {
    if (activity) {
      setNotesDraft(activity.notes ?? '')
      setTagsDraft([...activity.tags])
    }
  // only reset drafts when navigating to a different activity
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId])

  if (!activity) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Attività" showBack topInset />
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>Attività non trovata.</Text>
        </View>
      </View>
    )
  }

  const activityTypes = types.filter((t) => activity.type_ids.includes(t.id))

  const handleOpenMaps = () => {
    const query = activity.address ?? `${activity.lat},${activity.lng}`
    const url =
      Platform.OS === 'ios'
        ? `maps://?q=${encodeURIComponent(query)}`
        : `geo:0,0?q=${encodeURIComponent(query)}`
    Linking.openURL(url).catch(() =>
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
      )
    )
  }

  const handleCall = () => {
    if (!activity.phone) return
    Linking.openURL(`tel:${activity.phone}`)
  }

  const handleDelete = () => {
    Alert.alert(
      'Elimina attività',
      `Vuoi eliminare "${activity.name}"? L'operazione non è reversibile.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            const error = await remove(id)
            if (error) {
              Alert.alert('Errore', error)
            } else {
              router.back()
            }
          },
        },
      ]
    )
  }

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permesso negato', "Consenti l'accesso alla libreria foto nelle impostazioni.")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
      allowsMultipleSelection: false,
      base64: false,
    })

    if (result.canceled || !result.assets?.[0]) return

    setUploadingPhoto(true)
    try {
      const asset = result.assets[0]

      // Resize to max 1200px wide — reduces file from ~3MB to ~150KB with no visible loss on mobile
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: false }
      )

      try {
        const photoRecord = await api.uploadPhoto(id, manipulated.uri)
        logger.log('Photos', 'upload ok, id:', photoRecord.id)
        addPhoto(id, photoRecord)
      } catch (e) {
        logger.error('Photos', 'upload error:', (e as Error).message)
        Alert.alert('Errore upload', 'Impossibile caricare la foto. Riprova.')
      }
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleDeletePhoto = (photo: ActivityPhoto) => {
    Alert.alert('Elimina foto', 'Vuoi rimuovere questa foto?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          setDeletingPhotoId(photo.id)
          try {
            await api.delete(`/photos/${photo.id}`)
          } catch { /* best effort */ }
          removePhoto(id, photo.id)
          setDeletingPhotoId(null)
        },
      },
    ])
  }

  const handleOpenGallery = (index: number) => {
    setGalleryIndex(index)
    setGalleryVisible(true)
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    await update(id, {
      name: activity.name,
      address: activity.address,
      lat: activity.lat,
      lng: activity.lng,
      phone: activity.phone,
      notes: notesDraft.trim() || null,
      tags: activity.tags,
      type_ids: activity.type_ids,
    })
    setSavingNotes(false)
    setEditingNotes(false)
  }

  const handleSaveTags = async () => {
    setSavingTags(true)
    await update(id, {
      name: activity.name,
      address: activity.address,
      lat: activity.lat,
      lng: activity.lng,
      phone: activity.phone,
      notes: activity.notes,
      tags: tagsDraft,
      type_ids: activity.type_ids,
    })
    setSavingTags(false)
    setEditingTags(false)
    setTagInput('')
  }

  const getPhotoUrl = (storagePath: string) => {
    // storage_path from the Laravel API is the full public URL
    logger.log('Photos', 'url:', storagePath)
    return storagePath
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={activity.name} showBack topInset />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* PHOTO STRIP */}
        <View style={[styles.photoStrip, { height: PHOTO_STRIP_HEIGHT }]}>
          {activity.photos.length === 0 ? (
            <TouchableOpacity
              style={styles.photoEmpty}
              onPress={handlePickPhoto}
              disabled={uploadingPhoto}
              activeOpacity={0.7}
            >
              <Ionicons
                name={uploadingPhoto ? 'cloud-upload-outline' : 'camera-outline'}
                size={40}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.photoEmptyText}>
                {uploadingPhoto ? 'Caricamento...' : 'Aggiungi foto'}
              </Text>
            </TouchableOpacity>
          ) : (
            <FlatList
              data={activity.photos}
              keyExtractor={(p) => p.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
                setPhotoIndex(idx)
              }}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  activeOpacity={0.95}
                  style={{ width: SCREEN_WIDTH, height: PHOTO_STRIP_HEIGHT }}
                  onPress={() => handleOpenGallery(index)}
                  onLongPress={() => handleDeletePhoto(item)}
                >
                  <PhotoImage
                    uri={getPhotoUrl(item.storage_path)}
                    width={SCREEN_WIDTH}
                    height={PHOTO_STRIP_HEIGHT}
                    resizeMode="cover"
                    storagePath={item.storage_path}
                  />
                  {deletingPhotoId === item.id && (
                    <View style={styles.photoOverlay}>
                      <Ionicons name="trash" size={24} color={theme.colors.surface} />
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
          {activity.photos.length > 0 && (
            <TouchableOpacity
              style={styles.photoAddOverlay}
              onPress={handlePickPhoto}
              disabled={uploadingPhoto}
              activeOpacity={0.8}
            >
              <Ionicons
                name={uploadingPhoto ? 'cloud-upload-outline' : 'camera-outline'}
                size={18}
                color={theme.colors.surface}
              />
            </TouchableOpacity>
          )}
          {activity.photos.length > 1 && (
            <View style={styles.pageDots} pointerEvents="none">
              {activity.photos.map((_, i) => (
                <View key={i} style={[styles.pageDot, i === photoIndex && styles.pageDotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* BODY */}
        <View style={styles.body}>
          <Text style={styles.activityName}>{activity.name}</Text>

          {activity.address ? (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.addressText}>{activity.address}</Text>
            </View>
          ) : null}

          {activityTypes.length > 0 && (
            <View style={styles.typesRow}>
              {activityTypes.map((t) => (
                <View key={t.id} style={styles.typeChip}>
                  <Ionicons
                    name={t.icon_key as 'restaurant-outline'}
                    size={12}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.typeChipText}>{t.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Horizontal icon row */}
          <View style={styles.iconRow}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => toggleFavorite(id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={activity.is_favorite ? 'heart' : 'heart-outline'}
                size={22}
                color={activity.is_favorite ? theme.colors.favorite : theme.colors.textSecondary}
              />
              <Text style={styles.iconBtnLabel}>Preferiti</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => {
                setNotesDraft(activity.notes ?? '')
                setEditingNotes(true)
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={activity.notes ? 'document-text' : 'document-text-outline'}
                size={22}
                color={activity.notes ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text style={styles.iconBtnLabel}>Note</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => {
                setTagsDraft([...activity.tags])
                setTagInput('')
                setEditingTags(true)
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={activity.tags.length > 0 ? 'pricetags' : 'pricetags-outline'}
                size={22}
                color={activity.tags.length > 0 ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text style={styles.iconBtnLabel}>Tag</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconBtn, !activity.address && styles.iconBtnDisabled]}
              onPress={activity.address ? handleOpenMaps : undefined}
              activeOpacity={activity.address ? 0.7 : 1}
            >
              <Ionicons
                name="navigate-outline"
                size={22}
                color={activity.address ? theme.colors.textSecondary : theme.colors.border}
              />
              <Text style={[styles.iconBtnLabel, !activity.address && styles.iconBtnLabelDisabled]}>
                Indicazioni
              </Text>
            </TouchableOpacity>
          </View>

          {/* Phone row */}
          {activity.phone && (
            <TouchableOpacity style={styles.phoneRow} onPress={handleCall} activeOpacity={0.7}>
              <Ionicons name="call-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.phoneText}>{activity.phone}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Review section */}
          <ReviewSection
            activityId={id}
            activityTypes={activityTypes}
            reviews={reviews}
            scoreDropdownOpen={scoreDropdownOpen}
            onToggleDropdown={() => setScoreDropdownOpen((v) => !v)}
            onNavigateReview={(typeId, typeName) =>
              router.push({
                pathname: '/activity/review/[id]',
                params: { id, typeId, typeName },
              })
            }
          />

          {/* Edit + Delete */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push({ pathname: '/activity/edit/[id]', params: { id } })}
            activeOpacity={0.8}
          >
            <Ionicons name="pencil-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.editBtnText}>Modifica attività</Text>
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
            <Text style={styles.deleteBtnText}>Elimina attività</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Gallery modal */}
      <Modal
        visible={galleryVisible}
        animationType="fade"
        statusBarTranslucent
        onShow={() => {
          if (galleryIndex > 0) {
            galleryListRef.current?.scrollToIndex({ index: galleryIndex, animated: false })
          }
        }}
      >
        <View style={styles.gallery}>
          <FlatList
            ref={galleryListRef}
            data={activity.photos}
            keyExtractor={(p) => p.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={galleryIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            renderItem={({ item }) => (
              <PhotoImage
                uri={getPhotoUrl(item.storage_path)}
                width={SCREEN_WIDTH}
                height={SCREEN_HEIGHT}
                resizeMode="contain"
                storagePath={item.storage_path}
              />
            )}
          />
          <TouchableOpacity
            style={styles.galleryClose}
            onPress={() => setGalleryVisible(false)}
            hitSlop={12}
          >
            <Ionicons name="close" size={28} color={theme.colors.surface} />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Notes edit modal */}
      <Modal visible={editingNotes} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.modalSheet}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditingNotes(false)} hitSlop={8}>
              <Text style={styles.modalCancel}>Annulla</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Note</Text>
            <TouchableOpacity onPress={handleSaveNotes} disabled={savingNotes} hitSlop={8}>
              <Text style={[styles.modalSave, savingNotes && styles.modalSaveDisabled]}>Salva</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.notesInput}
            value={notesDraft}
            onChangeText={setNotesDraft}
            placeholder="Appunti, impressioni, suggerimenti..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            autoFocus
            textAlignVertical="top"
          />
        </KeyboardAvoidingView>
      </Modal>

      {/* Tags edit modal */}
      <Modal visible={editingTags} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.modalSheet}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditingTags(false)} hitSlop={8}>
              <Text style={styles.modalCancel}>Annulla</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Tag</Text>
            <TouchableOpacity onPress={handleSaveTags} disabled={savingTags} hitSlop={8}>
              <Text style={[styles.modalSave, savingTags && styles.modalSaveDisabled]}>Salva</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={styles.tagsModalContent}
            keyboardShouldPersistTaps="handled"
          >
            {tagsDraft.length > 0 && (
              <View style={styles.tagsWrap}>
                {tagsDraft.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>#{tag}</Text>
                    <TouchableOpacity
                      onPress={() => setTagsDraft(tagsDraft.filter((t) => t !== tag))}
                      hitSlop={6}
                    >
                      <Ionicons name="close" size={14} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.tagInputRow}>
              <TextInput
                style={styles.tagInput}
                value={tagInput}
                onChangeText={(t) => setTagInput(t.toLowerCase())}
                placeholder="Nuovo tag..."
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={() => {
                  const newTags = tagInput
                    .toLowerCase()
                    .split(/[\s,]+/)
                    .map((t) => t.trim())
                    .filter((t) => t.length > 0 && !tagsDraft.includes(t))
                  if (newTags.length > 0) setTagsDraft([...tagsDraft, ...newTags])
                  setTagInput('')
                }}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={styles.tagAddBtn}
                onPress={() => {
                  const newTags = tagInput
                    .toLowerCase()
                    .split(/[\s,]+/)
                    .map((t) => t.trim())
                    .filter((t) => t.length > 0 && !tagsDraft.includes(t))
                  if (newTags.length > 0) setTagsDraft([...tagsDraft, ...newTags])
                  setTagInput('')
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color={theme.colors.surface} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },

  // Photo strip
  photoStrip: {
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
  },
  photoEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  photoEmptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddOverlay: {
    position: 'absolute',
    bottom: theme.spacing.md,
    right: theme.spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageDots: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  pageDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },

  // Body
  body: {
    padding: theme.spacing.md,
  },
  activityName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  addressText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: `${theme.colors.primary}18`,
  },
  typeChipText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },

  // Icon row
  iconRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  iconBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: 4,
  },
  iconBtnDisabled: {
    opacity: 0.35,
  },
  iconBtnLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  iconBtnLabelDisabled: {
    color: theme.colors.border,
  },

  // Phone row
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  phoneText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },

  // Review placeholder
  reviewPlaceholder: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  reviewPlaceholderText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  // Edit
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  editBtnText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },

  // Delete
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  deleteBtnText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.error,
  },

  // Gallery
  gallery: {
    flex: 1,
    backgroundColor: '#000',
  },
  galleryClose: {
    position: 'absolute',
    top: 56,
    right: theme.spacing.md,
  },

  // Modals
  modalSheet: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  modalCancel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  modalSave: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  modalSaveDisabled: {
    opacity: 0.4,
  },
  notesInput: {
    flex: 1,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    textAlignVertical: 'top',
  },
  tagsModalContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.border,
  },
  tagChipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  tagAddBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
