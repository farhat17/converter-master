// Get the necessary elements
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');

// Add event listeners for drag-and-drop functionality
uploadArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (event) => {
    event.preventDefault();
    uploadArea.classList.remove('dragover');

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        // Set the dropped file to the input field
        fileInput.files = files;
        uploadArea.querySelector('p').textContent = `${files[0].name} selected.`;
    }
});

// Allow clicking on the upload area to select a file
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

// Update text when file is selected via file dialog
fileInput.addEventListener('change', () => {
    const selectedFile = fileInput.files[0];
    if (selectedFile) {
        uploadArea.querySelector('p').textContent = `${selectedFile.name} selected.`;
    }
});




// JavaScript to toggle the mobile menu visibility
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});
