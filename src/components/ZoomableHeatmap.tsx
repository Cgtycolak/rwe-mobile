import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

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
  const [scale, setScale] = useState(1);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Store current values
        lastScale.current = scale;
        lastTranslateX.current = translateX._value;
        lastTranslateY.current = translateY._value;
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length === 2) {
          // Pinch to zoom
          const touch1 = touches[0];
          const touch2 = touches[1];

          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
              Math.pow(touch2.pageY - touch1.pageY, 2),
          );

          if (lastScale.current) {
            const newScale = Math.max(
              1,
              Math.min(lastScale.current * (distance / 200), 4),
            );
            scaleValue.setValue(newScale);
            setScale(newScale);
          }
        } else if (touches.length === 1) {
          // Pan with one finger (only if zoomed in)
          if (scale > 1) {
            const maxTranslateX = (SCREEN_WIDTH * (scale - 1)) / 2;
            const maxTranslateY = (SCREEN_HEIGHT * (scale - 1)) / 2;

            const newTranslateX = Math.max(
              -maxTranslateX,
              Math.min(
                maxTranslateX,
                lastTranslateX.current + gestureState.dx,
              ),
            );
            const newTranslateY = Math.max(
              -maxTranslateY,
              Math.min(
                maxTranslateY,
                lastTranslateY.current + gestureState.dy,
              ),
            );

            translateX.setValue(newTranslateX);
            translateY.setValue(newTranslateY);
          }
        }
      },
      onPanResponderRelease: () => {
        lastScale.current = scale;
        lastTranslateX.current = translateX._value;
        lastTranslateY.current = translateY._value;
      },
    }),
  ).current;

  // Reset zoom
  const resetZoom = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
    setScale(1);
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {scale > 1 && (
          <Text style={styles.zoomIndicator} onPress={resetZoom}>
            Reset Zoom ({scale.toFixed(1)}x)
          </Text>
        )}
      </View>

      <Animated.View
        style={[
          styles.zoomableContainer,
          {
            transform: [
              {scale: scaleValue},
              {translateX: translateX},
              {translateY: translateY},
            ],
          },
        ]}
        {...panResponder.panHandlers}>
        <View style={styles.heatmapGrid}>
          {/* Header row with plant names */}
          <View style={styles.headerRow}>
            <View style={styles.hourHeaderCell}>
              <Text style={styles.headerText}>Hour</Text>
            </View>
            {heatmapData.plants?.map((plant: string, idx: number) => (
              <View key={idx} style={styles.plantCell}>
                <Text style={styles.headerText}>{plant.split('--')[0]}</Text>
                <Text style={styles.capacityText}>{plant.split('--')[1]}</Text>
              </View>
            ))}
          </View>

          {/* Data rows */}
          {heatmapData.hours?.map((hour: string, hourIndex: number) => {
            const rowValues = heatmapData.values[hourIndex];
            const maxValue = Math.max(...rowValues);
            return (
              <View key={hourIndex} style={styles.dataRow}>
                <View style={styles.hourDataCell}>
                  <Text style={styles.hourText}>{hour}</Text>
                </View>
                {rowValues.map((value: number, plantIndex: number) => (
                  <View key={plantIndex}>
                    {renderCell(value, maxValue)}
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </Animated.View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          💡 Pinch to zoom • Drag to pan • Tap "Reset" to restore
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 2,
  },
  zoomIndicator: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
  },
  zoomableContainer: {
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
    width: 50,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#34495e',
    marginRight: 2,
    borderRadius: 4,
  },
  plantCell: {
    width: 80,
    height: 60,
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
    fontSize: 11,
    textAlign: 'center',
  },
  capacityText: {
    color: '#ecf0f1',
    fontSize: 9,
    marginTop: 2,
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  hourDataCell: {
    width: 50,
    height: 35,
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
  heatmapCell: {
    width: 80,
    height: 35,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
    borderRadius: 4,
  },
  instructions: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  instructionText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ZoomableHeatmap;
