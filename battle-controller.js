// Battle Controller
// Main battle orchestration - coordinates attack input and battle flow

// Handle attack input from a team (PLAYER ONLY in single-player mode)
async function handleAttackInput(concept, team) {
    console.log(`Attack input from ${team}: "${concept}"`);
    
    // Only allow blue team (player) to input
    if (team !== 'blue') {
        console.log('Red team is AI controlled, ignoring input');
        return;
    }
    
    if (!concept || concept.trim().length === 0) {
        showMessage('Please enter a concept!', team);
        return;
    }

    concept = concept.trim();

    // If already processing battle, ignore
    if (gameState.isProcessing) {
        showMessage('Battle in progress...', team);
        return;
    }

    // Check if AI is attacking and player is responding within time window
    if (gameState.aiAttacking && gameState.currentActiveAttack && gameState.currentActiveAttack.team === 'red') {
        console.log(`Player responding to AI attack with: ${concept}`);
        
        // Cancel the timeout timer
        if (gameState.playerResponseTimer) {
            clearInterval(gameState.playerResponseTimer);
            gameState.playerResponseTimer = null;
        }
        hideTimerDisplay();
        
        // Lock input and show player concept
        displayConcept(concept, 'blue', 'defending');
        showMessage(`🛡️ ${concept} defending!`, 'blue');
        
        // Disable input field
        const blueInput = document.getElementById('blue-input');
        if (blueInput) {
            blueInput.disabled = true;
        }
        
        // Start battle resolution
        gameState.isProcessing = true;
        
        const attackingConcept = gameState.currentActiveAttack.concept; // AI's concept
        const defendingConcept = concept; // Player's concept
        const attackingTeam = 'red';
        const defendingTeam = 'blue';

        // Show thinking indicator
        showMessage('🤔 Analyzing interaction...', 'blue');
        showMessage('🤔 Analyzing interaction...', 'red');

        // Declare variables outside try block so they're accessible in finally
        let reasoningPromise = null;
        let result = null;
        let llmPromise = null;

        try {
            // Create player's visual
            const defendVisual = await createAttackVisual(defendingConcept, defendingTeam);
            defendVisual.userData.team = defendingTeam;
            
            // START LLM REASONING IMMEDIATELY (in parallel with animations)
            // Don't await yet - let it think while animations play!
            console.log('[Optimization] Starting LLM reasoning in parallel with animations...');
            llmPromise = callOpenAI(attackingConcept, defendingConcept);
            
            // Update status to show we're analyzing
            showMessage('🤔 AI analyzing your defense...', 'blue');
            showMessage('🤔 AI analyzing defense...', 'red');
            
            // Get AI's already created visual
            const attackVisual = gameState.aiWalkingCharacter || gameState.currentActiveAttack.visual;
            if (attackVisual) {
                attackVisual.userData.team = attackingTeam;
            }
            
            // Stop AI walking animation and spawn player character
            // LLM is thinking in the background during this!
            if (typeof stopAIWalkAndStartBattle === 'function') {
                await stopAIWalkAndStartBattle(attackVisual, defendVisual, attackingTeam, defendingTeam);
            } else {
                // Fallback: use existing animation
                console.log('Launching projectiles to center...');
                await Promise.all([
                    animateAttack(attackVisual, attackingTeam, defendingTeam),
                    animateAttack(defendVisual, defendingTeam, attackingTeam)
                ]);
            }
            
            // START STANDOFF LOOP - Characters interact while waiting for LLM
            console.log('[Standoff] Starting interactive standoff animation...');
            let stopStandoff = null;
            if (typeof startCharacterStandoffLoop === 'function') {
                stopStandoff = startCharacterStandoffLoop(attackVisual, defendVisual);
            }
            
            // NOW await LLM result (standoff loop continues during wait!)
            console.log('[Optimization] Standoff active, awaiting LLM result...');
            result = await llmPromise;
            
            // STOP STANDOFF - LLM response received
            if (stopStandoff) {
                stopStandoff();
                console.log('[Standoff] Stopped - transitioning to collision...');
            }
            
            // Camera transition before collision
            if (typeof cameraPrepareForCollision === 'function') {
                await cameraPrepareForCollision(400);
            } else {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            console.log('[5-Outcome System] Result:', result);
            
            // Extract new JSON structure
            const { winner, outcome_type, attacker_damage, defender_damage, damage_amount, explanation, teaching_point } = result;
            
            // Start reasoning display (don't await - let it run in parallel with animations)
            reasoningPromise = displayReasoningWithOutcome(explanation, outcome_type, 'blue');
            displayReasoningWithOutcome(explanation, outcome_type, 'red'); // Second call returns immediately (team check)
            
            console.log('Projectiles reached center, showing collision...');
            
            // Handle each of the 5 outcome types
            switch(outcome_type) {
                case 'direct_win':
                    console.log('[DIRECT_WIN] Defender wins - clean victory!');
                    // Show collision with defender winning
                    await createCenterCollision(attackVisual, defendVisual, 'blue');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // Apply damage to attacker's tower (RED)
                    if (attacker_damage === 1) {
                        updateHealth('red', damage_amount);
                        await sendImpactWaveToTower('red');
                    }
                    
                    // Show messages
                    showMessage(`✅ ${explanation}`, 'blue');
                    showMessage(`✅ ${explanation}`, 'red');
                    break;
                    
                case 'direct_loss':
                    console.log('[DIRECT_LOSS] Defender loses - defense failed!');
                    // Show collision with attacker winning
                    await createCenterCollision(attackVisual, defendVisual, 'red');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // Apply damage to defender's tower (BLUE)
                    if (defender_damage === 1) {
                        updateHealth('blue', damage_amount);
                        await sendImpactWaveToTower('blue');
                    }
                    
                    // Show messages
                    showMessage(`💀 ${explanation}`, 'blue');
                    showMessage(`💀 ${explanation}`, 'red');
                    break;
                    
                case 'backfire_win':
                    console.log('[BACKFIRE_WIN] Defender\'s choice backfired!');
                    // Show backfire explosion at defender's location
                    await createBackfireCollision(attackVisual, defendVisual);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // Defender takes damage from backfire
                    if (defender_damage === 1) {
                        updateHealth('blue', damage_amount);
                        await sendImpactWaveToTower('blue');
                    }
                    
                    // Show backfire messages
                    showMessage(`💥 ${explanation}`, 'blue');
                    showMessage(`💥 ${explanation}`, 'red');
                    break;
                    
                case 'neutral_no_damage':
                    console.log('[NEUTRAL_NO_DAMAGE] No meaningful interaction');
                    // Show phase-through effect (no explosion)
                    await createPhaseThroughEffect(attackVisual, defendVisual);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // No damage to either tower
                    // Both characters fade away peacefully
                    
                    // Show no damage messages
                    showMessage(`🚫 ${explanation}`, 'blue');
                    showMessage(`🚫 ${explanation}`, 'red');
                    break;
                    
                case 'mutual_destruction':
                    console.log('[MUTUAL_DESTRUCTION] Both concepts destroyed');
                    // Show symmetric explosion
                    await createCenterCollision(attackVisual, defendVisual, 'neutral');
                    await new Promise(resolve => setTimeout(resolve, 1200));
                    
                    // Both towers take equal damage
                    updateHealth('blue', damage_amount);
                    updateHealth('red', damage_amount);
                    
                    // Send impact waves to BOTH towers
                    await Promise.all([
                        sendImpactWaveToTower('blue'),
                        sendImpactWaveToTower('red')
                    ]);
                    
                    // Show mutual destruction messages
                    showMessage(`⚔️ ${explanation}`, 'blue');
                    showMessage(`⚔️ ${explanation}`, 'red');
                    break;
                    
                default:
                    console.error('Unknown outcome_type:', outcome_type);
                    // Fallback to no damage
                    await createCenterCollision(attackVisual, defendVisual, 'neutral');
                    await new Promise(resolve => setTimeout(resolve, 1200));
                    showMessage('⚠️ Unknown outcome', 'blue');
                    showMessage('⚠️ Unknown outcome', 'red');
            }
            
            // Add to battle history with new format
            addToBattleHistory(attackingConcept, defendingConcept, explanation, outcome_type, damage_amount);
            
            // Wait for character fade-out animation to complete before resetting camera
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.error('Battle error:', error);
            showMessage('Battle error occurred!', 'blue');
            showMessage('Battle error occurred!', 'red');
        } finally {
            // Reset state
            gameState.currentActiveAttack = null;
            gameState.isProcessing = false;
            gameState.aiAttacking = false;
            gameState.aiWalkingCharacter = null;
            
            if (gameState.activeProjectiles) {
                gameState.activeProjectiles = [];
            }
            
            clearInputs();
            
            // Re-enable input
            if (blueInput) blueInput.disabled = false;
            
            // Reset camera to original position after ALL animations complete
            if (typeof resetCamera === 'function') {
                resetCamera();
            }
            
            console.log('Battle complete, state reset');
            
            // Check if onboarding is active and show lesson banner
            if (typeof isOnboardingActive === 'function' && isOnboardingActive()) {
                const currentStep = typeof getCurrentStep === 'function' ? getCurrentStep() : 0;
                console.log('[Onboarding] Waiting for reasoning typewriter to complete...');
                
                // Wait for reasoning typewriter to finish (if it hasn't already)
                if (reasoningPromise) {
                    await reasoningPromise;
                    console.log('[Onboarding] Reasoning typewriter complete');
                }
                
                // Small buffer to let player absorb the reasoning (0.5 seconds)
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Generate dynamic lesson message using LLM (with Tier 1 reasoning for context)
                let lessonMessage = null;
                if (typeof generateLessonMessage === 'function' && result) {
                    console.log('[Onboarding] Generating LLM-based lesson message...');
                    try {
                        // Pass result.reasoning_debug (Tier 1 reasoning) for deeper context
                        lessonMessage = await generateLessonMessage(
                            attackingConcept, 
                            defendingConcept, 
                            result,
                            result.reasoning_debug  // NEW: Pass Tier 1 reasoning
                        );
                        console.log('[Onboarding] Lesson message generated successfully');
                    } catch (error) {
                        console.error('[Onboarding] Failed to generate lesson message:', error);
                    }
                } else if (!result) {
                    console.warn('[Onboarding] No battle result available, using fallback message');
                }
                
                // Show lesson banner with dynamic message
                if (typeof showLessonBanner === 'function') {
                    showLessonBanner(currentStep, lessonMessage);
                }
                
                // Don't automatically start next attack - user will click button to continue
            } else {
                // Normal gameplay - wait for animations then start next AI attack
                if (gameState.blueHealth > 0 && gameState.redHealth > 0) {
                    console.log('Waiting for animations to fully complete before next AI attack...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    console.log('Starting next AI attack');
                    initiateAIAttack();
                }
            }
        }
    } else {
        // No AI attack in progress
        showMessage('⏳ Wait for AI attack!', 'blue');
    }
}

