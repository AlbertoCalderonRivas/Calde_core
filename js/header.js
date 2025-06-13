const logo = document.querySelector(".logo_container")
const menu = document.querySelector(".navigation")
const menuLinks = document.querySelectorAll(".navigation a");
const menuItems = document.querySelectorAll(".navigation li");

const navigationItems = [
    { href: "/proyectos/WIP", label: "Works", short: "W" },
    { href: "/proyectos/WIP", label: "Courses", short: "C" },
    { href: "/proyectos/WIP", label: "Blog", short: "B" },
    { href: "/navigation/AboutMe", label: "About Me", short: "A" }
];

function renderNavigation() {
    menu.innerHTML = ""; // Limpia el contenido actual
    navigationItems.forEach(item => {
        const a = document.createElement("a");
        a.href = item.href;
        a.style.padding = "0px 5px";
        const li = document.createElement("li");
        li.textContent = item.label; // Por defecto, el nombre largo
        a.appendChild(li);
        menu.appendChild(a);
    });
}
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
        menu.querySelectorAll("li").forEach((li, i) => {
            li.textContent = navigationItems[i].short;
        });
        
    } else {
        // Pantallas grandes
        logo.style.fontSize = '0.7em'; 
        logo.style.marginTop = '0.4em';
                menu.style.marginTop = '0.5em'
        menu.style.fontSize = '1em';
        menu.querySelectorAll("li").forEach((li, i) => {
            li.textContent = navigationItems[i].label;
        });
        
    }
}
renderNavigation();
adjustLogoFontSize();
window.addEventListener('resize', adjustLogoFontSize);