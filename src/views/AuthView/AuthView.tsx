import React, { useState } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ImageBackground,
  Image,
  Alert,
  useWindowDimensions,
} from 'react-native';
import styles from './LoginView.styles';
import LoginFormComponent from '../../components/Forms/LoginFormComponent/LoginFormComponent';
import SignInFormComponent from '../../components/Forms/SignInFormComponent/SignInFormComponent';
import { Auth } from '../../interfaces/AuthInterfaces';
import imageBackground from '../../../assets/backgrounds/login-background.png';
import lumeraLogo from '../../../assets/logo/logo-completo-blanco.png';
import { supabase } from '../../lib/supabase';
import { useRancho } from '../../context/RanchoContext';
import { authService } from '../../services/AuthServices/AuthService';

export default function AuthView({ navigation }: any) {
  const { height } = useWindowDimensions();
  const [isLogin, setIsLogin] = useState(true);
  const { setPhone, setLoginPage, setLoginPageHistory } = useRancho();

  const handleLoginSubmit = async (data: Auth.LogInInterface) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        phone: data.phone,
        password: data.password || '',
        orgId: data.orgId,
      });
      if (error) {
        Alert.alert('Error', error.message);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al iniciar sesión');
    }
  };

  const handleRegisterSubmit = async (data: Auth.SignInInterface) => {
    try {
      // 1. Call standard api mock registration client
      await authService.register({
        first_name: data.first_name,
        last_name: `${data.paternal_last_name || ''} ${data.maternal_last_name || ''}`.trim() || 'Demo',
        email: data.email,
        phone: data.phone,
      });

      // 2. Call supabase client signup (returns session: null in mock now)
      await supabase.auth.signUp({
        phone: data.phone,
        password: '',
        options: {
          data: {
            first_name: data.first_name,
            last_name: `${data.paternal_last_name || ''} ${data.maternal_last_name || ''}`.trim() || 'Demo',
            email: data.email,
          }
        }
      });

      // 3. Pre-fill state & transition login wizard to OTP page
      setPhone(data.phone);
      setLoginPageHistory([0]); // Allow going back to phone input page
      setLoginPage(3); // P4: Verify code page index
      setIsLogin(true); // Toggle card view to login (wizard) component

      Alert.alert(
        'Registro exitoso',
        'Se ha enviado un código de verificación a tu número.'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al registrarse');
    }
  };

  return (
    <ImageBackground
      source={imageBackground}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ flex: 1, minHeight: height, width: '100%', maxWidth: 520, justifyContent: 'flex-start' }}>
                <View style={{ height: height * 0.25, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 100 }}>
                  <Image
                    source={lumeraLogo}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>

                <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 40 }}>
                  <Text style={styles.sloganText}>
                    Tu rancho siempre a la vista:{"\n"}seguro, claro y conectado.
                  </Text>

                  {/* Glassmorphism Card */}
                  <View style={styles.card}>
                    {isLogin ? (
                      <LoginFormComponent
                        onSubmit={handleLoginSubmit}
                        onToggleForm={() => setIsLogin(false)}
                      />
                    ) : (
                      <>
                        <Text style={styles.cardTitle}>Regístrate</Text>
                        <Text style={styles.cardSubtitle}>
                          Crea una cuenta para comenzar a gestionar tus propiedades
                        </Text>
                        <SignInFormComponent
                          onSubmit={handleRegisterSubmit}
                          onToggleForm={() => setIsLogin(true)} navigation={undefined} />
                      </>
                    )}
                  </View>


                </View>
                <Text onPress={() => setIsLogin(!isLogin)} style={{ textAlign: 'center' }}>crear cuenta</Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}
