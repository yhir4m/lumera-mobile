import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../context/AuthProvider';

export default function TopBarComponent({
  subtitle,
  onBack,
  onLogout,
  showLogout = true,
}) {
  const { user } = useAuth();
  const userName = user?.first_name || 'default';

  return (
    <View style={styles.navbar}>
      <View>
        <Text style={styles.navbarGreeting}>Hola, {userName}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={styles.navbarSubtitle}>{subtitle}</Text>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={{ marginLeft: 8, paddingHorizontal: 4 }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back-circle-outline" size={18} color="#d9ab55" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.navbarActions}>
        {showLogout && onLogout && (
          <TouchableOpacity style={styles.logoutIconButton} onPress={onLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={22} color="#ff6b6b" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0007',
  },
  navbarGreeting: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  navbarSubtitle: {
    color: '#8e929a',
    fontSize: 13,
    marginTop: 2,
  },
  navbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconActionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1f2025',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
  },
  logoutIconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});