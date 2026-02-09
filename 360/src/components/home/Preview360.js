import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
  Modal,
} from 'react-native'
import RNFS from 'react-native-fs'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { FFmpegKit } from 'ffmpeg-kit-react-native'
import RNBlobUtil from 'react-native-blob-util'
import { API_URL } from '../../config/api'

const Preview360 = ({ route, navigation }) => {
  const videoUri = route?.params?.videoUri
  const plantilla = route?.params?.plantilla
  const sourceUri = route?.params?.sourceUri
  const fileCopyUri = route?.params?.fileCopyUri
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')

  const resolveVideoPath = async () => {
    if (!videoUri) {
      throw new Error('No hay video')
    }

    const raw = videoUri.startsWith('file://')
      ? videoUri.replace('file://', '')
      : videoUri

    const exists = await RNFS.exists(raw)
    if (!exists) {
      throw new Error('Video no existe')
    }
    // En Android, FFmpegKit funciona mejor con esquema file://
    return `file://${raw}`
  }

  const resolveTemplatePath = async () => {
    const fallback = require('../../assets/fiestafondo.png')
    const source = Image.resolveAssetSource(plantilla?.image || fallback)
    const uri = source?.uri

    if (!uri) {
      throw new Error('No se pudo resolver la plantilla')
    }

    if (uri.startsWith('http')) {
      const dest = `${RNFS.CachesDirectoryPath}/plantilla_${Date.now()}.png`
      const download = RNFS.downloadFile({ fromUrl: uri, toFile: dest })
      const result = await download.promise
      if (result.statusCode !== 200) {
        throw new Error('No se pudo descargar la plantilla')
      }
      return dest
    }

    if (uri.startsWith('file://')) {
      return uri.replace('file://', '')
    }

    if (uri.startsWith('asset:/')) {
      const assetPath = uri.replace('asset:/', '')
      const dest = `${RNFS.CachesDirectoryPath}/plantilla_${Date.now()}.png`
      await RNFS.copyFileAssets(assetPath, dest)
      return dest
    }

    return uri
  }

  const guardarVideoConPlantilla = async ({ compartir } = {}) => {
    if (isProcessing) return
    try {
      setIsProcessing(true)
      setProgress(0)
      setProgressText('Preparando...')
      const dir =
        Platform.OS === 'android'
          ? `${RNFS.CachesDirectoryPath}/INMERSA360`
          : RNFS.TemporaryDirectoryPath ?? RNFS.CachesDirectoryPath

      if (!(await RNFS.exists(dir))) {
        await RNFS.mkdir(dir)
      }

      const outputPath = `${dir}/INMERSA360_${Date.now()}.mp4`
      const thumbPath = `${dir}/INMERSA360_${Date.now()}_thumb.jpg`

      const inputVideoPath = await resolveVideoPath()
      const plantillaPath = await resolveTemplatePath()

      const command = `-i "${inputVideoPath}" -loop 1 -framerate 30 -i "${plantillaPath}" -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,setpts=PTS-STARTPTS[base];[1:v]scale=1080:1920,format=rgba,colorchannelmixer=aa=0.7,setpts=PTS-STARTPTS[ovr];[base][ovr]overlay=0:0:format=auto,format=yuv420p[v]" -map "[v]" -map 0:a? -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest "${outputPath}"`

      const session = await FFmpegKit.execute(command)
      const returnCode = await session.getReturnCode()

      if (!returnCode || !returnCode.isValueSuccess()) {
        throw new Error('FFmpeg fallo')
      }
      setProgress(20)
      setProgressText('Generando miniatura...')

      // Genera miniatura
      const thumbCommand = `-y -i "${outputPath}" -ss 00:00:01 -frames:v 1 -update 1 -vf "scale=540:-1" -q:v 2 "${thumbPath}"`
      await FFmpegKit.execute(thumbCommand)

      const now = new Date()
      const dateText = now.toLocaleString()
      const counterKey = '@inmersa360_counter'

      const rawCount = await AsyncStorage.getItem(counterKey)
      const nextCount = rawCount ? parseInt(rawCount, 10) + 1 : 1
      await AsyncStorage.setItem(counterKey, String(nextCount))

      const title = `Boda${nextCount} - ${dateText}`

      // Subir al backend (R2) usando signed URL
      setProgress(35)
      setProgressText('Solicitando URL...')
      const signedRes = await fetch(`${API_URL}/signed-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType: 'video/mp4' }),
      })
      if (!signedRes.ok) {
        throw new Error('No se pudo obtener signed URL')
      }
      const { signedUrl, url } = await signedRes.json()

      setProgress(45)
      setProgressText('Subiendo video...')
      const uploadRes = await RNBlobUtil.fetch(
        'PUT',
        signedUrl,
        { 'Content-Type': 'video/mp4' },
        RNBlobUtil.wrap(outputPath)
      ).uploadProgress({ interval: 250 }, (sent, total) => {
        if (!total) return
        const pct = Math.min(95, Math.round((sent / total) * 100))
        setProgress(pct)
      })
      const status = uploadRes.info().status
      if (status < 200 || status >= 300) {
        throw new Error('Subida fallida')
      }

      setProgress(96)
      setProgressText('Registrando en backend...')
      const postRes = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          imageUrl: url,
          mediaType: 'video/mp4',
        }),
      })
      if (!postRes.ok) {
        throw new Error('No se pudo guardar en el backend')
      }

      setProgress(100)
      setProgressText('Finalizando...')
      // Borra archivos locales después de subir
      try {
        await RNFS.unlink(outputPath)
        await RNFS.unlink(thumbPath)
      } catch (_) {
        // si ya no existen, no hacemos nada
      }

      if (compartir) {
        const shareUrl =
          Platform.OS === 'android' ? `file://${outputPath}` : outputPath
        await Share.share({ url: shareUrl })
      }

      Alert.alert('Listo', 'Video guardado')
    } catch (e) {
      const msg = e?.message ? `No se pudo guardar el video: ${e.message}` : 'No se pudo guardar el video'
      Alert.alert('Error', msg)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <View style={styles.container}>
      <Image
        source={plantilla?.image || require('../../assets/fiestafondo.png')}
        style={styles.templateFill}
        resizeMode="stretch"
      />

      <View style={styles.overlay} />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>&lt;</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Vista previa</Text>

      <View style={styles.bottomCard}>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => guardarVideoConPlantilla({ compartir: false })}
          disabled={isProcessing}
        >
          <Text style={styles.shareText}>
            {isProcessing ? 'Procesando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shareBtn, styles.secondaryBtn]}
          onPress={() => navigation.navigate('VideosList')}
          disabled={isProcessing}
        >
          <Text style={styles.shareText}>Ver videos</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isProcessing} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Text style={styles.loadingTitle}>
              {progressText || 'Guardando video...'}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${progress}%` }]}
              />
            </View>
            <Text style={styles.loadingPct}>{progress}%</Text>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default Preview360

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,0,25,0.55)',
  },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  backText: { color: '#fff', fontSize: 22, fontWeight: '600' },
  title: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 24,
    backgroundColor: 'rgba(25,15,40,0.75)',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  shareBtn: {
    backgroundColor: '#9B5CFF',
    paddingVertical: 18,
    borderRadius: 26,
    alignItems: 'center',
  },
  secondaryBtn: { backgroundColor: '#444', marginTop: 16 },
  shareText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  templateFill: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    width: '80%',
    backgroundColor: '#151020',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2140',
  },
  loadingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 6,
    backgroundColor: '#2A2140',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9B5CFF',
  },
  loadingPct: {
    color: '#cbbcff',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
})
