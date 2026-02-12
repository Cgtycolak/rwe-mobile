import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from '../context/AuthContext';
import LoginScreen from '../screens/Auth/LoginScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import CaoChartsScreen from '../screens/Analytics/CaoChartsScreen';
import HeatmapScreen from '../screens/Heatmap/HeatmapScreen';
import HydroHeatmapScreen from '../screens/Heatmap/HydroHeatmapScreen';
import ImportCoalHeatmapScreen from '../screens/Heatmap/ImportCoalHeatmapScreen';
import LigniteHeatmapScreen from '../screens/Heatmap/LigniteHeatmapScreen';
import {ActivityIndicator, View, StyleSheet, TouchableOpacity, Text} from 'react-native';

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
  const {isAuthenticated, isLoading, logout} = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {!isAuthenticated ? (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{headerShown: false}}
        />
      ) : (
        <>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              title: 'RWE Dashboard',
              headerStyle: {
                backgroundColor: '#2c3e50',
              },
              headerTintColor: '#ecf0f1',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerRight: () => (
                <TouchableOpacity
                  onPress={logout}
                  style={styles.logoutButton}>
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              ),
            }}
          />
          <Stack.Screen 
            name="NaturalGasHeatmap" 
            component={HeatmapScreen}
            options={{
              title: 'Natural Gas',
              headerStyle: {
                backgroundColor: '#2c3e50',
              },
              headerTintColor: '#ecf0f1',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Stack.Screen
            name="CaoCharts"
            component={CaoChartsScreen}
            options={{
              title: 'CAO Charts',
              headerStyle: {
                backgroundColor: '#2c3e50',
              },
              headerTintColor: '#ecf0f1',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Stack.Screen 
            name="HydroHeatmap" 
            component={HydroHeatmapScreen}
            options={{
              title: 'Hydro',
              headerStyle: {
                backgroundColor: '#2c3e50',
              },
              headerTintColor: '#ecf0f1',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Stack.Screen 
            name="ImportCoalHeatmap" 
            component={ImportCoalHeatmapScreen}
            options={{
              title: 'Import Coal',
              headerStyle: {
                backgroundColor: '#2c3e50',
              },
              headerTintColor: '#ecf0f1',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Stack.Screen 
            name="LigniteHeatmap" 
            component={LigniteHeatmapScreen}
            options={{
              title: 'Lignite',
              headerStyle: {
                backgroundColor: '#2c3e50',
              },
              headerTintColor: '#ecf0f1',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  logoutButton: {
    marginRight: 15,
    padding: 8,
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MainNavigator;

