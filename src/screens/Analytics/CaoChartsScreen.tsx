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
import {LineChart, AreaChart} from 'react-native-gifted-charts';
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
      
      // Prepare data points for gifted-charts
      const prevData = prevSeries.map((value: number, index: number) => ({
        value: value || 0,
        label: index % Math.ceil(maxLen / 6) === 0 ? `W${index + 1}` : '',
        labelTextStyle: {color: '#7f8c8d', fontSize: 10},
      }));

      const currData = currSeries.map((value: number, index: number) => ({
        value: value || 0,
        label: index % Math.ceil(maxLen / 6) === 0 ? `W${index + 1}` : '',
        labelTextStyle: {color: '#7f8c8d', fontSize: 10},
      }));

      return (
        <View style={styles.chartWrapper}>
          <LineChart
            data={currData}
            data2={prevData}
            height={280}
            width={screenWidth - 64}
            spacing={Math.max(2, (screenWidth - 64) / maxLen)}
            thickness={2.5}
            thickness2={2.5}
            color1="#e74c3c"
            color2="#2c3e50"
            hideDataPoints={maxLen > 50}
            dataPointsRadius={4}
            dataPointsColor1="#e74c3c"
            dataPointsColor2="#2c3e50"
            textShiftY={-2}
            textShiftX={-5}
            textFontSize={10}
            curved
            startFillColor1="rgba(231, 76, 60, 0.1)"
            endFillColor1="rgba(231, 76, 60, 0.01)"
            startFillColor2="rgba(44, 62, 80, 0.1)"
            endFillColor2="rgba(44, 62, 80, 0.01)"
            areaChart
            yAxisColor="#bdc3c7"
            xAxisColor="#bdc3c7"
            rulesColor="#ecf0f1"
            rulesType="solid"
            yAxisTextStyle={{color: '#7f8c8d', fontSize: 10}}
            xAxisLabelTextStyle={{color: '#7f8c8d', fontSize: 10}}
            hideYAxisText={false}
            initialSpacing={10}
            endSpacing={10}
            pointerConfig={{
              pointer1Color: '#e74c3c',
              pointer2Color: '#2c3e50',
              activatePointersOnLongPress: true,
              autoAdjustPointerLabelPosition: true,
              pointerLabelComponent: (items: any) => {
                return (
                  <View style={styles.tooltipContainer}>
                    <Text style={styles.tooltipText}>
                      {items[0]?.value?.toFixed(0) || '0'} MWh
                    </Text>
                    {items[1] && (
                      <Text style={styles.tooltipText2}>
                        {items[1]?.value?.toFixed(0) || '0'} MWh
                      </Text>
                    )}
                  </View>
                );
              },
            }}
            onDataChangeAnimationDuration={300}
            animateOnDataChange
            animationDuration={800}
            maxValue={Math.max(...prevSeries, ...currSeries) * 1.1}
            noOfSections={5}
            yAxisLabelSuffix="k"
            formatYLabel={(label: string) => `${(parseFloat(label) / 1000).toFixed(0)}k`}
          />
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

    // Prepare data for gifted-charts
    const histAvgData = histAvg.map((value, index) => ({
      value: value || 0,
      label: index % Math.ceil(maxLen / 6) === 0 ? `D${index + 1}` : '',
      labelTextStyle: {color: '#7f8c8d', fontSize: 10},
    }));

    const prevYearData = prevYearSeries.map((value, index) => ({
      value: value || 0,
      label: index % Math.ceil(maxLen / 6) === 0 ? `D${index + 1}` : '',
      labelTextStyle: {color: '#7f8c8d', fontSize: 10},
    }));

    const currYearData = currYearSeries.map((value, index) => ({
      value: value || 0,
      label: index % Math.ceil(maxLen / 6) === 0 ? `D${index + 1}` : '',
      labelTextStyle: {color: '#7f8c8d', fontSize: 10},
    }));

    // Prepare range data for area chart (2016-2025 band)
    const rangeData = histRange.map((r, index) => {
      const maxVal = r.max != null ? r.max : r.min ?? 0;
      const minVal = r.min != null ? r.min : r.max ?? 0;
      return {
        value: maxVal,
        value2: minVal,
        label: index % Math.ceil(maxLen / 6) === 0 ? `D${index + 1}` : '',
        labelTextStyle: {color: '#7f8c8d', fontSize: 10},
      };
    });

    const maxValue = Math.max(...allValues) * 1.1;

    return (
      <View style={styles.chartWrapper}>
        {/* Historical range area (2016-2025 band) */}
        {rangeData.length > 0 && (
          <View style={styles.rangeChartContainer}>
            <AreaChart
              data={rangeData.map(d => ({value: d.value}))}
              data2={rangeData.map(d => ({value: d.value2}))}
              height={280}
              width={screenWidth - 64}
              spacing={Math.max(2, (screenWidth - 64) / maxLen)}
              startFillColor="rgba(135, 206, 250, 0.4)"
              endFillColor="rgba(135, 206, 250, 0.1)"
              startFillColor2="rgba(135, 206, 250, 0.4)"
              endFillColor2="rgba(135, 206, 250, 0.1)"
              hideDataPoints
              hideYAxisText
              hideRules
              hideAxesAndRules
              maxValue={maxValue}
              initialSpacing={10}
              endSpacing={10}
              pointerConfig={undefined}
            />
          </View>
        )}

        {/* Main line chart with all series */}
        <LineChart
          data={currYearData}
          data2={prevYearData}
          data3={histAvgData}
          height={280}
          width={screenWidth - 64}
          spacing={Math.max(2, (screenWidth - 64) / maxLen)}
          thickness={2.5}
          thickness2={2.5}
          thickness3={2}
          color1="#e74c3c"
          color2="#2c3e50"
          color3="#2980b9"
          hideDataPoints={maxLen > 50}
          dataPointsRadius={4}
          dataPointsColor1="#e74c3c"
          dataPointsColor2="#2c3e50"
          dataPointsColor3="#2980b9"
          textShiftY={-2}
          textShiftX={-5}
          textFontSize={10}
          curved
          yAxisColor="#bdc3c7"
          xAxisColor="#bdc3c7"
          rulesColor="#ecf0f1"
          rulesType="solid"
          yAxisTextStyle={{color: '#7f8c8d', fontSize: 10}}
          xAxisLabelTextStyle={{color: '#7f8c8d', fontSize: 10}}
          hideYAxisText={false}
          initialSpacing={10}
          endSpacing={10}
          pointerConfig={{
            pointer1Color: '#e74c3c',
            pointer2Color: '#2c3e50',
            pointer3Color: '#2980b9',
            activatePointersOnLongPress: true,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: any) => {
              return (
                <View style={styles.tooltipContainer}>
                  {items[0] && (
                    <Text style={[styles.tooltipText, {color: '#e74c3c'}]}>
                      {currentYear}: {items[0]?.value?.toFixed(0) || '0'}
                    </Text>
                  )}
                  {items[1] && (
                    <Text style={[styles.tooltipText, {color: '#2c3e50'}]}>
                      {currentYear - 1}: {items[1]?.value?.toFixed(0) || '0'}
                    </Text>
                  )}
                  {items[2] && (
                    <Text style={[styles.tooltipText, {color: '#2980b9'}]}>
                      Hist. avg: {items[2]?.value?.toFixed(0) || '0'}
                    </Text>
                  )}
                </View>
              );
            },
          }}
          onDataChangeAnimationDuration={300}
          animateOnDataChange
          animationDuration={800}
          maxValue={maxValue}
          noOfSections={5}
          yAxisLabelSuffix="k"
          formatYLabel={(label: string) => `${(parseFloat(label) / 1000).toFixed(0)}k`}
          dashGap={10}
          dashWidth={5}
          isAnimated
        />

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
            Compare current year, previous year, and long-term average. Long press to see values.
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
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  rangeChartContainer: {
    position: 'absolute',
    zIndex: 0,
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
  tooltipContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 80,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  tooltipText2: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default CaoChartsScreen;
