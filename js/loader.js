fetch("../assets/General/loadingScreen.txt")
  .then(res => res.text())
  .then(text => {
    const frames = text
      .split("===FRAME===")
      .map(f => f.trim())
      .filter(f => f.length > 0);

    let currentFrame = 0;
    const frameDelay = 200; // Puedes ajustar la velocidad
    const loaderElement = document.getElementById("ascii-loader");

    function updateFrame() {
      loaderElement.textContent = frames[currentFrame];
      currentFrame = (currentFrame + 1) % frames.length;
    }

    updateFrame(); // Mostrar el primer frame
    const intervalId = setInterval(updateFrame, frameDelay);

    // Ocultar el loader cuando todo haya cargado
    window.addEventListener("load", () => {
        setTimeout(() => {
          const loader = document.getElementById("loader");
          loader.classList.add("hidden");
          setTimeout(() => loader.remove(), 3500); // lo quita del DOM después del fade
        }, 500);
      });
  })
  .catch(err => {
    console.error("Error al cargar los frames del loader:", err);
  });
