 
        
// Seleccionar el contenedor
const scrollText = document.getElementById("scroll-text");
document.addEventListener("filteredNodesUpdated", cargarProyectos);


async function cargarProyectos() {
try {

    let visitCount;
        
    // Detectar si estamos en desarrollo local o en producción
    if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
        // En desarrollo local, usar localStorage para simular contador
        visitCount = parseInt(localStorage.getItem('visitCount') || '0');
        localStorage.setItem('visitCount', (visitCount + 1).toString());
    } else {
        // En producción, usar proxy CORS
        try {
            const proxyUrl = 'https://corsproxy.io/?';
            const targetUrl = 'https://api.countapi.xyz/hit/calde-core/visits';
            const contadorResponse = await fetch(proxyUrl + encodeURIComponent(targetUrl));
            const contadorData = await contadorResponse.json();
            visitCount = contadorData.value || 0;
        } catch (error) {
            console.error("Error al obtener contador:", error);
            // Si falla, usar valor de respaldo
            visitCount = Math.floor((Date.now() / 86400000) - 19722); // Simulación
        }
    }

    const response = await fetch("../projects.json"); // Ruta al archivo JSON
    const data = await response.json();
    const totalProyectos = data.nodes.length;
    
    const proyectosMostrados = window.filteredNodes ? window.filteredNodes.length : 28;
    let textoTag = ``;
   
    if(window.activeTags.size> 0){
        const activeTagsArray = Array.from(window.activeTags).join(" - ");
        textoTag = `──9ৎ── TAGS ACTIVOS [${activeTagsArray}] `;
    }
    else{
        textoTag = ``;
    }
    
    // 🔹 Texto que se desplazará
    const texto = `⋆౨ৎ˚⟡˖ CREADO x ࣪ALBERTO CALDERÓN RIVAS - PORTFOLIO WEB ──୨ৎ── VISITAS TOTALES [${visitCount}] ──୨ৎ── NÚMERO DE PROYECTOS EN MEMORIA [${totalProyectos}] ──9ৎ── NÚMERO DE PROYECTOS MOSTRADOS [${proyectosMostrados}]` + textoTag + ` ──9ৎ── ÚLTIMA ACTUALIZACIÓN [01/04/2025] ✶⋆.˚ `;
    

    scrollText.innerText = texto.repeat(10);
    scrollText.innerText += scrollText.innerHTML;

} catch (error) {
    console.error("Error cargando proyectos:", error);
    scrollText.innerText = "Error cargando estadísticas...";
}

}
cargarProyectos();
