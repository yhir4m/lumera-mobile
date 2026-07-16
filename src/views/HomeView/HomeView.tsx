import React from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import styles from './HomeView.styles';
import { useRancho } from '../../context/RanchoContext';
import { coreService } from '../../services/CoreServices/CoreService';
import imageBackground from '../../../assets/backgrounds/login-background.png';
import { theme } from '../../styles/theme';
import { useAuth } from '../../context/AuthProvider';
import TopBarComponent from '../../components/UI/main/topBar/topBar';
import PrimaryButton from '../../components/UI/buttons/primaryButton';
export default function HomeView({ navigation }: any) {
  const {
    organizations,
    selectedOrgId,
    setLoginPage,
    selectedProductionUnitId,
    setSelectedProductionUnitId,
    productionUnits,
    loadingProductionUnits,
    productionUnitsError,
    productionUnitsBlocked,
    loadProductionUnits,
  } = useRancho();

  const [modalVisible, setModalVisible] = React.useState(false);
  const [newPuName, setNewPuName] = React.useState('');
  const [newPuRegion, setNewPuRegion] = React.useState('');
  const [submittingPu, setSubmittingPu] = React.useState(false);

  const { user } = useAuth();
  const userName = user?.first_name || 'default';

  const selectedRancho = organizations.find((o) => o.org_id === selectedOrgId);
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleBackToOrgSelection = async () => {
    setSelectedProductionUnitId('');
    setLoginPage(6);
    await supabase.auth.signOut();
  };

  const handleCreatePu = async () => {
    if (!newPuName.trim()) {
      Alert.alert('Error', 'El nombre de la unidad productiva es obligatorio.');
      return;
    }
    setSubmittingPu(true);
    try {
      await coreService.createProductionUnit(selectedOrgId, {
        name: newPuName.trim(),
        address: {
          street: newPuRegion.trim() || 'Sin dirección',
          city: '',
          state: '',
          country: ''
        }
      });

      Alert.alert('Éxito', `La unidad productiva "${newPuName.trim()}" se registró con éxito.`);
      setNewPuName('');
      setNewPuRegion('');
      setModalVisible(false);

      // Force reload the production units list from the backend
      await loadProductionUnits(selectedOrgId, true);
    } catch (err: any) {
      const apiError = err.response?.data?.error;
      const errorMsg = apiError?.message || err.message || 'Error al registrar la unidad productiva';
      Alert.alert('Error', errorMsg);
    } finally {
      setSubmittingPu(false);
    }
  };

  const Sidebar = () => (
    <View style={styles.sidebar}>
      <View style={styles.sidebarBrand}>
        <View style={styles.smallLogoBox}>
          <Text style={styles.smallLogoText}>A</Text>
        </View>
        <Text style={styles.sidebarBrandText}>ATLAS</Text>
      </View>

      <View style={styles.sidebarMenu}>
        <TouchableOpacity style={[styles.sidebarMenuItem, styles.sidebarMenuItemActive]} activeOpacity={0.7}>
          <Ionicons name="grid-outline" size={20} color="#d9ab55" style={styles.menuIcon} />
          <Text style={styles.menuTextActive}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarMenuItem} activeOpacity={0.7}>
          <Ionicons name="folder-open-outline" size={20} color="#8e929a" style={styles.menuIcon} />
          <Text style={styles.menuText}>Expedientes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarMenuItem} activeOpacity={0.7}>
          <Ionicons name="construct-outline" size={20} color="#8e929a" style={styles.menuIcon} />
          <Text style={styles.menuText}>Equipos</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>92%</Text></View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarMenuItem} activeOpacity={0.7}>
          <Ionicons name="alert-circle-outline" size={20} color="#8e929a" style={styles.menuIcon} />
          <Text style={styles.menuText}>Incidencias</Text>
          <View style={styles.alertBadge}><Text style={styles.alertBadgeText}>14</Text></View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarMenuItem} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={20} color="#8e929a" style={styles.menuIcon} />
          <Text style={styles.menuText}>Ajustes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sidebarFooter}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color="#ff6b6b" style={styles.menuIcon} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={imageBackground}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar barStyle="light-content" />
          <View style={styles.layoutWrapper}>
            {isWideScreen && <Sidebar />}

            <View style={styles.mainContent}>
              <TopBarComponent
                subtitle={selectedRancho ? selectedRancho.org_name : 'Cargando rancho...'}
                onBack={handleBackToOrgSelection}
                onLogout={handleLogout}
                showLogout={!isWideScreen}
              />

              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={[styles.contentColumn, { width: '100%' }]}>
                  <View style={styles.columnHeader}>
                    <Text style={styles.sectionTitle}>Selecciona tu Unidad Productiva</Text>

                  </View>
                  <Text style={[styles.navbarSubtitle, { marginBottom: 16 }]}>
                    Tienes acceso a varias unidades productivas en esta organización. Por favor selecciona una para operar.
                  </Text>

                  {loadingProductionUnits && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#d9ab55" />
                      <Text style={styles.loadingText}>Cargando unidades productivas...</Text>
                    </View>
                  )}

                  {!loadingProductionUnits && productionUnitsError && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="warning-outline" size={40} color="#ff6b6b" />
                      <Text style={styles.errorText}>{productionUnitsError}</Text>
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => loadProductionUnits(selectedOrgId, true)}
                      >
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {!loadingProductionUnits && productionUnitsBlocked && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="lock-closed-outline" size={40} color="#ff9500" />
                      <Text style={styles.errorText}>No tienes permiso para ver las unidades productivas en esta organización.</Text>
                    </View>
                  )}

                  {!loadingProductionUnits && !productionUnitsError && !productionUnitsBlocked && productionUnits.length === 0 && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="folder-open-outline" size={40} color="#8e929a" />
                      <Text style={styles.errorText}>No se encontraron unidades productivas registradas.</Text>
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => loadProductionUnits(selectedOrgId, true)}
                      >
                        <Text style={styles.retryButtonText}>Cargar de nuevo</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {!loadingProductionUnits && !productionUnitsError && !productionUnitsBlocked && productionUnits.length > 0 && (
                    <View style={{ marginTop: 16 }}>
                      {productionUnits.map((pu) => {
                        const isSelected = selectedProductionUnitId === pu.id;
                        return (
                          <TouchableOpacity
                            key={pu.id}
                            style={[
                              styles.puCard,
                              isSelected && styles.puCardSelected,
                            ]}
                            onPress={() => {
                              setSelectedProductionUnitId(pu.id);
                              navigation.navigate('Animals');
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={styles.puCardContent}>
                              <Text style={styles.puCardTitle}>{pu.name}</Text>
                              <Text style={styles.puCardSubtitle}>
                                {pu.address ? `${pu.address.street}` : 'Sin dirección'}
                              </Text>
                            </View>
                            {isSelected ? (
                              <Ionicons name="checkmark-circle" size={22} color="#4cd964" />
                            ) : (
                              <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.4)" />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                  {!productionUnitsBlocked && (
                    <PrimaryButton text="+ Registrar Unidad" onPress={() => setModalVisible(true)} />
                  )}
                </View>

              </ScrollView>


              {/* Modal para Crear Unidad Productiva */}
              <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
              >
                <View style={modalStyles.overlay}>
                  <View style={modalStyles.card}>
                    <Text style={modalStyles.title}>Registrar Unidad Productiva</Text>

                    <Text style={modalStyles.label}>Nombre de la Unidad</Text>
                    <TextInput
                      style={modalStyles.input}
                      placeholder="Ej. Potrero de Engorda Norte"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      value={newPuName}
                      onChangeText={setNewPuName}
                    />

                    <Text style={modalStyles.label}>Ubicación / Región</Text>
                    <TextInput
                      style={modalStyles.input}
                      placeholder="Ej. Km 12 Carr. Federal"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      value={newPuRegion}
                      onChangeText={setNewPuRegion}
                    />

                    <View style={modalStyles.buttonRow}>
                      <TouchableOpacity
                        style={modalStyles.btnCancel}
                        onPress={() => {
                          setNewPuName('');
                          setNewPuRegion('');
                          setModalVisible(false);
                        }}
                        disabled={submittingPu}
                      >
                        <Text style={modalStyles.btnCancelText}>Cancelar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[modalStyles.btnSubmit, submittingPu && { opacity: 0.7 }]}
                        onPress={handleCreatePu}
                        disabled={submittingPu}
                      >
                        {submittingPu ? (
                          <ActivityIndicator size="small" color="#111214" />
                        ) : (
                          <>
                            <Text style={modalStyles.btnSubmitText}>Registrar</Text>
                            <Ionicons name="checkmark" size={18} color="#111214" />
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>

            </View>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const modalStyles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#16171a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#202227',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    color: '#8e929a',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#1e2025',
    borderWidth: 1,
    borderColor: '#26282e',
    borderRadius: 8,
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  btnCancel: {
    backgroundColor: '#26282e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancelText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  btnSubmit: {
    backgroundColor: '#d9ab55',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnSubmitText: {
    color: '#111214',
    fontWeight: 'bold',
    fontSize: 14,
  }
};
