import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import apiService from '../../services/apiService';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load any initial dashboard data
      // const data = await apiService.getAllTableData();
      setLastUpdate(new Date().toLocaleString());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const quickLinks = [
    {
      title: 'Natural Gas',
      icon: 'fire',
      color: '#e74c3c',
      screen: 'NaturalGasHeatmap',
    },
    {
      title: 'Hydro',
      icon: 'water',
      color: '#3498db',
      screen: 'HydroHeatmap',
    },
    {
      title: 'Import Coal',
      icon: 'industry',
      color: '#34495e',
      screen: 'ImportCoalHeatmap',
    },
    {
      title: 'Lignite',
      icon: 'gem',
      color: '#8e44ad',
      screen: 'LigniteHeatmap',
    },
    {
      title: 'CAO Charts',
      icon: 'chart-line',
      color: '#27ae60',
      screen: 'CaoCharts',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.titleText}>RWE Energy Dashboard</Text>
        {lastUpdate && (
          <Text style={styles.updateText}>Last updated: {lastUpdate}</Text>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <FontAwesome5 name="bolt" size={30} color="#3498db" />
          <Text style={styles.statValue}>Real-time</Text>
          <Text style={styles.statLabel}>Monitoring</Text>
        </View>
        <View style={styles.statCard}>
          <FontAwesome5 name="chart-line" size={30} color="#2ecc71" />
          <Text style={styles.statValue}>Analytics</Text>
          <Text style={styles.statLabel}>Dashboard</Text>
        </View>
        <View style={styles.statCard}>
          <FontAwesome5 name="cloud" size={30} color="#e74c3c" />
          <Text style={styles.statValue}>Forecast</Text>
          <Text style={styles.statLabel}>System</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.quickLinksContainer}>
        {quickLinks.map((link, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.quickLinkCard, {borderLeftColor: link.color}]}
            onPress={() => navigation.navigate(link.screen as never)}>
            <FontAwesome5 name={link.icon} size={24} color={link.color} />
            <Text style={styles.quickLinkText}>{link.title}</Text>
            <FontAwesome5 name="chevron-right" size={16} color="#95a5a6" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Dashboard Features</Text>
        <View style={styles.featureItem}>
          <FontAwesome5 name="check-circle" size={16} color="#2ecc71" />
          <Text style={styles.featureText}>Real-time generation monitoring</Text>
        </View>
        <View style={styles.featureItem}>
          <FontAwesome5 name="check-circle" size={16} color="#2ecc71" />
          <Text style={styles.featureText}>Historical data analysis</Text>
        </View>
        <View style={styles.featureItem}>
          <FontAwesome5 name="check-circle" size={16} color="#2ecc71" />
          <Text style={styles.featureText}>Interactive heatmaps</Text>
        </View>
        <View style={styles.featureItem}>
          <FontAwesome5 name="check-circle" size={16} color="#2ecc71" />
          <Text style={styles.featureText}>Advanced forecasting tools</Text>
        </View>
      </View>
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
    padding: 30,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#95a5a6',
    marginBottom: 5,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ecf0f1',
    marginBottom: 10,
  },
  updateText: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    marginTop: -30,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  quickLinksContainer: {
    paddingHorizontal: 20,
  },
  quickLinkCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 15,
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 10,
  },
});

export default HomeScreen;

