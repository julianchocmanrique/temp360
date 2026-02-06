import { useEffect } from 'react'
import { View } from 'react-native'

const Home = ({ navigation }) => {
  useEffect(() => {
    navigation.replace('Record360')
  }, [])

  return <View />
}

export default Home
