import { StyleSheet, Text, View } from 'react-native'
import { theme } from '@/theme'

export default function PrivateHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Area Privata</Text>
      <Text style={styles.subtitle}>Private home — Phase 2</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
})
