import React from 'react'
import {
  View,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native'
import RNFS from 'react-native-fs'
import { FFmpegKit } from 'ffmpeg-kit-react-native'

const Preview360 = ({ route, navigation }) => {
  const videoUri = route?.params?.videoUri

  const guardarVideoConPlantilla = async () => {
    try {
      const dir =
        Platform.OS === 'android'
          ? `${RNFS.PicturesDirectoryPath}/INMERSA360`
          : RNFS.DocumentDirectoryPath

      if (!(await RNFS.exists(dir))) {
        await RNFS.mkdir(dir)
      }

      const outputPath = `${dir}/INMERSA360_${Date.now()}.mp4`

      const plantillaPath =
        Platform.OS === 'android'
          ? `${RNFS.DocumentDirectoryPath}/fiestafondo.png`
          : `${RNFS.MainBundlePath}/fiestafondo.png`

      const command = `
        -i "${videoUri}"
        -i "${plantillaPath}"
        -filter_complex "overlay=0:0"
        -c:a copy
        -movflags +faststart
        "${outputPath}"
      `

      await FFmpegKit.execute(command)

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
        <TouchableOpacity style={styles.shareBtn} onPress={guardarVideoConPlantilla}>
          <Text style={styles.shareText}>Guardar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shareBtn, styles.secondaryBtn]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.shareText}>Repetir</Text>
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
