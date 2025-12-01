// Game Manager
// Handles high-level game flow, start/end, reset, and victory conditions

// End game
function endGame(winner) {
    gameState.isProcessing = true; // Prevent further attacks
    gameState.aiAttacking = false;
    
    // Clear any timers
    if (gameState.playerResponseTimer) {
        clearInterval(gameState.playerResponseTimer);
    }
    hideTimerDisplay();
    
    // Show appropriate message
    let message;
    if (winner === 'blue') {
        message = `🏆 VICTORY! YOU WIN! 🏆`;
    } else {
        message = `💀 DEFEAT! AI WINS! 💀`;
    }
    
    showMessage(message, 'blue');
    showMessage(message, 'red');
    
    // Reset camera to original position
    if (typeof resetCamera === 'function') {
        resetCamera();
    }
    
    // Show victory animation
    createVictoryEffect(winner);
    
    // Show restart button
    setTimeout(() => {
        const winText = winner === 'blue' ? 'You won!' : 'AI won!';
        if (confirm(`${winText} Play again?`)) {
            resetGame();
        }
    }, 2000);
}

// Reset game state
function resetGame() {
    // Clear all state
    gameState.currentActiveAttack = null;
    gameState.blueHealth = 100;
    gameState.redHealth = 100;
    gameState.battleHistory = [];
    gameState.isProcessing = false;
    gameState.gameStarted = false;
    gameState.aiAttacking = false;
    gameState.aiWalkingCharacter = null;
    
    // Clear timers
    if (gameState.playerResponseTimer) {
        clearInterval(gameState.playerResponseTimer);
        gameState.playerResponseTimer = null;
    }
    
    updateHealthBar('blue', 100);
    updateHealthBar('red', 100);
    
    clearInputs();
    hideTimerDisplay();
    
    const logContainer = document.getElementById('battle-log-content');
    if (logContainer) {
        logContainer.innerHTML = '';
    }
    
    // Re-enable input
    const blueInput = document.getElementById('blue-input');
    if (blueInput) {
        blueInput.disabled = false;
    }
    
    // Reset camera to original position
    if (typeof resetCamera === 'function') {
        resetCamera();
    }
    
    // Start game again with splash screen
    if (typeof showSplashScreen === 'function') {
        showSplashScreen();
    } else {
        // Fallback: start AI attack directly
        setTimeout(() => {
            gameState.gameStarted = true;
            initiateAIAttack();
        }, 1000);
    }
}

