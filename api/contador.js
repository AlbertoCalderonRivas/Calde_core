export default async function handler(req, res) {
  // Configurar cabeceras CORS para permitir peticiones
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    // Hacer la petición a CountAPI desde el servidor
    const response = await fetch('https://api.countapi.xyz/hit/calde-core/visits');
    
    // Si la respuesta no es ok, lanzar un error
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Devolver los datos al frontend
    res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener contador:', error);
    // Devolver un error amigable al frontend
    res.status(500).json({ error: 'Error al obtener contador de visitas', value: '?' });
  }
}