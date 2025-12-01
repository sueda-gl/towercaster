// Three.js Scene Setup and Initialization
// Global variables - shared across all modules
let scene, camera, renderer;
let arena, towers = [];
let units = [];
let particles = [];
let gltfLoader; // GLTFLoader for 3D models
let isRotating = true; // Camera rotation enabled by default
let mixer, clock;

// Initialize Three.js
function init() {
    // Scene setup with very dark, ominous atmosphere
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a15);
    scene.fog = new THREE.Fog(0x151520, 30, 100);
    
    // Camera setup - FIXED POV behind player (Blue team)
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    // Fixed camera position - centered elevated view
    camera.position.set(-19.58, 13.37, 56.24);
    camera.lookAt(-3.54, 2.42, 10.17); // Looking at center of arena
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Initialize GLTFLoader
    gltfLoader = new THREE.GLTFLoader();
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Clock for animations
    clock = new THREE.Clock();
    
    // Lighting
    setupLighting();
    
    // Create arena
    createArena();
    
    // Create towers
    createTowers();
    
    // Add decorative elements
    addDecorations();
    
    // Remove loading text
    document.querySelector('.loading').style.display = 'none';
    
    // Show splash screen and start game
    showSplashScreen();
    
    // Start animation loop
    animate();
}

function setupLighting() {
    // Very low ambient light for dramatic war arena
    const ambientLight = new THREE.AmbientLight(0x302030, 0.2);
    scene.add(ambientLight);
    
    // Strong dramatic directional light from above (like harsh sun)
    const dirLight = new THREE.DirectionalLight(0xb0a090, 0.8);
    dirLight.position.set(30, 60, 20);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);
    
    // Rim light from opposite side for depth
    const dirLight2 = new THREE.DirectionalLight(0x4a3a50, 0.3);
    dirLight2.position.set(-25, 20, -30);
    scene.add(dirLight2);
    
    // Intense dramatic tower point lights
    const blueLight = new THREE.PointLight(0x2244ff, 8, 50);
    blueLight.position.set(-20, 12, 0);
    blueLight.castShadow = true;
    scene.add(blueLight);
    
    const redLight = new THREE.PointLight(0xff2222, 8, 50);
    redLight.position.set(20, 12, 0);
    redLight.castShadow = true;
    scene.add(redLight);
    
    // Add upward spotlights at towers for dramatic effect
    const blueSpotlight = new THREE.SpotLight(0x3355ff, 4, 40, Math.PI / 6, 0.5, 1);
    blueSpotlight.position.set(-20, -8, 0);
    blueSpotlight.target.position.set(-20, 20, 0);
    scene.add(blueSpotlight);
    scene.add(blueSpotlight.target);
    
    const redSpotlight = new THREE.SpotLight(0xff3333, 4, 40, Math.PI / 6, 0.5, 1);
    redSpotlight.position.set(20, -8, 0);
    redSpotlight.target.position.set(20, 20, 0);
    scene.add(redSpotlight);
    scene.add(redSpotlight.target);
    
    // Very dark hemisphere for ominous ground lighting
    const hemiLight = new THREE.HemisphereLight(0x2a2a35, 0x0a0a10, 0.3);
    scene.add(hemiLight);
    
    // Center arena spotlight for battle focus
    const centerLight = new THREE.SpotLight(0xffffff, 2, 30, Math.PI / 4, 0.3, 1.5);
    centerLight.position.set(0, 20, 0);
    centerLight.target.position.set(0, -10, 0);
    centerLight.castShadow = true;
    scene.add(centerLight);
    scene.add(centerLight.target);
    
    // Store lights for lightning effects
    scene.userData.mainLight = dirLight;
    scene.userData.ambientLight = ambientLight;
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize when page loads
window.addEventListener('load', init);

