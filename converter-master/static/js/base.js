
document.addEventListener('DOMContentLoaded', function() {
    // Initialize editors
    const inputEditor = ace.edit("json-editor");
    inputEditor.setTheme("ace/theme/tomorrow");
    inputEditor.session.setMode("ace/mode/json");
    inputEditor.setOptions({
        fontSize: "13px",
        tabSize: 4,
        useSoftTabs: true,
        showPrintMargin: false,
        highlightActiveLine: true,
        highlightSelectedWord: true,
        showLineNumbers: true,
        showGutter: true,
        autoScrollEditorIntoView: true
    });
    
    // Add subtle guide lines
    inputEditor.renderer.setOption("showInvisibles", true);
    inputEditor.renderer.setOption("highlightGutterLine", true);
    
    const outputEditor = ace.edit("output-editor");
    outputEditor.setTheme("ace/theme/tomorrow");
    outputEditor.session.setMode("ace/mode/json");
    outputEditor.setOptions({
        fontSize: "13px",
        tabSize: 4,
        useSoftTabs: true,
        showPrintMargin: false,
        highlightActiveLine: false,
        readOnly: true,
        showLineNumbers: true,
        showGutter: true
    });

    // Initialize JSON tree viewer
    const treeContainer = document.getElementById('tree-view');
    const treeEditor = new JSONEditor(treeContainer, {
        mode: 'tree',
        modes: ['tree', 'view', 'form'],
        search: true,
        history: true,
        onChange: function() {
            try {
                const json = treeEditor.get();
                inputEditor.setValue(JSON.stringify(json, null, 4));
                updateStatus('success', 'Tree updated');
            } catch (err) {
                updateStatus('error', err.message);
            }
        }
    });

    // Initialize form editor
    const formContainer = document.getElementById('form-view');
    const formEditor = new JSONEditor(formContainer, {
        mode: 'form',
        modes: ['form', 'tree', 'view'],
        disable_array_add: false,
        disable_array_delete: false,
        disable_array_reorder: false,
        disable_collapse: false,
        disable_edit_json: true,
        disable_properties: false,
        onChange: function() {
            try {
                const json = formEditor.get();
                inputEditor.setValue(JSON.stringify(json, null, 4));
                updateStatus('success', 'Form updated');
            } catch (err) {
                updateStatus('error', err.message);
            }
        }
    });

    // View switching
    const viewButtons = document.querySelectorAll('.view-btn');
    const viewContents = document.querySelectorAll('.view-content');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const view = button.dataset.view;
            
            // Update active button
            viewButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active view
            viewContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${view}-view`).classList.add('active');
            
            // If switching to tree or form view, try to parse the JSON
            if (view === 'tree' || view === 'form') {
                try {
                    const json = JSON.parse(inputEditor.getValue());
                    if (view === 'tree') {
                        treeEditor.set(json);
                    } else {
                        formEditor.set(json);
                    }
                    updateStatus('success', 'JSON is valid');
                } catch (err) {
                    updateStatus('error', err.message);
                }
            }
        });
    });

    
    // Process button (main action)
    document.getElementById('process-btn').addEventListener('click', processJSON);
    
    function processJSON() {
        try {
            const input = inputEditor.getValue();
            const format = document.getElementById('output-format').value;
            const indent = document.getElementById('indent-size').value;
            
            // First validate JSON
            const json = JSON.parse(input);
            
            // Process based on output format
            let result;
            switch (format) {
                case 'json':
                    const indentSize = indent === 'tab' ? '\t' : parseInt(indent);
                    result = JSON.stringify(json, null, indentSize);
                    break;
                case 'yaml':
                    result = jsyaml.dump(json);
                    break;
                case 'xml':
                    const x2js = new X2JS();
                    result = x2js.json2xml_str(json);
                    break;
                case 'csv':
                    const parser = new json2csv.Parser();
                    result = parser.parse(json);
                    break;
                default:
                    throw new Error('Unsupported format');
            }
            
            // Set output
            outputEditor.setValue(result);
            outputEditor.session.setMode(getModeForFormat(format));
            
            // Update output info
            updateOutputInfo(result);
            updateStatus('success', `Converted to ${format.toUpperCase()} successfully`);
            
        } catch (err) {
            updateStatus('error', err.message);
            updateOutputInfo('');
        }
    }
    
    // Format button
    document.getElementById('format-btn').addEventListener('click', function() {
        try {
            const json = inputEditor.getValue();
            const indent = document.getElementById('indent-size').value;
            const indentSize = indent === 'tab' ? '\t' : parseInt(indent);
            
            const formatted = js_beautify(json, {
                indent_size: indentSize,
                indent_char: indent === 'tab' ? '\t' : ' ',
                indent_with_tabs: indent === 'tab',
                wrap_line_length: 100,
                brace_style: 'collapse,preserve-inline'
            });
            
            inputEditor.setValue(formatted);
            updateStatus('success', 'JSON formatted');
        } catch (err) {
            updateStatus('error', err.message);
        }
    });
    
    // Minify button
    document.getElementById('minify-btn').addEventListener('click', function() {
        try {
            const json = inputEditor.getValue();
            const minified = JSON.stringify(JSON.parse(json));
            inputEditor.setValue(minified);
            updateStatus('success', 'JSON minified');
        } catch (err) {
            updateStatus('error', err.message);
        }
    });
    
    // Validate button
    document.getElementById('validate-btn').addEventListener('click', function() {
        try {
            JSON.parse(inputEditor.getValue());
            updateStatus('success', 'Valid JSON');
        } catch (err) {
            updateStatus('error', err.message);
        }
    });
    
    // Auto-fix button
    document.getElementById('fix-btn').addEventListener('click', function() {
        try {
            // Try to parse first
            JSON.parse(inputEditor.getValue());
            updateStatus('info', 'JSON is already valid');
        } catch (err) {
            let jsonString = inputEditor.getValue();
            
            // Common fixes
            jsonString = jsonString
                .replace(/'/g, '"') // Single to double quotes
                .replace(/,\s*([}\]])/g, '$1') // Trailing commas
                .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3') // Unquoted keys
                .replace(/\\'/g, "'") // Escaped single quotes
                .replace(/\\"/g, '"') // Escaped double quotes
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control chars
            
            try {
                JSON.parse(jsonString);
                inputEditor.setValue(jsonString);
                updateStatus('success', 'Fixed common JSON issues');
            } catch (fixErr) {
                updateStatus('error', 'Unable to auto-fix: ' + fixErr.message);
            }
        }
    });
    
    // Copy output
    document.getElementById('copy-output').addEventListener('click', function() {
        const output = outputEditor.getValue();
        if (!output) {
            updateStatus('warning', 'No output to copy');
            return;
        }
        
        navigator.clipboard.writeText(output).then(() => {
            showTooltip(this, 'Copied to clipboard!');
            updateStatus('success', 'Copied to clipboard');
        }).catch(err => {
            updateStatus('error', 'Failed to copy: ' + err.message);
        });
    });
    
    // Download output
    document.getElementById('download-output').addEventListener('click', function() {
        const output = outputEditor.getValue();
        if (!output) {
            updateStatus('warning', 'No output to download');
            return;
        }
        
        const format = document.getElementById('output-format').value;
        const filename = `json-tool-output.${format}`;
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        updateStatus('success', 'Download started');
    });
    
    // Share output
    document.getElementById('share-output').addEventListener('click', function() {
        const output = outputEditor.getValue();
        if (!output) {
            updateStatus('warning', 'No output to share');
            return;
        }
        
        if (navigator.share) {
            navigator.share({
                title: 'JSON Tool Output',
                text: 'Check out this JSON data:',
                url: 'data:text/plain;charset=utf-8,' + encodeURIComponent(output)
            }).catch(err => {
                updateStatus('error', 'Error sharing: ' + err.message);
            });
        } else {
            // Fallback
            navigator.clipboard.writeText(output).then(() => {
                showTooltip(this, 'Output copied to clipboard!');
                updateStatus('success', 'Copied to clipboard (share not supported)');
            });
        }
    });
    
    // File upload
    document.getElementById('upload-json').addEventListener('click', function() {
        document.getElementById('json-file-input').click();
    });
    
    document.getElementById('json-file-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            inputEditor.setValue(e.target.result);
            updateStatus('success', `Loaded ${file.name}`);
            addHistoryItem(`Uploaded: ${file.name}`);
        };
        reader.onerror = function() {
            updateStatus('error', 'Error reading file');
        };
        reader.readAsText(file);
        
        // Reset input to allow re-uploading the same file
        e.target.value = '';
    });
    
    // Paste from clipboard
    document.getElementById('paste-json').addEventListener('click', function() {
        navigator.clipboard.readText().then(text => {
            inputEditor.setValue(text);
            updateStatus('success', 'Pasted from clipboard');
            addHistoryItem('Pasted from clipboard');
        }).catch(err => {
            updateStatus('error', 'Failed to read clipboard: ' + err.message);
        });
    });
    
    // URL import
    document.getElementById('load-url').addEventListener('click', function() {
        const url = document.getElementById('json-url').value.trim();
        if (!url) {
            updateStatus('warning', 'Please enter a URL');
            return;
        }
        
        if (!url.match(/^https?:\/\//i)) {
            updateStatus('error', 'Invalid URL - must start with http:// or https://');
            return;
        }
        
        updateStatus('info', 'Fetching JSON from URL...');
        
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.text();
            })
            .then(text => {
                inputEditor.setValue(text);
                updateStatus('success', 'URL loaded successfully');
                addHistoryItem(`Loaded from: ${url}`);
            })
            .catch(err => {
                updateStatus('error', 'Failed to load URL: ' + err.message);
            });
    });
    
    // Schema validation
    document.getElementById('validate-schema').addEventListener('click', async function() {
        try {
            const json = JSON.parse(inputEditor.getValue());
            const schemaText = document.getElementById('schema-input').value.trim();
            
            if (!schemaText) {
                updateStatus('warning', 'Please enter a JSON Schema');
                return;
            }
            
            const schema = JSON.parse(schemaText);
            const ajv = new Ajv({ allErrors: true, verbose: true });
            const validate = ajv.compile(schema);
            const valid = validate(json);
            
            if (valid) {
                updateStatus('success', 'JSON validates against the schema');
            } else {
                let errors = 'Schema validation failed:\n';
                validate.errors.forEach((err, index) => {
                    errors += `${index + 1}. ${err.instancePath || 'root'}: ${err.message}\n`;
                });
                updateStatus('error', errors);
            }
        } catch (err) {
            updateStatus('error', 'Schema validation error: ' + err.message);
        }
    });
    
    // Sample JSON modal
    const sampleModal = document.getElementById('sample-modal');
    const openSampleModal = document.getElementById('load-sample');
    const closeSampleModal = document.querySelector('.close-modal');
    
    openSampleModal.addEventListener('click', () => {
        sampleModal.style.display = 'flex';
    });
    
    closeSampleModal.addEventListener('click', () => {
        sampleModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === sampleModal) {
            sampleModal.style.display = 'none';
        }
    });
    
    // Sample buttons
    document.querySelectorAll('.sample-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const sampleType = this.dataset.sample;
            let sampleJson;
            
            switch (sampleType) {
                case 'simple-object':
                    sampleJson = {
                        "name": "John Doe",
                        "age": 35,
                        "isActive": true,
                        "address": {
                            "street": "123 Main St",
                            "city": "Anytown"
                        }
                    };
                    break;
                case 'array':
                    sampleJson = [
                        {"id": 1, "name": "Alice", "role": "admin"},
                        {"id": 2, "name": "Bob", "role": "user"},
                        {"id": 3, "name": "Charlie", "role": "user"}
                    ];
                    break;
                case 'nested':
                    sampleJson = {
                        "users": [
                            {
                                "id": 1,
                                "profile": {
                                    "name": "Alice",
                                    "preferences": {
                                        "theme": "dark",
                                        "notifications": true
                                    }
                                }
                            }
                        ],
                        "metadata": {
                            "created": "2023-01-01",
                            "version": "1.0.0"
                        }
                    };
                    break;
                case 'api-response':
                    sampleJson = {
                        "status": "success",
                        "data": {
                            "products": [
                                {
                                    "id": "p1",
                                    "name": "Laptop",
                                    "price": 999.99,
                                    "inStock": true
                                },
                                {
                                    "id": "p2",
                                    "name": "Phone",
                                    "price": 699.99,
                                    "inStock": false
                                }
                            ],
                            "total": 2
                        }
                    };
                    break;
                case 'config':
                    sampleJson = {
                        "$schema": "http://json-schema.org/draft-07/schema#",
                        "appName": "MyApp",
                        "version": "2.3.1",
                        "settings": {
                            "debug": false,
                            "maxConnections": 10,
                            "timeout": 30
                        },
                        "plugins": ["analytics", "logger", "notifications"]
                    };
                    break;
                case 'geo':
                    sampleJson = {
                        "type": "FeatureCollection",
                        "features": [
                            {
                                "type": "Feature",
                                "geometry": {
                                    "type": "Point",
                                    "coordinates": [102.0, 0.5]
                                },
                                "properties": {
                                    "name": "Sample Point"
                                }
                            }
                        ]
                    };
                    break;
                case 'invalid':
                    sampleJson = `{
                        name: "John",
                        age: 30,
                        isActive: true,
                        address: {
                            street: "123 Main",
                            city: "Anytown",
                        },
                        tags: ["user", "test",]
                    }`;
                    inputEditor.setValue(sampleJson);
                    sampleModal.style.display = 'none';
                    updateStatus('warning', 'Loaded invalid JSON sample');
                    return;
                case 'large':
                    // Generate a large sample
                    sampleJson = {
                        "metadata": { "generated": new Date().toISOString() },
                        "data": Array(100).fill().map((_, i) => ({
                            "id": `item-${i}`,
                            "value": Math.random(),
                            "nested": Array(5).fill().map((_, j) => ({
                                "id": `nested-${i}-${j}`,
                                "flag": j % 2 === 0
                            }))
                        }))
                    };
                    break;
                case 'unicode':
                    sampleJson = {
                        "description": "Sample with Unicode characters",
                        "languages": {
                            "japanese": "日本語",
                            "chinese": "中文",
                            "russian": "Русский",
                            "emoji": "😀🚀🌈"
                        }
                    };
                    break;
                default:
                    sampleJson = {};
            }
            
            inputEditor.setValue(JSON.stringify(sampleJson, null, 4));
            sampleModal.style.display = 'none';
            updateStatus('success', `Loaded ${sampleType.replace('-', ' ')} sample`);
            addHistoryItem(`Loaded sample: ${sampleType.replace('-', ' ')}`);
        });
    });
    
    // Clear all button
    document.getElementById('clear-all').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all content?')) {
            inputEditor.setValue('');
            outputEditor.setValue('');
            updateStatus('info', 'Cleared all content');
            updateOutputInfo('');
            addHistoryItem('Cleared all content');
        }
    });
    
    // Sidebar toggle
    const sidebar = document.getElementById('advanced-sidebar');
    const toggleSidebar = document.getElementById('toggle-sidebar');
    const closeSidebar = document.querySelector('.close-sidebar');
    
    toggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
    
    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });
    
    // History functionality
    const history = [];
    let historyIndex = -1;
    const historyList = document.getElementById('history-items');
    
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
            updateStatus('info', 'Undo');
        }
    });
    
    document.getElementById('redo-btn').addEventListener('click', function() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            inputEditor.setValue(history[historyIndex]);
            inputEditor.clearSelection();
            updateHistoryButtons();
            updateStatus('info', 'Redo');
        }
    });
    
    function updateHistoryButtons() {
        document.getElementById('undo-btn').disabled = historyIndex <= 0;
        document.getElementById('redo-btn').disabled = historyIndex >= history.length - 1;
    }
    
    function addHistoryItem(action) {
        const now = new Date();
        const time = now.toLocaleTimeString();
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `<span class="history-time">${time}</span> ${action}`;
        historyList.insertBefore(item, historyList.firstChild);
        
        // Limit history items
        if (historyList.children.length > 10) {
            historyList.removeChild(historyList.lastChild);
        }
    }
    
    // Transformation buttons
    document.getElementById('flatten-json').addEventListener('click', function() {
        try {
            const json = JSON.parse(inputEditor.getValue());
            const flattened = flattenObject(json);
            inputEditor.setValue(JSON.stringify(flattened, null, 4));
            updateStatus('success', 'JSON flattened');
            addHistoryItem('Applied: Flatten JSON');
        } catch (err) {
            updateStatus('error', err.message);
        }
    });
    
    document.getElementById('unflatten-json').addEventListener('click', function() {
        try {
            const json = JSON.parse(inputEditor.getValue());
            const unflattened = unflattenObject(json);
            inputEditor.setValue(JSON.stringify(unflattened, null, 4));
            updateStatus('success', 'JSON unflattened');
            addHistoryItem('Applied: Unflatten JSON');
        } catch (err) {
            updateStatus('error', err.message);
        }
    });
    
    document.getElementById('sort-keys').addEventListener('click', function() {
        try {
            const json = JSON.parse(inputEditor.getValue());
            const sorted = sortObjectKeys(json);
            inputEditor.setValue(JSON.stringify(sorted, null, 4));
            updateStatus('success', 'Object keys sorted');
            addHistoryItem('Applied: Sort keys');
        } catch (err) {
            updateStatus('error', err.message);
        }
    });
    
    // Helper functions
    function updateStatus(type, message) {
        const inputStatus = document.getElementById('input-status');
        const icon = inputStatus.querySelector('.status-icon');
        const text = inputStatus.querySelector('.status-text');
        
        inputStatus.className = `status-indicator status-${type}`;
        icon.className = `status-icon fas ${
            type === 'success' ? 'fa-check-circle' :
            type === 'error' ? 'fa-times-circle' :
            type === 'warning' ? 'fa-exclamation-triangle' :
            'fa-info-circle'
        }`;
        text.textContent = message;
    }
    
    function updateOutputInfo(content) {
        const size = new Blob([content]).size;
        const lines = content ? content.split('\n').length : 0;
        
        document.getElementById('output-size').textContent = formatBytes(size);
        document.getElementById('output-lines').textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
    }
    
    function formatBytes(bytes) {
        if (bytes === 0) return '0 bytes';
        const k = 1024;
        const sizes = ['bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]);
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
    
    function showTooltip(element, message) {
        const tooltip = document.getElementById('global-tooltip');
        tooltip.textContent = message;
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width/2}px`;
        tooltip.style.top = `${rect.top - 40}px`;
        
        tooltip.classList.add('show');
        setTimeout(() => tooltip.classList.remove('show'), 2000);
    }
    
    function flattenObject(obj, prefix = '') {
        return Object.keys(obj).reduce((acc, k) => {
            const pre = prefix.length ? prefix + '.' : '';
            if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
                Object.assign(acc, flattenObject(obj[k], pre + k));
            } else {
                acc[pre + k] = obj[k];
            }
            return acc;
        }, {});
    }
    
    function unflattenObject(obj) {
        return Object.keys(obj).reduce((acc, k) => {
            const keys = k.split('.');
            keys.reduce((a, e, i) => {
                if (i === keys.length - 1) {
                    a[e] = obj[k];
                } else if (!a[e]) {
                    a[e] = {};
                }
                return a[e];
            }, acc);
            return acc;
        }, {});
    }
    
    function sortObjectKeys(obj) {
        if (Array.isArray(obj)) {
            return obj.map(item => sortObjectKeys(item));
        } else if (typeof obj === 'object' && obj !== null) {
            return Object.keys(obj)
                .sort()
                .reduce((sorted, key) => {
                    sorted[key] = sortObjectKeys(obj[key]);
                    return sorted;
                }, {});
        }
        return obj;
    }
    
    // Initialize with empty object
    inputEditor.setValue('{\n    \n}');
    inputEditor.focus();
});



