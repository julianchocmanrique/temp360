import React, { useEffect, useState } from 'react'
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

  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.85} onPress={onOpen}>
        <View style={styles.videoWrap}>
          <Video
            source={{ uri: item.url }}
            style={styles.video}
            resizeMode="cover"
            paused
            muted
            onLoad={({ duration: d }) => setDuration(d)}
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
        Duración: {formatDuration(duration)}
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
    Alert.alert('Eliminar', '¿Eliminar este video?', [
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
          contentContainerStyle={{ paddingBottom: 30, gap: CARD_GAP }}
          renderItem={renderItem}
        />
      )}
    </View>
  )
}

export default VideosList

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0814', padding: SIDE_PADDING },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  info: { color: '#bbb', marginTop: 20 },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#151020',
    borderRadius: 18,
    overflow: 'hidden',
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2140',
  },
  videoWrap: {
    width: '100%',
    height: 170,
    backgroundColor: '#000',
  },
  video: { width: '100%', height: '100%' },
  playBadge: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9B5CFF',
  },
  playText: { color: '#9B5CFF', fontSize: 24, fontWeight: '700' },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '700', margin: 10 },
  cardDate: { color: '#a99ccc', fontSize: 11, marginHorizontal: 10 },
  cardDuration: {
    color: '#cbbcff',
    fontSize: 11,
    marginHorizontal: 10,
    marginTop: 4,
  },
  deleteBtn: {
    backgroundColor: '#402050',
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9B5CFF',
  },
  deleteText: { color: '#fff', fontWeight: '700', fontSize: 12 },
})
