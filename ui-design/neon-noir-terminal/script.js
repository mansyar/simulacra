// NEON NOIR TERMINAL - Interactive JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initTerminal();
    initSystemStats();
    initVisualizer();
    initCommandInput();
    initHexGrid();
    initKeyDisplay();
    initTimestamp();
});

// Terminal Animation
function initTerminal() {
    const output = document.getElementById('terminal-output');
    const lines = output.querySelectorAll('.output-line');
    
    lines.forEach((line, index) => {
        setTimeout(() => {
            line.style.opacity = '1';
            line.style.transform = 'translateX(0)';
        }, index * 300);
    });
}

// System Stats Simulation
function initSystemStats() {
    const cpuBar = document.getElementById('cpu-bar');
    const cpuValue = document.getElementById('cpu-value');
    const memoryBar = document.getElementById('memory-bar');
    const memoryValue = document.getElementById('memory-value');
    const networkBar = document.getElementById('network-bar');
    const networkValue = document.getElementById('network-value');

    function updateStats() {
        const cpu = Math.floor(Math.random() * 60) + 20;
        const memory = Math.floor(Math.random() * 50) + 30;
        const network = Math.floor(Math.random() * 80) + 10;

        cpuBar.style.width = `${cpu}%`;
        cpuValue.textContent = `${cpu}%`;
        
        memoryBar.style.width = `${memory}%`;
        memoryValue.textContent = `${memory}%`;
        
        networkBar.style.width = `${network}%`;
        networkValue.textContent = `${network}%`;
    }

    updateStats();
    setInterval(updateStats, 2000);
}

// Audio Visualizer
function initVisualizer() {
    const visualizer = document.getElementById('visualizer');
    const barCount = 20;

    for (let i = 0; i < barCount; i++) {
        const bar = document.createElement('div');
        bar.className = 'visualizer-bar';
        bar.style.height = `${Math.random() * 60 + 20}%`;
        visualizer.appendChild(bar);
    }

    const bars = visualizer.querySelectorAll('.visualizer-bar');
    
    function animateBars() {
        bars.forEach(bar => {
            const height = Math.random() * 80 + 10;
            bar.style.height = `${height}%`;
        });
        requestAnimationFrame(animateBars);
    }

    animateBars();
}

// Command Input Handler
function initCommandInput() {
    const input = document.getElementById('command-input');
    const history = document.getElementById('command-history');
    const commandHistory = [];
    let historyIndex = -1;

    const commands = {
        'help': 'Available commands: help, clear, status, date, whoami, reboot',
        'clear': () => { history.innerHTML = ''; return 'Terminal cleared'; },
        'status': 'All systems operational. Neural interface: ONLINE',
        'date': new Date().toString(),
        'whoami': 'root',
        'reboot': () => { setTimeout(() => location.reload(), 2000); return 'Initiating reboot sequence...'; }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = input.value.trim().toLowerCase();
            
            if (command) {
                commandHistory.push(command);
                historyIndex = -1;

                const promptLine = document.createElement('div');
                promptLine.innerHTML = `<span class="prompt">➜</span> <span class="command">${command}</span>`;
                history.appendChild(promptLine);

                let response;
                if (commands[command]) {
                    response = typeof commands[command] === 'function' 
                        ? commands[command]() 
                        : commands[command];
                } else {
                    response = `Command not found: ${command}. Type 'help' for available commands.`;
                }

                if (response) {
                    const responseLine = document.createElement('div');
                    responseLine.className = 'output-line';
                    responseLine.textContent = response;
                    history.appendChild(responseLine);
                }

                input.value = '';
                history.scrollTop = history.scrollHeight;
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                input.value = commandHistory[commandHistory.length - 1 - historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > -1) {
                historyIndex--;
                input.value = historyIndex === -1 ? '' : commandHistory[commandHistory.length - 1 - historyIndex];
            }
        }
    });
}

// Hex Grid Interaction
function initHexGrid() {
    const hexGrid = document.getElementById('hex-grid');
    const hexChars = 'ABCDEF0123456789';
    const gridSize = 24;

    for (let i = 0; i < gridSize; i++) {
        const cell = document.createElement('div');
        cell.className = 'hex-cell';
        cell.textContent = hexChars[Math.floor(Math.random() * hexChars.length)];
        
        cell.addEventListener('click', () => {
            cell.style.backgroundColor = '#ff00ff';
            cell.style.borderColor = '#ff00ff';
            cell.style.boxShadow = '0 0 15px #ff00ff';
            
            setTimeout(() => {
                cell.style.backgroundColor = '';
                cell.style.borderColor = '';
                cell.style.boxShadow = '';
            }, 300);
        });

        hexGrid.appendChild(cell);
    }
}

// Key Display Animation
function initKeyDisplay() {
    const keyChars = document.querySelectorAll('.key-char');
    
    function animateKeys() {
        const randomIndex = Math.floor(Math.random() * keyChars.length);
        const char = keyChars[randomIndex];
        const originalText = char.textContent;
        const hexChars = 'ABCDEF0123456789';
        
        let count = 0;
        const interval = setInterval(() => {
            char.textContent = hexChars[Math.floor(Math.random() * hexChars.length)];
            count++;
            
            if (count > 10) {
                clearInterval(interval);
                char.textContent = originalText;
            }
        }, 50);
    }

    setInterval(animateKeys, 3000);
}

// Timestamp Update
function initTimestamp() {
    const timestamp = document.getElementById('timestamp');
    
    function updateTimestamp() {
        const now = new Date();
        timestamp.textContent = now.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(',', '');
    }

    updateTimestamp();
    setInterval(updateTimestamp, 1000);
}

// Glitch effect on mouse move for cards
document.querySelectorAll('.glitch-card, .asymmetric-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const intensity = Math.min(x, y, rect.width - x, rect.height - y) / 100;
        card.style.boxShadow = `0 0 ${30 + intensity * 20}px rgba(0, 243, 255, ${0.3 + intensity * 0.2})`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.boxShadow = '';
    });
});

// Module item interactions
document.querySelectorAll('.module-item').forEach(item => {
    item.addEventListener('click', () => {
        const status = item.querySelector('.module-status');
        if (status) {
            status.classList.toggle('online');
            status.classList.toggle('offline');
            status.textContent = status.classList.contains('online') ? 'ONLINE' : 'STANDBY';
        }
    });
});
