import React, { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  FlatList,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native'
import { launchCamera } from 'react-native-image-picker'
import RNBlobUtil from 'react-native-blob-util'

const templates = [
  { id: 1, name: 'Plantilla Boda', image: require('../../assets/frames/frame1.png') },
  { id: 2, name: 'Plantilla Playa', image: require('../../assets/frames/frame2.png') },
  { id: 3, name: 'Plantilla Navidad', image: require('../../assets/frames/frame3.png') },
]

const Record360 = ({ navigation }) => {
  const [plantilla, setPlantilla] = useState(null)
  const [showSelector, setShowSelector] = useState(true)
  const [countdown, setCountdown] = useState(null)

  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      setCountdown(null)
      grabarVideo()
      return
    }
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const grabarVideo = async () => {
    if (Platform.OS === 'android') {
      const permission =
        Platform.Version >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE

      const granted = await PermissionsAndroid.request(permission)
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a videos')
        return
      }
    }

    const result = await launchCamera({
      mediaType: 'video',
      videoQuality: 'high',
      durationLimit: 30,
      includeExtra: true,
      saveToPhotos: true,
    })

    if (result.didCancel || !result.assets) return

    const asset = result.assets[0]
    if (!asset) return

    const candidates = [asset.fileCopyUri, asset.originalPath, asset.uri].filter(
      Boolean
    )

    const destDir = `${RNBlobUtil.fs.dirs.DocumentDir}/INMERSA360`
    try {
      const dirExists = await RNBlobUtil.fs.exists(destDir)
      if (!dirExists) {
        await RNBlobUtil.fs.mkdir(destDir)
      }
    } catch (e) {
      // si no se puede crear, seguimos con la uri original
    }

    let finalPath = null
    for (const candidate of candidates) {
      const raw = candidate.startsWith('file://')
        ? candidate.replace('file://', '')
        : candidate
      const dest = `${destDir}/video_${Date.now()}.mp4`
      try {
        await RNBlobUtil.fs.cp(raw, dest)
        const exists = await RNBlobUtil.fs.exists(dest)
        if (exists) {
          finalPath = dest
          break
        }
      } catch (e) {
        // intenta con el siguiente candidato
      }
    }

    if (!finalPath) {
      Alert.alert('Error', 'No se pudo preparar el video')
      return
    }

    const safeVideoUri = `file://${finalPath}`
    navigation.navigate('PreviewConfirm360', {
      videoUri: safeVideoUri,
      sourceUri: asset.originalPath,
      fileCopyUri: asset.fileCopyUri,
      plantilla,
    })
  }

  /* =========================
     CONTEO
  ========================= */
  if (countdown !== null) {
    return (
      <View style={styles.countContainer}>
        <Image
          source={require('../../assets/fiestafondo.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        <View style={styles.darkOverlay} />

        <View style={styles.topBadge}>
          <Text style={styles.badgeText}>INMERSA 360°</Text>
        </View>

        <Text style={styles.preparing}>PREPARANDO</Text>

        <View style={styles.circleWrap}>
          <View style={styles.circle}>
            <Text style={styles.countText}>{countdown}</Text>
          </View>
        </View>

        <Text style={styles.centerText}>MANTENTE EN EL CENTRO</Text>
      </View>
    )
  }

  /* =========================
     SELECTOR
  ========================= */
  if (showSelector) {
    return (
      <View style={styles.selectorContainer}>
        <Image
          source={require('../../assets/fiestafondo.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        <View style={styles.selectorOverlay} />

        <Text style={styles.selectorTitle}>¿Qué celebramos hoy?</Text>

        <FlatList
          data={templates}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.templateCard}
              activeOpacity={0.85}
              onPress={() => {
                setPlantilla(item)
                setShowSelector(false)
              }}
            >
              <Image source={item.image} style={styles.templateImage} />
              <Text style={styles.templateName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    )
  }

  /* =========================
     LISTO PARA GRABAR
  ========================= */
  return (
    <View style={styles.recordContainer}>
      {plantilla && (
        <Image
          source={plantilla.image}
          style={StyleSheet.absoluteFill}
          resizeMode="stretch"
        />
      )}

      {/* FLECHA LIMPIA (SIN FONDO) */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setPlantilla(null)
          setShowSelector(true)
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.backText}>◀</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.recordBtn}
        activeOpacity={0.85}
        onPress={() => setCountdown(3)}
      >
        <Text style={styles.recordText}>Grabar</Text>
      </TouchableOpacity>
    </View>
  )
}

export default Record360

/* =========================
   ESTILOS
========================= */
const styles = StyleSheet.create({
  countContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,8,20,0.65)',
  },

  topBadge: {
    position: 'absolute',
    top: 56,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  badgeText: {
    color: '#fff',
    fontSize: 13,
    letterSpacing: 1.2,
    fontWeight: '600',
  },

  preparing: {
    position: 'absolute',
    top: 110,
    color: '#CFC8FF',
    fontSize: 13,
    letterSpacing: 1,
  },

  circleWrap: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },

  circle: {
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 10,
    borderColor: '#9B5CFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  countText: {
    color: '#fff',
    fontSize: 88,
    fontWeight: '700',
  },

  centerText: {
    position: 'absolute',
    bottom: 90,
    color: '#E6E4FF',
    fontSize: 13,
    letterSpacing: 1.2,
  },

  selectorContainer: {
    flex: 1,
    paddingTop: 90,
  },

  selectorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,10,35,0.75)',
  },

  selectorTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 24,
    paddingHorizontal: 20,
  },

  templateCard: {
    marginHorizontal: 20,
    marginBottom: 26,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#1B1233',
    elevation: 6,
  },

  templateImage: {
    width: '100%',
    height: 190,
  },

  templateName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    padding: 18,
  },

  recordContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  recordBtn: {
    marginBottom: 52,
    backgroundColor: '#9B5CFF',
    paddingHorizontal: 56,
    paddingVertical: 18,
    borderRadius: 60,
    elevation: 8,
  },

  recordText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  /* =========================
     FLECHA LIMPIA
  ========================= */
  backButton: {
    position: 'absolute',
    top: 52,
    left: 18,
    zIndex: 10,
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
})
