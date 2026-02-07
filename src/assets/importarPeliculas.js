import RNFS from 'react-native-fs';
import Papa from 'papaparse';
import db from './db';
import { normalizeText } from './db'; 

export const importarPeliculasDesdeCSV = async () => {
  try {
    const path = RNFS.MainBundlePath + '/peliculas.csv';
    const csv = await RNFS.readFile(path, 'utf8');

    const parsed = Papa.parse(csv, { header: true });
    const database = await db;

    for (const row of parsed.data) {
      if (row.titulo) {
        const categoriaNormalized = normalizeText(row.categoria);
        await database.executeSql(
          `INSERT OR IGNORE INTO peliculas (id, titulo, categoria, ranking, likes, image) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            parseInt(row.id),
            row.titulo,
            categoriaNormalized,
            parseFloat(row.ranking) || 0,
            parseInt(row.likes) || 0,
            row.image || 'avatar.png'
          ]
        );
      }
    }
    console.log('Películas importadas correctamente con imágenes');
  } catch (error) {
    console.log('Error importando CSV:', error);
  }
};
