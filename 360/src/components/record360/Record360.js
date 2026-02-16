import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  Alert,
  ScrollView,
} from 'react-native'

const templates = [
  {
    id: 1,
    name: 'Bodas',
    subtitle: 'Elegancia cinematografica para capturar el "si" eterno y los momentos magicos.',
    duration: '15s',
    effectLabel: 'Slow Motion',
    image: require('../../assets/plantillas/boda.png'),
  },
  {
    id: 2,
    name: 'Fiestas Privadas',
    subtitle: 'Diversion sin limites, luces de neon y la energia de tus amigos en bucle.',
    duration: '10s',
    effectLabel: 'Boomerang',
    image: require('../../assets/plantillas/fiesta.png'),
  },
  {
    id: 3,
    name: 'Eventos Corporativos',
    subtitle: 'Networking profesional y presencia de marca con un acabado premium.',
    duration: '20s',
    effectLabel: 'Branding Overlay',
    image: require('../../assets/plantillas/navidad.png'),
  },
  {
    id: 4,
    name: 'Cumpleanos',
    subtitle: 'Recuerdos calidos, velas y sonrisas con un toque festivo.',
    duration: '12s',
    effectLabel: 'Highlights',
    image: require('../../assets/plantillas/cumple.png'),
  },
  {
    id: 5,
    name: 'Tropical',
    subtitle: 'Vibras veraniegas y colores vivos para fiestas inolvidables.',
    duration: '14s',
    effectLabel: 'Glow',
    image: require('../../assets/plantillas/tropical.png'),
  },
]

const Record360 = ({ navigation }) => {
  const [plantilla, setPlantilla] = useState(null)
  const [showSelector, setShowSelector] = useState(true)
  const [countdown] = useState(null)
  const [selectedEffect, setSelectedEffect] = useState('auto')

  const grabarVideo = () => {
    if (!plantilla) {
      Alert.alert('Elige una plantilla', 'Selecciona una plantilla para continuar')
      return
    }
    navigation.navigate('Record360Camera', { plantilla, effect: selectedEffect })
  }

  if (countdown !== null) {
    return null
  }

  if (showSelector) {
    return (
      <View style={styles.selectorContainer}>
        <View style={styles.heroGlow} />
        <View style={styles.selectorHeader}>
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
          <Text style={styles.selectorTitle}>Hola,</Text>
          <Text style={styles.selectorTitleBold}>que celebramos hoyque</Text>
        </View>

        <ScrollView contentContainerStyle={styles.cardsWrap}>
          {templates.map((item) => (
            <View key={item.id} style={styles.templateCard}>
              <Image source={item.image} style={styles.templateImage} />
              <View style={styles.cardOverlay} />
              <View style={styles.tagRow}>
                <View style={styles.durationChip}>
                  <Text style={styles.durationText}>t {item.duration}</Text>
                </View>
                <View style={styles.effectChipSmall}>
                  <Text style={styles.effectChipSmallText}>{item.effectLabel}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.templateName}>{item.name}</Text>
                <Text style={styles.templateSubtitle}>{item.subtitle}</Text>
                <TouchableOpacity
                  style={styles.selectBtn}
                  activeOpacity={0.9}
                  onPress={() => {
                    setPlantilla(item)
                    setShowSelector(false)
                  }}
                >
                  <Text style={styles.selectBtnText}>Seleccionar Plantilla  ></Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.recordContainer}>
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
      {plantilla && (
        <Image
          source={plantilla.image}
          style={StyleSheet.absoluteFill}
          resizeMode="stretch"
        />
      )}
      <View style={styles.previewOverlay} />

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
        style={styles.backButton}
        onPress={() => {
          setPlantilla(null)
          setShowSelector(true)
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.backText}>{'<'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.recordBtn}
        activeOpacity={0.85}
        onPress={grabarVideo}
      >
        <Text style={styles.recordText}>Grabar</Text>
      </TouchableOpacity>
    </View>
  )
}

export default Record360

const styles = StyleSheet.create({
  countContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
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
    color: '#D0D0D0',
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
    borderColor: '#FFFFFF',
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
    color: '#F2F2F2',
    fontSize: 13,
    letterSpacing: 1.2,
  },

  selectorContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },

  heroGlow: {
    position: 'absolute',
    top: -120,
    left: -40,
    width: 280,
    height: 280,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 160,
    opacity: 0.6,
  },

  selectorHeader: {
    paddingTop: 48,
    paddingHorizontal: 22,
    paddingBottom: 16,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  brandIconText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },

  brandText: {
    color: '#D0D0D0',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },

  bell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  bellText: {
    fontSize: 14,
    color: '#D0D0D0',
  },

  selectorTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '600',
  },

  selectorTitleBold: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 2,
  },

  recordHeader: {
    paddingTop: 48,
    paddingHorizontal: 22,
    paddingBottom: 10,
  },

  recordTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 6,
  },

  recordSubtitle: {
    color: '#D0D0D0',
    fontSize: 13,
    marginTop: 6,
  },

  cardsWrap: {
    paddingHorizontal: 18,
    paddingBottom: 30,
    gap: 18,
  },

  templateCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },

  templateImage: {
    width: '100%',
    height: 220,
  },

  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  tagRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    gap: 10,
  },

  durationChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  durationText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },

  effectChipSmall: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  effectChipSmallText: {
    color: '#F2F2F2',
    fontSize: 12,
    fontWeight: '600',
  },

  cardBody: {
    padding: 16,
    backgroundColor: '#0F0F0F',
  },

  templateName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  templateSubtitle: {
    color: '#D0D0D0',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },

  selectBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  selectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  templateList: {
    paddingHorizontal: 18,
    paddingBottom: 36,
    gap: 18,
  },

  templateRow: {
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 4,
  },

  templateFooter: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#0F0F0F',
  },

  recordContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#000000',
  },

  recordBtn: {
    marginBottom: 52,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 56,
    paddingVertical: 18,
    borderRadius: 60,
    elevation: 8,
  },

  recordText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.6,
  },

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
  effectPanel: {
    position: 'absolute',
    bottom: 130,
    left: 18,
    right: 18,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  effectTitle: {
    color: '#D0D0D0',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.6,
  },
  effectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  effectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  effectChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  effectChipText: {
    color: '#E6E6E6',
    fontSize: 12,
    fontWeight: '600',
  },
  effectChipTextActive: {
    color: '#000000',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
})
