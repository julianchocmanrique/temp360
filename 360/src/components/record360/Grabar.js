import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Easing } from 'react-native'
import { Camera, useCameraDevices } from 'react-native-vision-camera'
import { useIsFocused } from '@react-navigation/native'
import Video from 'react-native-video'

const DURATION_SECONDS = 30
const COUNTDOWN_SECONDS = 3

const Grabar = ({ route, navigation }) => {
  const plantilla = route?.params?.plantilla
  const initialEffect = route?.params?.effect || 'auto'
  const selectedFilter = route?.params?.filter || { id: 'none', image: null }
  const timelineSegments = route?.params?.timelineSegments
  const autoStart = Boolean(route?.params?.autoStart)
  const cameraRef = useRef(null)
  const isFocused = useIsFocused()
  const devices = useCameraDevices()
  const device = devices.back
  const [hasPermission, setHasPermission] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [remaining, setRemaining] = useState(DURATION_SECONDS)
  const [previewUri, setPreviewUri] = useState(null)
  const [selectedEffect, setSelectedEffect] = useState(initialEffect)
  const [countdown, setCountdown] = useState(null)
  const timerRef = useRef(null)
  const countdownRef = useRef(null)
  const retryRef = useRef(0)
  const startLockRef = useRef(false)
  const autoStartConsumedRef = useRef(false)
  const pulse = useRef(new Animated.Value(1)).current
  const arcProgress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let mounted = true
    const requestPerms = async () => {
      const cam = await Camera.requestCameraPermission()
      const mic = await Camera.requestMicrophonePermission()
      if (!mounted) return
      setHasPermission(cam === 'authorized' && mic === 'authorized')
    }
    requestPerms()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!isRecording) return
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [isRecording])

  useEffect(() => {
    if (!isFocused && isRecording) {
      stopRecording()
    }
  }, [isFocused, isRecording])

  useEffect(() => {
    let target = 0
    if (countdown != null) {
      target = (COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS
    } else if (isRecording) {
      target = (DURATION_SECONDS - remaining) / DURATION_SECONDS
    }
    Animated.timing(arcProgress, {
      toValue: Math.max(0, Math.min(1, target)),
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [countdown, isRecording, remaining, arcProgress])

  useEffect(() => {
    if (!isRecording) {
      pulse.setValue(1)
      return
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.25, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 650, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [isRecording, pulse])

  useEffect(() => {
    if (countdown == null) return
    if (countdown <= 0) {
      setCountdown(null)
      // Small buffer so CameraX can deliver first valid frames on some Android devices.
      setTimeout(() => startRecordingNow(), 280)
      return
    }
    countdownRef.current = setTimeout(() => {
      setCountdown((prev) => (prev == null ? null : prev - 1))
    }, 1000)
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current)
    }
  }, [countdown])

  useEffect(() => {
    if (!autoStart) return
    if (autoStartConsumedRef.current) return
    if (!isCameraReady || !isFocused) return
    if (isRecording || countdown != null || previewUri) return
    autoStartConsumedRef.current = true
    const t = setTimeout(() => setCountdown(COUNTDOWN_SECONDS), 180)
    return () => clearTimeout(t)
  }, [autoStart, isCameraReady, isFocused, isRecording, countdown, previewUri])

  const startCountdown = () => {
    if (isRecording || countdown != null || previewUri) return
    if (!isCameraReady) return
    setCountdown(COUNTDOWN_SECONDS)
  }

  const startRecordingNow = async () => {
    if (!cameraRef.current || isRecording || !isCameraReady || startLockRef.current) return
    startLockRef.current = true
    setIsRecording(true)
    setRemaining(DURATION_SECONDS)

    const stopTimeout = setTimeout(() => {
      stopRecording()
    }, DURATION_SECONDS * 1000)

    try {
      cameraRef.current.startRecording({
        onRecordingFinished: (video) => {
          clearTimeout(stopTimeout)
          setIsRecording(false)
          startLockRef.current = false
          retryRef.current = 0
          const safeVideoUri = video.path.startsWith('file://')
            ? video.path
            : `file://${video.path}`
          setPreviewUri(safeVideoUri)
        },
        onRecordingError: (err) => {
          clearTimeout(stopTimeout)
          setIsRecording(false)
          startLockRef.current = false
          const code = err?.code || err?.cause?.code
          if (
            (code === 'capture/inactive-source' ||
              code === 'capture/no-valid-data' ||
              code === 'session/camera-not-ready') &&
            retryRef.current < 2
          ) {
            retryRef.current += 1
            setTimeout(() => startRecordingNow(), 650)
            return
          }
          const msg = err?.message || (typeof err === 'string' ? err : JSON.stringify(err))
          Alert.alert('Error', `No se pudo grabar el video: ${msg}`)
        },
      })
    } catch (e) {
      clearTimeout(stopTimeout)
      setIsRecording(false)
      startLockRef.current = false
      const msg = e?.message || (typeof e === 'string' ? e : JSON.stringify(e))
      Alert.alert('Error', `No se pudo iniciar la grabacion: ${msg}`)
    }
  }

  const stopRecording = async () => {
    try {
      await cameraRef.current?.stopRecording()
    } catch (_) {
      // ignore
    }
  }
  const showCaptureOverlay = countdown != null || isRecording

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Cargando camara...</Text>
      </View>
    )
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Permisos de camara y microfono requeridos</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {previewUri ? (
        <View style={styles.previewWrap}>
          <Video source={{ uri: previewUri }} style={StyleSheet.absoluteFill} resizeMode="cover" repeat muted />
          <View style={styles.previewOverlay} />

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.previewBtnGhost}
              onPress={() => {
                setPreviewUri(null)
              }}
            >
              <Text style={styles.previewBtnText}>X</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.previewBtn}
              onPress={() =>
                navigation.navigate('VideoPlayer', {
                  videoUri: previewUri,
                  plantilla,
                  effect: selectedEffect,
                  filter: selectedFilter,
                  timelineSegments,
                })
              }
            >
              <Text style={styles.previewBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive
            video
            audio
            onInitialized={() => setIsCameraReady(true)}
          />
          <View style={styles.previewOverlay} />

          {!showCaptureOverlay && !autoStart ? (
            <>
              <View style={styles.recordHeader}>
                <View style={styles.headerRow}>
                  <View style={styles.brandRow}>
                    <View style={styles.brandIcon}>
                      <Text style={styles.brandIconText}>IN</Text>
                    </View>
                    <Text style={styles.brandText}>INMERSA</Text>
                  </View>
                  <View style={styles.bell}>
                    <Text style={styles.bellText}>!</Text>
                  </View>
                </View>
                <Text style={styles.recordTitle}>Listo para grabar</Text>
                <Text style={styles.recordSubtitle}>Elige el efecto y graba tu momento</Text>
              </View>

              <View style={styles.effectPanel}>
                <Text style={styles.effectTitle}>Efecto</Text>
                <View style={styles.effectRow}>
                  {[
                    { id: 'auto', label: 'Automatico' },
                    { id: 'normal', label: 'Normal' },
                    { id: 'fast2', label: 'Rapida 2x' },
                    { id: 'fast4', label: 'Rapida 4x' },
                    { id: 'slow05', label: 'Lenta 0.5x' },
                    { id: 'slow025', label: 'Lenta 0.25x' },
                    { id: 'boomerang', label: 'Boomerang' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.effectChip,
                        selectedEffect === item.id && styles.effectChipActive,
                      ]}
                      onPress={() => setSelectedEffect(item.id)}
                    >
                      <Text
                        style={[
                          styles.effectChipText,
                          selectedEffect === item.id && styles.effectChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.recordBtn}
                activeOpacity={0.85}
                disabled={!isCameraReady}
                onPress={startCountdown}
              >
                <Text style={styles.recordText}>
                  {!isCameraReady ? 'Preparando camara...' : 'Grabar'}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}

          {showCaptureOverlay ? (
            <View style={styles.countdownOverlay}>
              <View style={styles.countdownBrand}>
                <Text style={styles.countdownBrandText}>INMERSA 360</Text>
              </View>
              <View style={styles.countdownStatusRow}>
                {countdown == null ? (
                  <Animated.View style={[styles.countdownDotPulse, { transform: [{ scale: pulse }] }]} />
                ) : null}
                <View style={[styles.countdownDot, countdown == null && styles.countdownDotLive]} />
                <Text style={styles.countdownStatus}>{countdown != null ? 'PREPARANDO...' : 'GRABANDO...'}</Text>
              </View>
              <View style={styles.countdownCircleOuter}>
                <View style={styles.countdownRingBase} />
                <Animated.View
                  style={[
                    styles.countdownRingArc,
                    countdown == null ? styles.countdownRingArcLive : null,
                    {
                      transform: [
                        {
                          rotate: arcProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['-120deg', '240deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <View style={styles.countdownCircleInner}>
                  <Text style={styles.countdownNumber}>{countdown != null ? countdown : remaining}</Text>
                </View>
              </View>
              <Text style={styles.countdownHint}>MANTENTE EN EL CENTRO</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  )
}

export default Grabar

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#14081E' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#14081E', padding: 24 },
  text: { color: '#fff', textAlign: 'center' },
  backBtn: { marginTop: 16, backgroundColor: '#9B5CFF', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 16 },
  backText: { color: '#fff', fontWeight: '700' },
  previewOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,8,20,0.35)' },
  previewWrap: { flex: 1, backgroundColor: '#14081E' },
  previewActions: { position: 'absolute', bottom: 50, width: '100%', flexDirection: 'row', justifyContent: 'space-evenly' },
  previewBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#9B5CFF', alignItems: 'center', justifyContent: 'center' },
  previewBtnGhost: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  previewBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },

  recordHeader: {
    position: 'absolute',
    top: 28,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(20,8,30,0.65)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(155,92,255,0.25)',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#9B5CFF', justifyContent: 'center', alignItems: 'center' },
  brandIconText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  brandText: { color: '#C9B5FF', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  bell: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  bellText: { fontSize: 14, color: '#C9B5FF' },
  recordTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginTop: 6 },
  recordSubtitle: { color: '#C9B5FF', fontSize: 13, marginTop: 6 },
  timerBadge: { position: 'absolute', top: 140, right: 24, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  timerText: { color: '#fff', fontWeight: '700' },
  effectPanel: { position: 'absolute', bottom: 102, left: 16, right: 16, backgroundColor: 'rgba(20,8,30,0.9)', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: '#2A163D', maxHeight: 180 },
  effectTitle: { color: '#C9B5FF', fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.6 },
  effectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  effectChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(201,181,255,0.2)' },
  effectChipActive: { backgroundColor: '#9B5CFF', borderColor: '#9B5CFF' },
  effectChipText: { color: '#E2D7FF', fontSize: 12, fontWeight: '600' },
  effectChipTextActive: { color: '#fff' },

  recordBtn: { position: 'absolute', bottom: 26, alignSelf: 'center', backgroundColor: '#9B5CFF', paddingHorizontal: 56, paddingVertical: 18, borderRadius: 60, elevation: 8 },
  recordText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.6 },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,8,20,0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  countdownBrand: {
    position: 'absolute',
    top: 76,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  countdownBrandText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  countdownStatusRow: {
    position: 'absolute',
    top: 140,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9B5CFF',
  },
  countdownDotPulse: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,77,79,0.32)',
  },
  countdownDotLive: {
    backgroundColor: '#FF4D4F',
  },
  countdownStatus: {
    color: '#D8D3E8',
    fontSize: 26,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  countdownCircleOuter: {
    width: 285,
    height: 285,
    borderRadius: 142,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    shadowColor: '#9B5CFF',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    overflow: 'hidden',
  },
  countdownRingBase: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 142,
    borderWidth: 11,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  countdownRingArc: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 142,
    borderWidth: 11,
    borderColor: 'transparent',
    borderTopColor: '#9B5CFF',
    borderRightColor: '#9B5CFF',
  },
  countdownRingArcLive: {
    borderTopColor: '#FF4D4F',
    borderRightColor: '#FF4D4F',
  },
  countdownCircleInner: {
    width: 235,
    height: 235,
    borderRadius: 117,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    color: '#FFFFFF',
    fontSize: 112,
    fontWeight: '800',
    lineHeight: 118,
  },
  countdownHint: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    color: '#D8D3E8',
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
})
