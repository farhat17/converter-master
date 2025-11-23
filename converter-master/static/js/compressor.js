// Compressor Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const compressBtn = document.getElementById('compress-btn');
    const uploadForm = document.getElementById('upload-form');
    
    // Upload area click event
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', function() {
            fileInput.click();
        });
        
        // Drag and drop functionality
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            uploadArea.classList.add('drag-over');
        }
        
        function unhighlight() {
            uploadArea.classList.remove('drag-over');
        }
        
        uploadArea.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            fileInput.files = files;
            
            // Update UI to show selected files
            updateFileList(files);
        }
        
        // File input change event
        fileInput.addEventListener('change', function() {
            updateFileList(this.files);
        });
        
        function updateFileList(files) {
            if (files.length > 0) {
                uploadArea.innerHTML = `
                    <div class="upload-icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <h3>${files.length} File${files.length > 1 ? 's' : ''} Selected</h3>
                    <p>Ready for compression</p>
                    <div class="file-info">
                        <small>Click to change files</small>
                    </div>
                `;
                
                // Re-add click event after updating content
                uploadArea.addEventListener('click', function() {
                    fileInput.click();
                });
            }
        }
    }
    
    // Form submission loading state
    if (uploadForm && compressBtn) {
        uploadForm.addEventListener('submit', function() {
            const btnText = compressBtn.querySelector('.btn-text');
            const btnLoader = compressBtn.querySelector('.btn-loader');
            
            if (btnText && btnLoader) {
                btnText.style.display = 'none';
                btnLoader.style.display = 'flex';
                compressBtn.disabled = true;
            }
        });
    }
    
    // Add animation to feature cards on scroll
    const featureCards = document.querySelectorAll('.feature-card');
    
    function checkScroll() {
        featureCards.forEach(card => {
            const cardTop = card.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (cardTop < windowHeight - 100) {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }
        });
    }
    
    // Initialize feature cards with opacity for animation
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    window.addEventListener('scroll', checkScroll);
    checkScroll(); // Check on page load
});