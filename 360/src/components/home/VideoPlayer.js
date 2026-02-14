import React, { useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import Video from 'react-native-video'
import { Image } from 'react-native'
import RNFS from 'react-native-fs'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { FFmpegKit } from 'ffmpeg-kit-react-native'
import RNBlobUtil from 'react-native-blob-util'
import { API_URL } from '../../config/api'
import { setUploadJobState } from './uploadJobState'

const FILTER_SOURCE_MAP = {
  stars: require('../../assets/plantillas/navidad.png'),
  sparkle: require('../../assets/plantillas/cumple.png'),
  confeti: require('../../assets/plantillas/fiesta.png'),
}
const TARGET_W = 540
const TARGET_H = 960

const getVisualFilterChain = (filterId) => {
  switch (filterId) {
    case 'stars':
      return 'eq=saturation=1.14:brightness=0.03:contrast=1.05'
    case 'sparkle':
      return 'eq=saturation=1.22:brightness=0.04:contrast=1.07'
    case 'confeti':
      return 'hue=s=1.28,eq=brightness=0.03:contrast=1.08'
    default:
      return 'null'
  }
}

const buildAtempoChain = (tempoRaw) => {
  let tempo = Math.max(0.01, Number(tempoRaw) || 1)
  const chain = []

  while (tempo > 2.0) {
    chain.push('atempo=2.0')
    tempo /= 2.0
  }
  while (tempo < 0.5) {
    chain.push('atempo=0.5')
    tempo /= 0.5
  }

  chain.push(`atempo=${Number(tempo.toFixed(3))}`)
  return chain.join(',')
}

const VideoPlayer = ({ route, navigation }) => {
  const item = route?.params?.item
  const videoUri = route?.params?.videoUri
  const plantilla = route?.params?.plantilla
  const filter = route?.params?.filter
  const timelineSegments = route?.params?.timelineSegments
  const effect = route?.params?.effect || 'auto'
  const isGallery = Boolean(item && item.url)
  const playbackUri = item?.url || videoUri
  const saveLockRef = useRef(false)

  if (!global.__inmersaErrorHookInstalled) {
    const oldHandler = global.ErrorUtils?.getGlobalHandler?.()
    global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
      console.log('GLOBAL_JS_ERROR', { isFatal, message: error?.message, stack: error?.stack })
      if (oldHandler) oldHandler(error, isFatal)
    })
    global.__inmersaErrorHookInstalled = true
  }

  const resolveVideoPath = async () => {
    if (!videoUri) {
      throw new Error('No hay video')
    }
    const raw = videoUri.startsWith('file://')
      ? videoUri.replace(/^file:\/\//, '')
      : videoUri
    const exists = await RNFS.exists(raw)
    if (!exists) {
      throw new Error('Video no existe')
    }
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
      if (result.statusCode != 200) {
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

  const resolveFilterPath = async () => {
    if (!filter?.image || filter?.id === 'none') return null
    const source = Image.resolveAssetSource(filter.image)
    const uri = source?.uri
    if (!uri) return null

    if (uri.startsWith('http')) {
      const dest = `${RNFS.CachesDirectoryPath}/filtro_${Date.now()}.png`
      const download = RNFS.downloadFile({ fromUrl: uri, toFile: dest })
      const result = await download.promise
      if (result.statusCode !== 200) return null
      return dest
    }

    if (uri.startsWith('file://')) return uri.replace('file://', '')

    if (uri.startsWith('asset:/')) {
      const assetPath = uri.replace('asset:/', '')
      const dest = `${RNFS.CachesDirectoryPath}/filtro_${Date.now()}.png`
      await RNFS.copyFileAssets(assetPath, dest)
      return dest
    }

    return uri
  }

  const resolveFilterByIdPath = async (filterId) => {
    if (!filterId || filterId === 'none') return null
    const sourceRef = FILTER_SOURCE_MAP[filterId]
    if (!sourceRef) return null
    const source = Image.resolveAssetSource(sourceRef)
    const uri = source?.uri
    if (!uri) return null

    if (uri.startsWith('http')) {
      const dest = `${RNFS.CachesDirectoryPath}/filtro_${filterId}_${Date.now()}.png`
      const download = RNFS.downloadFile({ fromUrl: uri, toFile: dest })
      const result = await download.promise
      if (result.statusCode !== 200) return null
      return dest
    }
    if (uri.startsWith('file://')) return uri.replace('file://', '')
    if (uri.startsWith('asset:/')) {
      const assetPath = uri.replace('asset:/', '')
      const dest = `${RNFS.CachesDirectoryPath}/filtro_${filterId}_${Date.now()}.png`
      await RNFS.copyFileAssets(assetPath, dest)
      return dest
    }
    return uri
  }

  const guardar = async () => {
    if (saveLockRef.current) return
    saveLockRef.current = true
    setUploadJobState({
      status: 'processing',
      message: 'Preparando video...',
      error: '',
    })
    navigation.replace('VistaPrevia')

    setTimeout(async () => {
      try {

        const dir =
          Platform.OS === 'android'
            ? `${RNFS.CachesDirectoryPath}/INMERSA360`
            : (RNFS.TemporaryDirectoryPath ?? RNFS.CachesDirectoryPath)

        if (!(await RNFS.exists(dir))) {
          await RNFS.mkdir(dir)
        }

        const outputPath = `${dir}/INMERSA360_${Date.now()}.mp4`

      const inputVideoPath = await resolveVideoPath()
      const plantillaPath = await resolveTemplatePath()
      const selectedFilterId = filter?.id || 'none'
      const hasTimeline = Array.isArray(timelineSegments) && timelineSegments.length > 0

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

      const autoNormal = 4
      const autoFast = 6
      const autoSlow = 8
      const speedFactor = {
        normal: 1,
        fast2: 2,
        fast4: 4,
        slow05: 0.5,
        slow025: 0.25,
        boomerang: 1,
      }[effect] || 1

      const totalDuration = isAuto ? (autoNormal + autoFast / 2 + autoSlow * 2 + autoSlow) : (20 + 10 / speedFactor)
      const stretchFactor = 30 / totalDuration
      const audioTempo = 1 / stretchFactor
      const stretchFixed = Number(stretchFactor.toFixed(3))
      const tempoFixed = Number(audioTempo.toFixed(3))

      const globalVisualFilter = getVisualFilterChain(selectedFilterId)
      const overlayFilterGraph = `[1:v]scale=${TARGET_W}:${TARGET_H},format=rgba,colorchannelmixer=aa=0.7,setpts=PTS-STARTPTS[ovr];[vfix][ovr]overlay=0:0:format=auto[vtmp];[vtmp]${globalVisualFilter},scale=${TARGET_W}:${TARGET_H},format=yuv420p[v]`

      let command = isAuto
        ? `-i "${inputVideoPath}" -loop 1 -framerate 30 -i "${plantillaPath}" -filter_complex "[0:v]scale=${TARGET_W}:${TARGET_H}:force_original_aspect_ratio=increase,crop=${TARGET_W}:${TARGET_H},setsar=1,setpts=PTS-STARTPTS[base];[base]split=3[v1][v2][v3];[v1]trim=0:4,setpts=PTS-STARTPTS[v1t];[v2]trim=4:10,setpts=PTS-STARTPTS[v2t];[v3]trim=10:18,setpts=PTS-STARTPTS[v3t];[v3t]split=2[v3s][v3r];[v2t]setpts=0.5*PTS[v2e];[v3s]setpts=2.0*PTS[v3e];[v3r]reverse,setpts=PTS-STARTPTS[v3b];[v1t][v2e][v3e][v3b]concat=n=4:v=1:a=0[vcat];[0:a]atrim=0:4,asetpts=PTS-STARTPTS[a1];[0:a]atrim=4:10,asetpts=PTS-STARTPTS[a2];[0:a]atrim=10:18,asetpts=PTS-STARTPTS[a3];[a3]asplit=2[a3s][a3r];[a2]atempo=2.0,asetpts=PTS-STARTPTS[a2e];[a3s]atempo=0.5,asetpts=PTS-STARTPTS[a3e];[a3r]areverse,asetpts=PTS-STARTPTS[a3b];[a1][a2e][a3e][a3b]concat=n=4:v=0:a=1[a];[vcat]setpts=PTS*${stretchFixed},trim=duration=30,setpts=PTS-STARTPTS[vtmp];[vtmp]fps=30,setpts=N/(30*TB)[vfix];[a]atempo=${tempoFixed},atrim=duration=30,aresample=async=1:first_pts=0,asetpts=PTS-STARTPTS[afix];${overlayFilterGraph}" -map "[v]" -map "[afix]" -t 30 -shortest -r 30 -vsync cfr -c:v libx264 -preset veryfast -crf 24 -pix_fmt yuv420p -profile:v baseline -level 3.1 -bf 0 -refs 1 -g 60 -keyint_min 30 -sc_threshold 0 -c:a aac -b:a 128k -movflags +faststart "${outputPath}"`
        : `-i "${inputVideoPath}" -loop 1 -framerate 30 -i "${plantillaPath}" -filter_complex "[0:v]scale=${TARGET_W}:${TARGET_H}:force_original_aspect_ratio=increase,crop=${TARGET_W}:${TARGET_H},setsar=1,setpts=PTS-STARTPTS[base];[base]split=3[v1][v2][v3];[v1]trim=0:10,setpts=PTS-STARTPTS[v1t];[v2]trim=10:20,setpts=PTS-STARTPTS[v2t];[v3]trim=20:30,setpts=PTS-STARTPTS[v3t];[v2t]${effectVideo}[v2e];[v1t][v2e][v3t]concat=n=3:v=1:a=0[vcat];[0:a]atrim=0:10,asetpts=PTS-STARTPTS[a1];[0:a]atrim=10:20,asetpts=PTS-STARTPTS[a2];[0:a]atrim=20:30,asetpts=PTS-STARTPTS[a3];[a2]${effectAudio}[a2e];[a1][a2e][a3]concat=n=3:v=0:a=1[a];[vcat]setpts=PTS*${stretchFixed},trim=duration=30,setpts=PTS-STARTPTS[vtmp];[vtmp]fps=30,setpts=N/(30*TB)[vfix];[a]atempo=${tempoFixed},atrim=duration=30,aresample=async=1:first_pts=0,asetpts=PTS-STARTPTS[afix];${overlayFilterGraph}" -map "[v]" -map "[afix]" -t 30 -shortest -r 30 -vsync cfr -c:v libx264 -preset veryfast -crf 24 -pix_fmt yuv420p -profile:v baseline -level 3.1 -bf 0 -refs 1 -g 60 -keyint_min 30 -sc_threshold 0 -c:a aac -b:a 128k -movflags +faststart "${outputPath}"`

      if (hasTimeline) {
        const timeline = timelineSegments
          .map((s) => ({
            start: Number(s.start),
            end: Number(s.end),
            effect: s.effect || 'normal',
            filterId: s.filterId || 'none',
          }))
          .filter((s) => Number.isFinite(s.start) && Number.isFinite(s.end) && s.end > s.start)

        const timelineFilterFallback =
          timeline.find((s) => s.filterId && s.filterId !== 'none')?.filterId || 'none'
        const effectiveGlobalFilterId =
          selectedFilterId && selectedFilterId !== 'none' ? selectedFilterId : timelineFilterFallback
        const timelineGlobalVisualFilter = getVisualFilterChain(effectiveGlobalFilterId)

        const videoPartDefs = []
        const audioPartDefs = []
        const videoConcatInputs = []
        const audioConcatInputs = []

        const speedFactorMap = {
          normal: 1,
          auto: 1,
          fast2: 2,
          fast4: 4,
          slow05: 0.5,
          slow025: 0.25,
          boomerang: 1,
        }

        const baseSplitLabels = timeline.map((_, i) => `bs${i}`)
        timeline.forEach((seg, i) => {
          const baseV = `v${i}b`
          const outV = `v${i}o`
          const baseA = `a${i}b`
          const outA = `a${i}e`
          const segDuration = Math.max(0.1, seg.end - seg.start)

          // Stable mode: avoid the most aggressive variants that can produce VFR/PTS edge cases.
          const safeEffect = seg.effect === 'fast4'
            ? 'fast2'
            : seg.effect === 'slow025'
              ? 'slow05'
              : seg.effect

          const vFx = ({
            normal: 'setpts=PTS-STARTPTS',
            auto: 'setpts=PTS-STARTPTS',
            fast2: 'setpts=0.5*PTS',
            fast4: 'setpts=0.25*PTS',
            slow05: 'setpts=2.0*PTS',
            slow025: 'setpts=4.0*PTS',
            boomerang: 'reverse,setpts=PTS-STARTPTS',
          }[safeEffect] || 'setpts=PTS-STARTPTS')

          const aFx = ({
            normal: 'asetpts=PTS-STARTPTS',
            auto: 'asetpts=PTS-STARTPTS',
            fast2: 'atempo=2.0,asetpts=PTS-STARTPTS',
            fast4: 'atempo=2.0,atempo=2.0,asetpts=PTS-STARTPTS',
            slow05: 'atempo=0.5,asetpts=PTS-STARTPTS',
            slow025: 'atempo=0.5,atempo=0.5,asetpts=PTS-STARTPTS',
            boomerang: 'areverse,asetpts=PTS-STARTPTS',
          }[safeEffect] || 'asetpts=PTS-STARTPTS')

          if (safeEffect === 'boomerang') {
            // Continuous boomerang at the segment boundary:
            // if current segment starts at S, build S -> (S-lookback) -> S in slow motion.
            const lookback = Math.min(Math.max(1.0, segDuration * 0.5), 4.0, Math.max(0.2, seg.start))
            const bStart = Math.max(0, seg.start - lookback)
            const bEnd = seg.start
            const localEnd = lookback

            // Consume the per-segment split output to avoid unconnected split outputs in FFmpeg.
            videoPartDefs.push(`[${baseSplitLabels[i]}]trim=${bStart}:${bEnd},setpts=PTS-STARTPTS[${baseV}]`)
            videoPartDefs.push(`[${baseV}]split=2[v${i}f0][v${i}r0]`)
            videoPartDefs.push(`[v${i}r0]trim=0:${localEnd},reverse,setpts=2.0*PTS[v${i}r]`)
            videoPartDefs.push(`[v${i}f0]trim=0:${localEnd},setpts=2.0*PTS[v${i}f]`)
            videoPartDefs.push(`[v${i}r][v${i}f]concat=n=2:v=1:a=0,fps=30,settb=AVTB,setpts=PTS-STARTPTS[v${i}e]`)

            audioPartDefs.push(`[0:a]atrim=${bStart}:${bEnd},asetpts=PTS-STARTPTS[${baseA}]`)
            audioPartDefs.push(`[${baseA}]asplit=2[a${i}f0][a${i}r0]`)
            audioPartDefs.push(`[a${i}r0]atrim=0:${localEnd},areverse,atempo=0.5,asetpts=PTS-STARTPTS[a${i}r]`)
            audioPartDefs.push(`[a${i}f0]atrim=0:${localEnd},atempo=0.5,asetpts=PTS-STARTPTS[a${i}f]`)
            audioPartDefs.push(`[a${i}r][a${i}f]concat=n=2:v=0:a=1[${outA}]`)
          } else {
            videoPartDefs.push(
              `[${baseSplitLabels[i]}]trim=${seg.start}:${seg.end},setpts=PTS-STARTPTS[${baseV}]`
            )
            videoPartDefs.push(
              `[${baseV}]${vFx},fps=30,settb=AVTB,setpts=PTS-STARTPTS[v${i}e]`
            )
            audioPartDefs.push(`[0:a]atrim=${seg.start}:${seg.end},asetpts=PTS-STARTPTS[${baseA}]`)
            audioPartDefs.push(`[${baseA}]${aFx}[${outA}]`)
          }

          // Stable mode: do not switch filters per segment (can cause timestamp instability on some Android devices).
          videoPartDefs.push(`[v${i}e]fps=30,settb=AVTB,setpts=PTS-STARTPTS[${outV}]`)
          videoConcatInputs.push(`[${outV}]`)
          audioConcatInputs.push(`[${outA}]`)
        })

        const totalTimelineDuration = timeline.reduce((acc, seg) => {
          const base = seg.end - seg.start
          const safeEffect = seg.effect === 'fast4'
            ? 'fast2'
            : seg.effect === 'slow025'
              ? 'slow05'
              : seg.effect
          if (safeEffect === 'boomerang') {
            const lookback = Math.min(Math.max(1.0, base * 0.5), 4.0, Math.max(0.2, seg.start))
            return acc + (lookback * 2 * 2.0) // reverse + forward, both in slow motion (2x)
          }
          const factor = speedFactorMap[safeEffect] || 1
          return acc + base / factor
        }, 0)
        const stretch = 30 / Math.max(totalTimelineDuration, 0.001)
        const stretchFixedTimeline = Number(stretch.toFixed(3))
        const tempoTimelineFilter = buildAtempoChain(1 / stretch)

        const graphParts = [
          `[0:v]scale=${TARGET_W}:${TARGET_H}:force_original_aspect_ratio=increase,crop=${TARGET_W}:${TARGET_H},setsar=1,setpts=PTS-STARTPTS[base]`,
          `[base]split=${timeline.length}${baseSplitLabels.map((l) => `[${l}]`).join('')}`,
          ...videoPartDefs,
          ...audioPartDefs,
          `${videoConcatInputs.join('')}concat=n=${timeline.length}:v=1:a=0[vcat]`,
          `${audioConcatInputs.join('')}concat=n=${timeline.length}:v=0:a=1[a]`,
          `[vcat]fps=30,settb=AVTB,setpts=PTS*${stretchFixedTimeline},trim=duration=30,setpts=PTS-STARTPTS[vtmp]`,
          `[vtmp]fps=30,setpts=N/(30*TB)[vfix]`,
          `[a]${tempoTimelineFilter},atrim=duration=30,aresample=async=1:first_pts=0,asetpts=PTS-STARTPTS[afix]`,
          `[1:v]scale=${TARGET_W}:${TARGET_H},format=rgba,colorchannelmixer=aa=0.7,setpts=PTS-STARTPTS[ovr]`,
          `[vfix][ovr]overlay=0:0:format=auto[vovr]`,
          `[vovr]${timelineGlobalVisualFilter},scale=${TARGET_W}:${TARGET_H},fps=30,format=yuv420p[v]`,
        ]

        command = `-i "${inputVideoPath}" -loop 1 -framerate 30 -i "${plantillaPath}" -filter_complex "${graphParts.join(';')}" -map "[v]" -map "[afix]" -t 30 -shortest -r 30 -vsync cfr -c:v libx264 -preset veryfast -crf 24 -pix_fmt yuv420p -profile:v baseline -level 3.1 -bf 0 -refs 1 -g 60 -keyint_min 30 -sc_threshold 0 -c:a aac -b:a 128k -movflags +faststart "${outputPath}"`
      }

        const session = await FFmpegKit.execute(command)
        const returnCode = await session.getReturnCode()
        if (!returnCode || !returnCode.isValueSuccess()) {
          throw new Error('FFmpeg fallo')
        }

      const now = new Date()
      const dateText = now.toLocaleString()
      const counterKey = '@inmersa360_counter'

      const rawCount = await AsyncStorage.getItem(counterKey)
      const nextCount = rawCount ? parseInt(rawCount, 10) + 1 : 1
      await AsyncStorage.setItem(counterKey, String(nextCount))

      const title = `Boda${nextCount} - ${dateText}`

        setUploadJobState({ status: 'processing', message: 'Solicitando URL...' })
        const signedRes = await fetch(`${API_URL}/signed-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileType: 'video/mp4' }),
        })
        if (!signedRes.ok) {
          throw new Error('No se pudo obtener signed URL')
        }
        const { signedUrl, url } = await signedRes.json()

        setUploadJobState({ status: 'processing', message: 'Subiendo video...' })
        const stat = await RNFS.stat(outputPath)
        const fileSizeMb = Number((stat.size / (1024 * 1024)).toFixed(2))
        console.log('UPLOAD_FILE_SIZE_MB', fileSizeMb)

        const existsBeforeUpload = await RNFS.exists(outputPath)
        if (!existsBeforeUpload) {
          throw new Error('Archivo de video no encontrado antes de subir')
        }

        let uploaded = false
        let lastStatus = 0
        let lastErr = null
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          try {
            const uploadRes = await RNBlobUtil.config({ timeout: 300000 }).fetch(
              'PUT',
              signedUrl,
              { 'Content-Type': 'video/mp4' },
              RNBlobUtil.wrap(outputPath)
            )
            lastStatus = uploadRes.info().status
            if (lastStatus >= 200 && lastStatus < 300) {
              uploaded = true
              break
            }
          } catch (err) {
            lastErr = err
            console.log('UPLOAD_ATTEMPT_ERROR', attempt, err?.message || String(err))
          }
          setUploadJobState({ status: 'processing', message: `Reintentando subida (${attempt}/3)...` })
          await new Promise((resolve) => setTimeout(resolve, 1200 * attempt))
        }
        if (!uploaded) {
          const extra = lastErr?.message || `status ${lastStatus}`
          throw new Error(`Subida fallida: ${extra}`)
        }

        setUploadJobState({ status: 'processing', message: 'Registrando en backend...' })
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

        setUploadJobState({
          status: 'success',
          message: 'Tu video ya esta en la nube',
          error: '',
        })
        try {
          await RNFS.unlink(outputPath)
        } catch (_) {}
      } catch (e) {
        const msg = e?.message ? `No se pudo guardar el video: ${e.message}` : 'No se pudo guardar el video'
        setUploadJobState({
          status: 'error',
          message: 'No se pudo guardar en segundo plano',
          error: msg,
        })
      } finally {
        saveLockRef.current = false
      }
    }, 10)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>&lt;</Text>
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {isGallery ? (item?.title || 'Video') : 'Vista previa'}
      </Text>

      <Video
        source={{ uri: playbackUri }}
        style={styles.video}
        resizeMode="cover"
        repeat
        muted
      />
      {!isGallery && plantilla?.image ? (
        <Image source={plantilla.image} style={styles.frame} resizeMode="stretch" />
      ) : null}
      {!isGallery && filter?.image ? (
        <Image source={filter.image} style={styles.frameFilter} resizeMode="stretch" />
      ) : null}

      <View style={styles.bottomCard}>
        {isGallery ? (
          <TouchableOpacity style={styles.actionPrimary} onPress={() => navigation.goBack()}>
            <Text style={styles.actionText}>Volver</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.actionSecondary} onPress={() => navigation.goBack()}>
              <Text style={styles.actionText}>Repetir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionPrimary} onPress={guardar}>
              <Text style={styles.actionText}>Guardar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

    </View>
  )
}

export default VideoPlayer

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#14081E' },
  back: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  backText: { color: '#C9B5FF', fontSize: 22, fontWeight: '700' },
  title: { position: 'absolute', top: 52, alignSelf: 'center', color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  video: { width: '100%', height: '100%' },
  frame: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: 0.75 },
  frameFilter: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: 0.28 },
  bottomCard: { position: 'absolute', bottom: 0, width: '100%', padding: 24, backgroundColor: '#1A1026', borderTopLeftRadius: 36, borderTopRightRadius: 36, borderWidth: 1, borderColor: '#2A163D' },
  actionPrimary: { backgroundColor: '#9B5CFF', paddingVertical: 16, borderRadius: 22, alignItems: 'center' },
  actionSecondary: { backgroundColor: '#2A163D', paddingVertical: 16, borderRadius: 22, alignItems: 'center', marginBottom: 12 },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
