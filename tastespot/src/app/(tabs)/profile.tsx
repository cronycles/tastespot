import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/authStore'
import { ScreenHeader } from '@/components/ScreenHeader'
import { theme } from '@/theme'

type MenuItemProps = {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  onPress: () => void
}

function MenuItem({ icon, label, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={22} color={theme.colors.primary} style={styles.menuIcon} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  )
}

export default function ProfileScreen() {
  const router = useRouter()
  const { signOut } = useAuthStore()

  return (
    <View style={styles.container}>
      <ScreenHeader title="Area Privata" />
      <View style={styles.emailContainer}>
        <Ionicons name="person-circle-outline" size={48} color={theme.colors.primary} />
      </View>
      <View style={styles.menu}>
        <MenuItem
          icon="options-outline"
          label="Tipologie"
          onPress={() => router.push('/private/types')}
        />
        <MenuItem
          icon="lock-closed-outline"
          label="Sicurezza"
          onPress={() => router.push('/private/security')}
        />
      </View>
      <TouchableOpacity style={styles.signOut} onPress={signOut} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
        <Text style={styles.signOutText}>Esci</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  emailContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  email: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  menu: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuIcon: {
    marginRight: theme.spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
  },
  signOutText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.error,
    fontWeight: theme.fontWeight.medium,
  },
})
