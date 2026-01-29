import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

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
  const [zoomLevel, setZoomLevel] = useState<'small' | 'medium' | 'large'>('medium');

  const cellSizes = {
    small: {width: 60, height: 30, fontSize: 10},
    medium: {width: 80, height: 35, fontSize: 11},
    large: {width: 110, height: 45, fontSize: 13},
  };

  const currentSize = cellSizes[zoomLevel];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={[styles.zoomButton, zoomLevel === 'small' && styles.zoomButtonActive]}
            onPress={() => setZoomLevel('small')}>
            <Text style={[styles.zoomButtonText, zoomLevel === 'small' && styles.zoomButtonTextActive]}>
              S
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.zoomButton, zoomLevel === 'medium' && styles.zoomButtonActive]}
            onPress={() => setZoomLevel('medium')}>
            <Text style={[styles.zoomButtonText, zoomLevel === 'medium' && styles.zoomButtonTextActive]}>
              M
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.zoomButton, zoomLevel === 'large' && styles.zoomButtonActive]}
            onPress={() => setZoomLevel('large')}>
            <Text style={[styles.zoomButtonText, zoomLevel === 'large' && styles.zoomButtonTextActive]}>
              L
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.verticalScroll}
        showsVerticalScrollIndicator={true}
        bounces={false}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          bounces={false}>
          <View style={styles.heatmapGrid}>
            {/* Header row with plant names */}
            <View style={styles.headerRow}>
              <View style={[styles.hourHeaderCell, {width: 50, height: currentSize.height + 25}]}>
                <Text style={styles.headerText}>Hour</Text>
              </View>
              {heatmapData.plants?.map((plant: string, idx: number) => (
                <View 
                  key={idx} 
                  style={[
                    styles.plantCell, 
                    {width: currentSize.width, height: currentSize.height + 25}
                  ]}>
                  <Text style={[styles.headerText, {fontSize: currentSize.fontSize}]} numberOfLines={3}>
                    {plant.split('--')[0]}
                  </Text>
                  <Text style={[styles.capacityText, {fontSize: currentSize.fontSize - 2}]}>
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
                  <View style={[styles.hourDataCell, {width: 50, height: currentSize.height}]}>
                    <Text style={styles.hourText}>{hour}</Text>
                  </View>
                  {rowValues.map((value: number, plantIndex: number) => (
                    <View 
                      key={plantIndex}
                      style={{width: currentSize.width, height: currentSize.height}}>
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
          💡 Use S/M/L buttons to adjust cell size • Scroll horizontally and vertically
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 2,
  },
  zoomControls: {
    flexDirection: 'row',
    gap: 6,
  },
  zoomButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  zoomButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  zoomButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  zoomButtonTextActive: {
    color: '#fff',
  },
  verticalScroll: {
    flex: 1,
  },
  heatmapGrid: {
    padding: 10,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  hourHeaderCell: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#34495e',
    marginRight: 2,
    borderRadius: 4,
  },
  plantCell: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#34495e',
    marginRight: 2,
    padding: 4,
    borderRadius: 4,
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  capacityText: {
    color: '#ecf0f1',
    marginTop: 2,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  hourDataCell: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#34495e',
    marginRight: 2,
    borderRadius: 4,
  },
  hourText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
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
