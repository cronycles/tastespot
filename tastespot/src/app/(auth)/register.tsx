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

export default function RegisterScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { signUp, loading } = useAuthStore()
  const router = useRouter()

  const handleRegister = async () => {
    setError(null)
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Compila tutti i campi.')
      return
    }
    if (password !== confirmPassword) {
      setError('Le password non coincidono.')
      return
    }
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri.')
      return
    }
    // signUp auto-logs in on success — _layout.tsx will redirect to tabs
    const err = await signUp(name.trim(), email.trim(), password)
    if (err) setError(err)
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>TasteSpot</Text>
        <Text style={styles.subtitle}>Crea un nuovo account</Text>

        <View style={styles.form}>
          <FormInput
            label="Nome"
            value={name}
            onChangeText={setName}
            placeholder="Il tuo nome"
            autoComplete="name"
          />
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
            placeholder="Minimo 6 caratteri"
            autoComplete="new-password"
          />
          <FormInput
            label="Conferma password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Ripeti la password"
            autoComplete="new-password"
          />

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <Button
            label="Registrati"
            onPress={handleRegister}
            loading={loading}
            style={styles.button}
          />

          <TouchableOpacity onPress={() => router.back()} style={styles.link}>
            <Text style={styles.linkText}>
              Hai già un account? <Text style={styles.linkBold}>Accedi</Text>
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
  successContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  successTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  successText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  successEmail: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.semibold,
  },
  successButton: {
    width: '100%',
  },
})

