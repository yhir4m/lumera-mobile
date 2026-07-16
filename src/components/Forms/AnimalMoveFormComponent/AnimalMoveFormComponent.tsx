import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRancho } from '../../../context/RanchoContext';
import { Core } from '../../../interfaces/CoreInterfaces';
import { formStyleBase } from '../formStyles';

interface AnimalMoveFormComponentProps {
  animal: Core.Animal;
  fromOrgId: string;
  fromPuId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AnimalMoveFormComponent({
  animal,
  fromOrgId,
  fromPuId,
  onSuccess,
  onCancel,
}: AnimalMoveFormComponentProps) {
  const {
    organizations,
    productionUnitsByOrg,
    loadProductionUnits,
    moveAnimal,
  } = useRancho();

  // Selected targets (initially current values)
  const [tempSelectedOrgId, setTempSelectedOrgId] = useState<string>(fromOrgId);
  const [tempSelectedPuId, setTempSelectedPuId] = useState<string>(fromPuId);
  const [loadingPUs, setLoadingPUs] = useState<boolean>(false);

  // Fetch production units when selected organization changes
  useEffect(() => {
    if (tempSelectedOrgId) {
      const fetchUnits = async () => {
        setLoadingPUs(true);
        try {
          await loadProductionUnits(tempSelectedOrgId);
        } catch (err) {
          console.error('Error fetching production units:', err);
        } finally {
          setLoadingPUs(false);
        }
      };
      fetchUnits();
    }
  }, [tempSelectedOrgId]);

  // Find names for rendering labels
  const currentOrg = organizations.find((o) => o.org_id === fromOrgId);
  const currentOrgPUs = productionUnitsByOrg[fromOrgId] || [];
  const currentPU = currentOrgPUs.find((pu) => pu.id === fromPuId);

  // Get currently displayed production units for the selected target organization
  const displayPUs = productionUnitsByOrg[tempSelectedOrgId] || [];

  const handleMove = async () => {
    if (!tempSelectedOrgId || !tempSelectedPuId) {
      Alert.alert('Error', 'Por favor seleccione un rancho y una unidad productiva de destino.');
      return;
    }

    if (tempSelectedOrgId === fromOrgId && tempSelectedPuId === fromPuId) {
      Alert.alert('Información', 'El animal ya se encuentra en esta unidad productiva.');
      return;
    }

    try {
      await moveAnimal(animal, fromOrgId, fromPuId, tempSelectedOrgId, tempSelectedPuId);
      Alert.alert('Éxito', 'El animal se ha movido correctamente.');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Ocurrió un error al mover el animal.');
    }
  };

  const isCurrentPU = (orgId: string, puId: string) => {
    return orgId === fromOrgId && puId === fromPuId;
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Mover Registro de Animal</Text>
        <Text style={styles.subtitle}>Traslade el animal a otra organización o unidad productiva.</Text>
      </View>

      {/* Animal Info Card */}
      <View style={styles.animalSummaryCard}>
        <View style={styles.animalSummaryHeader}>
          <Text style={styles.animalName}>{animal.nombre || 'Sin nombre'}</Text>
          <View style={styles.animalBadge}>
            <Text style={styles.animalBadgeText}>{animal.animalType}</Text>
          </View>
        </View>
        <Text style={styles.animalDetailText}>Arete: {animal.Arete || 'N/A'}</Text>
        <Text style={styles.animalDetailText}>Color: {animal.Color || 'N/A'}</Text>
        <View style={styles.locationDivider} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="location-outline" size={16} color="rgba(255, 255, 255, 0.5)" style={{ marginRight: 6 }} />
          <Text style={styles.currentLocationText}>
            Ubicación actual: {currentOrg ? currentOrg.org_name : ''} {currentPU ? ` · ${currentPU.name}` : ''}
          </Text>
        </View>
      </View>

      {/* Organization Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Selecciona el Rancho / Organización</Text>
        <View style={styles.orgList}>
          {organizations.map((org) => {
            const isSelected = tempSelectedOrgId === org.org_id;
            return (
              <TouchableOpacity
                key={org.org_id}
                style={[
                  styles.orgItem,
                  isSelected && styles.orgItemActive,
                ]}
                onPress={() => {
                  setTempSelectedOrgId(org.org_id);
                  setTempSelectedPuId(''); // Reset selected PU
                }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color={isSelected ? '#d9ab55' : 'rgba(255, 255, 255, 0.6)'}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={[styles.orgItemText, isSelected && styles.orgItemTextActive]}>
                    {org.org_name}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-sharp" size={18} color="#d9ab55" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Production Unit Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Selecciona la Unidad Productiva</Text>
        
        {loadingPUs ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#d9ab55" />
            <Text style={styles.loadingText}>Cargando unidades productivas...</Text>
          </View>
        ) : (
          <View style={styles.puList}>
            {displayPUs.length === 0 ? (
              <Text style={styles.emptyText}>No hay unidades productivas en esta organización.</Text>
            ) : (
              displayPUs.map((pu) => {
                const current = isCurrentPU(tempSelectedOrgId, pu.id);
                const isSelected = tempSelectedPuId === pu.id;
                
                return (
                  <TouchableOpacity
                    key={pu.id}
                    style={[
                      styles.puItem,
                      current && styles.puItemCurrent,
                      !current && isSelected && styles.puItemActive,
                    ]}
                    onPress={() => setTempSelectedPuId(pu.id)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.puItemTitle,
                        current && styles.puItemTitleCurrent,
                        !current && isSelected && styles.puItemTitleActive
                      ]}>
                        {pu.name}
                      </Text>
                      <Text style={styles.puItemSubtitle}>
                        {pu.address ? `${pu.address.street}, ${pu.address.city}` : 'Sin dirección'}
                      </Text>
                    </View>

                    {current ? (
                      <View style={styles.currentBadge}>
                        <Ionicons name="checkmark-circle" size={18} color="#4cd964" style={{ marginRight: 4 }} />
                        <Text style={styles.currentBadgeText}>Actual</Text>
                      </View>
                    ) : isSelected ? (
                      <Ionicons name="checkmark-circle" size={20} color="#d9ab55" />
                    ) : (
                      <Ionicons name="ellipse-outline" size={20} color="rgba(255, 255, 255, 0.3)" />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        {onCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (tempSelectedOrgId === fromOrgId && tempSelectedPuId === fromPuId) && styles.submitButtonDisabled,
            onCancel ? { flex: 1, marginLeft: 12 } : { width: '100%' }
          ]}
          onPress={handleMove}
          disabled={tempSelectedOrgId === fromOrgId && tempSelectedPuId === fromPuId}
          activeOpacity={0.7}
        >
          <Text style={styles.submitButtonText}>Mover Animal</Text>
          <Ionicons name="swap-horizontal-outline" size={18} color="#111214" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ...formStyleBase,
  animalSummaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 22,
  },
  animalSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  animalName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  animalBadge: {
    backgroundColor: 'rgba(217, 171, 85, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  animalBadgeText: {
    color: '#d9ab55',
    fontSize: 10,
    fontWeight: 'bold',
  },
  animalDetailText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    marginTop: 2,
  },
  locationDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
  },
  currentLocationText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 22,
  },
  inputLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orgList: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  orgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  orgItemActive: {
    backgroundColor: 'rgba(217, 171, 85, 0.06)',
  },
  orgItemText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  orgItemTextActive: {
    color: '#d9ab55',
    fontWeight: 'bold',
  },
  puList: {
    marginTop: 4,
  },
  puItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  puItemActive: {
    borderColor: '#d9ab55',
    borderWidth: 1.5,
    backgroundColor: 'rgba(217, 171, 85, 0.06)',
  },
  puItemCurrent: {
    borderColor: '#4cd964',
    borderWidth: 1.5,
    backgroundColor: 'rgba(76, 217, 100, 0.08)',
  },
  puItemTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  puItemTitleActive: {
    color: '#d9ab55',
  },
  puItemTitleCurrent: {
    color: '#4cd964',
  },
  puItemSubtitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    marginTop: 4,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 217, 100, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  currentBadgeText: {
    color: '#4cd964',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  loadingContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 15,
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 24,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#d9ab55',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#111214',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
