import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  View
} from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChangeText: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  style?: any;
}

export default function DatePicker({
  value,
  onChangeText,
  placeholder = 'Seleccionar fecha',
  placeholderTextColor = 'rgba(255,255,255,0.3)',
  style,
}: DatePickerProps) {
  const [show, setShow] = useState(false);

  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
    return new Date();
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const currentDate = parseDate(value);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (selectedDate) {
        onChangeText(formatDate(selectedDate));
      }
    } else {
      if (selectedDate) {
        onChangeText(formatDate(selectedDate));
      }
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[{ flex: 1, justifyContent: 'center', height: '100%' }]}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Text style={{
          color: value ? '#ffffff' : placeholderTextColor,
          fontSize: 15,
        }}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      {show && Platform.OS === 'android' && (
        <RNDateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {show && Platform.OS === 'ios' && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={show}
          onRequestClose={() => setShow(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShow(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={styles.doneText}>Listo</Text>
                </TouchableOpacity>
              </View>
              <RNDateTimePicker
                value={currentDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                textColor="#ffffff"
                themeVariant="dark"
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#3a3a3c',
  },
  doneText: {
    color: '#d9ab55',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
