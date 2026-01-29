import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import apiService from '../../services/apiService';
import {format, subDays} from 'date-fns';
import ZoomableHeatmap from '../../components/ZoomableHeatmap';

const ImportCoalHeatmapScreen = () => {
  // Import Coal with DPP only (no realtime)
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd'),
  );
  const [version, setVersion] = useState<'first' | 'current'>('current');
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Generate date options (today + last 180 days = ~6 months)
  const dateOptions = Array.from({length: 181}, (_, i) => {
    const date = subDays(new Date(), i);
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: i === 0 ? `${format(date, 'yyyy-MM-dd')} (Today)` : format(date, 'yyyy-MM-dd'),
    };
  });

  useEffect(() => {
    loadHeatmapData();
  }, [selectedDate, version]);

  const loadHeatmapData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getImportCoalHeatmapData(selectedDate, version);
      
      if (response.code === 200) {
        setHeatmapData(response.data);
      } else {
        Alert.alert('Error', 'Failed to load heatmap data');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load heatmap data');
    } finally {
      setLoading(false);
    }
  };

  const renderHeatmapCell = (value: number, maxValue: number) => {
    const intensity = maxValue > 0 && value > 0 ? Math.max(0.15, value / maxValue) : 0;
    
    // Use a gradient from light blue (low) to dark red (high)
    let backgroundColor = '#f8f9fa';
    let textColor = '#2c3e50';
    
    if (value > 0) {
      if (intensity < 0.3) {
        backgroundColor = `rgba(52, 152, 219, ${intensity + 0.3})`; // Blue
      } else if (intensity < 0.6) {
        backgroundColor = `rgba(241, 196, 15, ${intensity})`; // Yellow
      } else {
        backgroundColor = `rgba(231, 76, 60, ${intensity})`; // Red
      }
      textColor = intensity > 0.5 ? '#fff' : '#2c3e50';
    }
    
    return (
      <View style={[styles.heatmapCell, {backgroundColor}]}>
        <Text style={[styles.cellText, {color: textColor}]}>
          {value.toFixed(0)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}>
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dateList}>
              {dateOptions.map(({value, label}) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.dateOption,
                    selectedDate === value && styles.dateOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedDate(value);
                    setShowDatePicker(false);
                  }}>
                  <Text
                    style={[
                      styles.dateOptionText,
                      selectedDate === value && styles.dateOptionTextSelected,
                    ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <View style={styles.dateControl}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateButtonText}>
                {selectedDate === format(new Date(), 'yyyy-MM-dd') 
                  ? `${selectedDate} (Today)` 
                  : selectedDate}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.versionControl}>
            <Text style={styles.label}>Version</Text>
            <View style={styles.versionButtons}>
              <TouchableOpacity
                style={[
                  styles.versionButton,
                  version === 'first' && styles.versionButtonActive,
                ]}
                onPress={() => setVersion('first')}>
                <Text
                  style={[
                    styles.versionButtonText,
                    version === 'first' && styles.versionButtonTextActive,
                  ]}>
                  First
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.versionButton,
                  version === 'current' && styles.versionButtonActive,
                ]}
                onPress={() => setVersion('current')}>
                <Text
                  style={[
                    styles.versionButtonText,
                    version === 'current' && styles.versionButtonTextActive,
                  ]}>
                  Current
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading heatmap...</Text>
        </View>
      ) : heatmapData ? (
        <ZoomableHeatmap
          heatmapData={heatmapData}
          renderCell={renderHeatmapCell}
          title="Import Coal Generation (MW)"
          subtitle={`${selectedDate} • ${version === 'first' ? 'First Version' : 'Current Version'}`}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  controls: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataTypeRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  dataTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3498db',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dataTypeButtonActive: {
    backgroundColor: '#3498db',
  },
  dataTypeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3498db',
  },
  dataTypeButtonTextActive: {
    color: '#fff',
  },
  controlRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateControl: {
    flex: 2,
  },
  versionControl: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    height: 44,
  },
  dateButtonText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#7f8c8d',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '85%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalClose: {
    fontSize: 24,
    color: '#7f8c8d',
    fontWeight: 'bold',
  },
  dateList: {
    maxHeight: 400,
  },
  dateOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  dateOptionText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  dateOptionTextSelected: {
    color: '#3498db',
    fontWeight: '600',
  },
  versionButtons: {
    flexDirection: 'column',
    gap: 6,
  },
  versionButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3498db',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 36,
    justifyContent: 'center',
  },
  versionButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  versionButtonText: {
    color: '#3498db',
    fontWeight: '600',
    fontSize: 12,
  },
  versionButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
    fontSize: 14,
  },
  heatmapScrollContainer: {
    flex: 1,
  },
  heatmapHeader: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  heatmapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
  },
  heatmapSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  heatmapGrid: {
    margin: 10,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#2c3e50',
  },
  dataRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  hourHeaderCell: {
    width: 45,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#34495e',
    borderRightWidth: 2,
    borderRightColor: '#2c3e50',
  },
  hourDataCell: {
    width: 45,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    borderRightWidth: 1,
    borderRightColor: '#bdc3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  plantCell: {
    width: 65,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#34495e',
  },
  heatmapCell: {
    width: 65,
    height: 40,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ecf0f1',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  cellText: {
    fontSize: 11,
    fontWeight: '600',
  },
  hourText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ecf0f1',
    textAlign: 'center',
    marginBottom: 2,
  },
  capacityText: {
    fontSize: 8,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
});

export default ImportCoalHeatmapScreen;

