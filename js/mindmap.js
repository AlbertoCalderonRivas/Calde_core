const enText = document.getElementById("emptyNodesText");
const NODE_R_BASE = 4; // Tamaño base
const NODE_R_ZOOM = 10; // Tamaño al hacer hover
const NODE_R_BASE_MOBILE = 5;
const NODE_R_ZOOM_MOBILE = 7;
const NODE_FORCE = -180;
const NODE_FORCE_MOBILE = -50;
const BOUNDSMUL_BASE = 8;
const BOUNDSMUL_MOBILE = 10;

const LINK_BASE_OPACITY = 0.1;
const LINK_HIGHLIGHT_OPACITY = 0.9;
const LINK_FORCE_MULTIPLICATOR = 0.009;

const LINK_WIDTH = 1;
const LINK_GROUP_WIDTH = 2;

const ANIMATION_INTERVAL = 1000; //Animación de los nodos al cargar la página
const ANIMATION_INTERVAL_RANDOM = 250;

let svg, simulation, width, height, isMobile, link, labels, node, skipAnimationFlag = false, animationEnded = false;

const tags = ["arq", "inm", "ins", "inv", "par", "group"];
window.activeTags = new Set(); //lista de tags activos
window.selectedNodes = new Set();

//Popup de info de los nodos
document.addEventListener("DOMContentLoaded", function () {
  // Configurar el popup de información
  const infoBtn = document.getElementById("info-btn");
  const infoPopup = document.getElementById("info-popup");
  const closePopup = document.querySelector(".close-popup");
  const popupContent = document.querySelector(".info-popup-content");

  if (infoBtn && infoPopup) {
    // Función para cerrar el popup con animación
    function hidePopup() {
      popupContent.classList.add("closing");

      // Quitar la clase active al botón inmediatamente
      infoBtn.classList.remove("active");

      // Esperar a que termine la animación antes de ocultar realmente
      popupContent.addEventListener(
        "animationend",
        function handleAnimationEnd() {
          infoPopup.style.display = "none";
          popupContent.classList.remove("closing");
          // Eliminar el evento para evitar múltiples listeners
          popupContent.removeEventListener("animationend", handleAnimationEnd);
        },
        { once: true }
      ); // El {once: true} hace que se elimine automáticamente después del primer disparo
    }

    // Función para mostrar el popup
    function showPopup() {
      // Asegurarse de que no tenga la clase 'closing'
      popupContent.classList.remove("closing");

      infoPopup.style.display = "block";
      infoBtn.classList.add("active");
    }

    // Toggle del popup al hacer clic en el botón de información
    infoBtn.addEventListener("click", function () {
      if (
        infoPopup.style.display === "block" &&
        !popupContent.classList.contains("closing")
      ) {
        hidePopup();
      } else {
        showPopup();
      }
    });

    // Cerrar popup al hacer clic en X
    closePopup.addEventListener("click", function () {
      hidePopup();
    });

    // Prevenir que clics dentro del contenido cierren el popup
    popupContent.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  }
});

fetch("projects.json") //contiene un array con todos los proyectos
  .then((response) => response.json())
  .then((data) => {
    // Inicializa todos los nodos como visibles
    data.nodes.forEach((n) => (n.visible = true));

    // Oculta los nodos que tienen la propiedad "parent"
    data.nodes.forEach((n) => {
      if (n.parent !== undefined) {
        n.visible = false;
      }
    });

    const allNodes = data.nodes;
    const nodes = allNodes.filter((n) => n.visible !== false);

    const links = generateLinks(nodes); //esto hay que cambiarlo ------------

    createFilterButtons();

    const tagColors = {
      arq: "#db5991",
      inm: "#63d2a8",
      ins: "#5ebcd2",
      inv: "#8e67d1",
      par: "#ddbc60",
      group: "#CCCCCC",
    };

    const tagOpacity = {
      arq: LINK_BASE_OPACITY,
      inm: LINK_BASE_OPACITY,
      ins: LINK_BASE_OPACITY,
      inv: LINK_BASE_OPACITY,
      par: LINK_BASE_OPACITY,
      group: 1,
    };

    //funciones config de simulación

    function initSVG() {
      //inicializa el svg y aplica una primera fuerza al centro
      isMobile = window.matchMedia("(max-width: 768px)").matches;
      width = window.innerWidth;
      height = window.innerHeight;
      svg.attr("width", width).attr("height", height);
      if (simulation) {
        simulation.force("center", d3.forceCenter(width / 2, height / 2));
      }
    }

    function animateMindmapAtStart(allNodesToShow, allLinksAvailable) {
      let currentNodeIndex = 0;
      const displayedNodeIds = new Set();
      let currentNodes = [];
      let currentLinks = [];

      function addNextNode() {
        console.log(
          "Añadiendo nodo",
          currentNodeIndex + 1,
          "de",
          allNodesToShow.length
        );
        if (currentNodeIndex == allNodesToShow.length - 1) {
          showFilters();
        }

        // Añadir el siguiente nodo
        const newNode = allNodesToShow[currentNodeIndex];

        // Inicializar posición en el centro si no existe
        if (newNode.x === undefined || newNode.y === undefined) {
          newNode.x = width / 2;
          newNode.y = height / 2;
        }

        currentNodes.push(newNode);
        displayedNodeIds.add(newNode.id);

        // Buscar enlaces que se puedan mostrar
        const newLinks = allLinksAvailable.filter((link) => {
          const sourceId =
            typeof link.source === "object" ? link.source.id : link.source;
          const targetId =
            typeof link.target === "object" ? link.target.id : link.target;
          return (
            displayedNodeIds.has(sourceId) &&
            displayedNodeIds.has(targetId) &&
            !currentLinks.some((l) => {
              const lSourceId =
                typeof l.source === "object" ? l.source.id : l.source;
              const lTargetId =
                typeof l.target === "object" ? l.target.id : l.target;
              return (
                lSourceId === sourceId &&
                lTargetId === targetId &&
                l.tag === link.tag
              );
            })
          );
        });

        currentLinks.push(...newLinks);

        // Actualizar simulación con los nodos y enlaces actuales
        simulation.nodes(currentNodes);
        simulation.force("link").links(currentLinks);
        simulation.force("childRepulsion", childRepulsionForce());

        // Actualizar enlaces en el DOM
        link = link
          .data(currentLinks, (d) => {
            const sourceId =
              typeof d.source === "object" ? d.source.id : d.source;
            const targetId =
              typeof d.target === "object" ? d.target.id : d.target;
            return `${sourceId}-${targetId}-${d.tag}-${d.curvature}`;
          })
          .join(
            (enter) =>
              enter
                .append("path")
                .attr("class", "link")
                .attr("stroke-width", (d) =>
                  d.tag === "group" ? LINK_GROUP_WIDTH : LINK_WIDTH
                )
                .attr("fill", "none")
                .attr("stroke", (d) => tagColors[d.tag])
                .attr("stroke-opacity", (d) => tagOpacity[d.tag]),
            (update) => update,
            (exit) => exit.remove()
          );

        // Actualizar nodos en el DOM
        node = node
          .data(currentNodes, (d) => d.id)
          .join(
            (enter) =>
              enter
                .append("circle")
                .attr("r", isMobile ? NODE_R_BASE_MOBILE : NODE_R_BASE)
                .attr("class", "node")
                .call(drag(simulation))
                .on("mouseover touchstart", handleNodeHover)
                .on("mouseout touchend", handleNodeUnhover),
            (update) => update,
            (exit) => exit.remove()
          );

        // Actualizar etiquetas en el DOM
        labels = labels
          .data(currentNodes, (d) => d.id)
          .join(
            (enter) =>
              enter
                .append("text")
                .attr("class", "node-id")
                .text((d) => `[${d.id}]`)
                .attr("text-anchor", "left")
                .attr("dy", "-0.5em")
                .attr("dx", "0.5em"),
            (update) => update,
            (exit) => exit.remove()
          );

        // Reiniciar simulación con un pequeño impulso
        restartSimulation();

        currentNodeIndex++;


        //Comprobar si queremos hacer skip a la animación
        const skipBtn = document.getElementById("skip-btn");
        skipBtn.onclick = function () {
            skipAnimationFlag = true;
        }



        if (skipAnimationFlag && currentNodeIndex < allNodesToShow.length) {
          addNextNode();
          animationEnded = true;
          return;
        }

        // Programar siguiente nodo con tiempo aleatorio
        if (currentNodeIndex < allNodesToShow.length) {
          const randomDelay = Math.max(
            50,
            ANIMATION_INTERVAL +
              (Math.random() * 2 - 1) * ANIMATION_INTERVAL_RANDOM -
              (ANIMATION_INTERVAL * currentNodeIndex * 1.5) /
                allNodesToShow.length
          );
          
          setTimeout(addNextNode, randomDelay);
        }
        else {
          animationEnded = true;
        }
      }

      // Iniciar la animación
      addNextNode();
    }
    
    function restartSimulation() {
        simulation.alpha(1).restart();
    }
    
    function fixBounds() {
        const NODE_R_BOUND = isMobile ? NODE_R_ZOOM_MOBILE : NODE_R_ZOOM;
        const BOUNDMUL = isMobile ? BOUNDSMUL_MOBILE : BOUNDSMUL_BASE;
        const graphNodes = simulation.nodes();
        
        const filtersElement = document.getElementById("filters");
        const filtersRect = filtersElement.getBoundingClientRect();
        
        // Calcular el límite inferior botones
        const bottomMargin = 39; // margen adicional en píxeles
        const lowerBoundY = filtersRect.top - bottomMargin;
        
        // Límites horizontales del contenedor de botones
        const leftBoundX = filtersRect.left - 10; // 10px de margen extra
        const rightBoundX = filtersRect.right - 2;
        
        graphNodes.forEach((node) => {
            // Limitar posición X general (límites de la pantalla)
            if (node.x - NODE_R_BOUND < 0) {
                node.x = NODE_R_BOUND;
                node.vx = 0;
            }
            if (node.x + 7 * NODE_R_BOUND > width) {
                node.x = width - 7 * NODE_R_BOUND;
                node.vx = 0;
            }
            
            // Limitar posición Y general
            if (node.y - 2 * NODE_R_BOUND < 0) {
                node.y = 2 * NODE_R_BOUND;
                node.vy = 0;
            }
            
            // Comprobar si el nodo está sobre el área de los botones
            if (
                node.y + NODE_R_BOUND > lowerBoundY &&
                node.x >= leftBoundX &&
                node.x <= rightBoundX
            ) {
                // Si está sobre los botones, empujarlo hacia arriba
                node.y = lowerBoundY - NODE_R_BOUND;
                node.vy = 0;
            } else if (node.y + BOUNDMUL * NODE_R_BOUND > height) {
                node.y = height - BOUNDMUL * NODE_R_BOUND;
                node.vy = 0;
            }
        });
    }
    
    function updateResponsiveProperties() {
        // Actualiza el flag
        isMobile = window.matchMedia("(max-width: 768px)").matches;
        
        // Actualiza las fuerzas que dependen de isMobile
        simulation.force(
            "charge",
            d3.forceManyBody().strength(isMobile ? NODE_FORCE_MOBILE : NODE_FORCE)
        );
        
        // Actualiza el radio de los nodos
        svg
        .selectAll("circle")
        .transition()
        .duration(200)
        .attr("r", isMobile ? NODE_R_BASE_MOBILE : NODE_R_BASE);
    }
    
    //funciones para filtrado de tags
    
    function createFilterButtons() {
        activeTags.clear();
        const container = d3.select(".filter-container");
        const preferedTags = tags.filter((tag) => tag !== "group"); // Excluir "group" de los botones
        
        container
        .selectAll(".filter-btn")
        .data(preferedTags)
        .join("button")
        .attr("class", "filter-btn")
        .text((d) => d.toUpperCase())
        .attr("data-tag", (d) => d)
        .on("click", function (event, tag) {
            d3.select(this).classed("active", !d3.select(this).classed("active"));
            if (activeTags.has(tag)) {
                activeTags.delete(tag);
            } else {
                activeTags.add(tag);
            }
            
            updateNodes();
        });
    }

    function showFilters() {
      const filtersDiv = document.getElementById("filter-container");
      const skipDiv = document.getElementById("skip-animation");

      setTimeout(() => {
      skipDiv.style.transform = "scaleX(0)";
        }, 300);

      
      setTimeout(() => {
        filtersDiv.style.transform = "scaleX(1)";
       
      }, 1300); 
    }

    function updateNodesInstant(nodesToShow, linksToShow) {
      // Actualizar simulación
      simulation.nodes(nodesToShow);
      simulation.force("link").links(linksToShow);
      simulation.force("childRepulsion", childRepulsionForce());

      // Actualizar enlaces en el DOM (instantáneo)
      link = link
        .data(linksToShow, (d) => {
          const sourceId =
            typeof d.source === "object" ? d.source.id : d.source;
          const targetId =
            typeof d.target === "object" ? d.target.id : d.target;
          return `${sourceId}-${targetId}-${d.tag}-${d.curvature}`;
        })
        .join(
          (enter) =>
            enter
              .append("path")
              .attr("class", "link")
              .attr("stroke-width", (d) =>
                d.tag === "group" ? LINK_GROUP_WIDTH : LINK_WIDTH
              )
              .attr("fill", "none")
              .attr("stroke", (d) => tagColors[d.tag])
              .attr("stroke-opacity", (d) => tagOpacity[d.tag]),
          (update) => update,
          (exit) => exit.remove()
        );

      // Actualizar nodos en el DOM (instantáneo)
      node = node
        .data(nodesToShow, (d) => d.id)
        .join(
          (enter) =>
            enter
              .append("circle")
              .attr("r", isMobile ? NODE_R_BASE_MOBILE : NODE_R_BASE)
              .attr("class", "node")
              .call(drag(simulation))
              .on("mouseover touchstart", handleNodeHover)
              .on("mouseout touchend", handleNodeUnhover),
          (update) => update,
          (exit) => exit.remove()
        );

      // Actualizar etiquetas en el DOM (instantáneo)
      labels = labels
        .data(nodesToShow, (d) => d.id)
        .join(
          (enter) =>
            enter
              .append("text")
              .attr("class", "node-id")
              .text((d) => `[${d.id}]`)
              .attr("text-anchor", "left")
              .attr("dy", "-0.5em")
              .attr("dx", "0.5em"),
          (update) => update,
          (exit) => exit.remove()
        );

      // Reiniciar simulación
      simulation.alpha(0.3).restart();
    }

    function updateNodes() {
      simulation.stop();

      const visibles = allNodes.filter((n) => n.visible !== false);

      // Si no hay filtros activos, se muestran todos los nodos
      if (activeTags.size === 0) {
        window.filteredNodes = visibles.slice();
      } else {
        // Filtrar nodos que cumplen con los tags activos
        const tagFilteredNodes = visibles.filter((node) =>
          Array.from(activeTags).every((tag) => node.tags.includes(tag))
        );

        // Crear un Set para evitar duplicados
        const finalNodes = new Set(tagFilteredNodes);

        // Agregar nodos hijos visibles cuyos padres estén en los nodos filtrados
        tagFilteredNodes.forEach((node) => {
          if (node.isGroup) {
            // Buscar hijos de este nodo grupo
            const children = visibles.filter(
              (child) => child.parent === node.id
            );
            children.forEach((child) => {
              finalNodes.add(child);
            });
          }
        });

        window.filteredNodes = Array.from(finalNodes);
      }

      enText.innerText = ``;
      // Si filteredNodes queda vacío, evitamos actualizar y avisamos en consola
      if (filteredNodes.length === 0) {
        enText.innerText = `No fitting criteria`;
      }

      document.dispatchEvent(new Event("filteredNodesUpdated"));
      const newLinks = generateLinks(filteredNodes);

      updateNodesInstant(filteredNodes, newLinks);
    }

    //funciones para links

    function generateLinks(nodes) {
      const links = [];
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      // 1. Enlaces entre nodos que NO tienen parent (nodos normales)
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        if (nodeA.parent) continue;

        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          if (nodeB.parent) continue;

          const sharedTags = nodeA.tags.filter((tag) =>
            nodeB.tags.includes(tag)
          );
          sharedTags.forEach((tag, index) => {
            let curvature =
              index === 0 ? 0.0001 : Math.ceil((index - 0) / 2) * 0.12;
            let baseWeight = sharedTags.length / 2;

            links.push({
              source: nodeA.id,
              target: nodeB.id,
              weight: baseWeight,
              tag: tag,
              curvature: curvature,
              order: index % 2,
            });
          });
        }
      }

      // 2. Enlaces de hijos a su padre
      nodes.forEach((node) => {
        if (node.parent && nodeMap.has(node.parent)) {
          console.log("Enlace hijo a padre:", node.id, "->", node.parent);
          links.push({
            source: node.parent,
            target: node.id,
            weight: 90,
            tag: "group",
            curvature: 0.0001,
            order: 0,
          });
        }
      });
      console.log(
        "Links generados:",
        links.filter((l) => l.tag === "group")
      );
      return links;
    }

    function arcPath(d) {
      const start =
        d.order === 0
          ? { x: d.source.x, y: d.source.y }
          : { x: d.target.x, y: d.target.y };
      const end =
        d.order === 0
          ? { x: d.target.x, y: d.target.y }
          : { x: d.source.x, y: d.source.y };
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
      labels.filter((labelD) => labelD === d).text(`[${d.name}]`);
      d3.select(event.currentTarget)
        .transition()
        .duration(50)
        .attr("r", isMobile ? NODE_R_ZOOM_MOBILE : NODE_R_ZOOM); // Tamaño móvil/desktop
      link
        .transition()
        .duration(800)
        .attr("stroke-opacity", (l) =>
          l.source.id === d.id || l.target.id === d.id
            ? LINK_HIGHLIGHT_OPACITY
            : tagOpacity[l.tag]
        );
    }

    function handleNodeUnhover(event, d) {
      // Función para manejar el "unhover" (mouseout/touchend)
      labels.filter((labelD) => labelD === d).text(`[${d.id}]`);
      d3.select(event.currentTarget)
        .transition()
        .duration(450)
        .attr("r", isMobile ? NODE_R_BASE_MOBILE : NODE_R_BASE); // Tamaño móvil/desktop
      link
        .transition()
        .duration(800)
        .attr("stroke-opacity", (d) => tagOpacity[d.tag]);
    }

    function drag(simulation) {
      const dragThreshold = 2;

      return d3
        .drag()
        .on("start", function (event, d) {
          //Se guarda la posición inicial
          d.dragged = false;
          d.startX = event.x;
          d.startY = event.y;

          event.sourceEvent.preventDefault();
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;

          if (isMobile) {
            handleNodeHover(event, d);
          }
        })
        .on("drag", (event, d) => {
          if (!d.dragged) {
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

          if (!d.dragged) {
            console.log(d.id, d.isGroup);

            if (d.isGroup) {
              console.log("Nodo clickeado:", d, "Expandiendo/colapsando hijos");
              toggleChildren(d.id);
            } else {
              if (d.link) {
                console.log("Nodo clickeado:", d, "Redirigiendo a:", d.link);
                window.location.href = d.link;
              } else {
                console.log("Nodo clickeado:", d, "No tiene enlace asociado");
              }
            }
          }
        });
    }

    

    // funciones para hijes
    function toggleChildren(groupId) {
     
     if(!animationEnded){
        return;
      }
     
      allNodes.forEach((n) => {
        if (n.parent === groupId) {
          n.visible = !n.visible;
        }
      });

      updateNodes();
    }

    function childRepulsionForce() {
      const CHILD_REPULSION_STRENGTH = 2; // Ajusta este valor según necesites
      const CHILD_REPULSION_RADIUS = 1000; // Radio de repulsión entre hermanos

      return function (alpha) {
        //const nodes = this.nodes;

        // Agrupar nodos hijos por padre
        const childrenByParent = {};
        allNodes.forEach((node) => {
          if (node.parent) {
            if (!childrenByParent[node.parent]) {
              childrenByParent[node.parent] = [];
            }
            childrenByParent[node.parent].push(node);
          }
        });

        // Aplicar repulsión entre hermanos
        Object.values(childrenByParent).forEach((siblings) => {
          if (siblings.length > 1) {
            for (let i = 0; i < siblings.length; i++) {
              for (let j = i + 1; j < siblings.length; j++) {
                const nodeA = siblings[i];
                const nodeB = siblings[j];

                const dx = nodeB.x - nodeA.x;
                const dy = nodeB.y - nodeA.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < CHILD_REPULSION_RADIUS && distance > 0) {
                  const strength =
                    ((CHILD_REPULSION_RADIUS - distance) /
                      CHILD_REPULSION_RADIUS) *
                    CHILD_REPULSION_STRENGTH *
                    alpha;
                  const fx = (dx / distance) * strength;
                  const fy = (dy / distance) * strength;

                  nodeA.vx -= fx;
                  nodeA.vy -= fy;
                  nodeB.vx += fx;
                  nodeB.vy += fy;
                }
              }
            }
          }
        });
      };
    }

    // Inicializar SVG
    svg = d3.select("svg");
    initSVG();

    simulation = d3
      .forceSimulation([])
      .force(
        "link",
        d3
          .forceLink([])
          .id((d) => d.id)
          .strength((d) => d.weight * LINK_FORCE_MULTIPLICATOR)
      )
      .force(
        "charge",
        d3.forceManyBody().strength(isMobile ? NODE_FORCE_MOBILE : NODE_FORCE)
      )
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.02))
      .force("childRepulsion", childRepulsionForce());

    // Crear grupos SVG VACÍOS
    let link = svg.append("g").selectAll("path");
    let labels = svg.append("g").selectAll("text");
    let node = svg.append("g").selectAll("circle");

    // Actualizar posiciones
    simulation.on("tick", () => {
      fixBounds();
      link.attr("d", arcPath);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    // Iniciar animación al cargar la página
    animateMindmapAtStart(nodes, links);

    //initSVG();
    window.addEventListener("resize", () => {
      initSVG();
      updateResponsiveProperties();
      fixBounds();
      restartSimulation();
    });

    svg.on("touchstart", (event) => {
      if (event.target.tagName === "svg") {
        link.transition().attr("stroke-opacity", (d) => tagOpacity[d.tag]);
      }
    });
  });
