import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';

const ForecastPerformanceScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Forecast Performance</Text>
        <Text style={styles.subtitle}>Model accuracy and metrics</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.infoText}>
          This screen will display forecast performance metrics and model comparisons.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f8f9fa'},
  header: {backgroundColor: '#2c3e50', padding: 20},
  title: {fontSize: 20, fontWeight: 'bold', color: '#ecf0f1', marginBottom: 5},
  subtitle: {fontSize: 14, color: '#bdc3c7'},
  content: {padding: 20},
  infoText: {fontSize: 16, color: '#7f8c8d', textAlign: 'center', marginTop: 40},
});

export default ForecastPerformanceScreen;

