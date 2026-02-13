import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import apiService from '../../services/apiService';

// Conditional import for recharts (web) or fallback to SVG (native)
let LineChart: any;
let AreaChart: any;
let Line: any;
let Area: any;
let XAxis: any;
let YAxis: any;
let CartesianGrid: any;
let Tooltip: any;
let Legend: any;
let ResponsiveContainer: any;
let ComposedChart: any;
let ReferenceArea: any;

if (Platform.OS === 'web') {
  try {
    const Recharts = require('recharts');
    LineChart = Recharts.LineChart;
    AreaChart = Recharts.AreaChart;
    Line = Recharts.Line;
    Area = Recharts.Area;
    XAxis = Recharts.XAxis;
    YAxis = Recharts.YAxis;
    CartesianGrid = Recharts.CartesianGrid;
    Tooltip = Recharts.Tooltip;
    Legend = Recharts.Legend;
    ResponsiveContainer = Recharts.ResponsiveContainer;
    ComposedChart = Recharts.ComposedChart;
    ReferenceArea = Recharts.ReferenceArea;
  } catch (e) {
    console.warn('Recharts not available, using SVG fallback');
  }
}

// SVG fallback for native
import Svg, {Line as SvgLine, Polyline, Polygon} from 'react-native-svg';

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
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const currentYear = new Date().getFullYear();
  const screenWidth = Dimensions.get('window').width;

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
    const useRecharts = Platform.OS === 'web' && LineChart && ResponsiveContainer;

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

      const maxLen = Math.max(prevSeries.length, currSeries.length);
      const chartData = Array.from({length: maxLen}, (_, i) => ({
        week: i + 1,
        prev: prevSeries[i] || null,
        curr: currSeries[i] || null,
      }));

      if (useRecharts) {
        return (
          <View style={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData} margin={{top: 5, right: 10, left: 0, bottom: 5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
                <XAxis
                  dataKey="week"
                  tick={{fill: '#7f8c8d', fontSize: 10}}
                  label={{value: 'Week', position: 'insideBottom', offset: -5, fill: '#7f8c8d'}}
                />
                <YAxis
                  tick={{fill: '#7f8c8d', fontSize: 10}}
                  label={{value: 'MWh', angle: -90, position: 'insideLeft', fill: '#7f8c8d'}}
                  tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: 4}}
                  labelStyle={{color: '#fff'}}
                  formatter={(value: number) => [`${value?.toFixed(0) || 0} MWh`, '']}
                />
                <Legend
                  wrapperStyle={{paddingTop: 10}}
                  iconType="line"
                  onClick={(e: any) => {
                    const dataKey = e.dataKey || e.value;
                    if (dataKey) {
                      setHiddenSeries(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(dataKey)) {
                          newSet.delete(dataKey);
                        } else {
                          newSet.add(dataKey);
                        }
                        return newSet;
                      });
                    }
                  }}
                  formatter={(value: string, entry: any) => {
                    const dataKey = entry.dataKey || entry.value || value;
                    const isHidden = hiddenSeries.has(dataKey);
                    return (
                      <span style={{opacity: isHidden ? 0.3 : 1, cursor: 'pointer', userSelect: 'none'}}>
                        {value}
                      </span>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="prev"
                  stroke="#2c3e50"
                  strokeWidth={2.5}
                  name={`${currentYear - 1}`}
                  dot={false}
                  activeDot={{r: 6}}
                  hide={hiddenSeries.has('prev')}
                />
                <Line
                  type="monotone"
                  dataKey="curr"
                  stroke="#e74c3c"
                  strokeWidth={2.5}
                  name={`${currentYear}`}
                  dot={false}
                  activeDot={{r: 6}}
                  hide={hiddenSeries.has('curr')}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </View>
        );
      }

      // SVG fallback for native
      return renderDemandSVG(prevSeries, currSeries, maxLen);
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

    const maxLen = Math.max(
      histAvg.length,
      histRange.length,
      prevYearSeries.length,
      currYearSeries.length,
    );

    const chartData = Array.from({length: maxLen}, (_, i) => {
      const max = histRange[i]?.max || null;
      const min = histRange[i]?.min || null;
      return {
        day: i + 1,
        histAvg: histAvg[i] || null,
        histMax: max,
        histMin: min,
        histRangeTop: max, // For the range area
        histRangeBottom: min, // For the range area
        prev: prevYearSeries[i] || null,
        curr: currYearSeries[i] || null,
      };
    });

    if (useRecharts) {
      return (
        <View style={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{top: 5, right: 10, left: 0, bottom: 5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
              <XAxis
                dataKey="day"
                tick={{fill: '#7f8c8d', fontSize: 10}}
                label={{value: 'Day', position: 'insideBottom', offset: -5, fill: '#7f8c8d'}}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{fill: '#7f8c8d', fontSize: 10}}
                label={{value: 'mW', angle: -90, position: 'insideLeft', fill: '#7f8c8d'}}
                tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: 4}}
                labelStyle={{color: '#fff'}}
                formatter={(value: number, name: string) => {
                  const labels: {[key: string]: string} = {
                    histAvg: 'Hist. avg',
                    prev: `${currentYear - 1}`,
                    curr: `${currentYear}`,
                  };
                  return [`${value?.toFixed(0) || 0}`, labels[name] || name];
                }}
              />
              <Legend
                wrapperStyle={{paddingTop: 10}}
                iconType="line"
                onClick={(e: any) => {
                  // Map legend names to dataKeys
                  const nameToKey: {[key: string]: string} = {
                    '2016-2025 Range': 'histRange',
                    'Hist. avg': 'histAvg',
                    [`${currentYear - 1}`]: 'prev',
                    [`${currentYear}`]: 'curr',
                  };
                  const legendName = e.value || e.dataKey;
                  const dataKey = nameToKey[legendName] || legendName;
                  if (dataKey) {
                    setHiddenSeries(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(dataKey)) {
                        newSet.delete(dataKey);
                      } else {
                        newSet.add(dataKey);
                      }
                      return newSet;
                    });
                  }
                }}
                formatter={(value: string, entry: any) => {
                  // Map legend names to dataKeys
                  const nameToKey: {[key: string]: string} = {
                    '2016-2025 Range': 'histRange',
                    'Hist. avg': 'histAvg',
                    [`${currentYear - 1}`]: 'prev',
                    [`${currentYear}`]: 'curr',
                  };
                  const dataKey = nameToKey[value] || entry.dataKey || value;
                  const isHidden = hiddenSeries.has(dataKey);
                  return (
                    <span style={{opacity: isHidden ? 0.3 : 1, cursor: 'pointer', userSelect: 'none'}}>
                      {value}
                    </span>
                  );
                }}
              />
              {/* Historical range area - Area with baseLine accessing histMin from each data point */}
              <Area
                type="monotone"
                dataKey="histMax"
                stroke="none"
                fill="rgba(135, 206, 250, 0.4)"
                connectNulls
                baseLine={(props: any) => {
                  // In recharts, baseLine function receives props with payload containing the data point
                  const dataPoint = props?.payload || props;
                  return dataPoint?.histMin ?? 0;
                }}
                name="2016-2025 Range"
                hide={hiddenSeries.has('histRange')}
              />
              <Line
                type="monotone"
                dataKey="histAvg"
                stroke="#2980b9"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Hist. avg"
                dot={false}
                activeDot={{r: 6}}
                hide={hiddenSeries.has('histAvg')}
              />
              <Line
                type="monotone"
                dataKey="prev"
                stroke="#2c3e50"
                strokeWidth={2.5}
                name={`${currentYear - 1}`}
                dot={false}
                activeDot={{r: 6}}
                hide={hiddenSeries.has('prev')}
              />
              <Line
                type="monotone"
                dataKey="curr"
                stroke="#e74c3c"
                strokeWidth={2.5}
                name={`${currentYear}`}
                dot={false}
                activeDot={{r: 6}}
                hide={hiddenSeries.has('curr')}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </View>
      );
    }

    // SVG fallback for native
    return renderRollingSVG(series, histAvg, histRange, prevYearSeries, currYearSeries, maxLen);
  };

  // SVG fallback renderers
  const renderDemandSVG = (prevSeries: number[], currSeries: number[], maxLen: number) => {
    const width = screenWidth - 48;
    const height = 220;
    const padding = 24;
    const allValues = [...prevSeries, ...currSeries].filter(v => typeof v === 'number' && !Number.isNaN(v));
    const maxY = Math.max(...allValues);
    const rangeY = maxY || 1;

    const makePoints = (arr: number[]) => {
      if (!arr.length) return '';
      return arr
        .map((y, i) => {
          const xRatio = maxLen > 1 ? i / (maxLen - 1) : 0;
          const x = padding + xRatio * (width - padding * 2);
          const yRatio = y / rangeY;
          const yCoord = height - padding - yRatio * (height - padding * 2);
          return `${x},${yCoord}`;
        })
        .join(' ');
    };

    const prevPoints = makePoints(prevSeries);
    const currPoints = makePoints(currSeries);
    const tickCount = 6;
    const xStep = Math.max(1, Math.floor(maxLen / (tickCount - 1)));
    const xTicks = Array.from({length: tickCount}, (_, i) => i * xStep + 1).filter(v => v <= maxLen);

    return (
      <View>
        <Svg width={width} height={height}>
          <SvgLine x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#bdc3c7" strokeWidth={1} />
          <SvgLine x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#bdc3c7" strokeWidth={1} />
          {prevPoints ? <Polyline points={prevPoints} fill="none" stroke="#2c3e50" strokeWidth={2} /> : null}
          {currPoints ? <Polyline points={currPoints} fill="none" stroke="#e74c3c" strokeWidth={2} /> : null}
        </Svg>
        <View style={styles.legendRow}>
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
            <Text key={v} style={styles.xTickLabel}>Week {v}</Text>
          ))}
        </View>
      </View>
    );
  };

  const renderRollingSVG = (
    series: RollingSeries,
    histAvg: number[],
    histRange: {min: number | null; max: number | null}[],
    prevYearSeries: number[],
    currYearSeries: number[],
    maxLen: number,
  ) => {
    const width = screenWidth - 48;
    const height = 220;
    const padding = 24;
    const allValues = [
      ...histAvg,
      ...histRange.map(r => (r.max != null ? r.max : r.min ?? 0)),
      ...histRange.map(r => (r.min != null ? r.min : r.max ?? 0)),
      ...prevYearSeries,
      ...currYearSeries,
    ].filter(v => typeof v === 'number' && !Number.isNaN(v));
    const maxY = Math.max(...allValues);
    const rangeY = maxY || 1;

    const makePoints = (arr: number[]) => {
      if (!arr.length) return '';
      return arr
        .map((y, i) => {
          const xRatio = maxLen > 1 ? i / (maxLen - 1) : 0;
          const x = padding + xRatio * (width - padding * 2);
          const yRatio = y / rangeY;
          const yCoord = height - padding - yRatio * (height - padding * 2);
          return `${x},${yCoord}`;
        })
        .join(' ');
    };

    let rangePoints = '';
    if (histRange.length) {
      const maxPts: string[] = [];
      const minPts: string[] = [];
      histRange.forEach((r, i) => {
        const maxVal = r.max != null ? r.max : r.min ?? 0;
        const minVal = r.min != null ? r.min : r.max ?? 0;
        const xRatio = maxLen > 1 ? i / (maxLen - 1) : 0;
        const x = padding + xRatio * (width - padding * 2);
        const maxRatio = maxVal / rangeY;
        const minRatio = minVal / rangeY;
        const yMaxCoord = height - padding - maxRatio * (height - padding * 2);
        const yMinCoord = height - padding - minRatio * (height - padding * 2);
        maxPts.push(`${x},${yMaxCoord}`);
        minPts.push(`${x},${yMinCoord}`);
      });
      rangePoints = [...maxPts, ...minPts.reverse()].join(' ');
    }

    const histPoints = makePoints(histAvg);
    const prevPoints = makePoints(prevYearSeries);
    const currPoints = makePoints(currYearSeries);
    const tickCount = 6;
    const xStep = Math.max(1, Math.floor(maxLen / (tickCount - 1)));
    const xTicks = Array.from({length: tickCount}, (_, i) => i * xStep + 1).filter(v => v <= maxLen);

    return (
      <View>
        <Svg width={width} height={height}>
          <SvgLine x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#bdc3c7" strokeWidth={1} />
          <SvgLine x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#bdc3c7" strokeWidth={1} />
          {rangePoints ? <Polygon points={rangePoints} fill="rgba(135, 206, 250, 0.4)" stroke="none" /> : null}
          {histPoints ? <Polyline points={histPoints} fill="none" stroke="#2980b9" strokeWidth={2} /> : null}
          {prevPoints ? <Polyline points={prevPoints} fill="none" stroke="#2c3e50" strokeWidth={2} /> : null}
          {currPoints ? <Polyline points={currPoints} fill="none" stroke="#e74c3c" strokeWidth={2} /> : null}
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
            <Text key={v} style={styles.xTickLabel}>Day {v}</Text>
          ))}
        </View>
      </View>
    );
  };

  const currentLabel =
    FUEL_TYPES.find(t => t.key === selectedType)?.label || selectedType;

  return (
    <View style={styles.container}>
      {loading && !rollingData && !demandData ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : null}

      {error && !loading && !rollingData && !demandData ? (
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
            {Platform.OS === 'web' 
              ? 'Compare current year, previous year, and long-term average. Hover or click to see values. Zoom with mouse wheel.'
              : 'Compare current year, previous year, and long-term average.'}
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
    paddingVertical: 16,
    paddingHorizontal: 8,
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
    marginBottom: 8,
  },
  chartWrapper: {
    width: '100%',
    height: 280,
    marginVertical: 8,
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
    marginTop: 12,
    marginLeft: 8,
    gap: 16,
    flexWrap: 'wrap',
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
