import { useState } from 'react'
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTypesStore } from '@/stores/typesStore'
import { theme } from '@/theme'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CategoryKey = 'location' | 'food' | 'service' | 'price'

export type FilterState = {
  typeIds: string[]
  scoreMin: number | null
  scoreMax: number | null
  categoryKey: CategoryKey | null
  categoryMin: number | null
  categoryMax: number | null
  favoritesOnly: boolean
}

export const EMPTY_FILTER: FilterState = {
  typeIds: [],
  scoreMin: null,
  scoreMax: null,
  categoryKey: null,
  categoryMin: null,
  categoryMax: null,
  favoritesOnly: false,
}

export function countActiveFilters(f: FilterState): number {
  let n = 0
  if (f.typeIds.length > 0) n++
  if (f.scoreMin != null || f.scoreMax != null) n++
  if (f.categoryKey != null) n++
  if (f.favoritesOnly) n++
  return n
}

// ─── Category labels ──────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: { key: CategoryKey; label: string }[] = [
  { key: 'location', label: 'Location' },
  { key: 'food',     label: 'Cibo' },
  { key: 'service',  label: 'Servizio' },
  { key: 'price',    label: 'Conto' },
]

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  visible: boolean
  value: FilterState
  onApply: (f: FilterState) => void
  onClose: () => void
}

export function FilterPanel({ visible, value, onApply, onClose }: Props) {
  const { types } = useTypesStore()

  // Local draft — only applied on "Applica"
  const [draft, setDraft] = useState<FilterState>(value)

  const update = (partial: Partial<FilterState>) =>
    setDraft((prev) => ({ ...prev, ...partial }))

  const handleOpen = () => setDraft(value)

  const handleApply = () => {
    onApply(draft)
    onClose()
  }

  const handleReset = () => {
    setDraft(EMPTY_FILTER)
    onApply(EMPTY_FILTER)
    onClose()
  }

  const toggleType = (id: string) =>
    update({
      typeIds: draft.typeIds.includes(id)
        ? draft.typeIds.filter((t) => t !== id)
        : [...draft.typeIds, id],
    })

  const parseScore = (v: string): number | null => {
    const n = parseFloat(v.replace(',', '.'))
    if (isNaN(n)) return null
    return Math.min(10, Math.max(0, n))
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onShow={handleOpen}
    >
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleReset} hitSlop={8}>
            <Text style={styles.resetBtn}>Azzera</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filtri</Text>
          <TouchableOpacity onPress={handleApply} hitSlop={8}>
            <Text style={styles.applyBtn}>Applica</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>

          {/* TIPOLOGIE */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tipologie</Text>
            <View style={styles.chipsWrap}>
              {types.map((t) => {
                const sel = draft.typeIds.includes(t.id)
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.chip, sel && styles.chipActive]}
                    onPress={() => toggleType(t.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={t.icon_key as 'restaurant-outline'}
                      size={13}
                      color={sel ? theme.colors.surface : theme.colors.textSecondary}
                    />
                    <Text style={[styles.chipText, sel && styles.chipTextActive]}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* PUNTEGGIO MEDIO */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Punteggio medio (0–10)</Text>
            <View style={styles.rangeRow}>
              <View style={styles.rangeField}>
                <Text style={styles.rangeFieldLabel}>Min</Text>
                <TextInput
                  style={styles.rangeInput}
                  value={draft.scoreMin != null ? String(draft.scoreMin) : ''}
                  onChangeText={(v) => update({ scoreMin: parseScore(v) })}
                  placeholder="0"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="decimal-pad"
                  maxLength={4}
                />
              </View>
              <Text style={styles.rangeSep}>—</Text>
              <View style={styles.rangeField}>
                <Text style={styles.rangeFieldLabel}>Max</Text>
                <TextInput
                  style={styles.rangeInput}
                  value={draft.scoreMax != null ? String(draft.scoreMax) : ''}
                  onChangeText={(v) => update({ scoreMax: parseScore(v) })}
                  placeholder="10"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="decimal-pad"
                  maxLength={4}
                />
              </View>
            </View>
          </View>

          {/* CATEGORIA DI VOTO */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Categoria di voto</Text>
            <Text style={styles.sectionHint}>
              L'attività è inclusa se almeno una sua recensione soddisfa la condizione
            </Text>
            <View style={styles.chipsWrap}>
              {CATEGORY_OPTIONS.map((c) => {
                const sel = draft.categoryKey === c.key
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.chip, sel && styles.chipActive]}
                    onPress={() => update({ categoryKey: sel ? null : c.key })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, sel && styles.chipTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            {draft.categoryKey && (
              <View style={[styles.rangeRow, { marginTop: theme.spacing.sm }]}>
                <View style={styles.rangeField}>
                  <Text style={styles.rangeFieldLabel}>Min</Text>
                  <TextInput
                    style={styles.rangeInput}
                    value={draft.categoryMin != null ? String(draft.categoryMin) : ''}
                    onChangeText={(v) => update({ categoryMin: parseScore(v) })}
                    placeholder="0"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="decimal-pad"
                    maxLength={4}
                  />
                </View>
                <Text style={styles.rangeSep}>—</Text>
                <View style={styles.rangeField}>
                  <Text style={styles.rangeFieldLabel}>Max</Text>
                  <TextInput
                    style={styles.rangeInput}
                    value={draft.categoryMax != null ? String(draft.categoryMax) : ''}
                    onChangeText={(v) => update({ categoryMax: parseScore(v) })}
                    placeholder="10"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="decimal-pad"
                    maxLength={4}
                  />
                </View>
              </View>
            )}
          </View>

          {/* SOLO PREFERITI */}
          <View style={[styles.section, styles.favoriteRow]}>
            <View style={styles.favoriteLeft}>
              <Ionicons name="heart-outline" size={18} color={theme.colors.favorite} />
              <Text style={styles.sectionLabel}>Solo preferiti</Text>
            </View>
            <Switch
              value={draft.favoritesOnly}
              onValueChange={(v) => update({ favoritesOnly: v })}
              trackColor={{ true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          </View>

        </ScrollView>
      </View>
    </Modal>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  resetBtn: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  applyBtn: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  chipTextActive: {
    color: theme.colors.surface,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rangeField: {
    flex: 1,
    gap: 4,
  },
  rangeFieldLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  rangeInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  rangeSep: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    paddingTop: theme.spacing.lg,
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  favoriteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
})
