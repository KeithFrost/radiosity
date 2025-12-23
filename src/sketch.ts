import p5 from "p5";
import { PLAYER_1, PLAYER_2, SYSTEM } from "@rcade/plugin-input-classic";
import { PLAYER_1 as SP1, PLAYER_2 as SP2} from "@rcade/plugin-input-spinners";

// Rcade game dimensions
const WIDTH = 336;
const HEIGHT = 262;

const SPIN1 = SP1.SPINNER;
const SPIN2 = SP2.SPINNER;

const sketch = (p: p5) => {
  let dots = []

  const pR = 30
  const pR3 = pR * pR * pR

  let camLat = 0.0;
  let camLon = 0.0;
  let camRad = 800;
  let cam;

  let gameStarted = false;

  p.setup = () => {
    p.createCanvas(WIDTH, HEIGHT, p.WEBGL);
    p.noStroke();
    for (let i = 0; i < 100; i++) {
      dots.push(new Particle());
    }

    cam = p.createCamera();
    const cz = camRad * p.sin(camLat);
    const cxy = camRad * p.cos(camLat);
    const cx = cxy * p.cos(camLon);
    const cy = cxy * p.sin(camLon);
    cam.setPosition(cx, cy, cz);
    cam.lookAt(0, 0, 0);
    p.setCamera(cam);
  };

  p.draw = () => {
    p.background(0);
    p.pointLight(255, 255, 64, 100000, 0, 0);
    p.pointLight(0, 0, 255, -100000, 0, 0);
    p.sphere(pR);

    if (!gameStarted) {
      if (SYSTEM.ONE_PLAYER) {
	gameStarted = true;
      }
      return;
    }

    const delta1 = SPIN1.consume_step_delta();
    const delta2 = SPIN2.consume_step_delta();

    camLat += 0.1 * delta1 / SPIN1.step_resolution;
    camLon += 0.1 * delta2 / SPIN2.step_resolution;

    const cz = camRad * p.sin(camLat);
    const cxy = camRad * p.cos(camLat);
    const cx = cxy * p.cos(camLon);
    const cy = cxy * p.sin(camLon);

    cam.setPosition(cx, cy, cz);
    cam.lookAt(0, 0, 0);

    for (var i = 0; i < dots.length; i++) {
      dots[i].accelerate();
    }
    for (var i = 0; i < dots.length; i++) {
      dots[i].move();
      dots[i].draw();
      const d = p.sqrt(dots[i].d2);
      if (d < pR || d > 400) {
	dots[i] = new Particle();
      }
    }
  };


    // Handle input from arcade controls
    // if (PLAYER_1.DPAD.up) {
    //   y -= speed;
    // }
    // if (PLAYER_1.DPAD.down) {
    //   y += speed;
    // }
    // if (PLAYER_1.DPAD.left) {
    //   x -= speed;
    // }
    // if (PLAYER_1.DPAD.right) {
    //   x += speed;
    // }

    // Keep ball in bounds
    //   x = p.constrain(x, ballSize / 2, WIDTH - ballSize / 2);
    //   y = p.constrain(y, ballSize / 2, HEIGHT - ballSize / 2);

    //   // Draw ball (change color when A is pressed)
    //   if (PLAYER_1.A) {
    //     p.fill(255, 100, 100);
    //   } else if (PLAYER_1.B) {
    //     p.fill(100, 255, 100);
    //   } else {
    //     p.fill(100, 200, 255);
    //   }
    //   p.noStroke();
    //   p.ellipse(x, y, ballSize, ballSize);
    // }

  class Particle {
    constructor() {
      this.radius = 1.0 - p.log(0.01 + 0.99 * p.random())
      this.radius3 = p.pow(this.radius, 3)
      const r = p.random(90, 120)
      const theta = p.random() * 2 * p.PI
      this.x = r * p.cos(theta)
      this.y = r * p.sin(theta)
      this.z = 10 * p.randomGaussian()
      this.vx = -0.5 * p.sin(theta)
      this.vy = 0.5 * p.cos(theta)
      this.vz = 0.01 * p.randomGaussian()
      this.d2 = this.x * this.x + this.y * this.y + this.z * this.z
    }

    accelerate() {
      // Given the positions of everything NOW, and the
      // velocities of everything from one half time step in the PAST, update
      // the velocities of everything to what they will be one half time
      // step in the FUTURE.
      this.d2 = this.x * this.x + this.y * this.y + this.z * this.z
      const d3 = p.pow(this.d2, 1.5)
      const g = 0.001 * pR3 / d3
      this.vx -= g * this.x
      this.vy -= g * this.y
      this.vz -= g * this.z
      for (var i = 0; i < dots.length; i++) {
	const dot = dots[i]
	if (dot == this) {
          continue
	}
	const dx = dot.x - this.x
	const dy = dot.y - this.y
	const dz = dot.z - this.z
	const dd2 = dx * dx + dy * dy + dz * dz
	const dd3 = p.pow(dd2, 1.5)
	const dg = 0.001 * dot.radius3 / dd3
	this.vx += dg * dx
	this.vy += dg * dy
	this.vz += dg * dz
      }
    }

    move() {
      // Integrate one time step forward, using the velocity from
      // one half time step in the FUTURE.
      this.x += this.vx
      this.y += this.vy
      this.z += this.vz
    }

    draw() {
      p.push()
      p.translate(this.x, this.y, this.z)
      p.sphere(this.radius)
      p.pop()
    }
  }
};

new p5(sketch, document.getElementById("sketch")!);
