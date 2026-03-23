import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { theme } from '@/theme'
import { SMILE_VALUES } from '@/stores/reviewsStore'

const SMILES = ['😞', '😕', '😐', '🙂', '😛'] as const

type Props = {
  label: string
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
}

export function SmileRating({ label, value, onChange, disabled }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {SMILES.map((smile, index) => {
          const smileValue = SMILE_VALUES[index]
          const selected = value === smileValue
          return (
            <TouchableOpacity
              key={index}
              style={[styles.smileBtn, selected && styles.smileBtnSelected]}
              onPress={() => !disabled && onChange(smileValue)}
              activeOpacity={disabled ? 1 : 0.7}
            >
              <Text style={[styles.smileEmoji, selected && styles.smileEmojiSelected]}>
                {smile}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  smileBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  smileBtnSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}18`,
  },
  smileEmoji: {
    fontSize: 24,
    opacity: 0.5,
  },
  smileEmojiSelected: {
    opacity: 1,
  },
})
