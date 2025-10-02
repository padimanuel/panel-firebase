// src/utils/listFunctions.js
import { db } from '../firebase';
import { doc, writeBatch } from 'firebase/firestore';

// Descargar CSV
export function downloadCSV(items) {
  if (!items || items.length === 0) return;

  const headers = Object.keys(items[0]);
  const csvRows = [
    headers.join(','), // cabecera
    ...items.map(item => headers.map(h => `"${item[h]}"`).join(',')),
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'lista.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Subir lista a Firebase (merge: actualiza existentes y añade nuevos)
export async function uploadList(items, placeId) {
  if (!items || items.length === 0 || !placeId) return;

  const batch = writeBatch(db);

  items.forEach(item => {
    const docRef = doc(db, 'places', placeId, 'lista', item.id);
    batch.set(docRef, item, { merge: true }); // merge para no borrar campos existentes
  });

  await batch.commit();
  console.log('Lista subida correctamente');
}
