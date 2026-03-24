import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
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
import { useNominatim } from '@/hooks/useNominatim'
import { theme } from '@/theme'

export default function EditActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { activities, update } = useActivitiesStore()
  const { types, fetch: fetchTypes } = useTypesStore()
  const { results: addressResults, loading: addressLoading, search: searchAddress, clear: clearAddress } = useNominatim()

  const activity = activities.find((a) => a.id === id)

  const [name, setName] = useState(activity?.name ?? '')
  const [addressText, setAddressText] = useState(activity?.address ?? '')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    activity?.lat != null && activity?.lng != null
      ? { lat: activity.lat, lng: activity.lng }
      : null
  )
  const [phone, setPhone] = useState(activity?.phone ?? '')
  const [notes, setNotes] = useState(activity?.notes ?? '')
  const [tags, setTags] = useState<string[]>(activity?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>(activity?.type_ids ?? [])
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [typesError, setTypesError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [showAddressResults, setShowAddressResults] = useState(false)
  const addressInputRef = useRef<TextInput>(null)

  useEffect(() => {
    fetchTypes()
  }, [fetchTypes])

  const handleAddressChange = (text: string) => {
    setAddressText(text)
    setShowAddressResults(true)
    searchAddress(text)
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

  const toggleType = (typeId: string) => {
    setSelectedTypeIds((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    )
    if (typesError) setTypesError(null)
  }

  const handleSave = async () => {
    setNameError(null)
    setTypesError(null)
    setSaveError(null)

    if (!name.trim()) {
      setNameError("Inserisci il nome dell'attività.")
      return
    }
    if (selectedTypeIds.length === 0) {
      setTypesError('Seleziona almeno una tipologia.')
      return
    }

    setSaving(true)
    const error = await update(id, {
      name: name.trim(),
      address: addressText.trim() || null,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
      tags,
      type_ids: selectedTypeIds,
    })
    setSaving(false)

    if (error) {
      setSaveError(error)
      return
    }

    router.back()
  }

  if (!activity) {
    return (
      <View style={styles.wrapper}>
        <ScreenHeader title="Modifica" showBack topInset />
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>Attività non trovata.</Text>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScreenHeader
        title="Modifica Attività"
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
        {saveError ? <Text style={styles.errorBanner}>{saveError}</Text> : null}

        {/* NOME */}
        <View style={styles.section}>
          <Text style={styles.label}>Nome *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(v) => { setName(v); if (nameError) setNameError(null) }}
            placeholder="Es. Trattoria da Mario"
            placeholderTextColor={theme.colors.textSecondary}
            returnKeyType="next"
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>

        {/* INDIRIZZO con autocomplete */}
        <View style={styles.section}>
          <Text style={styles.label}>Indirizzo</Text>
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

          <TouchableOpacity
            style={styles.manageTypesLink}
            onPress={() => router.push('/private/types')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.manageTypesText}>Gestisci tipologie</Text>
          </TouchableOpacity>
          {typesError ? <Text style={styles.errorText}>{typesError}</Text> : null}
        </View>

        {/* NOTE */
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
            <TouchableOpacity style={styles.tagAddBtn} onPress={handleAddTag} activeOpacity={0.8}>
              <Ionicons name="add" size={20} color={theme.colors.surface} />
            </TouchableOpacity>
          </View>
          {tags.length > 0 && (
            <View style={styles.chipsWrap}>
              {tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => setTags(tags.filter((t) => t !== tag))} hitSlop={6}>
                    <Ionicons name="close" size={14} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
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
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  errorBanner: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
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
  manageTypesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  manageTypesText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  tagInputRow: {
    flexDirection: 'row',
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
})
