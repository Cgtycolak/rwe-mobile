import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';

const RollingAveragesScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CAO Charts</Text>
        <Text style={styles.subtitle}>Rolling averages and historical analysis</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.infoText}>
          This screen will display rolling averages and CAO analysis charts.
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

export default RollingAveragesScreen;

