import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Splash from '../splash/Splash';
import Home from '../home/Home';
import Record360 from '../record360/Record360';
import Preview360 from '../home/Preview360';
import PreviewConfirm360 from '../home/PreviewConfirm360';
import VideosList from '../home/VideosList';
import VideoPlayer from '../home/VideoPlayer';

const Stack = createNativeStackNavigator();

const CoinsStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false, // 🔥 CLAVE: elimina TODAS las flechas nativas
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Record360" component={Record360} />
      <Stack.Screen name="PreviewConfirm360" component={PreviewConfirm360} />
      <Stack.Screen name="Preview360" component={Preview360} />
      <Stack.Screen name="VideosList" component={VideosList} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayer} />
    </Stack.Navigator>
  );
};

export default CoinsStack;
