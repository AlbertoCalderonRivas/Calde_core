 
        
// Seleccionar el contenedor
const scrollText = document.getElementById("scroll-text");
document.addEventListener("filteredNodesUpdated", cargarProyectos);
async function cargarProyectos() {
    

try {
    const response = await fetch("../projects.json"); // Ruta al archivo JSON
    const data = await response.json();
    const totalProyectos = data.nodes.length;
    const proyectosMostrados = window.filteredNodes ? window.filteredNodes.length : 28;


    // 🔹 Texto que se desplazará
    const texto = `⋆౨ৎ˚⟡˖ CREADO x ࣪ALBERTO CALDERÓN RIVAS - PORTFOLIO WEB ──୨ৎ── NÚMERO DE PROYECTOS EN MEMORIA [${totalProyectos}] ──9ৎ── NÚMERO DE PROYECTOS MOSTRADOS [${proyectosMostrados}] ──9ৎ── ÚLTIMA ACTUALIZACIÓN [20/02/2025] ✶⋆.˚ `;


    scrollText.innerText = texto.repeat(10);
    scrollText.innerText += scrollText.innerHTML;

} catch (error) {
    console.error("Error cargando proyectos:", error);
    scrollText.innerText = "Error cargando estadísticas...";
}

}
cargarProyectos();
