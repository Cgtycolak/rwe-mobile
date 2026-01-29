import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import apiService from '../../services/apiService';
import {format, subDays} from 'date-fns';

const RealtimeScreen = () => {
  const [loading, setLoading] = useState(false);
  const [powerPlants, setPowerPlants] = useState<any[]>([]);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [data, setData] = useState<any>(null);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'));

  useEffect(() => {
    loadPowerPlants();
  }, []);

  const loadPowerPlants = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPowerPlants();
      if (response.code === 200) {
        setPowerPlants(response.data);
        if (response.data.length > 0) {
          setSelectedPlant(response.data[0].id.toString());
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load power plants');
    } finally {
      setLoading(false);
    }
  };

  const loadRealtimeData = async () => {
    if (!selectedPlant) {
      Alert.alert('Error', 'Please select a power plant');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.getRealtimeData(
        selectedPlant,
        startDate,
        endDate,
      );
      if (response.code === 200) {
        setData(response.data);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load realtime data');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    if (!data || data.length === 0) return null;

    const totals: any = {};
    const columns = [
      'NG',
      'WIND',
      'LIGNITE',
      'HARDCOAL',
      'IMPORTCOAL',
      'FUELOIL',
      'HEPP',
      'ROR',
      'NAPHTHA',
      'BIO',
      'GEOTHERMAL',
    ];

    columns.forEach(col => {
      totals[col] = data.reduce((sum: number, row: any) => sum + (row[col] || 0), 0);
    });

    return totals;
  };

  const summary = calculateSummary();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>DPP - Realtime Monitoring</Text>
        <Text style={styles.subtitle}>Select a power plant to view realtime data</Text>
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.label}>Power Plant:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedPlant}
            onValueChange={itemValue => setSelectedPlant(itemValue)}
            style={styles.picker}>
            {powerPlants.map(plant => (
              <Picker.Item
                key={plant.id}
                label={plant.shortName || plant.name}
                value={plant.id.toString()}
              />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          style={styles.loadButton}
          onPress={loadRealtimeData}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loadButtonText}>Load Data</Text>
          )}
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Generation Summary (MWh)</Text>
          {Object.entries(summary).map(([key, value]: [string, any]) => (
            <View key={key} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{key}:</Text>
              <Text style={styles.summaryValue}>{value.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      {data && data.length > 0 && (
        <View style={styles.dataInfo}>
          <Text style={styles.dataInfoText}>
            Showing {data.length} hourly records
          </Text>
        </View>
      )}

      {!data && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Select a power plant and click "Load Data" to view realtime generation data
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2c3e50',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ecf0f1',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#bdc3c7',
  },
  filterContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
  },
  picker: {
    height: 50,
  },
  loadButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  loadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
    paddingBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  dataInfo: {
    backgroundColor: '#e8f4f8',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  dataInfoText: {
    color: '#2c3e50',
    fontSize: 14,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
  },
});

export default RealtimeScreen;

