import { useState } from 'react'
import {
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { ScreenHeader } from '@/components/ScreenHeader'
import { FormInput } from '@/components/FormInput'
import { Button } from '@/components/Button'
import { theme } from '@/theme'

export default function SecurityScreen() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChangePassword = async () => {
    setError(null)
    setSuccess(false)
    if (!password || !confirmPassword) {
      setError('Compila entrambi i campi.')
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
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError('Errore durante il salvataggio. Riprova.')
    } else {
      setSuccess(true)
      setPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader title="Sicurezza" showBack topInset />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Cambia password</Text>
        <FormInput
          label="Nuova password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Minimo 6 caratteri"
        />
        <FormInput
          label="Conferma nuova password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="Ripeti la password"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>Password aggiornata con successo.</Text> : null}
        <Button label="Salva" onPress={handleChangePassword} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  error: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
  },
  success: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.success,
    marginBottom: theme.spacing.md,
  },
})
