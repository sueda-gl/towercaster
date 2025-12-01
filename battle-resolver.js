// Battle Resolver
// Handles battle resolution logic and damage calculation

// Add entry to battle history (updated for 5-outcome system)
function addToBattleHistory(attackConcept, defendConcept, explanation, outcome_type, damage) {
    const entry = {
        timestamp: new Date().toLocaleTimeString(),
        attack: attackConcept,
        defend: defendConcept,
        explanation: explanation,
        outcome_type: outcome_type,
        damage: damage
    };
    
    gameState.battleHistory.push(entry);
    
    // Increment battle count
    if (gameState.battleCount !== undefined) {
        gameState.battleCount++;
    }
    
    // Update battle log UI
    updateBattleLog(entry);
}

// Update health and check for victory
function updateHealth(team, damage) {
    console.log(`[Health Update] ${team} team taking ${damage} damage`);
    
    // Show damage indicator animation
    if (damage > 0 && typeof showDamageNumber === 'function') {
        showDamageNumber(team, damage);
    }
    
    if (team === 'blue') {
        gameState.blueHealth = Math.max(0, gameState.blueHealth - damage);
        updateHealthBar('blue', gameState.blueHealth);
    } else {
        gameState.redHealth = Math.max(0, gameState.redHealth - damage);
        updateHealthBar('red', gameState.redHealth);
    }
    
    // Check for victory
    if (gameState.blueHealth <= 0) {
        endGame('red');
    } else if (gameState.redHealth <= 0) {
        endGame('blue');
    }
}

// Send visual impact wave from center to losing tower
async function sendImpactWaveToTower(team) {
    // This will be implemented in index.html
    if (typeof createImpactWave === 'function') {
        console.log(`Awaiting impact wave animation for ${team} team...`);
        await createImpactWave(team);
        console.log(`Impact wave animation for ${team} team complete`);
    }
}

// Resolve the battle based on LLM response
async function resolveBattle(attackConcept, defendConcept, attackTeam, defendTeam, result) {
    const { reasoning, outcome, damage } = result;
    
    // Display reasoning on both sides
    displayReasoning(reasoning, attackTeam);
    displayReasoning(reasoning, defendTeam);
    
    // Create and animate attack visuals - they will fly to center
    const attackVisual = await createAttackVisual(attackConcept, attackTeam);
    const defendVisual = await createAttackVisual(defendConcept, defendTeam);
    
    // Tag visuals with their team for later identification
    attackVisual.userData.team = attackTeam;
    defendVisual.userData.team = defendTeam;
    
    console.log('Launching projectiles to center...');
    
    // Animate both projectiles to center
    await Promise.all([
        animateAttack(attackVisual, attackTeam, defendTeam),
        animateAttack(defendVisual, defendTeam, attackTeam)
    ]);
    
    console.log('Projectiles reached center, showing collision...');
    
    // Determine who takes damage and show collision
    let damagedTeam;
    let winningTeam;
    let resultMessage;
    
    if (outcome === 'DEFEAT') {
        damagedTeam = defendTeam;
        winningTeam = attackTeam;
        resultMessage = `✨ ${attackConcept} defeats ${defendConcept}!`;
    } else if (outcome === 'BLOCKED') {
        damagedTeam = attackTeam;
        winningTeam = defendTeam;
        resultMessage = `🛡️ ${defendConcept} blocks ${attackConcept}!`;
    } else {
        // NEUTRAL - both take half damage
        await createCenterCollision(attackVisual, defendVisual, 'neutral');
        
        // Wait longer for the dramatic collision effect
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        updateHealth('blue', damage / 2);
        updateHealth('red', damage / 2);
        resultMessage = `⚔️ ${attackConcept} and ${defendConcept} clash evenly!`;
        
        showMessage(resultMessage, attackTeam);
        showMessage(resultMessage, defendTeam);
        
        addToBattleHistory(attackConcept, defendConcept, reasoning, resultMessage, damage);
        
        // Wait for character fade-out animation to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('Neutral battle complete');
        return;
    }
    
    // Show collision with winner
    await createCenterCollision(attackVisual, defendVisual, winningTeam);
    
    // Wait longer for the dramatic collision effect
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Apply damage to the losing side
    updateHealth(damagedTeam, damage);
    
    // Send impact wave to losing team's towers
    sendImpactWaveToTower(damagedTeam);
    
    // Show result
    showMessage(resultMessage, attackTeam);
    showMessage(resultMessage, defendTeam);
    
    // Add to battle history
    addToBattleHistory(attackConcept, defendConcept, reasoning, resultMessage, damage);
    
    // Wait for character fade-out animation to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
}

