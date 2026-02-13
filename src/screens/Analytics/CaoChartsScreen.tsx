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
import Svg, {Line as SvgLine, Polyline, Polygon} from 'react-native-svg';
import apiService from '../../services/apiService';

type RollingSeries = {
  historical_avg?: number[];
  historical_range?: {min: number | null; max: number | null}[];
  [year: string]: any;
};

type RollingDataResponse = {
  [key: string]: RollingSeries;
};

type DemandDataResponse = {
  consumption?: {
    [year: string]: number[];
  };
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
  const [demandData, setDemandData] = useState<DemandDataResponse | null>(null);
  const [selectedType, setSelectedType] = useState<string>('naturalgas');

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [rolling, demand] = await Promise.all([
          apiService.getRollingData(),
          apiService.getDemandData(),
        ]);
        setRollingData(rolling);
        setDemandData(demand);
      } catch (e: any) {
        setError(e.message || 'Failed to load CAO charts data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const renderChart = () => {
    // Special handling for Demand: uses separate endpoint and weekly data
    if (selectedType === 'consumption') {
      if (!demandData || !demandData.consumption) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No data available for this series.</Text>
          </View>
        );
      }

      const prevSeries =
        demandData.consumption[String(currentYear - 1)] || [];
      const currSeries = demandData.consumption[String(currentYear)] || [];

      if (!prevSeries.length && !currSeries.length) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No data available for this series.</Text>
          </View>
        );
      }

      const width = Dimensions.get('window').width - 48;
      const height = 220;
      const padding = 24;

      const allDemandValues = [...prevSeries, ...currSeries].filter(
        v => typeof v === 'number' && !Number.isNaN(v),
      ) as number[];
      const minY = 0;
      const maxY = Math.max(...allDemandValues);
      const rangeY = maxY - minY || 1;
      const maxLen = Math.max(prevSeries.length, currSeries.length);

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

      const prevPoints = makePoints(prevSeries);
      const currPoints = makePoints(currSeries);

      const tickCount = 6;
      const xStep = Math.max(1, Math.floor(maxLen / (tickCount - 1)));
      const xTicks = Array.from(
        {length: tickCount},
        (_, i) => i * xStep + 1,
      ).filter(v => v <= maxLen);

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
              <View
                style={[styles.legendSwatch, {backgroundColor: '#2c3e50'}]}
              />
              <Text style={styles.legendText}>{currentYear - 1}</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendSwatch, {backgroundColor: '#e74c3c'}]}
              />
              <Text style={styles.legendText}>{currentYear}</Text>
            </View>
          </View>

          <View style={styles.xTicksRow}>
            {xTicks.map(v => (
              <Text key={v} style={styles.xTickLabel}>
                Week {v}
              </Text>
            ))}
          </View>
        </View>
      );
    }

    // Other fuel types: use rollingData with historical band
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
    const histRange = series.historical_range || [];
    const prevYearSeries = series[String(currentYear - 1)] || [];
    const currYearSeries = series[String(currentYear)] || [];

    const allValues = [
      ...histAvg,
      ...histRange.map(r => (r.max != null ? r.max : r.min ?? 0)),
      ...histRange.map(r => (r.min != null ? r.min : r.max ?? 0)),
      ...prevYearSeries,
      ...currYearSeries,
    ].filter(
      v => typeof v === 'number' && !Number.isNaN(v),
    ) as number[];

    if (allValues.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data available for this series.</Text>
        </View>
      );
    }

    const maxLen = Math.max(
      histAvg.length,
      histRange.length,
      prevYearSeries.length,
      currYearSeries.length,
    );
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
    const prevPoints = makePoints(prevYearSeries);
    const currPoints = makePoints(currYearSeries);

    // Historical range polygon (2016–2025 band)
    let rangePoints = '';
    if (histRange.length) {
      const maxPts: string[] = [];
      const minPts: string[] = [];

      histRange.forEach((r, i) => {
        const maxVal = r.max != null ? r.max : r.min ?? 0;
        const minVal = r.min != null ? r.min : r.max ?? 0;
        const xRatio = maxLen > 1 ? i / (maxLen - 1) : 0;
        const x = padding + xRatio * (width - padding * 2);

        const clamp = (yVal: number) =>
          Math.max(minY, Math.min(maxY, yVal || 0));

        const maxClamped = clamp(maxVal);
        const minClamped = clamp(minVal);

        const maxRatio = (maxClamped - minY) / rangeY;
        const minRatio = (minClamped - minY) / rangeY;
        const yMaxCoord =
          height - padding - maxRatio * (height - padding * 2);
        const yMinCoord =
          height - padding - minRatio * (height - padding * 2);

        maxPts.push(`${x},${yMaxCoord}`);
        minPts.push(`${x},${yMinCoord}`);
      });

      rangePoints = [...maxPts, ...minPts.reverse()].join(' ');
    }

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

          {/* Historical 2016–2025 range */}
          {rangePoints ? (
            <Polygon
              points={rangePoints}
              fill="rgba(135, 206, 250, 0.4)"
              stroke="none"
            />
          ) : null}

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
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
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
