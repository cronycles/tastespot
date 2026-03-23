import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ScreenHeader } from '@/components/ScreenHeader'
import { useActivitiesStore } from '@/stores/activitiesStore'
import { useTypesStore } from '@/stores/typesStore'
import { useNominatim, reverseGeocode } from '@/hooks/useNominatim'
import { theme } from '@/theme'

// Maps OSM amenity/shop values to Italian type name keywords for matching
const OSM_TYPE_KEYWORDS: Record<string, string[]> = {
  restaurant: ['ristorante', 'restaurant', 'trattoria', 'osteria'],
  cafe: ['bar', 'caffè', 'caffe', 'cafe', 'caffetteria', 'coffee'],
  bar: ['bar', 'pub', 'birreria', 'enoteca'],
  pub: ['pub', 'bar', 'birreria'],
  fast_food: ['fast food', 'fastfood', 'street food'],
  ice_cream: ['gelateria', 'gelato'],
  bakery: ['panetteria', 'bakery', 'forno', 'pasticceria'],
  pizza: ['pizzeria', 'pizza'],
  wine_bar: ['enoteca', 'wine', 'vino'],
  confectionery: ['pasticceria', 'dolci'],
}

export default function AddActivityScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    lat?: string
    lng?: string
    name?: string
    address?: string
    osmAmenity?: string
    phone?: string
  }>()

  const { create } = useActivitiesStore()
  const { types, fetch: fetchTypes } = useTypesStore()
  const { results: addressResults, loading: addressLoading, search: searchAddress, clear: clearAddress } = useNominatim()

  // Form state
  const [name, setName] = useState(params.name ?? '')
  const [addressText, setAddressText] = useState(params.address ?? '')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    params.lat && params.lng
      ? { lat: parseFloat(params.lat), lng: parseFloat(params.lng) }
      : null
  )
  const [phone, setPhone] = useState(params.phone ?? '')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [saving, setSaving] = useState(false)

  // Inline new-type creation
  const [newTypeName, setNewTypeName] = useState('')
  const [savingType, setSavingType] = useState(false)
  const { create: createType } = useTypesStore()

  // Address field autocomplete
  const [showAddressResults, setShowAddressResults] = useState(false)
  const addressInputRef = useRef<TextInput>(null)

  useEffect(() => {
    fetchTypes()
  }, [fetchTypes])

  // Pre-select type from OSM amenity
  useEffect(() => {
    if (!params.osmAmenity || types.length === 0) return
    const keywords = OSM_TYPE_KEYWORDS[params.osmAmenity] ?? [params.osmAmenity]
    const matched = types.find((t) =>
      keywords.some((kw) => t.name.toLowerCase().includes(kw.toLowerCase()))
    )
    if (matched) setSelectedTypeIds([matched.id])
  }, [params.osmAmenity, types])

  // Reverse geocode when lat+lng provided but no address
  useEffect(() => {
    if (params.lat && params.lng && !params.address) {
      reverseGeocode(parseFloat(params.lat), parseFloat(params.lng)).then((addr) => {
        if (addr) setAddressText(addr)
      })
    }
  }, [params.lat, params.lng, params.address])

  const handleAddressChange = (text: string) => {
    setAddressText(text)
    setShowAddressResults(true)
    searchAddress(text)
    // Clear coords when user manually types an address
    if (coords) setCoords(null)
  }

  const handleSelectAddress = (result: { display_name: string; lat: string; lon: string }) => {
    Keyboard.dismiss()
    setAddressText(result.display_name)
    setCoords({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) })
    setShowAddressResults(false)
    clearAddress()
  }

  const handleAddTag = () => {
    const newTags = tagInput
      .toLowerCase()
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !tags.includes(t))
    if (newTags.length === 0) return
    setTags([...tags, ...newTags])
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const toggleType = (id: string) => {
    setSelectedTypeIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Campo obbligatorio', "Inserisci il nome dell'attività.")
      return
    }
    if (!addressText.trim() || !coords) {
      Alert.alert('Campo obbligatorio', "Inserisci l'indirizzo dell'attività.")
      return
    }
    if (selectedTypeIds.length === 0) {
      Alert.alert('Campo obbligatorio', 'Seleziona almeno una tipologia. Puoi crearne una nuova usando il campo qui sopra.')
      return
    }

    setSaving(true)
    const error = await create({
      name: name.trim(),
      address: addressText.trim() || null,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
      tags,
      type_ids: selectedTypeIds,
      is_favorite: isFavorite,
    })
    setSaving(false)

    if (error) {
      Alert.alert('Errore', error)
      return
    }

    router.back()
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScreenHeader
        title="Aggiungi Attività"
        showBack
        topInset
        right={
          saving ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <TouchableOpacity onPress={handleSave} hitSlop={8}>
              <Text style={styles.saveButton}>Salva</Text>
            </TouchableOpacity>
          )
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* NOME */}
        <View style={styles.section}>
          <Text style={styles.label}>Nome *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Es. Trattoria da Mario"
            placeholderTextColor={theme.colors.textSecondary}
            autoFocus={!name}
            returnKeyType="next"
          />
        </View>

        {/* INDIRIZZO con autocomplete */}
        <View style={styles.section}>
          <Text style={styles.label}>Indirizzo *</Text>
          <TextInput
            ref={addressInputRef}
            style={styles.input}
            value={addressText}
            onChangeText={handleAddressChange}
            onFocus={() => addressText.length > 0 && setShowAddressResults(true)}
            placeholder="Cerca indirizzo..."
            placeholderTextColor={theme.colors.textSecondary}
            returnKeyType="next"
          />
          {coords && (
            <Text style={styles.coordsHint}>
              <Ionicons name="location" size={12} color={theme.colors.primary} />
              {`  ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`}
            </Text>
          )}
          {showAddressResults && addressResults.length > 0 && (
            <View style={styles.dropdown}>
              <FlatList
                data={addressResults}
                keyExtractor={(item) => String(item.place_id)}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleSelectAddress(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={theme.colors.primary}
                      style={styles.dropdownIcon}
                    />
                    <Text style={styles.dropdownText} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* TELEFONO */}
        <View style={styles.section}>
          <Text style={styles.label}>Telefono</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Es. +39 010 123456"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="phone-pad"
            returnKeyType="next"
          />
        </View>

        {/* TIPOLOGIE */}
        <View style={styles.section}>
          <Text style={styles.label}>Tipologie *</Text>

          {/* Chips tipologie esistenti */}
          {types.length > 0 && (
            <View style={styles.chipsWrap}>
              {types.map((t) => {
                const selected = selectedTypeIds.includes(t.id)
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.typeChip, selected && styles.typeChipSelected]}
                    onPress={() => toggleType(t.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={t.icon_key as 'restaurant-outline'}
                      size={14}
                      color={selected ? theme.colors.surface : theme.colors.textSecondary}
                      style={styles.chipIcon}
                    />
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          {/* Crea nuova tipologia inline */}
          <View style={styles.newTypeRow}>
            <TextInput
              style={[styles.input, styles.newTypeInput]}
              value={newTypeName}
              onChangeText={setNewTypeName}
              placeholder="Nuova tipologia (es. Pizzeria)"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={async () => {
                if (!newTypeName.trim() || savingType) return
                setSavingType(true)
                const err = await createType(newTypeName.trim(), null, 'restaurant-outline')
                setSavingType(false)
                if (!err) {
                  const created = useTypesStore.getState().types.at(-1)
                  if (created) setSelectedTypeIds((prev) => [...prev, created.id])
                  setNewTypeName('')
                }
              }}
            />
            <TouchableOpacity
              style={[styles.tagAddBtn, savingType && { opacity: 0.5 }]}
              disabled={savingType}
              onPress={async () => {
                if (!newTypeName.trim() || savingType) return
                setSavingType(true)
                const err = await createType(newTypeName.trim(), null, 'restaurant-outline')
                setSavingType(false)
                if (!err) {
                  const created = useTypesStore.getState().types.at(-1)
                  if (created) setSelectedTypeIds((prev) => [...prev, created.id])
                  setNewTypeName('')
                }
              }}
              activeOpacity={0.8}
            >
              {savingType
                ? <ActivityIndicator size="small" color={theme.colors.surface} />
                : <Ionicons name="add" size={20} color={theme.colors.surface} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* NOTE */}
        <View style={styles.section}>
          <Text style={styles.label}>Note</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Appunti, impressioni, suggerimenti..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* TAG */}
        <View style={styles.section}>
          <Text style={styles.label}>Tag</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.input, styles.tagInput]}
              value={tagInput}
              onChangeText={(t) => setTagInput(t.toLowerCase())}
              placeholder="Es. romantico, economico..."
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleAddTag}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={styles.tagAddBtn}
              onPress={handleAddTag}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color={theme.colors.surface} />
            </TouchableOpacity>
          </View>
          {tags.length > 0 && (
            <View style={styles.chipsWrap}>
              {tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(tag)} hitSlop={6}>
                    <Ionicons name="close" size={14} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* PREFERITI */}
        <View style={[styles.section, styles.favoriteRow]}>
          <View style={styles.favoriteLeft}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={theme.colors.favorite}
            />
            <Text style={styles.label}>Aggiungi ai preferiti</Text>
          </View>
          <Switch
            value={isFavorite}
            onValueChange={setIsFavorite}
            trackColor={{ true: theme.colors.primary }}
            thumbColor={theme.colors.surface}
          />
        </View>

        {/* Spaziatura finale per evitare che la tastiera copra l'ultimo campo */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  saveButton: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: theme.spacing.sm + 2,
  },
  coordsHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  dropdown: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownIcon: {
    marginTop: 2,
    marginRight: theme.spacing.sm,
  },
  dropdownText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  typeChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  chipTextSelected: {
    color: theme.colors.surface,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  tagInput: {
    flex: 1,
  },
  tagAddBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTypeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  newTypeInput: {
    flex: 1,
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
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  favoriteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
})

