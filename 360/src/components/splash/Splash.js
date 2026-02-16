import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Image,
} from 'react-native';

const Splash = ({ navigation }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(-120)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),

      Animated.timing(progress, {
        toValue: 1,
        duration: 5200, // ⏱ splash más largo
        useNativeDriver: false,
      }),
    ]).start(() => {
      navigation.replace('Home');
    });
  }, []);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View style={styles.centerContent}>
        <Animated.View
          style={{
            transform: [{ translateY: logoTranslateY }],
            opacity: logoOpacity,
          }}
        >
          <View style={styles.logoGlow}>
            <Image
              source={require('../../assets/inmersa.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <Text style={styles.title}>INMERSA</Text>
        <Text style={styles.subtitle}>360° EVENT EXPERIENCES</Text>
      </View>

      <View style={styles.bottomArea}>
        <View style={styles.progressContainer}>
          <Animated.View
            style={[styles.progressBar, { width: widthInterpolated }]}
          />
        </View>
        <Text style={styles.version}>v1.0</Text>
      </View>
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoGlow: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 25,
    elevation: 18,
    marginBottom: 16,
  },

  logo: {
    width: 96,
    height: 96,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 28,
    letterSpacing: 5,
    fontWeight: '700',
    textAlign: 'center',
  },

  subtitle: {
    color: '#D0D0D0',
    fontSize: 12,
    letterSpacing: 1.6,
    marginTop: 6,
    textAlign: 'center',
  },

  bottomArea: {
    paddingBottom: 28,
    alignItems: 'center',
  },

  progressContainer: {
    height: 4,
    width: '60%',
    backgroundColor: '#1E1E1E',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },

  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },

  version: {
    color: '#A0A0A0',
    fontSize: 11,
  },
});
