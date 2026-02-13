import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'

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

const Home = ({ navigation }) => {
  const [showSelector] = useState(true)
  const [countdown] = useState(null)

  if (countdown !== null) {
    return null
  }

  if (showSelector) {
    return (
      <View style={styles.selectorContainer}>
        <View style={styles.topFixedHeader}>
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <Icon name="videocam" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.brandText}>INMERSA</Text>
            </View>
            <View style={styles.bell}>
              <Icon name="notifications-outline" size={16} color="#C9B5FF" />
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.mainScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.selectorHeader}>
            <Text style={styles.selectorTitle}>Hola,</Text>
            <Text style={styles.selectorTitleBold}>que celebramos hoy?</Text>
            <Text style={styles.selectorSubtitle}>
              Elige una experiencia 360 para tu evento
            </Text>
          </View>

          <View style={styles.cardsWrap}>
            {templates.map((item) => (
              <View key={item.id} style={styles.templateCard}>
                <Image source={item.image} style={styles.templateImage} />
                <View style={styles.cardOverlay} />
                <View style={styles.cardGradient} />
                <View style={styles.cardBody}>
                  <Text style={styles.templateName}>{item.name}</Text>
                  <Text style={styles.templateSubtitle}>{item.subtitle}</Text>
                  <TouchableOpacity
                    style={styles.selectBtn}
                    activeOpacity={0.9}
                    onPress={() => {
                      navigation.navigate('Configuracion', { plantilla: item })
                    }}
                  >
                    <Text style={styles.selectBtnText}>Crear nuevo evento</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Icon name="home" size={22} color="#9B5CFF" />
            <Text style={[styles.navText, styles.navTextActive]}>INICIO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VideosList')}>
            <Icon name="images-outline" size={22} color="#C9B5FF" />
            <Text style={styles.navText}>GALERIA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Icon name="settings-outline" size={22} color="#C9B5FF" />
            <Text style={styles.navText}>AJUSTES</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return null
}

export default Home

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
    backgroundColor: '#14081E',
  },
  topFixedHeader: {
    paddingTop: 48,
    paddingHorizontal: 22,
    paddingBottom: 4,
  },
  mainScrollContent: { paddingBottom: 110 },


  selectorHeader: {
    paddingTop: 8,
    paddingHorizontal: 22,
    paddingBottom: 12,
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
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#9B5CFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  brandText: {
    color: '#C9B5FF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },

  bell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },


  selectorTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },

  selectorTitleBold: {
    color: '#9B5CFF',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  selectorSubtitle: {
    color: '#C9B5FF',
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
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
    color: '#C9B5FF',
    fontSize: 13,
    marginTop: 6,
  },

  cardsWrap: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },

  templateCard: {
    borderRadius: 26,
    overflow: 'hidden',
    marginVertical: 8,
    backgroundColor: '#211332',
    borderWidth: 1,
    borderColor: 'rgba(232,208,255,0.72)',
    shadowColor: '#7B3FE4',
    shadowOpacity: 0.26,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },

  templateImage: {
    width: '100%',
    height: 320,
  },

  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
    backgroundColor: 'rgba(12,8,20,0.78)',
  },

  tagRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    gap: 10,
  },

  durationChip: {
    backgroundColor: '#9B5CFF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  effectChipSmall: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  effectChipSmallText: {
    color: '#EDE7FF',
    fontSize: 12,
    fontWeight: '600',
  },

  cardBody: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },

  templateName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  templateSubtitle: {
    color: '#D9CCFF',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },

  selectBtn: {
    marginTop: 14,
    backgroundColor: '#A86BFF',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C89BFF',
    shadowColor: '#7B3FE4',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  selectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 78,
    backgroundColor: '#1A1026',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#2A163D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navText: {
    color: '#C9B5FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  navTextActive: {
    color: '#9B5CFF',
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
    backgroundColor: '#1A1026',
  },

  recordContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#14081E',
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
    backgroundColor: 'rgba(20,8,30,0.8)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A163D',
  },
  effectTitle: {
    color: '#C9B5FF',
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
    borderColor: 'rgba(201,181,255,0.2)',
  },
  effectChipActive: {
    backgroundColor: '#9B5CFF',
    borderColor: '#9B5CFF',
  },
  effectChipText: {
    color: '#E2D7FF',
    fontSize: 12,
    fontWeight: '600',
  },
  effectChipTextActive: {
    color: '#fff',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,8,20,0.35)',
  },
})
