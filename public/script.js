
const modelSelect = document.getElementById('model-select');
const promptInput = document.getElementById('prompt-input');
const temperatureSlider = document.getElementById('temperature');
const maxTokensSlider = document.getElementById('max-tokens');
const tempValue = document.getElementById('temp-value');
const tokensValue = document.getElementById('tokens-value');
const generateBtn = document.getElementById('generate-btn');
const btnText = document.querySelector('.btn-text');
const spinner = document.querySelector('.spinner');
const responseContent = document.getElementById('response-content');
const responseMeta = document.getElementById('response-meta');
const modelName = document.getElementById('model-name');
const latency = document.getElementById('latency');
const tokens = document.getElementById('tokens');
const totalRequests = document.getElementById('total-requests');
const avgLatency = document.getElementById('avg-latency');
const refreshStats = document.getElementById('refresh-stats');
const logsContent = document.getElementById('logs-content');

const API_BASE = '';

document.addEventListener('DOMContentLoaded', async () => {
    await loadModels();
    await loadStats();
    await loadLogs();
    setupEventListeners();
});

function setupEventListeners() {
    temperatureSlider.addEventListener('input', (e) => {
        tempValue.textContent = e.target.value;
    });

    maxTokensSlider.addEventListener('input', (e) => {
        tokensValue.textContent = e.target.value;
    });

    generateBtn.addEventListener('click', handleGenerate);

    refreshStats.addEventListener('click', async () => {
        await loadStats();
        await loadLogs();
    });

    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            handleGenerate();
        }
    });
}

async function loadModels() {
    try {
        const response = await fetch(`${API_BASE}/models`);
        const data = await response.json();
        
        modelSelect.innerHTML = '';
        
        if (data.models && data.models.length > 0) {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select a model...';
            modelSelect.appendChild(defaultOption);
            
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.key;
                option.textContent = `${model.name} - ${model.description}`;
                modelSelect.appendChild(option);
            });
        } else {
            modelSelect.innerHTML = '<option value="">No models available</option>';
        }
    } catch (error) {
        console.error('Error loading models:', error);
        modelSelect.innerHTML = '<option value="">Error loading models</option>';
    }
}

// Handle generate button click
async function handleGenerate() {
    const prompt = promptInput.value.trim();
    const model = modelSelect.value;
    
    if (!prompt) {
        showError('Please enter a prompt');
        return;
    }
    
    if (!model) {
        showError('Please select a model');
        return;
    }

    setLoading(true);
    clearResponse();

    try {
        const options = {
            temperature: parseFloat(temperatureSlider.value),
            max_tokens: parseInt(maxTokensSlider.value)
        };

        const response = await fetch(`${API_BASE}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt,
                model,
                options
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Generation failed');
        }

        showResponse(data);
        
        await loadStats();
        await loadLogs();
        
    } catch (error) {
        console.error('Error generating response:', error);
        showError(error.message || 'Failed to generate response');
    } finally {
        setLoading(false);
    }
}

// Show response
function showResponse(data) {
    responseContent.innerHTML = '';
    
    const responseText = document.createElement('div');
    responseText.className = 'response-text';
    responseText.textContent = data.response || 'No response generated';
    responseContent.appendChild(responseText);
    
    modelName.textContent = data.model_name || data.model;
    latency.textContent = `${data.latency_ms}ms`;
    tokens.textContent = `${data.tokens?.total || 0} tokens`;
    responseMeta.style.display = 'flex';
}

function showError(message) {
    responseContent.innerHTML = '';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    responseContent.appendChild(errorDiv);
    
    responseMeta.style.display = 'none';
}

function clearResponse() {
    responseContent.innerHTML = `
        <div class="placeholder">
            <p>💭 Generating response...</p>
            <p>Please wait while the AI processes your request</p>
        </div>
    `;
    responseMeta.style.display = 'none';
}

function setLoading(loading) {
    generateBtn.disabled = loading;
    
    if (loading) {
        btnText.textContent = 'Generating...';
        spinner.style.display = 'block';
    } else {
        btnText.textContent = 'Generate Response';
        spinner.style.display = 'none';
    }
}

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();
        
        totalRequests.textContent = data.total_requests || 0;
        avgLatency.textContent = `${Math.round(data.average_latency || 0)}ms`;
        
        updateModelStats(data.by_model || {});
        
    } catch (error) {
        console.error('Error loading stats:', error);
        totalRequests.textContent = 'Error';
        avgLatency.textContent = 'Error';
    }
}

function updateModelStats(modelStats) {
    const statsContent = document.getElementById('stats-content');
    
    const existingStats = statsContent.querySelectorAll('.stat-item');
    const basicStatsCount = 2;
    
    for (let i = existingStats.length - 1; i >= basicStatsCount; i--) {
        existingStats[i].remove();
    }
    
    Object.entries(modelStats).forEach(([modelKey, stats]) => {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        statItem.innerHTML = `
            <span class="stat-label">${modelKey}:</span>
            <span class="stat-value">${stats.requests} req</span>
        `;
        statsContent.appendChild(statItem);
    });
}

// Load recent logs
async function loadLogs() {
    try {
        const response = await fetch(`${API_BASE}/logs`);
        const data = await response.json();
        
        const logs = data.logs || [];
        
        if (logs.length === 0) {
            logsContent.innerHTML = '<p class="no-logs">No requests yet</p>';
            return;
        }
        
        const recentLogs = logs.slice(-10).reverse();
        
        logsContent.innerHTML = '';
        recentLogs.forEach(log => {
            const logItem = document.createElement('div');
            logItem.className = 'log-item';
            
            const prompt = log.prompt || 'No prompt';
            const truncatedPrompt = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
            
            const date = new Date(log.timestamp).toLocaleTimeString();
            const status = log.status === 'success' ? '✅' : '❌';
            
            logItem.innerHTML = `
                <div class="log-prompt">${truncatedPrompt}</div>
                <div class="log-meta">
                    <span>${status} ${log.model || 'Unknown'}</span>
                    <span>${date}</span>
                </div>
            `;
            
            logsContent.appendChild(logItem);
        });
        
    } catch (error) {
        console.error('Error loading logs:', error);
        logsContent.innerHTML = '<p class="no-logs">Error loading logs</p>';
    }
}

function formatTime(ms) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

function formatNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
} 