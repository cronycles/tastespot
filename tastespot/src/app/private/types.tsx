import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTypesStore } from '@/stores/typesStore'
import { ActivityType, AVAILABLE_ICONS, DEFAULT_ICON_KEY } from '@/types'
import { ScreenHeader } from '@/components/ScreenHeader'
import { FormInput } from '@/components/FormInput'
import { Button } from '@/components/Button'
import { theme } from '@/theme'

const EMPTY_FORM = { name: '', description: '', icon_key: DEFAULT_ICON_KEY }

export default function ActivityTypesScreen() {
  const { types, loading, fetch, create, update, remove, reorder } = useTypesStore()
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState<ActivityType | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch()
  }, [fetch])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalVisible(true)
  }

  const openEdit = (type: ActivityType) => {
    setEditing(type)
    setForm({ name: type.name, description: type.description ?? '', icon_key: type.icon_key })
    setFormError(null)
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setEditing(null)
  }

  const handleSave = async () => {
    setFormError(null)
    if (!form.name.trim()) {
      setFormError('Il nome è obbligatorio.')
      return
    }
    setSaving(true)
    const err = editing
      ? await update(editing.id, form.name.trim(), form.description || null, form.icon_key)
      : await create(form.name.trim(), form.description || null, form.icon_key)
    setSaving(false)
    if (err) {
      setFormError(err)
    } else {
      closeModal()
    }
  }

  const handleDelete = (type: ActivityType) => {
    Alert.alert(
      'Elimina tipologia',
      `Eliminando "${type.name}" verranno rimosse anche tutte le associazioni con le attività esistenti. Continuare?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            const err = await remove(type.id)
            if (err) Alert.alert('Errore', err)
          },
        },
      ]
    )
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        topInset
        title="Tipologie"
        showBack
        right={
          <TouchableOpacity onPress={openCreate} hitSlop={8}>
            <Ionicons name="add" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
        }
      />

      {loading && types.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : types.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="options-outline" size={48} color={theme.colors.border} />
          <Text style={styles.emptyText}>Nessuna tipologia ancora.{'\n'}Creane una con il +</Text>
        </View>
      ) : (
        <FlatList
          data={types}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <View style={styles.reorderButtons}>
                <TouchableOpacity
                  onPress={() => reorder(item.id, 'up')}
                  hitSlop={8}
                  disabled={index === 0}
                >
                  <Ionicons
                    name="chevron-up"
                    size={18}
                    color={index === 0 ? theme.colors.border : theme.colors.textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => reorder(item.id, 'down')}
                  hitSlop={8}
                  disabled={index === types.length - 1}
                >
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={index === types.length - 1 ? theme.colors.border : theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <Ionicons
                name={item.icon_key as React.ComponentProps<typeof Ionicons>['name']}
                size={24}
                color={theme.colors.primary}
                style={styles.rowIcon}
              />
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.rowDesc} numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => openEdit(item)} hitSlop={8} style={styles.rowAction}>
                <Ionicons name="pencil-outline" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                hitSlop={8}
                style={styles.rowAction}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.modalFlex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScreenHeader
            title={editing ? 'Modifica tipologia' : 'Nuova tipologia'}
            showBack={false}
            right={
              <TouchableOpacity onPress={closeModal} hitSlop={8}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            }
          />
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <FormInput
              label="Nome *"
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="es. Ristorante, Bar, Gelateria…"
            />
            <FormInput
              label="Descrizione"
              value={form.description}
              onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
              placeholder="Descrizione opzionale"
              multiline
            />
            <Text style={styles.iconLabel}>Icona</Text>
            <View style={styles.iconGrid}>
              {AVAILABLE_ICONS.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.iconCell, form.icon_key === key && styles.iconCellActive]}
                  onPress={() => setForm((f) => ({ ...f, icon_key: key }))}
                >
                  <Ionicons
                    name={key as React.ComponentProps<typeof Ionicons>['name']}
                    size={26}
                    color={form.icon_key === key ? theme.colors.primary : theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <Button
              label={editing ? 'Salva modifiche' : 'Crea tipologia'}
              onPress={handleSave}
              loading={saving}
              style={styles.saveButton}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    paddingVertical: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowIcon: {
    marginRight: theme.spacing.md,
  },
  reorderButtons: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    gap: 2,
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  rowDesc: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  rowAction: {
    padding: theme.spacing.sm,
  },
  modalFlex: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalContent: {
    padding: theme.spacing.lg,
  },
  iconLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  iconCell: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  iconCellActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
  },
  formError: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
  },
  saveButton: {
    marginTop: theme.spacing.sm,
  },
})
