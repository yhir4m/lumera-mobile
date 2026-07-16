import React, { useState, useEffect } from 'react';
import {
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    Alert,
    ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRancho } from '../../context/RanchoContext';
import AnimalCreateFormComponent from '../../components/Forms/AnimalCreateFormComponent/AnimalCreateFormComponent';
import AnimalEditFormComponent from '../../components/Forms/AnimalEditFormComponent/AnimalEditFormComponent';
import AnimalMoveFormComponent from '../../components/Forms/AnimalMoveFormComponent/AnimalMoveFormComponent';
import styles from '../HomeView/HomeView.styles';
import { supabase } from '../../lib/supabase';
import imageBackground from '../../../assets/backgrounds/login-background.png';
import { Core } from '../../interfaces/CoreInterfaces';
import { useAuth } from '../../context/AuthProvider';
import TopBarComponent from '../../components/UI/main/topBar/topBar';
import { coreService } from '../../services/CoreServices/CoreService';

export default function AnimalsView({ navigation }: any) {
    const {
        organizations,
        selectedOrgId,
        selectedProductionUnitId,
        setSelectedProductionUnitId,
        productionUnits,
        animals,
        setAnimals,
        loadingAnimals,
        animalsError,
        loadAnimals,
        animalToMove,
        setAnimalToMove
    } = useRancho();

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingAnimal, setEditingAnimal] = useState<Core.Animal | null>(null);
    const { user } = useAuth();
    const userName = user?.first_name || 'default';

    const selectedRancho = organizations.find((o) => o.org_id === selectedOrgId);
    const selectedProductionUnit = productionUnits.find((pu) => pu.id === selectedProductionUnitId);

    const getAge = (birthDateStr?: string | null) => {
        if (!birthDateStr) return 'N/A';
        const birthDate = new Date(birthDateStr);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return `${Math.max(0, age)}`;
    };

    // Load animals when this component is rendered (or selected PU changes)
    useEffect(() => {
        if (selectedOrgId && selectedProductionUnitId) {
            loadAnimals(selectedOrgId, selectedProductionUnitId);
        }
    }, [selectedOrgId, selectedProductionUnitId]);

    // Clean state when going back
    const handleBack = () => {
        console.log(editingAnimal, 'ppe')
        setAnimalToMove(null);
        setSelectedProductionUnitId('');
        navigation.goBack();
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleDelete = (animal: Core.Animal) => {
        //change this alert for a modal
        Alert.alert(
            'Eliminar Animal',
            '¿Estás seguro de que deseas eliminar este registro de animal? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await coreService.archiveAnimal(selectedOrgId, selectedProductionUnitId, animal);
                            setAnimals((prev) => prev.filter((a) => a.id !== animal.id));
                            Alert.alert('Éxito', 'El animal ha sido eliminado correctamente.');
                        } catch (err: any) {
                            const apiMessage = err.response?.data?.error?.message;
                            Alert.alert('Error', apiMessage || err.message || 'Ocurrió un error al eliminar el animal.');
                        }
                    },
                },
            ]
        );
    };

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
                        <View style={styles.mainContent}>

                            {/* Header/Navbar */}
                            <TopBarComponent
                                subtitle={`${selectedRancho ? selectedRancho.org_name : ''}${selectedProductionUnit ? ` · ${selectedProductionUnit.name}` : ''}`}
                                onBack={handleBack}
                                onLogout={handleLogout}
                                showLogout={true}
                            />

                            {/* Main scroll content */}
                            <ScrollView
                                contentContainerStyle={styles.scrollContent}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <Text style={styles.sectionTitle}>
                                        {editingAnimal
                                            ? 'Editar Registro'
                                            : animalToMove
                                                ? 'Mover Animal'
                                                : showCreateForm
                                                    ? 'Nuevo Registro'
                                                    : 'Animales Registrados'}
                                    </Text>
                                    {!showCreateForm && !editingAnimal && !animalToMove && (
                                        <TouchableOpacity
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor: 'rgba(217, 171, 85, 0.15)',
                                                paddingHorizontal: 12,
                                                paddingVertical: 6,
                                                borderRadius: 8,
                                                borderWidth: 1,
                                                borderColor: '#d9ab55',
                                            }}
                                            onPress={() => setShowCreateForm(true)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="add-circle-outline" size={16} color="#d9ab55" style={{ marginRight: 4 }} />
                                            <Text style={{ color: '#d9ab55', fontSize: 13, fontWeight: 'bold' }}>Agregar</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {editingAnimal ? (
                                    <AnimalEditFormComponent
                                        animal={editingAnimal}
                                        onSuccess={() => setEditingAnimal(null)}
                                        onCancel={() => setEditingAnimal(null)}
                                    />
                                ) : animalToMove ? (
                                    <AnimalMoveFormComponent
                                        animal={animalToMove}
                                        fromOrgId={selectedOrgId}
                                        fromPuId={selectedProductionUnitId}
                                        onSuccess={() => setAnimalToMove(null)}
                                        onCancel={() => setAnimalToMove(null)}
                                    />
                                ) : showCreateForm ? (
                                    <AnimalCreateFormComponent
                                        onSuccess={() => setShowCreateForm(false)}
                                        onCancel={() => setShowCreateForm(false)}
                                    />
                                ) : (
                                    <>
                                        {loadingAnimals && (
                                            <View style={styles.loadingContainer}>
                                                <ActivityIndicator size="large" color="#d9ab55" />
                                                <Text style={styles.loadingText}>Cargando animales...</Text>
                                            </View>
                                        )}

                                        {!loadingAnimals && animalsError && (
                                            <View style={styles.errorContainer}>
                                                <Ionicons name="warning-outline" size={40} color="#ff6b6b" />
                                                <Text style={styles.errorText}>{animalsError}</Text>
                                                <TouchableOpacity
                                                    style={styles.retryButton}
                                                    onPress={() => loadAnimals(selectedOrgId, selectedProductionUnitId, true)}
                                                >
                                                    <Text style={styles.retryButtonText}>Reintentar</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}

                                        {!loadingAnimals && !animalsError && animals.length === 0 && (
                                            <View style={styles.errorContainer}>
                                                <Ionicons name="alert-circle-outline" size={40} color="#8e929a" />
                                                <Text style={styles.errorText}>No se encontraron animales en esta unidad productiva.</Text>
                                            </View>
                                        )}

                                        {!loadingAnimals && !animalsError && animals.length > 0 && (
                                            <View style={{ marginTop: 16 }}>
                                                {animals.map((animal) => (
                                                    <View key={animal.id} style={styles.puCard}>
                                                        <View style={styles.puCardContent}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                                 <Text style={styles.puCardTitle}>{animal.name || animal.display_name || animal.identifier || 'Sin nombre'}</Text>
                                                                 <View style={{
                                                                     backgroundColor: 'rgba(217, 171, 85, 0.15)',
                                                                     borderRadius: 8,
                                                                     paddingHorizontal: 8,
                                                                     paddingVertical: 2,
                                                                     marginLeft: 8
                                                                 }}>
                                                                     <Text style={{
                                                                         color: '#d9ab55',
                                                                         fontSize: 10,
                                                                         fontWeight: 'bold',
                                                                         textTransform: 'uppercase'
                                                                     }}>
                                                                         {animal.sex || 'unknown'}
                                                                     </Text>
                                                                 </View>
                                                                 <View style={{
                                                                     backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                                     borderRadius: 8,
                                                                     paddingHorizontal: 8,
                                                                     paddingVertical: 2,
                                                                     marginLeft: 6
                                                                 }}>
                                                                     <Text style={{
                                                                         color: 'rgba(255, 255, 255, 0.8)',
                                                                         fontSize: 10,
                                                                         fontWeight: 'bold'
                                                                     }}>
                                                                         {animal.purity || 'No especificado'}
                                                                     </Text>
                                                                 </View>
                                                             </View>
                                                             <Text style={styles.puCardSubtitle}>Identificador: {animal.identifier}</Text>
                                                             <Text style={[styles.puCardSubtitle, { marginTop: 2 }]}>
                                                                 Tag: {animal.tag_number || 'N/A'} · SINIIGA: {animal.siniiga_tag || 'N/A'}
                                                             </Text>
                                                             <Text style={[styles.puCardSubtitle, { marginTop: 2 }]}>
                                                                 Edad: {getAge(animal.birth_date)} años · Nacimiento: {animal.birth_date ? animal.birth_date.split('T')[0] : 'N/A'}
                                                             </Text>
                                                        </View>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            <TouchableOpacity
                                                                onPress={() => setAnimalToMove(animal)}
                                                                style={{ padding: 8 }}
                                                                activeOpacity={0.7}
                                                            >
                                                                <Ionicons name="move" size={18} color="#d9ab55" />
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                onPress={() => setEditingAnimal(animal)}
                                                                style={{ padding: 8 }}
                                                                activeOpacity={0.7}
                                                            >
                                                                <Ionicons name="pencil-outline" size={18} color="#d9ab55" />
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                onPress={() => handleDelete(animal)}
                                                                style={{ padding: 8, marginLeft: 4 }}
                                                                activeOpacity={0.7}
                                                            >
                                                                <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </SafeAreaView>
            </View>
        </ImageBackground>
    );
}
