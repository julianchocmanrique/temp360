import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import Video from 'react-native-video'

const VideoPlayer = ({ route, navigation }) => {
  const item = route?.params?.item

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>&lt;</Text>
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {item?.title ?? 'Video'}
      </Text>

      <Video
        source={{ uri: item?.url ? encodeURI(item.url) : `file://${item?.path}` }}
        style={styles.video}
        resizeMode="contain"
        controls
        onError={(e) =>
          Alert.alert('Error', 'No se pudo reproducir el video')
        }
      />
    </View>
  )
}

export default VideoPlayer

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0814' },
  back: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  backText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  title: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    maxWidth: '70%',
  },
  video: { width: '100%', height: '100%' },
})
