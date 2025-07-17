import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';

let player;
let mixer;

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 10, 50);

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

scene.add(new THREE.AmbientLight(0x404040));

// Grid floor
const grid = new THREE.GridHelper(20, 20, 0x333333, 0x333333);
scene.add(grid);

// Ground plane
const groundGeo = new THREE.PlaneGeometry(20, 200);
const groundMat = new THREE.MeshPhongMaterial({
  color: 0x222222,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.z = -90;
scene.add(ground);

// Load player model
const loader = new GLTFLoader();
loader.load(
  'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
  function (gltf) {
    player = gltf.scene;
    player.scale.set(0.5, 0.5, 0.5);
    player.position.set(0, 0, 5);
    scene.add(player);

    // Animation mixer
    mixer = new THREE.AnimationMixer(player);
    if (gltf.animations.length) {
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();
    }
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

// Obstacles
let obstacles = [];

function createObstacle() {
  const types = [
    { color: 0x0000ff, width: 1, height: 2, depth: 1 }, // police
    { color: 0xffff00, width: 2, height: 1, depth: 1 }, // barricade
  ];

  const type = types[Math.floor(Math.random() * types.length)];
  const geometry = new THREE.BoxGeometry(type.width, type.height, type.depth);
  const material = new THREE.MeshPhongMaterial({ color: type.color });
  const obstacle = new THREE.Mesh(geometry, material);
  const lane = [-4, 0, 4][Math.floor(Math.random() * 3)];
  obstacle.position.set(lane, type.height / 2, -100);
  scene.add(obstacle);
  obstacles.push(obstacle);
}

// Controls
let targetX = 0;
let lanes = [-4, 0, 4];
let currentLane = 1;

document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft") {
    currentLane = Math.max(0, currentLane - 1);
    targetX = lanes[currentLane];
  } else if (e.code === "ArrowRight") {
    currentLane = Math.min(2, currentLane + 1);
    targetX = lanes[currentLane];
  }
});

// Animation loop
let speed = 0.5;
let distance = 0;
let spawnTimer = 0;

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (mixer) {
    mixer.update(delta);
  }

  // Move ground
  ground.position.z += speed;
  if (ground.position.z > 0) {
    ground.position.z = -90;
  }

  // Smooth player movement
  if (player) {
    player.position.x += (targetX - player.position.x) * 0.2;
  }

  // Move obstacles
  obstacles.forEach((obs) => {
    obs.position.z += speed;
  });

  // Remove obstacles
  obstacles = obstacles.filter((obs) => {
    if (obs.position.z > 10) {
      scene.remove(obs);
      return false;
    }
    return true;
  });

  // Spawn obstacles
  spawnTimer += speed;
  if (spawnTimer > 20) {
    createObstacle();
    spawnTimer = 0;
  }

  // Collision detection
  obstacles.forEach((obs) => {
    if (
      player &&
      Math.abs(player.position.x - obs.position.x) < 1.5 &&
      Math.abs(player.position.z - obs.position.z) < 1.5
    ) {
      alert("Game Over! Your score: " + Math.floor(distance));
      window.location.reload();
    }
  });

  distance += speed;

  renderer.render(scene, camera);
}

animate();

// Responsive
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
