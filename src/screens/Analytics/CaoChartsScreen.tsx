import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  VictoryAxis,
  VictoryChart,
  VictoryLegend,
  VictoryLine,
  VictoryTheme,
} from 'victory-native';
import apiService from '../../services/apiService';

type RollingSeries = {
  historical_avg?: number[];
  historical_range?: {min: number | null; max: number | null}[];
  [year: string]: any;
};

type RollingDataResponse = {
  [key: string]: RollingSeries;
};

const FUEL_TYPES: {key: string; label: string}[] = [
  {key: 'naturalgas', label: 'CCGT'},
  {key: 'lignite', label: 'Lignite'},
  {key: 'wind', label: 'Wind'},
  {key: 'solar_combined', label: 'Solar'},
  {key: 'importcoal', label: 'HardCoal'},
  {key: 'river', label: 'Run-of-River'},
  {key: 'dammedhydro', label: 'Dam'},
  {key: 'consumption', label: 'Demand'},
];

const CaoChartsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rollingData, setRollingData] = useState<RollingDataResponse | null>(
    null,
  );
  const [selectedType, setSelectedType] = useState<string>('naturalgas');

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getRollingData();
        setRollingData(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load CAO charts data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const renderChart = () => {
    if (!rollingData) {
      return null;
    }

    const series = rollingData[selectedType];
    if (!series) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data available for this series.</Text>
        </View>
      );
    }

    const histAvg = series.historical_avg || [];
    const prevYear = series[String(currentYear - 1)] || [];
    const currYear = series[String(currentYear)] || [];

    const histData = histAvg.map((y, i) => ({x: i + 1, y}));
    const prevData = prevYear.map((y: number, i: number) => ({x: i + 1, y}));
    const currData = currYear.map((y: number, i: number) => ({x: i + 1, y}));

    const maxLen = Math.max(histData.length, prevData.length, currData.length);
    const tickCount = 6;
    const step = Math.max(1, Math.floor(maxLen / (tickCount - 1)));
    const tickValues = Array.from(
      {length: tickCount},
      (_, i) => i * step + 1,
    ).filter(v => v <= maxLen);

    return (
      <VictoryChart
        theme={VictoryTheme.material}
        height={260}
        padding={{top: 20, bottom: 50, left: 60, right: 20}}>
        <VictoryAxis
          tickValues={tickValues}
          tickFormat={(v: number) => `Day ${v}`}
          style={{
            tickLabels: {fontSize: 10},
            axisLabel: {fontSize: 12, padding: 35},
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(t: number) => `${Math.round(t / 1000)}k`}
          style={{
            tickLabels: {fontSize: 10},
          }}
        />

        {histData.length > 0 && (
          <VictoryLine
            data={histData}
            style={{
              data: {stroke: '#2980b9', strokeDasharray: '6,4', strokeWidth: 2},
            }}
          />
        )}

        {prevData.length > 0 && (
          <VictoryLine
            data={prevData}
            style={{
              data: {stroke: '#2c3e50', strokeWidth: 2},
            }}
          />
        )}

        {currData.length > 0 && (
          <VictoryLine
            data={currData}
            style={{
              data: {stroke: '#e74c3c', strokeWidth: 2},
            }}
          />
        )}

        <VictoryLegend
          x={40}
          y={10}
          orientation="horizontal"
          gutter={10}
          style={{
            labels: {fontSize: 10},
          }}
          data={[
            {name: 'Hist. avg', symbol: {fill: '#2980b9'}},
            {name: String(currentYear - 1), symbol: {fill: '#2c3e50'}},
            {name: String(currentYear), symbol: {fill: '#e74c3c'}},
          ]}
        />
      </VictoryChart>
    );
  };

  const currentLabel =
    FUEL_TYPES.find(t => t.key === selectedType)?.label || selectedType;

  return (
    <View style={styles.container}>
      {loading && !rollingData ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : null}

      {error && !loading && !rollingData ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load CAO charts</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>7-Day Rolling Averages</Text>
          <Text style={styles.subtitle}>
            Compare current year, previous year, and long-term average.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsContainer}>
            {FUEL_TYPES.map(type => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.tabButton,
                  selectedType === type.key && styles.tabButtonActive,
                ]}
                onPress={() => setSelectedType(type.key)}>
                <Text
                  style={[
                    styles.tabButtonText,
                    selectedType === type.key && styles.tabButtonTextActive,
                  ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>{currentLabel}</Text>
            {renderChart()}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    zIndex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c0392b',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  tabsContainer: {
    marginVertical: 8,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    marginRight: 8,
    backgroundColor: '#ecf0f1',
  },
  tabButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#2980b9',
  },
  tabButtonText: {
    fontSize: 13,
    color: '#34495e',
  },
  tabButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  chartCard: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 12,
    marginBottom: 4,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
});

export default CaoChartsScreen;

