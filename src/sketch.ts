import p5 from "p5";
import { PLAYER_1, PLAYER_2, SYSTEM } from "@rcade/plugin-input-classic";
import { PLAYER_1 as SP1, PLAYER_2 as SP2} from "@rcade/plugin-input-spinners";

// Rcade game dimensions
const WIDTH = 336;
const HEIGHT = 262;

const SPIN1 = SP1.SPINNER;
const SPIN2 = SP2.SPINNER;

const sketch = (p: p5) => {
  let dots = [null]

  const pR = 30
  const pR3 = pR * pR * pR

  let camLat = 0.0;
  let camLon = 0.0;
  let camRad = 800;
  let cam;

  let gameStarted = false;

  p.pointCam = (posn) => {
    const dz = camRad * p.sin(camLat);
    const dxy = camRad * p.cos(camLat);
    const dx = dxy * p.cos(camLon);
    const dy = dxy * p.sin(camLon);
    cam.lookAt(posn.x - dx, posn.y - dy, posn.z - dz);
  }

  p.makeShip = () => {
    dots[0] = new Particle(1, 800);
    const posn = dots[0];
    cam = p.createCamera();
    cam.setPosition(posn.x, posn.y, posn.z);
    camRad = p.sqrt(posn.x * posn.x + posn.y * posn.y + posn.z * posn.z);
    camLat = p.asin(posn.z / camRad);
    camLon = p.atan2(posn.y, posn.x);
    p.pointCam(posn);
    p.setCamera(cam);
  }

  p.updateShip = () => {
    const posn = dots[0];
    cam.setPosition(posn.x, posn.y, posn.z);
    p.pointCam(posn);
  }

  p.setup = () => {
    p.createCanvas(WIDTH, HEIGHT, p.WEBGL);
    p.noStroke();
    p.makeShip();
    for (let i = 1; i <= 100; i++) {
      dots.push(new Particle(0, 0));
    }
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

    camLat = (camLat + p.PI) % (2 * p.PI) - p.PI;
    camLon = (camLon + p.PI) % (2 * p.PI) - p.PI;

    for (var i = 0; i < dots.length; i++) {
      dots[i].accelerate();
    }
    for (var i = 0; i < dots.length; i++) {
      dots[i].move();
      dots[i].draw();
      const d = p.sqrt(dots[i].d2);
      if (i != 0 && (d < pR || d > 1600)) {
	dots[i] = new Particle(0, 0);
      }
    }
    p.updateShip();
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
    constructor(radius, r) {
      if (radius == 0) {
	this.radius = 1.0 - p.log(0.01 + 0.99 * p.random());
      } else {
	this.radius = radius;
      }
      this.radius3 = p.pow(this.radius, 3)
      if (r == 0) {
	r = p.random(90, 120)
      }
      const theta = p.random() * 2 * p.PI
      this.x = r * p.cos(theta)
      this.y = r * p.sin(theta)
      this.z = 10 * p.randomGaussian()

      this.vx = -5.0 * p.sin(theta) / p.sqrt(r)
      this.vy = 5.0 * p.cos(theta) / p.sqrt(r)
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
