import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    // Ruta al archivo de contador
    const filePath = path.join(process.cwd(), 'api', 'visits.json');
    
    // Leer el archivo actual
    let data = { count: 0 };
    
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(fileContent);
    }
    
    // Incrementar contador
    data.count += 1;
    
    // Guardar el archivo actualizado
    fs.writeFileSync(filePath, JSON.stringify(data));
    
    // Devolver el contador
    res.status(200).json({ value: data.count });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Error al obtener contador', value: '?' });
  }
}