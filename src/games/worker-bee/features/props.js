import * as THREE from 'three';

function polygon(radius, reverse = false) {
  const points = Array.from({ length: 6 }, (_, i) => new THREE.Vector2(Math.cos(i * Math.PI / 3) * radius, Math.sin(i * Math.PI / 3) * radius));
  return reverse ? points.reverse() : points;
}
export function createTie(material) {
  const body = new THREE.Shape(); body.moveTo(-0.025, -0.015); body.lineTo(0.025, -0.015);
  body.lineTo(0.055, -0.2); body.lineTo(0, -0.26); body.lineTo(-0.055, -0.2); body.closePath();
  const knot = new THREE.Shape(); knot.moveTo(0, 0.035); knot.lineTo(0.04, 0); knot.lineTo(0, -0.035); knot.lineTo(-0.04, 0); knot.closePath();
  const tie = new THREE.Group(); tie.name = 'worker-tie';
  for (const shape of [body, knot]) tie.add(new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.022, bevelEnabled: false }), material));
  tie.position.set(0, 1.48, 0.14); tie.rotation.set(-0.24, 0, -0.09); return tie;
}
export function createHoneyMug(material, color) {
  const mug = new THREE.Group();
  const outline = new THREE.Shape(polygon(0.1)); outline.holes.push(new THREE.Path(polygon(0.074, true)));
  const shell = new THREE.ExtrudeGeometry(outline, { depth: 0.17, bevelEnabled: false }); shell.rotateX(-Math.PI / 2); shell.translate(0, -0.085, 0);
  const body = new THREE.Mesh(shell, material(color)); body.name = 'mug-shell'; mug.add(body);
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.016, 6), material(color)); bottom.name = 'mug-bottom'; bottom.position.y = -0.077; bottom.rotation.y = Math.PI / 6; mug.add(bottom);
  const nectar = new THREE.Mesh(new THREE.CylinderGeometry(0.073, 0.073, 0.008, 6), material('#c78b2d')); nectar.position.y = 0.045; nectar.rotation.y = Math.PI / 6; mug.add(nectar);
  const handleShape = new THREE.Shape(polygon(0.065)); handleShape.holes.push(new THREE.Path(polygon(0.043, true)));
  const handle = new THREE.Mesh(new THREE.ExtrudeGeometry(handleShape, { depth: 0.02, bevelEnabled: false }), material(color));
  handle.name = 'mug-handle'; handle.position.set(0.11, 0, -0.01); mug.add(handle); return mug;
}
