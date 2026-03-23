import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import { ScreenHeader } from '@/components/ScreenHeader'
import { SmileRating } from '@/components/SmileRating'
import { useReviewsStore } from '@/stores/reviewsStore'
import { theme } from '@/theme'

export default function ReviewScreen() {
  const { id, typeId, typeName } = useLocalSearchParams<{
    id: string
    typeId: string
    typeName: string
  }>()
  const router = useRouter()

  const { getForType, upsert, loading } = useReviewsStore()
  const existing = getForType(id, typeId)

  const [scoreLocation, setScoreLocation] = useState<number | null>(existing?.score_location ?? null)
  const [scoreFood, setScoreFood] = useState<number | null>(existing?.score_food ?? null)
  const [scoreService, setScoreService] = useState<number | null>(existing?.score_service ?? null)
  const [scorePrice, setScorePrice] = useState<number | null>(existing?.score_price ?? null)
  const [costPerPerson, setCostPerPerson] = useState(
    existing?.cost_per_person != null ? String(existing.cost_per_person) : ''
  )
  const [liked, setLiked] = useState(existing?.liked ?? '')
  const [disliked, setDisliked] = useState(existing?.disliked ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [saving, setSaving] = useState(false)

  const hasAnyScore =
    scoreLocation !== null || scoreFood !== null || scoreService !== null || scorePrice !== null

  const handleSave = async () => {
    if (!hasAnyScore) {
      Alert.alert('Valutazione richiesta', 'Dai almeno un voto a una categoria.')
      return
    }

    setSaving(true)
    const error = await upsert({
      activity_id: id,
      activity_type_id: typeId,
      score_location: scoreLocation,
      score_food: scoreFood,
      score_service: scoreService,
      score_price: scorePrice,
      cost_per_person: costPerPerson.trim() ? parseFloat(costPerPerson) : null,
      liked: liked.trim() || null,
      disliked: disliked.trim() || null,
      notes: notes.trim() || null,
    })
    setSaving(false)

    if (error) {
      Alert.alert('Errore', error)
      return
    }
    router.back()
  }

  const title = typeName ? `Recensione — ${typeName}` : 'Recensione'

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader
        title={title}
        showBack
        topInset
        right={
          saving || loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <TouchableOpacity onPress={handleSave} hitSlop={8}>
              <Text style={styles.saveBtn}>Salva</Text>
            </TouchableOpacity>
          )
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {existing && (
          <View style={styles.dateRow}>
            <Text style={styles.dateText}>Creata il {formatDate(existing.created_at)}</Text>
            {existing.updated_at !== existing.created_at && (
              <Text style={styles.dateText}>Modificata il {formatDate(existing.updated_at)}</Text>
            )}
          </View>
        )}

        {/* SCORES */}
        <View style={styles.section}>
          <SmileRating label="Location" value={scoreLocation} onChange={setScoreLocation} />
          <SmileRating label="Cibo" value={scoreFood} onChange={setScoreFood} />
          <SmileRating label="Servizio" value={scoreService} onChange={setScoreService} />
          <SmileRating label="Conto" value={scorePrice} onChange={setScorePrice} />
        </View>

        {/* OPTIONAL FIELDS */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Informazioni aggiuntive</Text>

          <Text style={styles.fieldLabel}>Costo per persona (€)</Text>
          <TextInput
            style={styles.input}
            value={costPerPerson}
            onChangeText={setCostPerPerson}
            placeholder="Es. 15"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="decimal-pad"
            returnKeyType="next"
          />

          <Text style={styles.fieldLabel}>Cosa ti è piaciuto</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={liked}
            onChangeText={setLiked}
            placeholder="Es. ottima pizza, ottimo servizio..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />

          <Text style={styles.fieldLabel}>Cosa non ti è piaciuto</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={disliked}
            onChangeText={setDisliked}
            placeholder="Es. troppo caro, lento..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />

          <Text style={styles.fieldLabel}>Note aggiuntive</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Altre impressioni..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: theme.spacing.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
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
  saveBtn: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  dateRow: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    gap: 4,
  },
  dateText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
  },
  fieldLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
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
    marginBottom: theme.spacing.md,
  },
  inputMultiline: {
    minHeight: 72,
    paddingTop: theme.spacing.sm + 2,
  },
})
