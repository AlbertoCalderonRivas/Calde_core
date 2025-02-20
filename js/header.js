const logo = document.querySelector(".logo_container")
const menu = document.querySelector(".navigation")
const menuLinks = document.querySelectorAll(".navigation a");
const menuItems = document.querySelectorAll(".navigation li");

function adjustLogoFontSize() {
    // Ajusta tamaño de la fuente del header en función del tamaño de la pantalla
    const windowWidth = window.innerWidth;
    const screenWidthThreshold = 768;

    
    if (windowWidth < screenWidthThreshold) {
        // Pantallas pequeñas
        logo.style.fontSize = '0.5em'; 
        logo.style.marginTop = '0.8em';
        menu.style.fontSize = '0.8em';
        menu.style.marginTop = '0.8em'
        menuLinks.forEach(link => {
            link.style.padding = '0px 5px';})
        
            menuItems[0].textContent = 'W';
            menuItems[1].textContent = 'C';
            menuItems[2].textContent = 'B';
            menuItems[3].textContent = 'A';
        
    } else {
        // Pantallas grandes
        logo.style.fontSize = '0.7em'; 
        logo.style.marginTop = '0.4em';
                menu.style.marginTop = '0.5em'
        menu.style.fontSize = '1em';
        menuLinks.forEach(link => {
            link.style.padding = '0px 8px';})


        menuItems[0].textContent = 'Works';
        menuItems[1].textContent = 'Courses';
        menuItems[2].textContent = 'Blog';
        menuItems[3].textContent = 'About Me';
        
    }
}

adjustLogoFontSize();
window.addEventListener('resize', adjustLogoFontSize);