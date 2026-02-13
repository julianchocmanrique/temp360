import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Splash from '../splash/Splash';
import Home from '../home/Home';
import Configuracion from '../home/Configuracion';
import Grabar from '../record360/Grabar';
import VideoPlayer from '../home/VideoPlayer';
import VistaPrevia from '../home/VistaPrevia';
import VideosList from '../home/VideosList';

const Stack = createNativeStackNavigator();

const CoinsStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Configuracion" component={Configuracion} />
      <Stack.Screen name="Grabar" component={Grabar} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayer} />
      <Stack.Screen name="VistaPrevia" component={VistaPrevia} />
      <Stack.Screen name="VideosList" component={VideosList} />
    </Stack.Navigator>
  );
};

export default CoinsStack;
