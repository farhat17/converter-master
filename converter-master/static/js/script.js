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

document.addEventListener('DOMContentLoaded', function() {
    // Initialize editors
    const inputEditor = ace.edit("json-editor");
    inputEditor.setTheme("ace/theme/chrome");
    inputEditor.session.setMode("ace/mode/json");
    inputEditor.setOptions({
        fontSize: "14px",
        tabSize: 2,
        useSoftTabs: true,
        showPrintMargin: false
    });

    const outputEditor = ace.edit("output-editor");
    outputEditor.setTheme("ace/theme/chrome");
    outputEditor.session.setMode("ace/mode/json");
    outputEditor.setOptions({
        fontSize: "14px",
        tabSize: 2,
        useSoftTabs: true,
        showPrintMargin: false,
        readOnly: true
    });

    // Initialize JSONEditor for tree view
    const treeContainer = document.getElementById('json-tree');
    const treeEditor = new JSONEditor(treeContainer, {
        mode: 'tree',
        modes: ['tree', 'view', 'form', 'code'],
        onError: function(err) {
            showValidationResult(err.toString(), 'error');
        },
        onChange: function() {
            try {
                const json = treeEditor.get();
                inputEditor.setValue(JSON.stringify(json, null, 2));
                showValidationResult('JSON is valid', 'success');
            } catch (err) {
                showValidationResult(err.toString(), 'error');
            }
        }
    });

    // Initialize JSONEditor for form view
    const formContainer = document.getElementById('json-form');
    const formEditor = new JSONEditor(formContainer, {
        mode: 'form',
        modes: ['tree', 'view', 'form', 'code'],
        onError: function(err) {
            showValidationResult(err.toString(), 'error');
        },
        onChange: function() {
            try {
                const json = formEditor.get();
                inputEditor.setValue(JSON.stringify(json, null, 2));
                showValidationResult('JSON is valid', 'success');
            } catch (err) {
                showValidationResult(err.toString(), 'error');
            }
        }
    });

    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // If switching to tree or form view, try to parse the JSON
            if (tabName === 'tree' || tabName === 'form') {
                try {
                    const json = JSON.parse(inputEditor.getValue());
                    if (tabName === 'tree') {
                        treeEditor.set(json);
                    } else {
                        formEditor.set(json);
                    }
                    showValidationResult('JSON is valid', 'success');
                } catch (err) {
                    showValidationResult(err.toString(), 'error');
                }
            }
        });
    });

    // Format button
    document.getElementById('format-btn').addEventListener('click', function() {
        try {
            const json = inputEditor.getValue();
            const indent = document.getElementById('indent-select').value;
            const indentSize = indent === 'tab' ? '\t' : parseInt(indent);
            
            const formatted = js_beautify(json, {
                indent_size: indentSize,
                indent_char: indent === 'tab' ? '\t' : ' ',
                indent_with_tabs: indent === 'tab',
                wrap_line_length: 80
            });
            
            inputEditor.setValue(formatted);
            showValidationResult('JSON formatted successfully', 'success');
        } catch (err) {
            showValidationResult(err.toString(), 'error');
        }
    });

    // Minify button
    document.getElementById('minify-btn').addEventListener('click', function() {
        try {
            const json = inputEditor.getValue();
            const minified = JSON.stringify(JSON.parse(json));
            inputEditor.setValue(minified);
            showValidationResult('JSON minified successfully', 'success');
        } catch (err) {
            showValidationResult(err.toString(), 'error');
        }
    });

    // Validate button
    document.getElementById('validate-btn').addEventListener('click', function() {
        try {
            JSON.parse(inputEditor.getValue());
            showValidationResult('JSON is valid', 'success');
        } catch (err) {
            showValidationResult(err.toString(), 'error');
        }
    });

    // Auto-fix button
    document.getElementById('fix-btn').addEventListener('click', function() {
        try {
            // Try to parse the JSON to check if it's valid
            JSON.parse(inputEditor.getValue());
            showValidationResult('JSON is already valid', 'info');
        } catch (err) {
            // If invalid, try to fix common issues
            let jsonString = inputEditor.getValue();
            
            // Fix 1: Replace single quotes with double quotes
            jsonString = jsonString.replace(/'/g, '"');
            
            // Fix 2: Remove trailing commas
            jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
            
            // Fix 3: Add missing quotes around property names
            jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
            
            try {
                // Try to parse the fixed JSON
                JSON.parse(jsonString);
                inputEditor.setValue(jsonString);
                showValidationResult('Fixed common JSON issues', 'success');
            } catch (fixErr) {
                showValidationResult('Unable to automatically fix JSON: ' + fixErr.toString(), 'error');
            }
        }
    });

    // Copy button
    document.getElementById('copy-btn').addEventListener('click', function() {
        const output = outputEditor.getValue();
        navigator.clipboard.writeText(output).then(() => {
            showValidationResult('Copied to clipboard', 'success');
        }).catch(err => {
            showValidationResult('Failed to copy: ' + err.toString(), 'error');
        });
    });

    // Download button
    document.getElementById('download-btn').addEventListener('click', function() {
        const output = outputEditor.getValue();
        const format = document.getElementById('convert-select').value;
        const filename = `output.${format}`;
        
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Share button
    document.getElementById('share-btn').addEventListener('click', function() {
        const output = outputEditor.getValue();
        
        if (navigator.share) {
            navigator.share({
                title: 'JSON Tool Output',
                text: 'Check out this JSON data:',
                url: 'data:text/plain;charset=utf-8,' + encodeURIComponent(output)
            }).catch(err => {
                showValidationResult('Error sharing: ' + err.toString(), 'error');
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            const tempInput = document.createElement('input');
            document.body.appendChild(tempInput);
            tempInput.value = window.location.href;
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            showValidationResult('Link copied to clipboard', 'info');
        }
    });

    // Convert button
    document.getElementById('convert-btn').addEventListener('click', function() {
        try {
            const json = inputEditor.getValue();
            const format = document.getElementById('convert-select').value;
            let converted;
            
            switch (format) {
                case 'json':
                    converted = JSON.stringify(JSON.parse(json), null, 2);
                    break;
                case 'xml':
                    const x2js = new X2JS();
                    converted = x2js.json2xml_str(JSON.parse(json));
                    break;
                case 'yaml':
                    converted = jsyaml.dump(JSON.parse(json));
                    break;
                case 'csv':
                    const parser = new json2csv.Parser();
                    converted = parser.parse(JSON.parse(json));
                    break;
                default:
                    throw new Error('Unsupported format');
            }
            
            outputEditor.setValue(converted);
            outputEditor.session.setMode(getModeForFormat(format));
            showValidationResult(`Converted to ${format.toUpperCase()} successfully`, 'success');
        } catch (err) {
            showValidationResult('Conversion error: ' + err.toString(), 'error');
        }
    });

    // File upload
    document.getElementById('json-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            inputEditor.setValue(e.target.result);
            showValidationResult('File loaded successfully', 'success');
        };
        reader.onerror = function() {
            showValidationResult('Error reading file', 'error');
        };
        reader.readAsText(file);
    });

    // URL import
    document.getElementById('load-url').addEventListener('click', function() {
        const url = document.getElementById('json-url').value.trim();
        if (!url) return;
        
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(text => {
                inputEditor.setValue(text);
                showValidationResult('URL loaded successfully', 'success');
            })
            .catch(err => {
                showValidationResult('Error loading URL: ' + err.toString(), 'error');
            });
    });

    // Schema validation
    document.getElementById('validate-schema').addEventListener('click', function() {
        try {
            const json = JSON.parse(inputEditor.getValue());
            const schemaText = document.getElementById('schema-input').value.trim();
            
            if (!schemaText) {
                showValidationResult('Please enter a JSON Schema', 'warning');
                return;
            }
            
            const schema = JSON.parse(schemaText);
            const Ajv = window.ajv || require('ajv');
            const ajv = new Ajv();
            const validate = ajv.compile(schema);
            const valid = validate(json);
            
            if (valid) {
                showValidationResult('JSON validates against the schema', 'success');
            } else {
                let errors = 'Schema validation failed:\n';
                validate.errors.forEach(err => {
                    errors += `- ${err.instancePath} ${err.message}\n`;
                });
                showValidationResult(errors, 'error');
            }
        } catch (err) {
            showValidationResult('Schema validation error: ' + err.toString(), 'error');
        }
    });

    // History controls
    const history = [];
    let historyIndex = -1;
    
    inputEditor.on('change', function() {
        const currentValue = inputEditor.getValue();
        
        // Don't record if the change is from undo/redo
        if (history[historyIndex] === currentValue) return;
        
        // Remove any forward history
        if (historyIndex < history.length - 1) {
            history.splice(historyIndex + 1);
        }
        
        history.push(currentValue);
        historyIndex = history.length - 1;
        updateHistoryButtons();
    });
    
    document.getElementById('undo-btn').addEventListener('click', function() {
        if (historyIndex > 0) {
            historyIndex--;
            inputEditor.setValue(history[historyIndex]);
            inputEditor.clearSelection();
            updateHistoryButtons();
        }
    });
    
    document.getElementById('redo-btn').addEventListener('click', function() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            inputEditor.setValue(history[historyIndex]);
            inputEditor.clearSelection();
            updateHistoryButtons();
        }
    });
    
    document.getElementById('clear-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the editor?')) {
            inputEditor.setValue('');
            history.length = 0;
            historyIndex = -1;
            updateHistoryButtons();
            showValidationResult('Editor cleared', 'info');
        }
    });
    
    function updateHistoryButtons() {
        document.getElementById('undo-btn').disabled = historyIndex <= 0;
        document.getElementById('redo-btn').disabled = historyIndex >= history.length - 1;
    }

    // Advanced panel toggle
    document.getElementById('toggle-advanced').addEventListener('click', function() {
        const panel = document.querySelector('.panel-content');
        const icon = this.querySelector('i');
        
        if (panel.style.display === 'none') {
            panel.style.display = 'grid';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        } else {
            panel.style.display = 'none';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    });

    // Sample JSON modal
    const modal = document.getElementById('sample-modal');
    const closeModal = document.querySelector('.close-modal');
    const sampleBtns = document.querySelectorAll('.sample-btn');
    
    function openModal() {
        modal.style.display = 'block';
    }
    
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    sampleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const sampleType = this.getAttribute('data-sample');
            let sampleJson;
            
            switch (sampleType) {
                case 'simple':
                    sampleJson = {
                        "name": "John Doe",
                        "age": 30,
                        "isActive": true,
                        "address": {
                            "street": "123 Main St",
                            "city": "Anytown"
                        },
                        "hobbies": ["reading", "hiking", "coding"]
                    };
                    break;
                case 'complex':
                    sampleJson = {
                        "users": [
                            {
                                "id": 1,
                                "name": "Alice",
                                "roles": ["admin", "user"],
                                "preferences": {
                                    "theme": "dark",
                                    "notifications": true
                                }
                            },
                            {
                                "id": 2,
                                "name": "Bob",
                                "roles": ["user"],
                                "preferences": {
                                    "theme": "light",
                                    "notifications": false
                                }
                            }
                        ],
                        "metadata": {
                            "createdAt": "2023-01-01T00:00:00Z",
                            "version": "1.0.0"
                        }
                    };
                    break;
                case 'api':
                    sampleJson = {
                        "status": "success",
                        "code": 200,
                        "data": {
                            "products": [
                                {
                                    "id": "prod_001",
                                    "name": "Wireless Headphones",
                                    "price": 99.99,
                                    "inStock": true,
                                    "colors": ["black", "white", "blue"]
                                },
                                {
                                    "id": "prod_002",
                                    "name": "Smart Watch",
                                    "price": 199.99,
                                    "inStock": false,
                                    "colors": ["black", "silver"]
                                }
                            ],
                            "total": 2,
                            "page": 1,
                            "perPage": 10
                        },
                        "timestamp": "2023-05-15T14:30:22Z"
                    };
                    break;
                case 'invalid':
                    sampleJson = `{
                        name: "John Doe",
                        age: 30,
                        isActive: true,
                        address: {
                            street: "123 Main St",
                            city: "Anytown",
                        },
                        hobbies: ["reading", "hiking", "coding",]
                    }`;
                    inputEditor.setValue(sampleJson);
                    modal.style.display = 'none';
                    return;
            }
            
            inputEditor.setValue(JSON.stringify(sampleJson, null, 2));
            modal.style.display = 'none';
        });
    });

    // Helper functions
    function showValidationResult(message, type) {
        const panel = document.getElementById('validation-result');
        panel.textContent = message;
        panel.className = 'validation-panel';
        
        switch (type) {
            case 'success':
                panel.classList.add('validation-success');
                break;
            case 'error':
                panel.classList.add('validation-error');
                break;
            case 'warning':
                panel.classList.add('validation-warning');
                break;
            case 'info':
                panel.classList.add('validation-info');
                break;
        }
    }

    function getModeForFormat(format) {
        switch (format) {
            case 'json': return 'ace/mode/json';
            case 'xml': return 'ace/mode/xml';
            case 'yaml': return 'ace/mode/yaml';
            case 'csv': return 'ace/mode/text';
            default: return 'ace/mode/text';
        }
    }

    // Add validation panel styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .validation-success {
            background-color: #d4edda !important;
            border-color: #c3e6cb !important;
            color: #155724;
        }
        .validation-error {
            background-color: #f8d7da !important;
            border-color: #f5c6cb !important;
            color: #721c24;
        }
        .validation-warning {
            background-color: #fff3cd !important;
            border-color: #ffeeba !important;
            color: #856404;
        }
        .validation-info {
            background-color: #d1ecf1 !important;
            border-color: #bee5eb !important;
            color: #0c5460;
        }
    `;
    document.head.appendChild(style);

    // Initialize with empty object
    inputEditor.setValue('{\n    \n}');
});

