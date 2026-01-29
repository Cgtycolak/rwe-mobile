import React, {useRef, useState, useEffect} from 'react';
import {View, ScrollView, StyleSheet, Platform} from 'react-native';

interface ZoomableScrollViewProps {
  children: React.ReactNode;
  minZoom?: number;
  maxZoom?: number;
}

const ZoomableScrollView: React.FC<ZoomableScrollViewProps> = ({
  children,
  minZoom = 0.5,
  maxZoom = 2.5,
}) => {
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef<any>(null);
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && containerRef.current) {
      const element = containerRef.current;
      
      let initialDistance = 0;
      let initialZoom = 1;

      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 2) {
          e.preventDefault();
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          initialDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          );
          initialZoom = zoom;
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 2) {
          e.preventDefault();
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          );
          
          const scale = currentDistance / initialDistance;
          const newZoom = Math.min(maxZoom, Math.max(minZoom, initialZoom * scale));
          setZoom(newZoom);
        }
      };

      const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = -e.deltaY * 0.01;
          const newZoom = Math.min(maxZoom, Math.max(minZoom, zoom + delta));
          setZoom(newZoom);
        }
      };

      element.addEventListener('touchstart', handleTouchStart, {passive: false});
      element.addEventListener('touchmove', handleTouchMove, {passive: false});
      element.addEventListener('wheel', handleWheel, {passive: false});

      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('wheel', handleWheel);
      };
    }
  }, [zoom, minZoom, maxZoom]);

  return (
    <View style={styles.container} ref={containerRef}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={true}
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        style={styles.horizontalScroll}>
        <ScrollView
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          scrollEventThrottle={16}
          style={styles.verticalScroll}>
          <View
            style={[
              styles.content,
              Platform.OS === 'web' && {
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              },
            ]}>
            {children}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  horizontalScroll: {
    flex: 1,
  },
  verticalScroll: {
    flex: 1,
  },
  content: {
    padding: 10,
  },
});

export default ZoomableScrollView;
