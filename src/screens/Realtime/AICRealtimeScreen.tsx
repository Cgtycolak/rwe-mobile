import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert} from 'react-native';
import apiService from '../../services/apiService';

const AICRealtimeScreen = () => {
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState('week');
  const [data, setData] = useState<any>(null);

  const ranges = [
    {label: 'Last Week', value: 'week'},
    {label: 'Last Month', value: 'month'},
    {label: 'Last Year', value: 'year'},
    {label: 'Last 5 Years', value: '5year'},
  ];

  const loadAICData = async (selectedRange: string) => {
    try {
      setLoading(true);
      setRange(selectedRange);
      const response = await apiService.getAicData(selectedRange);
      if (response.code === 200) {
        setData(response.data);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load AIC data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AIC - Realtime & DPP</Text>
        <Text style={styles.subtitle}>View generation data comparison</Text>
      </View>

      <View style={styles.rangeContainer}>
        <Text style={styles.label}>Select Time Range:</Text>
        {ranges.map(r => (
          <TouchableOpacity
            key={r.value}
            style={[styles.rangeButton, range === r.value && styles.rangeButtonActive]}
            onPress={() => loadAICData(r.value)}>
            <Text style={[styles.rangeButtonText, range === r.value && styles.rangeButtonTextActive]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      )}

      {data && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataTitle}>Data Sources Available:</Text>
          <Text style={styles.dataText}>• AIC: {data.aic?.length || 0} records</Text>
          <Text style={styles.dataText}>• Realtime: {data.realtime?.length || 0} records</Text>
          <Text style={styles.dataText}>• DPP: {data.dpp?.length || 0} records</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f8f9fa'},
  header: {backgroundColor: '#2c3e50', padding: 20},
  title: {fontSize: 20, fontWeight: 'bold', color: '#ecf0f1', marginBottom: 5},
  subtitle: {fontSize: 14, color: '#bdc3c7'},
  rangeContainer: {backgroundColor: '#fff', margin: 15, padding: 15, borderRadius: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3},
  label: {fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 15},
  rangeButton: {backgroundColor: '#ecf0f1', padding: 12, borderRadius: 8, marginBottom: 10},
  rangeButtonActive: {backgroundColor: '#3498db'},
  rangeButtonText: {fontSize: 14, color: '#2c3e50', textAlign: 'center', fontWeight: '500'},
  rangeButtonTextActive: {color: '#fff'},
  loadingContainer: {padding: 40, alignItems: 'center'},
  dataContainer: {backgroundColor: '#fff', margin: 15, padding: 15, borderRadius: 10},
  dataTitle: {fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10},
  dataText: {fontSize: 14, color: '#7f8c8d', marginBottom: 5},
});

export default AICRealtimeScreen;

