import React from 'react'
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native'
import Video from 'react-native-video'

const PreviewConfirm360 = ({ route, navigation }) => {
  const { videoUri, plantilla, sourceUri, fileCopyUri } = route.params

  return (
    <View style={styles.container}>

      {/* VIDEO */}
      <Video
        source={{ uri: videoUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        repeat
        muted
      />

      {/* PLANTILLA */}
      {plantilla?.image && (
        <Image
          source={plantilla.image}
          style={styles.frame}
          resizeMode="stretch"
        />
      )}

      {/* FLECHA ATRÁS (SIN FONDO) */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Text style={styles.backText}>◀</Text>
      </TouchableOpacity>

      {/* ACCIONES */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButtonSecondary}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.actionText}>Repetir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButtonPrimary}
          onPress={() =>
            navigation.navigate('Preview360', {
              videoUri,
              sourceUri,
              fileCopyUri,
              plantilla,
            })
          }
        >
          <Text style={styles.actionText}>Aceptar</Text>
        </TouchableOpacity>
      </View>

    </View>
  )
}

export default PreviewConfirm360

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  frame: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },

  /* =========================
     FLECHA LIMPIA (SIN FONDO)
  ========================= */
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

  /* =========================
     BOTONES INFERIORES
  ========================= */
  actions: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
    zIndex: 3,
  },

  actionButtonPrimary: {
    minWidth: 140,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: '#9B5CFF',
    justifyContent: 'center',
    alignItems: 'center',

    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  actionButtonSecondary: {
    minWidth: 140,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: 'rgba(15,12,30,0.75)',
    justifyContent: 'center',
    alignItems: 'center',

    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
})
