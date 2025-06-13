fetch("/assets/General/wip.txt")
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
    


  })
  .catch(err => {
    console.error("Error al cargar los frames del loader:", err);
  });
