// Onboarding Manager
// Handles tutorial flow with curated battles to teach 5-outcome system mechanics

// Curated battle sequences for onboarding - showcasing key outcome types (5 total available)
const ONBOARDING_BATTLES = [
    {
        step: 1,
        aiConcept: "Fire",
        emoji: "🔥",
        hintTitle: "AI ATTACKED WITH: FIRE",
        hintText: "Fire burns and destroys. You need something that naturally extinguishes flames.\n\n💡 Try typing: WATER\n\nLogic: Some elements have natural dominance.",
        lessonAfter: "✅ YOU LEARNED: DIRECT WIN\n\nWater extinguishes fire, BUT then the water continues forward unimpeded! With nothing left to stop it, the water damages AI's castle.\n\nThe damage isn't from extinguishing - it's because your defense kept going and hit their tower."
    },
    {
        step: 2,
        aiConcept: "Sodium",
        emoji: "⚗️",
        hintTitle: "AI ATTACKED WITH: SODIUM",
        hintText: "Sodium is a highly reactive metal. What happens when reactive metals meet liquids?\n\n💡 Try typing: WATER\n\n(This might surprise you...)",
        lessonAfter: "💥 YOU LEARNED: BACKFIRE\n\nYour defense AMPLIFIED the threat! Water reacts violently with sodium, causing an explosion at YOUR tower.\n\nSometimes your defense can make things worse by acting as fuel, conductor, or amplifier for the attack."
    },
    {
        step: 3,
        aiConcept: "Nuclear Weapon",
        emoji: "☢️",
        hintTitle: "AI ATTACKED WITH: NUCLEAR WEAPON",
        hintText: "Physical weapons destroy physical targets. What exists everywhere with no single point of failure?\n\n💡 Try typing: YOUTUBE\n\nLogic: Decentralized systems survive physical attacks.",
        lessonAfter: "🚫 YOU LEARNED: INEFFECTIVE ATTACK\n\nThe nuclear attack happens but is INEFFECTIVE! YouTube has no single point of failure - it exists on thousands of servers worldwide.\n\nDestroying one location doesn't destroy the concept. BOTH towers safe!"
    },
    {
        step: 4,
        aiConcept: "Lightning",
        emoji: "⚡",
        hintTitle: "AI ATTACKED WITH: LIGHTNING",
        hintText: "A powerful bolt of lightning. What has equal power that would collide symmetrically?\n\n💡 Try typing: LIGHTNING\n\nLogic: Identical forces destroy each other.",
        lessonAfter: "⚔️ YOU LEARNED: MUTUAL DESTRUCTION\n\nTwo identical forces collide with equal power, destroying each other!\n\nWhen symmetric concepts meet, neither dominates. BOTH towers take damage equally."
    },
    {
        step: 5,
        aiConcept: "Laser Pointer",
        emoji: "🔴",
        hintTitle: "AI ATTACKED WITH: LASER POINTER",
        hintText: "Just a harmless dot of red light. What creature has an evolutionary obsession with chasing it?\n\n💡 Try typing: CAT\n\nLogic: Some things AMPLIFY power instead of blocking.",
        lessonAfter: "🐈 YOU LEARNED: Power Amplification\n\nThe laser pointer AMPLIFIES the cat's hunting instinct to maximum! The cat's predatory focus becomes unstoppable. Another DIRECT WIN."
    },
    {
        step: 6,
        aiConcept: "Echo Chamber",
        emoji: "🔊",
        hintTitle: "AI ATTACKED WITH: ECHO CHAMBER",
        hintText: "Echo chambers amplify sound infinitely in a feedback loop. What creature makes a loud, repetitive noise?\n\n💡 Try typing: DUCK\n\nLogic: Environments can become your weapon.",
        lessonAfter: "🦆 YOU LEARNED: Environmental Amplification\n\nThe echo chamber AMPLIFIES your duck's quack infinitely! The feedback loop becomes so powerful it collapses the chamber.\n\nA weak concept becomes overwhelming in the right environment. Another DIRECT WIN!\n\n🎓 TUTORIAL COMPLETE!\n\nYou've mastered all 5 outcome types:\n✅ Direct Win | 💀 Direct Loss | 💥 Backfire | 🚫 Ineffective Attack | ⚔️ Mutual Destruction\n\n⚔️ WELCOME TO THE REAL GAME!\n\nRemember: An LLM is leading this game in REAL-TIME. Every battle is uniquely evaluated.\n\nBE CREATIVE. There is NO LIMIT to what you can come up with. Black holes, abstract concepts, emotions, quantum physics - anything works!\n\nFigure out the mechanics. Learn from each battle. Beat the AI at its own game!"
    }
];

// Onboarding state
const onboardingState = {
    active: true,           // Always true on page load
    currentStep: 0,         // Current battle (0-5 for 6 total battles)
    phase: null,            // 'hint' | 'battle' | 'lesson'
    isPaused: false,        // Game animation pause state
    waitingForNextBattle: false
};

// Start onboarding sequence
function startOnboarding() {
    console.log('🎓 Starting onboarding tutorial with 4-outcome system...');
    onboardingState.active = true;
    onboardingState.currentStep = 0;
    onboardingState.phase = 'hint';
}

// Get current battle data
function getCurrentBattle() {
    if (onboardingState.currentStep >= ONBOARDING_BATTLES.length) {
        return null;
    }
    return ONBOARDING_BATTLES[onboardingState.currentStep];
}

// Show hint banner before battle starts
function showHintBanner(step) {
    const battle = ONBOARDING_BATTLES[step];
    if (!battle) return;
    
    console.log(`Showing hint banner for step ${step + 1}`);
    onboardingState.phase = 'hint';
    onboardingState.isPaused = true;
    
    // Pause game
    pauseGame();
    
    const title = `${battle.emoji} ${battle.hintTitle}`;
    const message = battle.hintText;
    const stepIndicator = `\n\nStep ${step + 1} of 6`;
    
    displayOnboardingBanner(
        title + stepIndicator,
        message,
        'Ready to Defend →',
        () => {
            console.log('User ready to defend, resuming game...');
            onboardingState.phase = 'battle';
            resumeGame();
        }
    );
}

// Show lesson banner after battle completes
function showLessonBanner(step, dynamicLessonMessage = null) {
    const battle = ONBOARDING_BATTLES[step];
    if (!battle) return;
    
    console.log(`Showing lesson banner for step ${step + 1}`);
    onboardingState.phase = 'lesson';
    onboardingState.isPaused = true;
    
    // Pause game
    pauseGame();
    
    const isLastBattle = (step === ONBOARDING_BATTLES.length - 1);
    const buttonText = isLastBattle ? 'Start Real Game →' : 'Next Battle →';
    const stepIndicator = `\n\nCompleted: ${step + 1} of 6`;
    
    // Use dynamic LLM-generated message if available, otherwise fall back to hardcoded
    const lessonMessage = dynamicLessonMessage || battle.lessonAfter;
    
    console.log(`[Onboarding] Using ${dynamicLessonMessage ? 'LLM-generated' : 'fallback'} lesson message`);
    
    displayOnboardingBanner(
        lessonMessage + stepIndicator,
        '',
        buttonText,
        () => {
            if (isLastBattle) {
                completeOnboarding();
            } else {
                advanceToNextBattle();
            }
        }
    );
}

// Advance to next battle
function advanceToNextBattle() {
    console.log('Advancing to next battle...');
    onboardingState.currentStep++;
    onboardingState.phase = 'hint';
    onboardingState.waitingForNextBattle = false;
    
    // Resume game briefly to allow state cleanup
    resumeGame();
    
    // Small delay then start next AI attack
    setTimeout(() => {
        if (typeof initiateAIAttack === 'function') {
            initiateAIAttack();
        }
    }, 500);
}

// Complete onboarding and transition to normal gameplay
function completeOnboarding() {
    console.log('🎉 Onboarding complete! Starting normal gameplay...');
    
    onboardingState.active = false;
    onboardingState.phase = null;
    
    // Resume game
    resumeGame();
    
    // Start normal AI attack after brief delay
    setTimeout(() => {
        if (typeof initiateAIAttack === 'function') {
            initiateAIAttack();
        }
    }, 1000);
}

// Pause game - freeze animations, dim background, hide timer
function pauseGame() {
    console.log('⏸️ Pausing game...');
    onboardingState.isPaused = true;
    
    // Show dimmer overlay
    const dimmer = document.getElementById('game-dimmer');
    if (dimmer) {
        dimmer.style.display = 'block';
        setTimeout(() => {
            dimmer.style.opacity = '1';
        }, 10);
    }
    
    // Hide timer display
    const timerEl = document.getElementById('response-timer');
    if (timerEl) {
        timerEl.style.display = 'none';
    }
    
    // Pause the player response timer interval
    if (gameState && gameState.playerResponseTimer) {
        clearInterval(gameState.playerResponseTimer);
        gameState.playerResponseTimer = null;
    }
}

// Resume game - unfreeze animations, undim background
function resumeGame() {
    console.log('▶️ Resuming game...');
    onboardingState.isPaused = false;
    
    // Hide dimmer overlay
    const dimmer = document.getElementById('game-dimmer');
    if (dimmer) {
        dimmer.style.opacity = '0';
        setTimeout(() => {
            dimmer.style.display = 'none';
        }, 500);
    }
    
    // Show timer if AI is attacking
    if (gameState && gameState.aiAttacking) {
        const timerEl = document.getElementById('response-timer');
        if (timerEl) {
            timerEl.style.display = 'block';
        }
        
        // Restart response timer for onboarding duration
        if (onboardingState.active && onboardingState.phase === 'battle') {
            startResponseTimer(20000); // 20 seconds for tutorial
        }
    }
}

// Check if currently in onboarding mode
function isOnboardingActive() {
    return onboardingState.active;
}

// Get current onboarding step
function getCurrentStep() {
    return onboardingState.currentStep;
}

// Check if game is paused
function isGamePaused() {
    return onboardingState.isPaused;
}
