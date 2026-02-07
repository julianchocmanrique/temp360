import React from 'react'
import {
  View,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
} from 'react-native'
import RNFS from 'react-native-fs'
import { FFmpegKit } from 'ffmpeg-kit-react-native'

const Preview360 = ({ route, navigation }) => {
  const videoUri = route?.params?.videoUri
  const plantilla = route?.params?.plantilla
  const sourceUri = route?.params?.sourceUri
  const fileCopyUri = route?.params?.fileCopyUri

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
    try {
      const dir =
        Platform.OS === 'android'
          ? `${RNFS.PicturesDirectoryPath}/INMERSA360`
          : RNFS.DocumentDirectoryPath

      if (!(await RNFS.exists(dir))) {
        await RNFS.mkdir(dir)
      }

      const outputPath = `${dir}/INMERSA360_${Date.now()}.mp4`

      const inputVideoPath = await resolveVideoPath()
      const plantillaPath = await resolveTemplatePath()

      const command = `-i "${inputVideoPath}" -loop 1 -i "${plantillaPath}" -filter_complex "[0:v]transpose=1,scale=1080:1920,setsar=1[base];[1:v]scale=1080:1920,format=rgba[ovr];[base][ovr]overlay=0:0:format=auto,format=yuv420p[v]" -map "[v]" -map 0:a? -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest "${outputPath}"`

      const session = await FFmpegKit.execute(command)
      const returnCode = await session.getReturnCode()

      if (!returnCode || !returnCode.isValueSuccess()) {
        throw new Error('FFmpeg falló')
      }

      if (Platform.OS === 'android') {
        // RNFS en algunas versiones espera string, no array
        await RNFS.scanFile(outputPath)
      }

      if (compartir) {
        const shareUrl =
          Platform.OS === 'android' ? `file://${outputPath}` : outputPath
        await Share.share({ url: shareUrl })
      }

      Alert.alert('Listo', 'Video guardado en la galería')
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el video')
    }
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/fiestafondo.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <View style={styles.overlay} />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>◀</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Vista previa</Text>

      <View style={styles.bottomCard}>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => guardarVideoConPlantilla({ compartir: false })}
        >
          <Text style={styles.shareText}>Guardar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shareBtn, styles.secondaryBtn]}
          onPress={() => guardarVideoConPlantilla({ compartir: true })}
        >
          <Text style={styles.shareText}>Compartir</Text>
        </TouchableOpacity>
      </View>
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
})
