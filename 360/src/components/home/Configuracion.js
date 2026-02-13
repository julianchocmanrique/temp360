import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native'
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
  auto: { bg: '#5B4B7A', border: '#8C78B8' },
  normal: { bg: '#3B3B58', border: '#68689A' },
  fast2: { bg: '#A041FF', border: '#C88BFF' },
  fast4: { bg: '#C24DFF', border: '#E2A6FF' },
  slow05: { bg: '#2F89FF', border: '#7AB6FF' },
  slow025: { bg: '#2166CC', border: '#70A3F0' },
  boomerang: { bg: '#FF4FA0', border: '#FF9ACA' },
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
        <Text style={styles.title}>Configuracion</Text>
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
          <View style={styles.timelineTrack}>
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
  container: { flex: 1, backgroundColor: '#14081E' },
  header: {
    paddingTop: 44,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  content: { padding: 16, gap: 14, paddingBottom: 30 },
  templateTitleCard: {
    borderRadius: 14,
    backgroundColor: '#1A1026',
    borderWidth: 1,
    borderColor: '#2A163D',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  templateTitleLabel: {
    color: '#C9B5FF',
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
    backgroundColor: '#1A1026',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A163D',
    padding: 12,
  },
  blockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  blockTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  blockPill: {
    color: '#C9B5FF',
    borderWidth: 1,
    borderColor: '#3B2460',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    marginBottom: 8,
  },
  timelineBar: { height: 12, borderRadius: 8, overflow: 'hidden', flexDirection: 'row', gap: 3 },
  timelineSegment: { backgroundColor: '#9B5CFF', borderRadius: 6 },
  timelineTrack: {
    height: 74,
    borderRadius: 14,
    backgroundColor: '#231636',
    borderWidth: 1,
    borderColor: '#4A2D71',
    overflow: 'hidden',
    marginTop: 4,
    justifyContent: 'center',
    shadowColor: '#7B3FE4',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  timelineBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 20,
    bottom: 20,
    backgroundColor: '#372151',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 9,
    marginHorizontal: 8,
  },
  timelineBaseText: {
    color: '#EDE3FF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  timelineBlock: {
    position: 'absolute',
    top: 10,
    bottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 7,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  timelineBlockActive: {
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  timelineBlockText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  timelineGuide: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  timeMarks: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mark: {
    color: '#C9B5FF',
    fontSize: 11,
  },
  helperText: { color: '#C9B5FF', fontSize: 12, marginTop: 8 },
  segmentEditor: { marginTop: 10, backgroundColor: '#241735', borderRadius: 10, padding: 10 },
  adjustRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  adjustLabel: { color: '#EADFFF', width: 70, fontSize: 12, fontWeight: '600' },
  adjustBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#9B5CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  adjustValue: { color: '#FFFFFF', marginHorizontal: 10, minWidth: 46, textAlign: 'center', fontWeight: '700' },
  removeBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#4A2444',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  removeBtnText: { color: '#FFD9E8', fontSize: 12, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201,181,255,0.25)',
  },
  chipActive: { backgroundColor: '#9B5CFF', borderColor: '#9B5CFF' },
  chipText: { color: '#E2D7FF', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  filterRow: { gap: 10, paddingTop: 4 },
  filterCard: {
    width: 95,
    borderRadius: 12,
    backgroundColor: '#241735',
    borderWidth: 1,
    borderColor: '#3B2460',
    overflow: 'hidden',
  },
  filterCardActive: { borderColor: '#9B5CFF' },
  filterImage: { width: '100%', height: 62 },
  noneFilter: { backgroundColor: '#1A1026', alignItems: 'center', justifyContent: 'center' },
  filterLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '600', padding: 8, textAlign: 'center' },
  recordBtn: {
    marginTop: 4,
    backgroundColor: '#9B5CFF',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  recordBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
})
