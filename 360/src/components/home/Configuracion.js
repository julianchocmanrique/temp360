import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'

const EFFECTS = [
  { id: 'auto', label: 'Automatico' },
  { id: 'normal', label: 'Normal' },
  { id: 'fast2', label: 'Rapida 2x' },
  { id: 'fast4', label: 'Rapida 4x' },
  { id: 'slow05', label: 'Lenta 0.5x' },
  { id: 'slow025', label: 'Lenta 0.25x' },
  { id: 'boomerang', label: 'Boomerang' },
]

const FILTERS = [
  { id: 'none', name: 'Sin filtro', image: null },
  { id: 'stars', name: 'Estrellas', image: require('../../assets/plantillas/navidad.png') },
  { id: 'sparkle', name: 'Brillos', image: require('../../assets/plantillas/cumple.png') },
  { id: 'confeti', name: 'Confeti', image: require('../../assets/plantillas/fiesta.png') },
]

const TOTAL_SECONDS = 30
const TIMELINE_MARKS = [0, 5, 10, 15, 20, 25, 30]

const EFFECT_COLORS = {
  auto: { bg: '#3A3A3A', border: '#6F6F6F' },
  normal: { bg: '#3B3B58', border: '#565656' },
  fast2: { bg: '#8A8A8A', border: '#B0B0B0' },
  fast4: { bg: '#9C9C9C', border: '#C8C8C8' },
  slow05: { bg: '#777777', border: '#9A9A9A' },
  slow025: { bg: '#606060', border: '#8D8D8D' },
  boomerang: { bg: '#7A7A7A', border: '#A8A8A8' },
}

const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

const composeTimeline = (blocks) => {
  const normalizedBlocks = blocks
    .map((b) => {
      const start = clamp(Math.round(b.start), 0, TOTAL_SECONDS - 1)
      const duration = clamp(Math.round(b.duration), 1, TOTAL_SECONDS - start)
      const end = clamp(start + duration, start + 1, TOTAL_SECONDS)
      return { ...b, start, end }
    })
    .sort((a, b) => a.createdAt - b.createdAt)

  const points = new Set([0, TOTAL_SECONDS])
  normalizedBlocks.forEach((b) => {
    points.add(b.start)
    points.add(b.end)
  })
  const sorted = [...points].sort((a, b) => a - b)
  const raw = []

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const start = sorted[i]
    const end = sorted[i + 1]
    if (end <= start) continue

    let active = null
    for (let j = 0; j < normalizedBlocks.length; j += 1) {
      const b = normalizedBlocks[j]
      if (start >= b.start && end <= b.end) active = b
    }
    raw.push({
      start,
      end,
      effect: active?.effect || 'normal',
      filterId: 'none',
    })
  }

  const merged = []
  raw.forEach((s) => {
    const last = merged[merged.length - 1]
    if (last && last.effect === s.effect && last.filterId === s.filterId && last.end === s.start) {
      last.end = s.end
    } else {
      merged.push({ ...s })
    }
  })
  return merged
}

const Configuracion = ({ route, navigation }) => {
  const plantilla = route?.params?.plantilla
  const [effectBlocks, setEffectBlocks] = useState([])
  const [selectedBlockId, setSelectedBlockId] = useState(null)
  const [globalFilterId, setGlobalFilterId] = useState('none')

  const selectedFilter = useMemo(
    () => FILTERS.find((f) => f.id === globalFilterId) || FILTERS[0],
    [globalFilterId],
  )

  const selectedBlock = useMemo(
    () => effectBlocks.find((b) => b.id === selectedBlockId) || null,
    [effectBlocks, selectedBlockId],
  )

  const timelineSegments = useMemo(() => composeTimeline(effectBlocks), [effectBlocks])

  const addEffectBlock = (effectId) => {
    const id = `b_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    const next = {
      id,
      effect: effectId,
      start: 0,
      duration: 4,
      createdAt: Date.now(),
    }
    setEffectBlocks((prev) => [...prev, next])
    setSelectedBlockId(id)
  }

  const updateSelectedBlock = (patch) => {
    if (!selectedBlockId) return
    setEffectBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== selectedBlockId) return b
        const start = patch.start != null ? patch.start : b.start
        const duration = patch.duration != null ? patch.duration : b.duration
        const safeStart = clamp(Math.round(start), 0, TOTAL_SECONDS - 1)
        const safeDuration = clamp(Math.round(duration), 1, TOTAL_SECONDS - safeStart)
        return { ...b, start: safeStart, duration: safeDuration }
      }),
    )
  }

  const removeSelectedBlock = () => {
    if (!selectedBlockId) return
    setEffectBlocks((prev) => prev.filter((b) => b.id !== selectedBlockId))
    setSelectedBlockId(null)
  }

  const goRecord = () => {
    navigation.navigate('Grabar', {
      plantilla,
      effect: 'normal',
      filter: selectedFilter,
      timelineSegments,
      autoStart: true,
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Configuracion</Text>
          <Text style={styles.headerSubtitle}>Ajusta tiempos y efectos</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.templateTitleCard}>
          <Text style={styles.templateTitleLabel}>Plantilla seleccionada</Text>
          <Text style={styles.templateTitleName}>{plantilla?.name || 'Plantilla'}</Text>
        </View>

        <View style={styles.block}>
          <View style={styles.blockHeader}>
            <Text style={styles.blockTitle}>Linea de tiempo</Text>
            <Text style={styles.blockPill}>30s</Text>
          </View>
          <View style={styles.blockMetaRow}>
            <Text style={styles.blockMeta}>Base: Normal continuo</Text>
            <Text style={styles.blockMeta}>{effectBlocks.length} efectos</Text>
          </View>
          <View style={styles.timelineTrack}>
            <View style={styles.timelineAmbientGlow} pointerEvents="none" />
            <View style={styles.timelineScanLine} pointerEvents="none" />
            <View style={styles.timelineBase}>
              <Text style={styles.timelineBaseText}>Normal 0-30s</Text>
            </View>
            {effectBlocks.map((b) => {
              const leftPct = (b.start / TOTAL_SECONDS) * 100
              const widthPct = (b.duration / TOTAL_SECONDS) * 100
              const tone = EFFECT_COLORS[b.effect] || EFFECT_COLORS.normal
              return (
                <TouchableOpacity
                  key={b.id}
                  activeOpacity={0.9}
                  onPress={() => setSelectedBlockId(b.id)}
                  style={[
                    styles.timelineBlock,
                    {
                      left: `${leftPct}%`,
                      width: `${Math.max(widthPct, 6)}%`,
                      backgroundColor: tone.bg,
                      borderColor: tone.border,
                    },
                    selectedBlockId === b.id && styles.timelineBlockActive,
                  ]}
                >
                  <Text style={styles.timelineBlockText} numberOfLines={1}>
                    {b.effect}
                  </Text>
                </TouchableOpacity>
              )
            })}
            {TIMELINE_MARKS.map((m) => (
              <View
                key={`m_${m}`}
                pointerEvents="none"
                style={[
                  styles.timelineGuide,
                  { left: `${(m / TOTAL_SECONDS) * 100}%` },
                ]}
              />
            ))}
            {TIMELINE_MARKS.map((m) => (
              <View
                key={`n_${m}`}
                pointerEvents="none"
                style={[
                  styles.timelineNode,
                  { left: `${(m / TOTAL_SECONDS) * 100}%` },
                  (m === 0 || m === 30) && styles.timelineNodeEdge,
                ]}
              />
            ))}
          </View>
          <View style={styles.timeMarks}>
            <Text style={styles.mark}>0s</Text>
            <Text style={styles.mark}>10s</Text>
            <Text style={styles.mark}>20s</Text>
            <Text style={styles.mark}>30s</Text>
          </View>
          {selectedBlock ? (
            <View style={styles.segmentEditor}>
              <Text style={styles.helperText}>
                Editando: {selectedBlock.effect}
              </Text>
              <View style={styles.adjustRow}>
                <Text style={styles.adjustLabel}>Inicio</Text>
                <TouchableOpacity style={styles.adjustBtn} onPress={() => updateSelectedBlock({ start: selectedBlock.start - 1 })}>
                  <Text style={styles.adjustBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.adjustValue}>{selectedBlock.start}s</Text>
                <TouchableOpacity style={styles.adjustBtn} onPress={() => updateSelectedBlock({ start: selectedBlock.start + 1 })}>
                  <Text style={styles.adjustBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.adjustRow}>
                <Text style={styles.adjustLabel}>Duracion</Text>
                <TouchableOpacity style={styles.adjustBtn} onPress={() => updateSelectedBlock({ duration: selectedBlock.duration - 1 })}>
                  <Text style={styles.adjustBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.adjustValue}>{selectedBlock.duration}s</Text>
                <TouchableOpacity style={styles.adjustBtn} onPress={() => updateSelectedBlock({ duration: selectedBlock.duration + 1 })}>
                  <Text style={styles.adjustBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={removeSelectedBlock}>
                <Text style={styles.removeBtnText}>Quitar bloque</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.helperText}>Agrega un efecto para editar inicio y duracion.</Text>
          )}
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Agregar efecto</Text>
          <View style={styles.chips}>
            {EFFECTS.filter((item) => item.id !== 'normal').map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => addEffectBlock(item.id)}
                style={styles.chip}
              >
                <Icon name="add" size={14} color="#FFFFFF" />
                <Text style={styles.chipText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity onPress={goRecord} style={styles.recordBtn} activeOpacity={0.85}>
          <Text style={styles.recordBtnText}>Grabar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

export default Configuracion

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    paddingTop: 44,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  headerCenter: { alignItems: 'center' },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  headerSubtitle: { color: '#AFAFAF', fontSize: 11, marginTop: 2 },
  content: { padding: 16, gap: 14, paddingBottom: 36 },
  templateTitleCard: {
    borderRadius: 18,
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  templateTitleLabel: {
    color: '#D0D0D0',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  templateTitleName: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  block: {
    backgroundColor: '#0F0F0F',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 14,
  },
  blockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  blockTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginBottom: 8 },
  blockMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  blockMeta: { color: '#B5B5B5', fontSize: 12, fontWeight: '600' },
  blockPill: {
    color: '#D0D0D0',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 14,
    fontSize: 12,
    marginBottom: 8,
  },
  timelineBar: { height: 12, borderRadius: 8, overflow: 'hidden', flexDirection: 'row', gap: 3 },
  timelineSegment: { backgroundColor: '#FFFFFF', borderRadius: 6 },
  timelineTrack: {
    height: 88,
    borderRadius: 22,
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#2F2F2F',
    overflow: 'hidden',
    marginTop: 4,
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  timelineAmbientGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  timelineScanLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: '50%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  timelineBase: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 28,
    bottom: 28,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  timelineBaseText: {
    color: '#E5E5E5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  timelineBlock: {
    position: 'absolute',
    top: 18,
    bottom: 18,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  timelineBlockActive: {
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  timelineBlockText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  timelineGuide: {
    position: 'absolute',
    bottom: 3,
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  timelineNode: {
    position: 'absolute',
    bottom: 0,
    marginLeft: -2.5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CFCFCF',
  },
  timelineNodeEdge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: -3,
    backgroundColor: '#FFFFFF',
  },
  timeMarks: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mark: {
    color: '#D6D6D6',
    fontSize: 11,
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  helperText: { color: '#D0D0D0', fontSize: 12, marginTop: 8 },
  segmentEditor: { marginTop: 10, backgroundColor: '#181818', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#2A2A2A' },
  adjustRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  adjustLabel: { color: '#D5D5D5', width: 70, fontSize: 12, fontWeight: '700' },
  adjustBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustBtnText: { color: '#000000', fontSize: 16, fontWeight: '800' },
  adjustValue: { color: '#FFFFFF', marginHorizontal: 10, minWidth: 46, textAlign: 'center', fontWeight: '700' },
  removeBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#262626',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  removeBtnText: { color: '#FFD3D3', fontSize: 12, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  chipText: { color: '#E6E6E6', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#000000' },
  filterRow: { gap: 10, paddingTop: 4 },
  filterCard: {
    width: 95,
    borderRadius: 12,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
  },
  filterCardActive: { borderColor: '#FFFFFF' },
  filterImage: { width: '100%', height: 62 },
  noneFilter: { backgroundColor: '#0F0F0F', alignItems: 'center', justifyContent: 'center' },
  filterLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '600', padding: 8, textAlign: 'center' },
  recordBtn: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  recordBtnText: { color: '#000000', fontSize: 17, fontWeight: '700' },
})
