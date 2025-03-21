class ShaderImageManager {
    constructor(selector = '.shader-image') {
        this.scenes = [];
        this.cameras = [];
        this.renderers = [];
        this.containers = [];
        this.planes = [];
        this.materials = []; 
        this.animations = []; 
        this.animationStarted = []; 
        this.selector = selector;
        
        // Buscar todos los elementos que coincidan con el selector
        const imageContainers = document.querySelectorAll(selector);
        
        // Inicializar cada contenedor encontrado
        imageContainers.forEach(container => {
            this.initializeFromDOM(container);
        });
        
        // Escuchar eventos de redimensionamiento
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Inicializar el observador de intersección para detectar elementos visibles
        this.setupIntersectionObserver();
        
        // NUEVO: Comprobación inicial para elementos ya visibles en viewport
        setTimeout(() => {
            this.checkInitialVisibility();
        }, 300); // Pequeño retraso para asegurar que todo está renderizado
    }
    
    // NUEVO: Método para comprobar elementos ya visibles al cargar
    checkInitialVisibility() {
        console.log("Comprobando elementos inicialmente visibles...");
        const imageContainers = document.querySelectorAll(this.selector);
        
        imageContainers.forEach((container, i) => {
            const index = this.containers.findIndex(c => c.parentElement === container);
            
            if (index !== -1 && !this.animationStarted[index]) {
                const rect = container.getBoundingClientRect();
                const isVisible = (
                    rect.top < window.innerHeight &&
                    rect.bottom > 0 &&
                    rect.left < window.innerWidth &&
                    rect.right > 0
                );
                
                if (isVisible) {
                    console.log(`Elemento ${index} ya visible en carga inicial, iniciando animación`);
                    this.startAnimation(index);
                    this.animationStarted[index] = true;
                }
            }
        });
    }
    
    setupIntersectionObserver() {
        // Opciones para el Intersection Observer
        const options = {
            root: null, // Viewport
            rootMargin: '0px',
            threshold: 0.3 // Elemento visible al menos en un 30%
        };
        
        // Crear el observador
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Buscar el índice del contenedor en nuestro array
                const container = entry.target;
                const index = this.containers.findIndex(c => c.parentElement === container);
                
                if (index !== -1) {
                    if (entry.isIntersecting && !this.animationStarted[index]) {
                        // La imagen está visible y la animación no ha comenzado
                        console.log(`Elemento ${index} es visible, iniciando animación`);
                        this.startAnimation(index);
                        this.animationStarted[index] = true;
                    }
                }
            });
        }, options);
        
        // Observar todos los contenedores de imágenes
        const imageContainers = document.querySelectorAll(this.selector);
        imageContainers.forEach(container => {
            this.observer.observe(container);
        });
    }
    
    initializeFromDOM(container) {
        // Obtener la URL de la imagen desde el atributo data-image
        const imagePath = container.getAttribute('data-image');
        if (!imagePath) {
            console.error('Contenedor sin atributo data-image:', container);
            return;
        }
        
        // Crear escena y cámara
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
        camera.position.z = 1;
        
        // Crear contenedor para el canvas si no existe
        let canvasContainer = container.querySelector('.canvas-container');
        if (!canvasContainer) {
            canvasContainer = document.createElement('div');
            canvasContainer.className = 'canvas-container';
            canvasContainer.style.width = '100%';
            container.appendChild(canvasContainer);
        }
        
        // Configurar el renderer
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setClearColor(0x000000, 0);
        canvasContainer.appendChild(renderer.domElement);
        
        // Obtener configuración del shader y animaciones múltiples
        const shaderConfig = {
            fragmentType: container.getAttribute('data-shader') || 'contrast',
            intensity: parseFloat(container.getAttribute('data-intensity') || '1.0'),
            pixelSize: parseFloat(container.getAttribute('data-pixel-size') || '1.0'),
            // Configuración para animación múltiple
            animate: container.hasAttribute('data-animate'),
            // Propiedades para pixelSize
            animatePixelSize: container.hasAttribute('data-animate-pixel-size'),
            pixelSizeStart: parseFloat(container.getAttribute('data-pixel-size-start') || '1.0'),
            pixelSizeEnd: parseFloat(container.getAttribute('data-pixel-size-end') || '800.0'),
            // Propiedades para intensity
            animateIntensity: container.hasAttribute('data-animate-intensity'),
            intensityStart: parseFloat(container.getAttribute('data-intensity-start') || '1.0'),
            intensityEnd: parseFloat(container.getAttribute('data-intensity-end') || '0.0'),
            // Duración general
            duration: parseFloat(container.getAttribute('data-duration') || '2.0'),
            
            // Mantener compatibilidad con el sistema anterior
            animateProperty: container.getAttribute('data-animate-property') || '',
            startValue: parseFloat(container.getAttribute('data-start-value') || '10.0'),
            endValue: parseFloat(container.getAttribute('data-end-value') || '100.0')
        };
        
        console.log(`Configuración para ${imagePath}:`, shaderConfig);
        
        // Cargar la textura
        const loader = new THREE.TextureLoader();
        loader.load(imagePath, (texture) => {
            const imageWidth = texture.image.width;
            const imageHeight = texture.image.height;
            const aspectRatio = imageWidth / imageHeight;
            
            // Configurar tamaño
            this.updateRendererSize(renderer, canvasContainer, aspectRatio);
            
            // Ajustar cámara
            camera.left = -aspectRatio / 2;
            camera.right = aspectRatio / 2;
            camera.top = 0.5;
            camera.bottom = -0.5;
            camera.updateProjectionMatrix();
            
            // Determinar valores iniciales para las propiedades
            let initialPixelSize = shaderConfig.pixelSize;
            let initialIntensity = shaderConfig.intensity;
            
            // Si alguna propiedad tiene animación específica, usar su valor inicial
            if (shaderConfig.animatePixelSize) {
                initialPixelSize = shaderConfig.pixelSizeStart;
            }
            if (shaderConfig.animateIntensity) {
                initialIntensity = shaderConfig.intensityStart;
            }
            
            // Sistema antiguo (compatibilidad)
            if (shaderConfig.animate && shaderConfig.animateProperty) {
                if (shaderConfig.animateProperty === 'pixelSize') {
                    initialPixelSize = shaderConfig.startValue;
                } else if (shaderConfig.animateProperty === 'intensity') {
                    initialIntensity = shaderConfig.startValue;
                }
            }
            
            // Uniforms 
            const uniforms = {
                uTextura: { value: texture },
                uIntensity: { value: initialIntensity },
                uPixelSize: { value: initialPixelSize }
            };
            
            // Seleccionar fragmentShader basado en data-shader
            let fragmentShader;
            switch (shaderConfig.fragmentType) {
                case 'grayscale':
                    fragmentShader = `
                        uniform sampler2D uTextura;
                        uniform float uIntensity;
                        varying vec2 vUv;
                        void main() {
                            vec4 color = texture2D(uTextura, vUv);
                            float gris = (color.r + color.g + color.b) / 3.0;
                            gl_FragColor = vec4(vec3(gris), 1.0);
                        }
                    `;
                    break;
                case 'contrast':
                    fragmentShader = `
                        uniform sampler2D uTextura;
                        uniform float uIntensity;
                        varying vec2 vUv;
                        void main() {
                            vec4 color = texture2D(uTextura, vUv);
                            float gris = (color.r + color.g + color.b) / 3.0;
                            // Aumentar contraste según intensidad
                            gris = (gris - 0.5) * uIntensity + 0.5;
                            gl_FragColor = vec4(vec3(gris), 1.0)*color;
                        }
                    `;
                    break;
                case 'pixelate':
                    fragmentShader = `
                        uniform sampler2D uTextura;
                        uniform float uPixelSize;
                        varying vec2 vUv;
                        void main() {
                            vec2 pixelUv = floor(vUv * uPixelSize) / uPixelSize;
                            vec4 color = texture2D(uTextura, pixelUv);
                            float gris = (color.r + color.g + color.b) / 3.0;
                            gl_FragColor = vec4(vec3(gris), 1.0)* color;
                        }
                    `;
                    break;
                case 'noise':
                    fragmentShader = `
                        uniform sampler2D uTextura;
                        uniform float uIntensity;
                        varying vec2 vUv;
                        
                        // Función de ruido simple
                        float random(vec2 st) {
                            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                        }
                        
                        void main() {
                            vec4 color = texture2D(uTextura, vUv);
                            float gris = (color.r + color.g + color.b) / 3.0;
                            
                            // Añadir ruido según intensidad
                            float noise = random(vUv) * uIntensity * 0.2;
                            gris = gris + noise - (uIntensity * 0.1);
                            
                            gl_FragColor = vec4(vec3(gris), 1.0);
                        }
                    `;
                    break;
                case 'gs_pixelate':
                    fragmentShader = `
                        uniform sampler2D uTextura;
                        uniform float uPixelSize;
                        uniform float uIntensity;
                        varying vec2 vUv;
                        void main() {
                            vec2 pixelUv = floor(vUv * uPixelSize) / uPixelSize;
                            vec4 color = texture2D(uTextura, pixelUv);
                            float gris = (color.r + color.g + color.b) / 3.0;
                            // Mezcla entre escala de grises y color basada en intensidad
                            vec4 grisColor = vec4(vec3(gris), 1.0);
                            gl_FragColor = mix(color, grisColor, uIntensity);
                        }
                    `;
                    break;
                default:
                    fragmentShader = `
                        uniform sampler2D uTextura;
                        varying vec2 vUv;
                        void main() {
                            vec4 color = texture2D(uTextura, vUv);
                            gl_FragColor = color;
                        }
                    `;
            }
            
            // Vertex shader estándar
            const vertexShader = `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `;
            
            // Crear material y plano
            const geometry = new THREE.PlaneGeometry(aspectRatio, 1);
            const material = new THREE.ShaderMaterial({
                uniforms: uniforms,
                vertexShader: vertexShader,
                fragmentShader: fragmentShader
            });
            
            const plane = new THREE.Mesh(geometry, material);
            plane.position.z = 0;
            scene.add(plane);
            
            // Guardar referencias
            const index = this.scenes.length;
            this.scenes.push(scene);
            this.cameras.push(camera);
            this.renderers.push(renderer);
            this.containers.push(canvasContainer);
            this.planes.push(plane);
            this.materials.push(material);
            this.animationStarted.push(false);
            
            // Configurar objeto de animación múltiple
            const multiAnimation = {
                enabled: shaderConfig.animate,
                properties: [],
                startTime: null,
                duration: shaderConfig.duration
            };
            
            // Añadir propiedades a animar
            if (shaderConfig.animatePixelSize || (shaderConfig.animate && shaderConfig.animateProperty === 'pixelSize')) {
                multiAnimation.properties.push({
                    name: 'pixelSize',
                    startValue: shaderConfig.animatePixelSize ? shaderConfig.pixelSizeStart : shaderConfig.startValue,
                    endValue: shaderConfig.animatePixelSize ? shaderConfig.pixelSizeEnd : shaderConfig.endValue
                });
            }
            
            if (shaderConfig.animateIntensity || (shaderConfig.animate && shaderConfig.animateProperty === 'intensity')) {
                multiAnimation.properties.push({
                    name: 'intensity',
                    startValue: shaderConfig.animateIntensity ? shaderConfig.intensityStart : shaderConfig.startValue,
                    endValue: shaderConfig.animateIntensity ? shaderConfig.intensityEnd : shaderConfig.endValue
                });
            }
            
            this.animations.push(multiAnimation);
            
            // Iniciar animación
            this.animate(index);
        });
    }
    
    startAnimation(index) {
        console.log(`Iniciando animación para imagen ${index}`);
        const animation = this.animations[index];
        
        if (animation.enabled && animation.properties.length > 0) {
            animation.startTime = performance.now();
        }
    }
    
    updateAnimation(index) {
        const animation = this.animations[index];
        const material = this.materials[index];
        
        if (animation.enabled && animation.startTime && animation.properties.length > 0) {
            const currentTime = performance.now();
            const elapsedTime = (currentTime - animation.startTime) / 1000; // Convertir a segundos
            
            if (elapsedTime < animation.duration) {
                // Calcular el progreso de la animación (0 a 1)
                const progress = elapsedTime / animation.duration;
                
                // Actualizar todas las propiedades en animación
                animation.properties.forEach(prop => {
                    // Interpolar entre los valores inicial y final
                    const currentValue = prop.startValue + (prop.endValue - prop.startValue) * progress;
                    
                    // Actualizar el uniforme correspondiente
                    if (prop.name === 'pixelSize') {
                        material.uniforms.uPixelSize.value = currentValue;
                    } else if (prop.name === 'intensity') {
                        material.uniforms.uIntensity.value = currentValue;
                    }
                });
            } else if (elapsedTime >= animation.duration) {
                // La animación ha terminado, establecer valores finales
                animation.properties.forEach(prop => {
                    if (prop.name === 'pixelSize') {
                        material.uniforms.uPixelSize.value = prop.endValue;
                    } else if (prop.name === 'intensity') {
                        material.uniforms.uIntensity.value = prop.endValue;
                    }
                });
            }
        }
    }
    
    updateRendererSize(renderer, container, aspectRatio) {
        // Obtener el ancho del contenedor padre
        const width = container.parentElement.clientWidth;
        const height = width / aspectRatio;
        
        renderer.setSize(width, height);
        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
    }
    
    onWindowResize() {
        for (let i = 0; i < this.renderers.length; i++) {
            const renderer = this.renderers[i];
            const container = this.containers[i];
            const plane = this.planes[i];
            const camera = this.cameras[i];
            
            // Recalcular aspect ratio basado en el plano
            const aspectRatio = plane.geometry.parameters.width / plane.geometry.parameters.height;
            
            // Actualizar tamaño del renderer
            this.updateRendererSize(renderer, container, aspectRatio);
            
            // Actualizar la cámara ortográfica
            camera.left = -aspectRatio / 2;
            camera.right = aspectRatio / 2;
            camera.updateProjectionMatrix();
        }
    }
    
    animate(index) {
        const scene = this.scenes[index];
        const camera = this.cameras[index];
        const renderer = this.renderers[index];
        
        const renderFrame = () => {
            requestAnimationFrame(renderFrame);
            
            // Actualizar animaciones si están activas
            this.updateAnimation(index);
            
            renderer.render(scene, camera);
        };
        
        renderFrame();
    }
}

// Inicializar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Pequeña espera para asegurar que los estilos estén aplicados
    setTimeout(() => {
        const imageManager = new ShaderImageManager('.shader-image');
    }, 100);
});