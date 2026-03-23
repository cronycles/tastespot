import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/stores/authStore'
import { FormInput } from '@/components/FormInput'
import { Button } from '@/components/Button'
import { theme } from '@/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { signIn, loading } = useAuthStore()
  const router = useRouter()

  const handleLogin = async () => {
    setError(null)
    if (!email.trim() || !password) {
      setError('Inserisci email e password.')
      return
    }
    const err = await signIn(email.trim(), password)
    if (err) setError(err)
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>TasteSpot</Text>
        <Text style={styles.subtitle}>Accedi al tuo account</Text>

        <View style={styles.form}>
          <FormInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="nome@esempio.com"
            autoComplete="email"
          />
          <FormInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <Button label="Accedi" onPress={handleLogin} loading={loading} style={styles.button} />

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.link}>
            <Text style={styles.linkText}>
              Non hai un account? <Text style={styles.linkBold}>Registrati</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  logo: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  form: {
    width: '100%',
  },
  errorBanner: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  button: {
    marginTop: theme.spacing.sm,
  },
  link: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  linkBold: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
})

