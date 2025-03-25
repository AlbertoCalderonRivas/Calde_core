document.addEventListener('DOMContentLoaded', () => {
    const popup = document.getElementById('imagePopup');
    const popupClose = popup.querySelector('.image-popup-close');
    const popupImage = document.getElementById('popupImage');

    // Function to open the popup
    function openImagePopup(imgElement) {
        // Set the src of the popup image to the clicked image's src
        popupImage.src = imgElement.src || imgElement.getAttribute('data-image');
        
        // Ensure the popup is responsive
        popupImage.style.maxWidth = '90vw';
        popupImage.style.maxHeight = '90vh';
        popupImage.style.objectFit = 'contain';

        // Show the popup
        popup.classList.add('show');
    }

    // Function to close the popup
    function closeImagePopup() {
        popup.classList.remove('show');
    }

    // Add click events to images only within .image-container
    document.querySelectorAll('.image-container img, .image-container .shader-image').forEach(imgElement => {
        imgElement.addEventListener('click', (e) => {
            // Prevent multiple event triggers
            e.stopPropagation();
            
            // Get the actual image source
            const src = imgElement.tagName === 'DIV' 
                ? imgElement.getAttribute('data-image') 
                : imgElement.src;
            
            // Set popup image source
            popupImage.src = src;
            
            // Show popup
            popup.classList.add('show');
        });
    });

    // Close popup events
    popupClose.addEventListener('click', closeImagePopup);
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            closeImagePopup();
        }
    });

    // Handle window resize to maintain responsiveness
    window.addEventListener('resize', () => {
        if (popup.classList.contains('show')) {
            popupImage.style.maxWidth = '90vw';
            popupImage.style.maxHeight = '90vh';
        }
    });
});