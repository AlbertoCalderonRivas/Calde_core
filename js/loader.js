fetch("../assets/General/loadingScreen.txt")
  .then(res => res.text())
  .then(text => {
    const frames = text
      .split("===FRAME===")
      .map(f => f.trim())
      .filter(f => f.length > 0);

    let currentFrame = 0;
    const frameDelay = 200; 
    const loaderElement = document.getElementById("ascii-loader");

    function updateFrame() {
      loaderElement.textContent = frames[currentFrame];
      currentFrame = (currentFrame + 1) % frames.length;
    }

    updateFrame(); 
    const intervalId = setInterval(updateFrame, frameDelay);
    
    // Limitar el tiempo máximo de espera para el loader
    const maxTimeout = 5000; 
    const maxTimeoutId = setTimeout(() => {
      hideLoader();
    }, maxTimeout);

    // Función para ocultar el loader
    function hideLoader() {
      clearInterval(intervalId); 
      const loader = document.getElementById("loader");
      loader.classList.add("hidden");
      setTimeout(() => loader.remove(), 3500);     }

    // Ocultar el loader cuando todo haya cargado
    window.addEventListener("load", () => {
      clearTimeout(maxTimeoutId); 
      setTimeout(hideLoader, 500);
      });
  })
  .catch(err => {
    console.error("Error al cargar los frames del loader:", err);
  });
