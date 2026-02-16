import React, { useRef } from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'

const templates = [
  {
    id: 1,
    name: 'Bodas',
    subtitle: 'Elegancia cinematografica para capturar el "si" eterno y los momentos magicos.',
    image: require('../../assets/plantillas/boda.png'),
  },
  {
    id: 2,
    name: 'Fiestas Privadas',
    subtitle: 'Diversion sin limites, luces de neon y energia en bucle para toda la noche.',
    image: require('../../assets/plantillas/fiesta.png'),
  },
  {
    id: 3,
    name: 'Eventos Corporativos',
    subtitle: 'Networking y presencia de marca con una estetica premium.',
    image: require('../../assets/plantillas/navidad.png'),
  },
  {
    id: 4,
    name: 'Cumpleanos',
    subtitle: 'Velas, sonrisas y recuerdos calidos en una toma inolvidable.',
    image: require('../../assets/plantillas/cumple.png'),
  },
  {
    id: 5,
    name: 'Tropical',
    subtitle: 'Vibras de verano y color para fiestas intensas.',
    image: require('../../assets/plantillas/tropical.png'),
  },
]

const TemplateCard = ({ item, onSelect }) => {
  const scale = useRef(new Animated.Value(1)).current

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.985,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start()
  }

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start()
  }

  return (
    <Animated.View style={[styles.templateCard, { transform: [{ scale }] }]}>
      <Image source={item.image} style={styles.templateImage} />
      <View style={styles.cardOverlay} />
      <View style={styles.cardGradient} />
      <View style={styles.cardBody}>
        <Text style={styles.templateName}>{item.name}</Text>
        <Text style={styles.templateSubtitle}>{item.subtitle}</Text>
        <Pressable
          style={styles.selectBtn}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onSelect}
        >
          <Text style={styles.selectBtnText}>Crear nuevo evento</Text>
          <Icon name="arrow-forward" size={16} color="#000000" />
        </Pressable>
      </View>
    </Animated.View>
  )
}

const Home = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Icon name="videocam" size={16} color="#000000" />
          </View>
          <Text style={styles.brandText}>INMERSA</Text>
        </View>
        <TouchableOpacity style={styles.bell}>
          <Icon name="notifications-outline" size={16} color="#D0D0D0" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Hola,</Text>
          <Text style={styles.titleBold}>que celebramos hoy?</Text>
          <Text style={styles.subtitle}>Elige tu plantilla y crea un nuevo evento</Text>
        </View>

        <View style={styles.cardsWrap}>
          {templates.map((item) => (
            <TemplateCard
              key={item.id}
              item={item}
              onSelect={() => navigation.navigate('Configuracion', { plantilla: item })}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.activeIconWrap}>
            <Icon name="home" size={18} color="#000000" />
          </View>
          <Text style={[styles.navText, styles.navTextActive]}>INICIO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VideosList')}>
          <Icon name="images-outline" size={22} color="#D0D0D0" />
          <Text style={styles.navText}>GALERIA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="settings-outline" size={22} color="#D0D0D0" />
          <Text style={styles.navText}>AJUSTES</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    color: '#D0D0D0',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  titleWrap: {
    paddingTop: 4,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '600',
    lineHeight: 36,
  },
  titleBold: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 42,
  },
  subtitle: {
    color: '#AFAFAF',
    marginTop: 10,
    fontSize: 13,
  },
  cardsWrap: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  templateCard: {
    borderRadius: 26,
    overflow: 'hidden',
    marginVertical: 10,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#2C2C2C',
    shadowColor: '#000',
    shadowOpacity: 0.38,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  templateImage: {
    width: '100%',
    height: 350,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.24)',
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 170,
    backgroundColor: 'rgba(0,0,0,0.84)',
  },
  cardBody: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  templateName: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 42,
  },
  templateSubtitle: {
    color: '#D6D6D6',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 19,
  },
  selectBtn: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#DADADA',
  },
  selectBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 82,
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#1E1E1E',
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
  activeIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    color: '#B8B8B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  navTextActive: {
    color: '#FFFFFF',
  },
})

