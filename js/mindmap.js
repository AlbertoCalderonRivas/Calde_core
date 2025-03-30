
   
    
    const NODE_R_BASE = 4; // Tamaño base
    const NODE_R_ZOOM = 10; // Tamaño al hacer hover
    const NODE_R_BASE_MOBILE = 6;
    const NODE_R_ZOOM_MOBILE = 8;
    const NODE_FORCE = -180;
    const NODE_FORCE_MOBILE = -30;
    
    const LINK_BASE_OPACITY = 0.1;
    const LINK_HIGHLIGHT_OPACITY = 0.9;
    const LINK_FORCE_MULTIPLICATOR = 0.004;
    let svg, simulation,width, height, isMobile;

    const tags = ["arq", "inm", "ins", "inv", "par"];
    let activeTags = new Set(); //lista de tags activos 
    window.selectedNodes = new Set();
   

    fetch('projects.json') //contiene un array con todos los proyectos
    .then(response => response.json())
    .then(data => {
    const nodes = data.nodes;
    
    const links = generateLinks(nodes); //esto hay que cambiarlo ------------

    createFilterButtons();

    const tagColors = {
      "arq": "#db5991",  
      "inm": "#63d2a8",  
      "ins": "#5ebcd2",  
      "inv": "#8e67d1",  
      "par": "#ddbc60", 
    };


    //funciones config de simulación

    function initSVG() {
        //inicializa el svg y aplica una primera fuerza al centro
        isMobile = window.matchMedia("(max-width: 768px)").matches;
        width = window.innerWidth;
        height = window.innerHeight;
        svg.attr("width", width).attr("height", height);
        if(simulation){simulation.force("center", d3.forceCenter(width / 2, height / 2));}
    }
    
    function restartSimulation() {

        simulation.alpha(1).restart();
    }
    
    function fixBounds() {
              
        const NODE_R_BOUND = isMobile ? NODE_R_ZOOM_MOBILE : NODE_R_ZOOM;

          const graphNodes = simulation.nodes();

          graphNodes.forEach((node) => {
              // Limitar posición X
              if (node.x - NODE_R_BOUND < 0) {
                  node.x = NODE_R_BOUND;
                  node.vx = 0;
              }
              if (node.x + 7*NODE_R_BOUND > width ) {
                  node.x = width-7*NODE_R_BOUND;
                  node.vx = 0;
              }
            
              // Limitar posición Y
              if (node.y - 2*NODE_R_BOUND < 0) {
                  node.y = 2*NODE_R_BOUND;
                  node.vy = 0; 
              }
              if (node.y + 14*NODE_R_BOUND > height) {
                  node.y = height - 14*NODE_R_BOUND;
                  node.vy = 0; 
              }
         });
    }
  
    function updateResponsiveProperties() {
      // Actualiza el flag
      isMobile = window.matchMedia("(max-width: 768px)").matches;
        
      // Actualiza las fuerzas que dependen de isMobile
      simulation.force("charge", d3.forceManyBody().strength(isMobile ? NODE_FORCE_MOBILE : NODE_FORCE));
        
      // Actualiza el radio de los nodos
      svg.selectAll("circle")
        .transition()
        .duration(200)
        .attr("r", isMobile ? NODE_R_BASE_MOBILE : NODE_R_BASE);
        
      
    }
    
    //funciones para filtrado de tags

    function createFilterButtons() {
    activeTags.clear();
    const container = d3.select(".filter-container");
    
    container.selectAll(".filter-btn")
        .data(tags)
        .join("button")
        .attr("class", "filter-btn")
        .text(d => d.toUpperCase())
        .attr("data-tag", d => d)
        .on("click", function(event, tag) {
            d3.select(this).classed("active", !d3.select(this).classed("active"));
            if(activeTags.has(tag)) {
                activeTags.delete(tag);
            } else {
                activeTags.add(tag);
            }
            
            
            updateNodes();
        });
    }

    function updateNodes() {

        simulation.stop();


        // Si no hay filtros activos, se muestran todos los nodos
        window.filteredNodes = activeTags.size === 0
          ? nodes.slice()
          : nodes.filter(node =>
              Array.from(activeTags).some(tag => node.tags.includes(tag))
            );

        // Si filteredNodes queda vacío, evitamos actualizar y avisamos en consola
        if (filteredNodes.length === 0) {
          console.warn("No hay nodos que cumplan los filtros activos:", Array.from(activeTags));
          // Opcional: puedes optar por mostrar todos los nodos en lugar de ninguno
          filteredNodes = nodes.slice();
        }

        document.dispatchEvent(new Event("filteredNodesUpdated"));
        const newLinks = generateLinks(filteredNodes);

        //Reiniciar posiciones de los nodos
        filteredNodes.forEach(node => {
        node.x = width / 2;  // Centrar nodos
        node.y = height / 2;
        delete node.vx;     // Eliminar velocidad anterior
        delete node.vy;
        });

        // Actualizar simulación
        simulation.nodes(filteredNodes);
        simulation.force("link").links(newLinks);

        // Actualizar enlaces
        link = link.data(newLinks, d => `${d.source.id}-${d.target.id}-${d.tag}-${d.curvature}`)
            .join(
                enter => enter.append("path")
                    .attr("class", "link")
                    .attr("stroke-width", 1)
                    .attr("fill", "none")
                    .attr("stroke", d => tagColors[d.tag])
                    .attr("stroke-opacity", LINK_BASE_OPACITY),
                update => update,
                exit => exit.remove()
            );


        // Actualizar nodos
        node = node.data(filteredNodes, d => d.id)
            .join(
                enter => enter.append("circle")
                    .attr("r", isMobile ? NODE_R_BASE_MOBILE : NODE_R_BASE)
                    .attr("class", "node")
                    .call(drag(simulation))
                    .on("mouseover touchstart", handleNodeHover)
                    .on("mouseout touchend", handleNodeUnhover),
                update => update,
                exit => exit.remove()
            );

        // Actualizar etiquetas
        labels = labels.data(filteredNodes, d => d.id)
        .join(
            enter => enter.append("text")
                .attr("class", "node-id")
                .text(d => `[${d.id}]`)
                .attr("text-anchor", "left")
                .attr("dy", "-0.5em")
                .attr("dx", "0.5em"),
            update => update,
            exit => exit.remove()
        );


        restartSimulation();

    }
    
    //funciones para links
    
    function generateLinks(nodes) {
        // Función mágica para generar links
        const links = [];
        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const nodeA = nodes[i];
                const nodeB = nodes[j];
                const sharedTags = nodeA.tags.filter(tag => nodeB.tags.includes(tag));
                
                sharedTags.forEach((tag, index) => {
                    let curvature;
                    if (index === 0) {
                        curvature = 0.0001; 
                    } else {
                        
                        const adjustedIndex = index - 0; 
                        curvature =  (Math.ceil(adjustedIndex / 2)) * 0.12;
                    }
                    links.push({
                        source: nodeA.id,
                        target: nodeB.id,
                        weight: sharedTags.length/2,
                        tag: tag,
                        curvature: curvature,
                        order: index % 2
                    });
                });
            }
        }
        return links;
    }
    
    function arcPath(d) {
        const start = d.order === 0 ? { x: d.source.x, y: d.source.y } : { x: d.target.x, y: d.target.y };
        const end = d.order === 0 ? { x: d.target.x, y: d.target.y } : { x: d.source.x, y: d.source.y };
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dr = Math.sqrt(dx * dx + dy * dy) / d.curvature; // Radio del arco

        return `
              M${start.x},${start.y}
              A${dr},${dr} 0 0,1 ${end.x},${end.y}
              `;
    }

    //funciones para interactividad

    function handleNodeHover(event, d) {
        // Función para manejar el "hover" (mouseover/touchstart)
    labels.filter(labelD => labelD === d)
        .text(`[${d.name}]`);
    d3.select(event.currentTarget)
        .transition()
        .duration(50)
        .attr("r", isMobile ? NODE_R_ZOOM_MOBILE : NODE_R_ZOOM); // Tamaño móvil/desktop
    link.transition()
        .duration(800)
        .attr("stroke-opacity", l => 
            (l.source.id === d.id || l.target.id === d.id) ? LINK_HIGHLIGHT_OPACITY : LINK_BASE_OPACITY
        );
    }

    function handleNodeUnhover(event, d) {
        // Función para manejar el "unhover" (mouseout/touchend)
        labels.filter(labelD => labelD === d)
            .text(`[${d.id}]`);
        d3.select(event.currentTarget)
            .transition()
            .duration(450)
            .attr("r", isMobile ? NODE_R_BASE_MOBILE : NODE_R_BASE); // Tamaño móvil/desktop
        link.transition()
            .duration(800)
            .attr("stroke-opacity", LINK_BASE_OPACITY);
    }

    function drag(simulation) {

        const dragThreshold = 2;

        return d3.drag()
        .on("start", function(event, d) {

            //Se guarda la posición inicial
            d.dragged = false;
            d.startX = event.x;
            d.startY = event.y;


            event.sourceEvent.preventDefault(); //esto evita scroll en moviles, quiza haya que quitarlo
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
           
            if (isMobile) {
            handleNodeHover(event, d);
            }
            

        })
        .on("drag", (event, d) => {
            if(!d.dragged){
                const dx = event.x - d.startX;
                const dy = event.y - d.startY;
                if (Math.sqrt(dx * dx + dy * dy) > dragThreshold) {
                d.dragged = true;
            }
            }
            d.fx = event.x;
            d.fy = event.y;
            link.attr("d", arcPath);
        })
        .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
     
         if (isMobile) {
            handleNodeUnhover(event, d);
            }
           
         if (!d.dragged && d.link) {
            console.log("Nodo clickeado:", d, "Redirigiendo a:", d.link);
         window.location.href = d.link;
         }

        });
        }


        // Inicializar SVG
        svg = d3.select("svg");
        initSVG();

        // Crear simulación
        simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).strength(d => d.weight * LINK_FORCE_MULTIPLICATOR))
            .force("charge", d3.forceManyBody().strength(isMobile? NODE_FORCE_MOBILE : NODE_FORCE))
            .force("center", d3.forceCenter(width / 2, height / 2).strength(0.02));

        // Dibujar enlaces
        let link = svg.append("g")
            .selectAll("path")
            .data(links)
            .join("path")
            .attr("class", "link")
            .attr("stroke-width", 1)
            .attr("stroke-opacity",LINK_BASE_OPACITY)
            .attr("fill", "none")
            .attr("stroke", d => tagColors[d.tag]);



        // Crear etiquetas
        let labels = svg.append("g")
            .selectAll("text")
            .data(nodes)
            .join("text")
            .attr("class", "node-id")
            .text(d =>`[${d.id}]`) // Mostrar el ID
            .attr("text-anchor", "left")
            .attr("dy", "-0.5em")
            .attr("dx","0.5em")
              
              
        // Dibujar nodos
        let node = svg.append("g")
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("class", "node")
            .attr("r", isMobile ? NODE_R_BASE_MOBILE : NODE_R_BASE)
            .call(drag(simulation))
            .on("mouseover touchstart", handleNodeHover)
            .on("mouseout touchend", handleNodeUnhover); 

        

            

        // Actualizar posiciones
        simulation.on("tick", () => {
          fixBounds();
          link.attr("d", arcPath); 

          node.attr("cx", d => d.x)
              .attr("cy", d => d.y);

          labels
              .attr("x", d => d.x)
              .attr("y", d => d.y);

          

        });



        //initSVG();
        window.addEventListener("resize", () => {
                    initSVG();
                    updateResponsiveProperties();
                    restartSimulation();
        });

        svg.on("touchstart", (event) => {
        if (event.target.tagName === "svg") {
            link.transition().attr("stroke-opacity", LINK_BASE_OPACITY);
        }
    });

        
      })