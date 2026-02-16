import React from 'react'
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native'
import Video from 'react-native-video'

const PreviewConfirm360 = ({ route, navigation }) => {
  const { videoUri, plantilla, sourceUri, fileCopyUri, effect } = route.params

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
      {plantillaque.image && (
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
          <Text style={styles.actionTextSecondary}>Repetir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButtonPrimary}
          onPress={() =>
            navigation.navigate('Preview360', {
              videoUri,
              sourceUri,
              fileCopyUri,
              plantilla,
              effect,
            })
          }
        >
          <Text style={styles.actionTextPrimary}>Aceptar</Text>
        </TouchableOpacity>
      </View>

    </View>
  )
}

export default PreviewConfirm360

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  frame: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.75,
    zIndex: 2,
  },

  backButton: {
    position: 'absolute',
    top: 52,
    left: 18,
    zIndex: 10,
  },

  backText: {
    color: '#D0D0D0',
    fontSize: 24,
    fontWeight: '700',
  },

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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',

    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  actionTextPrimary: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  actionTextSecondary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
