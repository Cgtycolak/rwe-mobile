import React from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {useAuth} from '../context/AuthContext';

// Import screens
import HomeScreen from '../screens/Home/HomeScreen';
import RealtimeScreen from '../screens/Realtime/RealtimeScreen';
import AICRealtimeScreen from '../screens/Realtime/AICRealtimeScreen';
import GenerationComparisonScreen from '../screens/Analysis/GenerationComparisonScreen';
import RollingAveragesScreen from '../screens/Analysis/RollingAveragesScreen';
import HeatmapScreen from '../screens/Heatmap/HeatmapScreen';
import ForecastingScreen from '../screens/Forecasting/ForecastingScreen';
import ForecastPerformanceScreen from '../screens/Forecasting/ForecastPerformanceScreen';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props: any) => {
  const {logout, username} = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    {name: 'Home', icon: 'home', screen: 'Home'},
    {
      category: 'Realtime Monitoring',
      items: [
        {name: 'DPP - Realtime', icon: 'bolt', screen: 'RealtimeMonitoring'},
        {name: 'AIC - Realtime', icon: 'chart-line', screen: 'AICRealtime'},
      ],
    },
    {
      category: 'Data Analysis',
      items: [
        {name: 'Generation Comparison', icon: 'chart-bar', screen: 'GenerationComparison'},
        {name: 'CAO Charts', icon: 'chart-line', screen: 'RollingAverages'},
      ],
    },
    {
      category: 'Reports & Heatmaps',
      items: [
        {name: 'Natural Gas Heatmap', icon: 'fire', screen: 'NaturalGasHeatmap'},
        {name: 'Import Coal Heatmap', icon: 'industry', screen: 'ImportCoalHeatmap'},
        {name: 'Hydro Heatmap', icon: 'water', screen: 'HydroHeatmap'},
        {name: 'Lignite Heatmap', icon: 'industry', screen: 'LigniteHeatmap'},
      ],
    },
    {
      category: 'Forecasting',
      items: [
        {name: 'System Direction Forecast', icon: 'chart-line', screen: 'Forecasting'},
        {name: 'Forecast Performance', icon: 'chart-bar', screen: 'ForecastPerformance'},
      ],
    },
  ];

  return (
    <View style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>RWE Dashboard</Text>
        {username && <Text style={styles.username}>{username}</Text>}
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => {
          if ('category' in item) {
            return (
              <View key={index}>
                <Text style={styles.categoryTitle}>{item.category}</Text>
                {item.items?.map((subItem, subIndex) => (
                  <TouchableOpacity
                    key={subIndex}
                    style={styles.menuItem}
                    onPress={() => props.navigation.navigate(subItem.screen)}>
                    <FontAwesome5 name={subItem.icon} size={18} color="#ecf0f1" style={styles.menuIcon} />
                    <Text style={styles.menuText}>{subItem.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          } else {
            return (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => props.navigation.navigate(item.screen)}>
                <FontAwesome5 name={item.icon} size={18} color="#ecf0f1" style={styles.menuIcon} />
                <Text style={styles.menuText}>{item.name}</Text>
              </TouchableOpacity>
            );
          }
        })}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <FontAwesome5 name="sign-out-alt" size={18} color="#e74c3c" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2c3e50',
        },
        headerTintColor: '#ecf0f1',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerStyle: {
          backgroundColor: '#2c3e50',
          width: 280,
        },
      }}>
      <Drawer.Screen name="Home" component={HomeScreen} options={{title: 'Dashboard Home'}} />
      <Drawer.Screen name="RealtimeMonitoring" component={RealtimeScreen} options={{title: 'DPP - Realtime'}} />
      <Drawer.Screen name="AICRealtime" component={AICRealtimeScreen} options={{title: 'AIC - Realtime'}} />
      <Drawer.Screen name="GenerationComparison" component={GenerationComparisonScreen} options={{title: 'Generation Comparison'}} />
      <Drawer.Screen name="RollingAverages" component={RollingAveragesScreen} options={{title: 'CAO Charts'}} />
      <Drawer.Screen name="NaturalGasHeatmap" component={HeatmapScreen} options={{title: 'Natural Gas Heatmap'}} />
      <Drawer.Screen name="ImportCoalHeatmap" component={HeatmapScreen} options={{title: 'Import Coal Heatmap'}} />
      <Drawer.Screen name="HydroHeatmap" component={HeatmapScreen} options={{title: 'Hydro Heatmap'}} />
      <Drawer.Screen name="LigniteHeatmap" component={HeatmapScreen} options={{title: 'Lignite Heatmap'}} />
      <Drawer.Screen name="Forecasting" component={ForecastingScreen} options={{title: 'System Direction Forecast'}} />
      <Drawer.Screen name="ForecastPerformance" component={ForecastPerformanceScreen} options={{title: 'Forecast Performance'}} />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#2c3e50',
  },
  drawerHeader: {
    padding: 20,
    backgroundColor: '#34495e',
    borderBottomWidth: 1,
    borderBottomColor: '#3498db',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ecf0f1',
    marginBottom: 5,
  },
  username: {
    fontSize: 14,
    color: '#bdc3c7',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 10,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ecf0f1',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuIcon: {
    width: 25,
    marginRight: 10,
  },
  menuText: {
    fontSize: 16,
    color: '#ecf0f1',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#34495e',
  },
  logoutText: {
    fontSize: 16,
    color: '#e74c3c',
    marginLeft: 10,
  },
});

export default DrawerNavigator;

