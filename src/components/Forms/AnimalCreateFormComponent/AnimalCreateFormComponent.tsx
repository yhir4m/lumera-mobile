import React, { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRancho } from '../../../context/RanchoContext';
import { coreService } from '../../../services/CoreServices/CoreService';
import { formStyleBase } from '../formStyles';
import DatePicker from '../../UI/DatePicker/DatePicker';

interface AnimalCreateFormComponentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AnimalCreateFormComponent({
  onSuccess,
  onCancel,
}: AnimalCreateFormComponentProps) {
  const { selectedOrgId, selectedProductionUnitId, setAnimals } = useRancho();

  // Form states
  const [identifier, setIdentifier] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [tagNumber, setTagNumber] = useState<string>('');
  const [siniigaTag, setSiniigaTag] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [sex, setSex] = useState<'male' | 'female' | 'unknown'>('unknown');
  const [origin, setOrigin] = useState<'born' | 'purchased' | 'transferred' | 'imported' | 'unknown'>('unknown');
  const [ownershipType, setOwnershipType] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [purity, setPurity] = useState<string>('');
  const [sireId, setSireId] = useState<string>('');
  const [damId, setDamId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // UI states
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!identifier.trim()) {
      Alert.alert('Error', 'El Identificador es requerido.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        identifier: identifier.trim(),
        display_name: displayName.trim() || null,
        name: name.trim() || null,
        tag_number: tagNumber.trim() || null,
        siniiga_tag: siniigaTag.trim() || null,
        birth_date: birthDate.trim() || null,
        sex: sex,
        origin: origin,
        ownership_type: ownershipType.trim() || null,
        purpose: purpose.trim() || null,
        purity: purity.trim() || null,
        sire_id: sireId.trim() || null,
        dam_id: damId.trim() || null,
        notes: notes.trim() || null,
      };

      const response = await coreService.createAnimal(selectedOrgId, selectedProductionUnitId, payload);
      const createdAnimal = response.data;

      // Pushing the real animal into current context list
      setAnimals((prev) => [...prev, createdAnimal]);

      Alert.alert('Éxito', 'El animal ha sido registrado correctamente.');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || err.message || 'Ocurrió un error al registrar el animal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Registrar Nuevo Animal</Text>
        <Text style={styles.subtitle}>Complete los datos del animal para registrarlo en la unidad productiva.</Text>
      </View>

      {/* Identifier Input (Required) */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Identificador (Requerido)</Text>
        <View style={[styles.inputWrapper, { borderColor: '#d9ab55' }]}>
          <Ionicons name="key-outline" size={20} color="#d9ab55" style={styles.inputIcon} />
          <TextInput
            style={styles.inputText}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="Ej. ARETE-100"
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoCapitalize="characters"
          />
        </View>
      </View>

      {/* Name & Display Name Row */}
      <View style={styles.inputRowContainer}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Nombre</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="text-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
            <TextInput
              style={styles.inputText}
              value={name}
              onChangeText={setName}
              placeholder="Ej. Tilín"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Nombre Público</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="eye-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
            <TextInput
              style={styles.inputText}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ej. Vaca 01"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
          </View>
        </View>
      </View>

      {/* Tag Number & Siniiga Tag Row */}
      <View style={styles.inputRowContainer}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Nº Arete</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="pricetag-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
            <TextInput
              style={styles.inputText}
              value={tagNumber}
              onChangeText={setTagNumber}
              placeholder="Ej. TAG-123"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>SINIIGA Tag</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="shield-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
            <TextInput
              style={styles.inputText}
              value={siniigaTag}
              onChangeText={setSiniigaTag}
              placeholder="Ej. SIN-456"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
          </View>
        </View>
      </View>

      {/* Birth Date Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="calendar-outline" size={20} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
          <DatePicker
            style={styles.inputText}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="AAAA-MM-DD (Ej. 2023-05-15)"
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
        </View>
      </View>

      {/* Sex Selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Sexo</Text>
        <View style={styles.typeSelectorRow}>
          {([
            { key: 'female', label: 'Hembra' },
            { key: 'male', label: 'Macho' },
            { key: 'unknown', label: 'Desconocido' }
          ] as const).map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.typeButton,
                sex === opt.key && styles.typeButtonActive,
              ]}
              onPress={() => setSex(opt.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.typeButtonText,
                sex === opt.key && styles.typeButtonTextActive
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Origin Selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Origen</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.originSelectorScroll}>
          {([
            { key: 'born', label: 'Nacido' },
            { key: 'purchased', label: 'Comprado' },
            { key: 'transferred', label: 'Transferido' },
            { key: 'imported', label: 'Importado' },
            { key: 'unknown', label: 'Desconocido' }
          ] as const).map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.typeButton,
                { width: 100, marginHorizontal: 4 },
                origin === opt.key && styles.typeButtonActive,
              ]}
              onPress={() => setOrigin(opt.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.typeButtonText,
                origin === opt.key && styles.typeButtonTextActive
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Ownership & Purpose & Purity Row */}
      <View style={styles.inputRowContainer}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
          <Text style={styles.inputLabel}>Propiedad</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.inputText}
              value={ownershipType}
              onChangeText={setOwnershipType}
              placeholder="Ej. Propio"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 6 }]}>
          <Text style={styles.inputLabel}>Propósito</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.inputText}
              value={purpose}
              onChangeText={setPurpose}
              placeholder="Ej. Leche"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
          <Text style={styles.inputLabel}>Pureza</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.inputText}
              value={purity}
              onChangeText={setPurity}
              placeholder="Ej. Cruzado"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
          </View>
        </View>
      </View>

      {/* Sire ID & Dam ID Row */}
      <View style={styles.inputRowContainer}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>ID Padre (Sire)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="male-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
            <TextInput
              style={styles.inputText}
              value={sireId}
              onChangeText={setSireId}
              placeholder="UUID Padre"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>ID Madre (Dam)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="female-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
            <TextInput
              style={styles.inputText}
              value={damId}
              onChangeText={setDamId}
              placeholder="UUID Madre"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
          </View>
        </View>
      </View>

      {/* Notes Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Notas / Observaciones</Text>
        <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
          <Ionicons name="document-text-outline" size={20} color="rgba(255,255,255,0.4)" style={[styles.inputIcon, { marginTop: 2 }]} />
          <TextInput
            style={[styles.inputText, { textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ingrese cualquier observación sobre el animal..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            multiline={true}
            numberOfLines={4}
          />
        </View>
      </View>

      {/* Form Buttons */}
      <View style={styles.buttonRow}>
        {onCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.submitButton, onCancel ? { flex: 1, marginLeft: 12 } : { width: '100%' }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#111214" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Registrar</Text>
              <Ionicons name="checkmark-sharp" size={18} color="#111214" style={{ marginLeft: 6 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ...formStyleBase,
});
