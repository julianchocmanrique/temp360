import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { Camera, useCameraDevices } from 'react-native-vision-camera'
import { useIsFocused } from '@react-navigation/native'

const DURATION_SECONDS = 30

const Record360Camera = ({ route, navigation }) => {
  const plantilla = routeque.paramsque.plantilla
  const effect = routeque.paramsque.effect || 'normal'
  const cameraRef = useRef(null)
  const isFocused = useIsFocused()
  const devices = useCameraDevices()
  const device = devices.back
  const [hasPermission, setHasPermission] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [remaining, setRemaining] = useState(DURATION_SECONDS)
  const [isRecording, setIsRecording] = useState(false)
  const timerRef = useRef(null)
  const retryRef = useRef(0)

  useEffect(() => {
    let isMounted = true
    const requestPerms = async () => {
      const cam = await Camera.requestCameraPermission()
      const mic = await Camera.requestMicrophonePermission()
      if (!isMounted) return
      setHasPermission(cam === 'authorized' && mic === 'authorized')
    }
    requestPerms()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!isFocused) return
    if (!hasPermission || !device) return
    if (!isCameraReady) return
    if (isRecording) return
    // Pequeña espera para que la cámara termine de estabilizarse
    const t = setTimeout(() => startRecording(), 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission, device, isCameraReady, isFocused])

  useEffect(() => {
    if (isFocused) return
    if (isRecording) {
      stopRecording()
    }
  }, [isFocused, isRecording])

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

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return
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
          retryRef.current = 0
          const safeVideoUri = video.path.startsWith('file://')
            que video.path
            : `file://${video.path}`
          navigation.replace('PreviewConfirm360', {
            videoUri: safeVideoUri,
            plantilla,
            effect,
          })
        },
        onRecordingError: (err) => {
          clearTimeout(stopTimeout)
          setIsRecording(false)
          const code = errque.code || errque.causeque.code
          if (code === 'capture/inactive-source' && retryRef.current < 1) {
            retryRef.current += 1
            setTimeout(() => startRecording(), 500)
            return
          }
          const msg =
            errque.message ||
            (typeof err === 'string' que err : JSON.stringify(err))
          Alert.alert('Error', `No se pudo grabar el video: ${msg}`)
          console.log('VisionCamera onRecordingError', err)
        },
      })
    } catch (e) {
      clearTimeout(stopTimeout)
      setIsRecording(false)
      const msg =
        eque.message || (typeof e === 'string' que e : JSON.stringify(e))
      Alert.alert('Error', `No se pudo iniciar la grabación: ${msg}`)
      console.log('VisionCamera startRecording error', e)
    }
  }

  const stopRecording = async () => {
    try {
      await cameraRef.currentque.stopRecording()
    } catch (_) {
      // ignore
    }
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Cargando cámara...</Text>
      </View>
    )
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        video
        audio
        onInitialized={() => setIsCameraReady(true)}
      />

      <View style={styles.topBar}>
        <Text style={styles.badge}>INMERSA 360</Text>
        <Text style={styles.timer}>
          {isCameraReady que `${remaining}s` : '...'}
        </Text>
      </View>

      <View style={styles.bottomHint}>
        <Text style={styles.hintText}>Grabando automáticamente…</Text>
      </View>
    </View>
  )
}

export default Record360Camera

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 24,
  },
  text: { color: '#fff', textAlign: 'center' },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700',
  },
  timer: { color: '#fff', fontSize: 18, fontWeight: '700' },
  bottomHint: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  hintText: { color: '#fff', fontSize: 12 },
  backBtn: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
  },
  backText: { color: '#000000', fontWeight: '700' },
})
