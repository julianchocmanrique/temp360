import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native'
import Video from 'react-native-video'
import Icon from 'react-native-vector-icons/Ionicons'
import { API_URL } from '../../config/api'

const { width } = Dimensions.get('window')
const CARD_GAP = 12
const SIDE_PADDING = 16
const CARD_WIDTH = (width - SIDE_PADDING * 2 - CARD_GAP) / 2

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds)) return '--:--'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const VideoCard = ({ item, onOpen, onDelete }) => {
  const [duration, setDuration] = useState(null)
  const videoRef = useRef(null)

  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.85} onPress={onOpen}>
        <View style={styles.videoWrap}>
          <Video
            ref={videoRef}
            source={{ uri: item.url }}
            style={styles.video}
            resizeMode="cover"
            paused
            muted
            onLoad={({ duration: d }) => {
              setDuration(d)
              // Move the preview away from second 0, which is often black.
              if (videoRef.current?.seek) {
                setTimeout(() => videoRef.current.seek(1), 0)
              }
            }}
          />
          <View style={styles.playBadge}>
            <Text style={styles.playText}>&gt;</Text>
          </View>
        </View>
      </TouchableOpacity>

      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.title}
      </Text>
      {item.createdAt ? (
        <Text style={styles.cardDate} numberOfLines={1}>
          {item.createdAt}
        </Text>
      ) : null}
      <Text style={styles.cardDuration}>
        Duracion: {formatDuration(duration)}
      </Text>

      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Text style={styles.deleteText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  )
}

const VideosList = ({ navigation }) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const loadVideos = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/posts`)
      if (!res.ok) {
        throw new Error('No se pudieron cargar los videos')
      }
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      const mapped = list.map((item) => ({
        id: item.id,
        title: item.title || 'Video',
        url: item.imageUrl,
        createdAt: item.createdAt || '',
      }))
      setItems(mapped)
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar los videos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadVideos)
    return unsubscribe
  }, [navigation])

  const handleDelete = async (item) => {
    Alert.alert('Eliminar', 'Eliminar este video?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            if (item.id != null) {
              const res = await fetch(`${API_URL}/posts/${item.id}`, {
                method: 'DELETE',
              })
              if (!res.ok) {
                throw new Error('No se pudo eliminar')
              }
            }
            const next = items.filter((v) => v.id !== item.id)
            setItems(next)
          } catch (_) {
            Alert.alert('Error', 'No se pudo eliminar el video')
          }
        },
      },
    ])
  }

  const renderItem = ({ item }) => {
    const safeItem = {
      ...item,
      url: item.url ? encodeURI(item.url) : item.url,
    }

    return (
      <VideoCard
        item={safeItem}
        onOpen={() => navigation.navigate('VideoPlayer', { item: safeItem })}
        onDelete={() => handleDelete(item)}
      />
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis videos</Text>

      {loading ? (
        <Text style={styles.info}>Cargando...</Text>
      ) : items.length === 0 ? (
        <Text style={styles.info}>No hay videos guardados</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: CARD_GAP }}
          contentContainerStyle={{ paddingBottom: 120, gap: CARD_GAP }}
          renderItem={renderItem}
        />
      )}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Icon name="home-outline" size={22} color="#C9B5FF" />
          <Text style={styles.navText}>INICIO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="images" size={22} color="#9B5CFF" />
          <Text style={[styles.navText, styles.navTextActive]}>GALERIA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="settings-outline" size={22} color="#C9B5FF" />
          <Text style={styles.navText}>AJUSTES</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default VideosList

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#14081E', padding: SIDE_PADDING, paddingBottom: 86 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  info: { color: '#C9B5FF', marginTop: 20 },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#1A1026',
    borderRadius: 18,
    overflow: 'hidden',
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: '#2A163D',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  videoWrap: {
    width: '100%',
    height: 170,
    backgroundColor: '#0B0814',
  },
  video: { width: '100%', height: '100%' },
  playBadge: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    backgroundColor: 'rgba(10,8,20,0.75)',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9B5CFF',
  },
  playText: { color: '#9B5CFF', fontSize: 24, fontWeight: '700' },
  cardTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', margin: 10 },
  cardDate: { color: '#C9B5FF', fontSize: 11, marginHorizontal: 10 },
  cardDuration: {
    color: '#B59CFF',
    fontSize: 11,
    marginHorizontal: 10,
    marginTop: 4,
  },
  deleteBtn: {
    backgroundColor: '#2A163D',
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B2460',
  },
  deleteText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
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
})
