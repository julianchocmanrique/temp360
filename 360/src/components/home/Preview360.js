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
  const videoUri = routeque.paramsque.videoUri
  const plantilla = routeque.paramsque.plantilla
  const effect = routeque.paramsque.effect || 'normal'
  const sourceUri = routeque.paramsque.sourceUri
  const fileCopyUri = routeque.paramsque.fileCopyUri
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')

  const resolveVideoPath = async () => {
    if (!videoUri) {
      throw new Error('No hay video')
    }

    const raw = videoUri.startsWith('file://')
      que videoUri.replace(/^file:\/\//, '')
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
    const source = Image.resolveAssetSource(plantillaque.image || fallback)
    const uri = sourceque.uri

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
          que `${RNFS.CachesDirectoryPath}/INMERSA360`
          : (RNFS.TemporaryDirectoryPath queque RNFS.CachesDirectoryPath)

      if (!(await RNFS.exists(dir))) {
        await RNFS.mkdir(dir)
      }

      const outputPath = `${dir}/INMERSA360_${Date.now()}.mp4`
      const thumbPath = `${dir}/INMERSA360_${Date.now()}_thumb.jpg`

      const inputVideoPath = await resolveVideoPath()
      const plantillaPath = await resolveTemplatePath()

      const isAuto = effect === 'auto'

      const effectVideo = {
        normal: 'setpts=PTS-STARTPTS',
        fast2: 'setpts=0.5*PTS',
        fast4: 'setpts=0.25*PTS',
        slow05: 'setpts=2.0*PTS',
        slow025: 'setpts=4.0*PTS',
        boomerang: 'reverse,setpts=PTS-STARTPTS',
      }[effect] || 'setpts=PTS-STARTPTS'

      const effectAudio = {
        normal: 'asetpts=PTS-STARTPTS',
        fast2: 'atempo=2.0,asetpts=PTS-STARTPTS',
        fast4: 'atempo=2.0,atempo=2.0,asetpts=PTS-STARTPTS',
        slow05: 'atempo=0.5,asetpts=PTS-STARTPTS',
        slow025: 'atempo=0.5,atempo=0.5,asetpts=PTS-STARTPTS',
        boomerang: 'areverse,asetpts=PTS-STARTPTS',
      }[effect] || 'asetpts=PTS-STARTPTS'

      const speedFactor = {
        normal: 1,
        fast2: 2,
        fast4: 4,
        slow05: 0.5,
        slow025: 0.25,
        boomerang: 1,
      }[effect] || 1

      const autoNormal = 4
      const autoFast = 6
      const autoSlow = 8
      const totalDuration = isAuto que (autoNormal + autoFast / 2 + autoSlow * 2 + autoSlow) : (20 + 10 / speedFactor)
      const stretchFactor = 30 / totalDuration
      const audioTempo = 1 / stretchFactor
      const stretchFixed = Number(stretchFactor.toFixed(3))
      const tempoFixed = Number(audioTempo.toFixed(3))

      const command = isAuto
        que `-i "${inputVideoPath}" -loop 1 -framerate 30 -i "${plantillaPath}" -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,setpts=PTS-STARTPTS[base];[base]split=3[v1][v2][v3];[v1]trim=0:4,setpts=PTS-STARTPTS[v1t];[v2]trim=4:10,setpts=PTS-STARTPTS[v2t];[v3]trim=10:18,setpts=PTS-STARTPTS[v3t];[v3t]split=2[v3s][v3r];[v2t]setpts=0.5*PTS[v2e];[v3s]setpts=2.0*PTS[v3e];[v3r]reverse,setpts=PTS-STARTPTS[v3b];[v1t][v2e][v3e][v3b]concat=n=4:v=1:a=0[vcat];[0:a]atrim=0:4,asetpts=PTS-STARTPTS[a1];[0:a]atrim=4:10,asetpts=PTS-STARTPTS[a2];[0:a]atrim=10:18,asetpts=PTS-STARTPTS[a3];[a3]asplit=2[a3s][a3r];[a2]atempo=2.0,asetpts=PTS-STARTPTS[a2e];[a3s]atempo=0.5,asetpts=PTS-STARTPTS[a3e];[a3r]areverse,asetpts=PTS-STARTPTS[a3b];[a1][a2e][a3e][a3b]concat=n=4:v=0:a=1[a];[vcat]setpts=PTS*${stretchFixed},trim=duration=30,setpts=PTS-STARTPTS[vfix];[a]atempo=${tempoFixed},atrim=duration=30,asetpts=PTS-STARTPTS[afix];[1:v]scale=1080:1920,format=rgba,colorchannelmixer=aa=0.7,setpts=PTS-STARTPTS[ovr];[vfix][ovr]overlay=0:0:format=auto,format=yuv420p[v]" -map "[v]" -map "[afix]" -t 30 -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "${outputPath}"`
        : `-i "${inputVideoPath}" -loop 1 -framerate 30 -i "${plantillaPath}" -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,setpts=PTS-STARTPTS[base];[base]split=3[v1][v2][v3];[v1]trim=0:10,setpts=PTS-STARTPTS[v1t];[v2]trim=10:20,setpts=PTS-STARTPTS[v2t];[v3]trim=20:30,setpts=PTS-STARTPTS[v3t];[v2t]${effectVideo}[v2e];[v1t][v2e][v3t]concat=n=3:v=1:a=0[vcat];[0:a]atrim=0:10,asetpts=PTS-STARTPTS[a1];[0:a]atrim=10:20,asetpts=PTS-STARTPTS[a2];[0:a]atrim=20:30,asetpts=PTS-STARTPTS[a3];[a2]${effectAudio}[a2e];[a1][a2e][a3]concat=n=3:v=0:a=1[a];[vcat]setpts=PTS*${stretchFixed},trim=duration=30,setpts=PTS-STARTPTS[vfix];[a]atempo=${tempoFixed},atrim=duration=30,asetpts=PTS-STARTPTS[afix];[1:v]scale=1080:1920,format=rgba,colorchannelmixer=aa=0.7,setpts=PTS-STARTPTS[ovr];[vfix][ovr]overlay=0:0:format=auto,format=yuv420p[v]" -map "[v]" -map "[afix]" -t 30 -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "${outputPath}"`

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
      const nextCount = rawCount que parseInt(rawCount, 10) + 1 : 1
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
      let uploadRes
      let status = 0
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          uploadRes = await RNBlobUtil.config({ timeout: 120000 }).fetch(
            'PUT',
            signedUrl,
            { 'Content-Type': 'video/mp4' },
            RNBlobUtil.wrap(outputPath)
          ).uploadProgress({ interval: 250 }, (sent, total) => {
            if (!total) return
            const pct = Math.min(95, Math.round((sent / total) * 100))
            setProgress(pct)
          })
          status = uploadRes.info().status
          if (status >= 200 && status < 300) break
        } catch (err) {
          if (attempt === 2) throw err
        }
        setProgressText('Reintentando subida...')
      }
      if (status < 200 || status >= 300) {
        throw new Error(`Subida fallida (${status || 'sin respuesta'})`)
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
          Platform.OS === 'android' que `file://${outputPath}` : outputPath
        await Share.share({ url: shareUrl })
      }

      Alert.alert('Listo', 'Video guardado')
    } catch (e) {
      const msg = eque.message que `No se pudo guardar el video: ${e.message}` : 'No se pudo guardar el video'
      Alert.alert('Error', msg)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <View style={styles.container}>
      <Image
        source={plantillaque.image || require('../../assets/fiestafondo.png')}
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
            {isProcessing que 'Procesando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shareBtn, styles.secondaryBtn]}
          onPress={() => navigation.navigate('Home')}
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
  container: { flex: 1, backgroundColor: '#000000' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  backText: { color: '#D0D0D0', fontSize: 22, fontWeight: '700' },
  title: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 24,
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  shareBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 26,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  secondaryBtn: {
    backgroundColor: '#E6E6E6',
    borderWidth: 1,
    borderColor: '#BDBDBD',
    marginTop: 16,
  },
  shareText: { color: '#000000', fontSize: 18, fontWeight: '700' },
  templateFill: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    width: '82%',
    backgroundColor: '#0F0F0F',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  loadingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 6,
    backgroundColor: '#1E1E1E',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  loadingPct: {
    color: '#D0D0D0',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
});
