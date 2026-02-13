import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

const VistaPrevia = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Listo</Text>
      <Text style={styles.subtitle}>Tu video ya esta en la nube</Text>

      <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate('Grabar')}>
        <Text style={styles.btnText}>Volver a grabar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondary} onPress={() => navigation.navigate('VideosList')}>
        <Text style={styles.btnText}>Ver videos</Text>
      </TouchableOpacity>
    </View>
  )
}

export default VistaPrevia

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#14081E', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#C9B5FF', fontSize: 13, marginTop: 8, marginBottom: 24, textAlign: 'center' },
  primary: { width: '80%', backgroundColor: '#9B5CFF', paddingVertical: 16, borderRadius: 22, alignItems: 'center', marginBottom: 12 },
  secondary: { width: '80%', backgroundColor: '#2A163D', paddingVertical: 16, borderRadius: 22, alignItems: 'center', borderWidth: 1, borderColor: '#3B2460' },
  btnText: { color: '#FFFFFF', fontWeight: '700' },
})
