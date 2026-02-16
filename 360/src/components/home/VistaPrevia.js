import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { getUploadJobState, subscribeUploadJobState } from './uploadJobState'

const VistaPrevia = ({ navigation }) => {
  const [job, setJob] = useState(getUploadJobState())

  useEffect(() => {
    const unsub = subscribeUploadJobState((next) => setJob(next))
    return unsub
  }, [])

  const isProcessing = job.status === 'processing'
  const isError = job.status === 'error'
  const title = isProcessing ? 'Procesando' : isError ? 'Error' : 'Listo'
  const subtitle = isProcessing
    ? (job.message || 'Procesando en segundo plano...')
    : isError
      ? (job.error || 'No se pudo guardar el video')
      : 'Tu video ya esta en la nube'

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate('Grabar')}>
        <Text style={styles.btnTextPrimary}>Volver a grabar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondary, isProcessing && styles.secondaryDisabled]}
        disabled={isProcessing}
        onPress={() => navigation.navigate('VideosList')}
      >
        <Text style={styles.btnTextSecondary}>{isProcessing ? 'Subiendo...' : 'Ver videos'}</Text>
      </TouchableOpacity>
    </View>
  )
}

export default VistaPrevia

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#D0D0D0', fontSize: 13, marginTop: 8, marginBottom: 24, textAlign: 'center' },
  primary: { width: '80%', backgroundColor: '#FFFFFF', paddingVertical: 16, borderRadius: 22, alignItems: 'center', marginBottom: 12 },
  secondary: { width: '80%', backgroundColor: '#1E1E1E', paddingVertical: 16, borderRadius: 22, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  secondaryDisabled: { opacity: 0.55 },
  btnTextPrimary: { color: '#000000', fontWeight: '700' },
  btnTextSecondary: { color: '#FFFFFF', fontWeight: '700' },
})
