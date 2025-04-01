const db = getFirestore();

export default async function handler(req, res) {
  // Configurar CORS para permitir solicitudes desde tu dominio
  res.setHeader('Access-Control-Allow-Origin', '*'); // En producción, especificar tu dominio
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  // Solo permitir solicitudes GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Referencia al documento del contador
    const counterRef = db.collection('stats').doc('visitors');
    
    // Actualizar el contador en una transacción para evitar condiciones de carrera
    const result = await db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      if (!counterDoc.exists) {
        // Si el documento no existe, crearlo con valor inicial
        transaction.set(counterRef, { count: 1 });
        return 1;
      }
      
      // Incrementar el contador
      const newCount = counterDoc.data().count + 1;
      transaction.update(counterRef, { count: newCount });
      return newCount;
    });
    
    // Devolver el nuevo valor del contador
    return res.status(200).json({ count: result });
  } catch (error) {
    console.error('Error actualizando contador de visitas:', error);
    return res.status(500).json({ error: 'Failed to update visitor count' });
  }
}