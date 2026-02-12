import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {Line as SvgLine, Polyline} from 'react-native-svg';
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

    const allValues = [...histAvg, ...prevYear, ...currYear].filter(
      v => typeof v === 'number' && !Number.isNaN(v),
    ) as number[];

    if (allValues.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data available for this series.</Text>
        </View>
      );
    }

    const maxLen = Math.max(histAvg.length, prevYear.length, currYear.length);
    const width = Dimensions.get('window').width - 48;
    const height = 220;
    const padding = 24;
    const minY = 0;
    const maxY = Math.max(...allValues);
    const rangeY = maxY - minY || 1;

    const makePoints = (arr: number[]) => {
      if (!arr.length) {
        return '';
      }
      return arr
        .map((y, i) => {
          const xRatio = maxLen > 1 ? i / (maxLen - 1) : 0;
          const x = padding + xRatio * (width - padding * 2);
          const yClamped = Math.max(minY, Math.min(maxY, y));
          const yRatio = (yClamped - minY) / rangeY;
          const yCoord = height - padding - yRatio * (height - padding * 2);
          return `${x},${yCoord}`;
        })
        .join(' ');
    };

    const histPoints = makePoints(histAvg);
    const prevPoints = makePoints(prevYear);
    const currPoints = makePoints(currYear);

    // Simple x-axis ticks: 6 evenly spaced labels
    const tickCount = 6;
    const xStep = Math.max(1, Math.floor(maxLen / (tickCount - 1)));
    const xTicks = Array.from({length: tickCount}, (_, i) => i * xStep + 1).filter(
      v => v <= maxLen,
    );

    return (
      <View>
        <Svg width={width} height={height}>
          {/* Axes */}
          <SvgLine
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#bdc3c7"
            strokeWidth={1}
          />
          <SvgLine
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#bdc3c7"
            strokeWidth={1}
          />

          {/* Historical avg */}
          {histPoints ? (
            <Polyline
              points={histPoints}
              fill="none"
              stroke="#2980b9"
              strokeWidth={2}
            />
          ) : null}

          {/* Previous year */}
          {prevPoints ? (
            <Polyline
              points={prevPoints}
              fill="none"
              stroke="#2c3e50"
              strokeWidth={2}
            />
          ) : null}

          {/* Current year */}
          {currPoints ? (
            <Polyline
              points={currPoints}
              fill="none"
              stroke="#e74c3c"
              strokeWidth={2}
            />
          ) : null}
        </Svg>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, {backgroundColor: '#2980b9'}]} />
            <Text style={styles.legendText}>Hist. avg</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, {backgroundColor: '#2c3e50'}]} />
            <Text style={styles.legendText}>{currentYear - 1}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, {backgroundColor: '#e74c3c'}]} />
            <Text style={styles.legendText}>{currentYear}</Text>
          </View>
        </View>

        <View style={styles.xTicksRow}>
          {xTicks.map(v => (
            <Text key={v} style={styles.xTickLabel}>
              Day {v}
            </Text>
          ))}
        </View>
      </View>
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
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
    marginLeft: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#2c3e50',
  },
  xTicksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginHorizontal: 12,
  },
  xTickLabel: {
    fontSize: 10,
    color: '#7f8c8d',
  },
});

export default CaoChartsScreen;

