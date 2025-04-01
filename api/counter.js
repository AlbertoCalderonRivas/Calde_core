
import admin from 'firebase-admin';

// Inicializar Firebase Admin
let db;

try {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  
  db = admin.firestore();
} catch (error) {
  console.error('Error inicializando Firebase:', error);
}

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  // Solo permitir solicitudes GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Verificar si Firestore está disponible
  if (!db) {
    return res.status(500).json({ 
      count: 458, // Valor de respaldo
      error: 'Firebase no está configurado correctamente'
    });
  }

  try {
    // Referencia al documento del contador
    const counterRef = db.collection('stats').doc('visitors');
    
    // Actualizar el contador en una transacción
    const result = await db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      if (!counterDoc.exists) {
        // Si el documento no existe, crearlo con valor inicial
        transaction.set(counterRef, { count: 1 });
        return 1;
      }
      
      // Incrementar el contador
      const newCount = (counterDoc.data().count || 0) + 1;
      transaction.update(counterRef, { count: newCount });
      return newCount;
    });
    
    // Devolver el nuevo valor del contador
    return res.status(200).json({ count: result });
  } catch (error) {
    console.error('Error actualizando contador de visitas:', error);
    
    // Devolver un valor de respaldo en caso de error
    return res.status(200).json({ 
      count: 458, 
      error: 'temporal_fallback'
    });
  }
}