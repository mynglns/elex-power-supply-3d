import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const viewer = document.querySelector("#viewer");
const viewerShell = document.querySelector("#viewerShell");
const loadingState = document.querySelector("#loadingState");
const loadingLabel = document.querySelector("#loadingLabel");
const resetViewButton = document.querySelector("#resetView");
const MODEL_ID = "power-supply";
const models = new Map();

let scene;
let camera;
let renderer;
let controls;
let model;
let activeId;
let defaultCameraPosition;
let defaultTarget;

init();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(31, 1, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  viewer.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.addEventListener("change", render);

  addLights();
  resetViewButton.addEventListener("click", resetView);
  for (const button of document.querySelectorAll(".view")) {
    button.addEventListener("click", () => {
      for (const b of document.querySelectorAll(".view")) b.classList.toggle("is-active", b === button);
      selectModel(button.dataset.model);
    });
  }
  window.addEventListener("resize", resize);
  resize();
  selectModel(MODEL_ID);
  renderer.setAnimationLoop(animate);
}

function addLights() {
  scene.add(new THREE.HemisphereLight(0xcfe9d3, 0x0d120f, 2.2));

  const key = new THREE.DirectionalLight(0xf1ffe9, 4.1);
  key.position.set(4.8, 9.5, 5.4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x9ce9d5, 1.45);
  fill.position.set(-7, 4, -4);
  scene.add(fill);

  const under = new THREE.DirectionalLight(0xdbe7dd, 1.6);
  under.position.set(2, -8, 3);
  scene.add(under);
}

function selectModel(id) {
  if (id === activeId) return;
  activeId = id;

  if (model) scene.remove(model);
  model = null;

  if (models.has(id)) {
    showModel(models.get(id));
    return;
  }

  loadingState.classList.remove("is-hidden", "is-error");
  loadingLabel.textContent = "Loading model…";
  new GLTFLoader().load(
    `./assets/${id}.glb`,
    (gltf) => {
      const loaded = gltf.scene;
      loaded.traverse((object) => {
        if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
      });
      models.set(id, loaded);
      if (id === activeId) showModel(loaded);
    },
    (event) => {
      if (!event.total || id !== activeId) return;
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
      loadingLabel.textContent = `Loading model ${percent}%`;
    },
    (error) => {
      console.error("Unable to load the GLB model", error);
      if (id !== activeId) return;
      loadingState.classList.add("is-error");
      loadingLabel.textContent = "Model could not load";
    },
  );
}

function showModel(loaded) {
  model = loaded;
  fitModel();
  scene.add(model);
  loadingState.classList.add("is-hidden");
  render();
}

function fitModel() {
  // Boards are exported in metres; scale each to a common size so the camera limits fit.
  model.position.set(0, 0, 0);
  model.scale.setScalar(1);
  model.updateMatrixWorld(true);
  const rawSize = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  model.scale.setScalar(6 / Math.max(rawSize.x, rawSize.y, rawSize.z));
  model.updateMatrixWorld(true);
  const fitBounds = new THREE.Box3().setFromObject(model);

  const center = fitBounds.getCenter(new THREE.Vector3());
  const size = fitBounds.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  model.position.sub(center);

  const fitDistance = maxDim * 1.55 * Math.max(1, 0.85 / camera.aspect);
  defaultTarget = new THREE.Vector3(0, 0, 0);
  defaultCameraPosition = new THREE.Vector3(fitDistance * 0.94, fitDistance * 0.72, fitDistance * 0.94);
  camera.position.copy(defaultCameraPosition);
  camera.near = Math.max(0.05, maxDim / 100);
  camera.far = Math.max(100, maxDim * 15);
  camera.updateProjectionMatrix();

  controls.minDistance = Math.max(2.2, maxDim * 0.03);
  controls.maxDistance = Math.max(18, fitDistance * 4);
  controls.target.copy(defaultTarget);
  controls.update();
}

function resetView() {
  if (!defaultCameraPosition || !defaultTarget) return;
  camera.position.copy(defaultCameraPosition);
  controls.target.copy(defaultTarget);
  controls.update();
  render();
}

function animate() {
  controls.update();
  render();
}

function render() {
  renderer.render(scene, camera);
}

function resize() {
  const width = viewerShell.clientWidth;
  const height = viewerShell.clientHeight;
  if (!width || !height) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
