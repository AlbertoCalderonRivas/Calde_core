 
        
// Seleccionar el contenedor
const scrollText = document.getElementById("scroll-text");
document.addEventListener("filteredNodesUpdated", cargarProyectos);
async function cargarProyectos() {
    

try {
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
    const texto = `⋆౨ৎ˚⟡˖ CREADO x ࣪ALBERTO CALDERÓN RIVAS - PORTFOLIO WEB ──୨ৎ── NÚMERO DE PROYECTOS EN MEMORIA [${totalProyectos}] ──9ৎ── NÚMERO DE PROYECTOS MOSTRADOS [${proyectosMostrados}]` + textoTag + ` ──9ৎ── ÚLTIMA ACTUALIZACIÓN [01/04/2025] ✶⋆.˚ `;
    

    scrollText.innerText = texto.repeat(10);
    scrollText.innerText += scrollText.innerHTML;

} catch (error) {
    console.error("Error cargando proyectos:", error);
    scrollText.innerText = "Error cargando estadísticas...";
}

}
cargarProyectos();
