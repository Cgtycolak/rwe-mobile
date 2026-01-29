import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';

interface ZoomableHeatmapProps {
  heatmapData: any;
  renderCell: (value: number, maxValue: number) => JSX.Element;
  title: string;
  subtitle: string;
}

const ZoomableHeatmap: React.FC<ZoomableHeatmapProps> = ({
  heatmapData,
  renderCell,
  title,
  subtitle,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <ScrollView 
        style={styles.verticalScroll}
        showsVerticalScrollIndicator={true}
        bounces={false}
        pinchGestureEnabled={true}
        maximumZoomScale={3}
        minimumZoomScale={0.5}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          bounces={false}
          pinchGestureEnabled={true}>
          <View style={styles.heatmapGrid}>
            {/* Header row with plant names */}
            <View style={styles.headerRow}>
              <View style={styles.hourHeaderCell}>
                <Text style={styles.headerText}>Hour</Text>
              </View>
              {heatmapData.plants?.map((plant: string, idx: number) => (
                <View key={idx} style={styles.plantCell}>
                  <Text style={styles.headerText} numberOfLines={2}>
                    {plant.split('--')[0]}
                  </Text>
                  <Text style={styles.capacityText}>
                    {plant.split('--')[1]}
                  </Text>
                </View>
              ))}
            </View>

            {/* Data rows */}
            {heatmapData.hours?.map((hour: string, hourIndex: number) => {
              const rowValues = heatmapData.values[hourIndex];
              const maxValue = Math.max(...rowValues.filter((v: number) => v > 0), 1);
              return (
                <View key={hourIndex} style={styles.dataRow}>
                  <View style={styles.hourDataCell}>
                    <Text style={styles.hourText}>{hour}</Text>
                  </View>
                  {rowValues.map((value: number, plantIndex: number) => (
                    <View key={plantIndex} style={styles.cellContainer}>
                      {renderCell(value, maxValue)}
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          💡 Scroll horizontally & vertically • Pinch to zoom (mobile)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  verticalScroll: {
    flex: 1,
  },
  heatmapGrid: {
    padding: 10,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  hourHeaderCell: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#34495e',
    marginRight: 3,
    borderRadius: 6,
  },
  plantCell: {
    width: 95,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#34495e',
    marginRight: 3,
    padding: 6,
    borderRadius: 6,
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'center',
  },
  capacityText: {
    color: '#ecf0f1',
    fontSize: 10,
    marginTop: 3,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  hourDataCell: {
    width: 70,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#34495e',
    marginRight: 3,
    borderRadius: 6,
  },
  hourText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  cellContainer: {
    width: 95,
    height: 42,
    marginRight: 3,
  },
  instructions: {
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  instructionText: {
    fontSize: 11,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ZoomableHeatmap;
