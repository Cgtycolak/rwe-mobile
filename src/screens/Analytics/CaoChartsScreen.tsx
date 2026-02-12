import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Platform, StyleSheet, View, Text} from 'react-native';
import {WebView} from 'react-native-webview';

const CAO_CHARTS_URL = 'https://rwe-dashboard.onrender.com/#rolling-averages';

const CaoChartsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On web, just redirect the browser/tab to the existing Flask page
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        // @ts-ignore - window is only available on web
        window.location.href = CAO_CHARTS_URL;
      } catch (e) {
        setError('Automatic redirect to CAO charts failed.');
        setLoading(false);
      }
    }
  }, []);

  return (
    <View style={styles.container}>
      {loading && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      )}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load CAO charts</Text>
          <Text style={styles.errorText}>
            {error || 'Please check your connection or try again later.'}
          </Text>
        </View>
      ) : Platform.OS === 'web' ? (
        // While redirecting on web, just show a simple loader
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : (
        <WebView
          source={{uri: CAO_CHARTS_URL}}
          onLoadStart={() => {
            setError(null);
            setLoading(true);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={(e: any) => {
            console.log('CAO WebView error', e.nativeEvent);
            setLoading(false);
            setError('The rolling averages page could not be loaded from the server.');
          }}
          startInLoadingState={false}
          javaScriptEnabled
          domStorageEnabled
          pullToRefreshEnabled
          overScrollMode="never"
          nestedScrollEnabled
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
});

export default CaoChartsScreen;

