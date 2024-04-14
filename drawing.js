let gl;
let u_Matrix;
let position_buffer = [];
let color_buffer = [];
let ball_x = 0;
let ball_y = 0;
let ball_vx = 0.02;
let ball_vy = -0.031;
let paddle_l_y = 0;
let paddle_r_y = 0;

let CIRCLE_VERTS;
const NUM_CIRCLE_SEGMENTS = 25;

const PADDLE_VEL = 0.05;
const BALL_RAD = 0.04;
const SCREEN_LEFT = -1;
const SCREEN_RIGHT = 1;
const SCREEN_TOP = 0.5;
const SCREEN_BOT = -1;
const PADDLE_OFFSET = 0.1;
const PADDLE_WIDTH = 0.05;
const PADDLE_HEIGHT = 0.2;
const NUM_RECTANGLE_VERTS = 6;
const RECTANGLE_VERTS = new Float32Array([
  0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
  0.0, 1.0, 0.0,
]);

export function drawing_main() {
  let canvas = document.getElementById("drawing_canvas");
  set_up_webgl(canvas);
  generate_cirlce_points();
  draw_scene();
  setInterval(() => {
    ball_y += ball_vy;
    ball_x += ball_vx;
    let ball_top = ball_y + BALL_RAD;
    let ball_bot = ball_y - BALL_RAD;

    if (ball_x - BALL_RAD < SCREEN_LEFT + PADDLE_OFFSET + PADDLE_WIDTH) {
      let paddle_top = paddle_l_y + PADDLE_HEIGHT / 2;
      let paddle_bot = paddle_l_y - PADDLE_HEIGHT / 2;
      if (!(paddle_top > ball_bot) || !(paddle_bot < ball_top)) {
        //lose
        ball_y = 0;
        ball_x = 0;
        if (Math.random() > 0.5) {
          ball_vx *= -1;
        }
      } else {
        ball_vx *= -1;
      }
      ball_vy = Math.random() * 0.2 - 0.1;
    }
    if (ball_x + BALL_RAD > SCREEN_RIGHT - PADDLE_OFFSET - PADDLE_WIDTH) {
      let paddle_top = paddle_r_y + PADDLE_HEIGHT / 2;
      let paddle_bot = paddle_r_y - PADDLE_HEIGHT / 2;
      if (!(paddle_top > ball_bot) || !(paddle_bot < ball_top)) {
        //lose
        ball_y = 0;
        ball_x = 0;
        if (Math.random() > 0.5) {
          ball_vx *= -1;
        }
      } else {
        ball_vx *= -1;
      }
      ball_vy = Math.random() * 0.2 - 0.1;
    }
    if (ball_y - BALL_RAD < SCREEN_BOT) {
      ball_vy = Math.abs(ball_vy);
    }
    if (ball_y + BALL_RAD > SCREEN_TOP) {
      ball_vy = -Math.abs(ball_vy);
    }

    if (ball_vx < 0) {
      if (ball_y > paddle_l_y) {
        paddle_l_y += PADDLE_VEL;
      }
      if (ball_y < paddle_l_y) {
        paddle_l_y -= PADDLE_VEL;
      }
    }

    let right_paddle_target_pos = right_paddle_predict_pos();
    if (ball_vx > 0) {
      if (right_paddle_target_pos > paddle_r_y) {
        paddle_r_y += PADDLE_VEL;
      }
      if (right_paddle_target_pos < paddle_r_y) {
        paddle_r_y -= PADDLE_VEL;
      }
    }

    draw_scene();
  }, 10);

  document
    .getElementById("button_draw")
    .addEventListener("mouseup", function () {
      draw_scene();
    });
}

function right_paddle_predict_pos() {
  //spaghetti code
  const SCREEN_HEIGHT = SCREEN_TOP - SCREEN_BOT;

  let target_x = SCREEN_RIGHT - PADDLE_OFFSET - PADDLE_WIDTH - BALL_RAD;

  let diff_x = target_x - ball_x;
  let slope = ball_vy / ball_vx;

  let diff_y = slope * diff_x;

  let distance_next_bounce = undefined;

  let next_bounce_is_top = ball_vy > 0;

  if (next_bounce_is_top) {
    distance_next_bounce = (SCREEN_TOP - ball_y) / slope;
  } else {
    distance_next_bounce = (SCREEN_BOT - ball_y) / slope;
  }

  if (distance_next_bounce > diff_x) {
    return ball_y + diff_y;
  }

  let ball_next_bounce_x = ball_x + distance_next_bounce;

  let distance_per_bounce = SCREEN_HEIGHT / Math.abs(slope);
  let num_bounces =
    Math.floor((target_x - ball_next_bounce_x) / distance_per_bounce) + 1;
  let last_bounce_x_pos =
    ball_next_bounce_x + num_bounces * distance_per_bounce;

  let last_bounce_is_top = undefined;

  if (num_bounces % 2 == 0) {
    last_bounce_is_top = next_bounce_is_top;
  } else {
    last_bounce_is_top = !next_bounce_is_top;
  }

  let after_last_bounce_vy_speed = Math.abs(ball_vy);
  let after_last_bounce_vy = undefined;
  if (last_bounce_is_top) {
    after_last_bounce_vy = -after_last_bounce_vy_speed;
  } else {
    after_last_bounce_vy = after_last_bounce_vy_speed;
  }

  let dist_left_to_travel = target_x - last_bounce_x_pos;

  let travel_y = dist_left_to_travel * (after_last_bounce_vy / ball_vx);
  if (last_bounce_is_top) {
    return SCREEN_TOP - travel_y;
  } else {
    return SCREEN_BOT - travel_y;
  }
}

function draw_scene() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  draw_deco();

  set_matrix(
    [PADDLE_WIDTH, PADDLE_HEIGHT, 0],
    [SCREEN_LEFT + PADDLE_OFFSET, paddle_l_y - PADDLE_HEIGHT / 2, 1],
  );
  draw_rect([1.0, 0.5, 0.0, 1.0]);
  set_matrix(
    [PADDLE_WIDTH, PADDLE_HEIGHT, 0],
    [
      SCREEN_RIGHT - PADDLE_WIDTH - PADDLE_OFFSET,
      paddle_r_y - PADDLE_HEIGHT / 2,
      1,
    ],
  );
  draw_rect([1.0, 0.5, 0.0, 1.0]);

  set_matrix([BALL_RAD, BALL_RAD, 0], [ball_x, ball_y, 1]);
  draw_circle();
}

function draw_rect(color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, RECTANGLE_VERTS, gl.DYNAMIC_DRAW);
  let colors = new Array(NUM_RECTANGLE_VERTS).fill(color).flat();
  let color_buffer_data = new Float32Array(colors);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, color_buffer_data, gl.DYNAMIC_DRAW);

  gl.drawArrays(gl.TRIANGLES, 0, NUM_RECTANGLE_VERTS);
}

function draw_circle() {
  gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, CIRCLE_VERTS, gl.DYNAMIC_DRAW);
  let color = [1.0, 0.0, 0.0, 1.0];
  let colors = new Array(3 * NUM_CIRCLE_SEGMENTS).fill(color).flat();
  let color_buffer_data = new Float32Array(colors);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, color_buffer_data, gl.DYNAMIC_DRAW);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 2 + NUM_CIRCLE_SEGMENTS);
}

function set_up_webgl(canvas) {
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  //https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/By_example/Hello_GLSL
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, VERTEX_SHADER_SOURCE);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, FRAGMENT_SHADER_SOURCE);
  gl.compileShader(fragmentShader);

  let program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const linkErrLog = gl.getProgramInfoLog(program);
    console.error(
      `Shader program did not link successfully. Error log: ${linkErrLog}`,
    );
    return null;
  }

  let a_Position = gl.getAttribLocation(program, "attribute_model_position");
  let a_FragColor = gl.getAttribLocation(program, "attribute_color");

  gl.enableVertexAttribArray(a_Position);
  gl.enableVertexAttribArray(a_FragColor);

  position_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

  color_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
  gl.vertexAttribPointer(a_FragColor, 4, gl.FLOAT, false, 0, 0);

  gl.useProgram(program);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  u_Matrix = gl.getUniformLocation(program, "translation_matrix");
}

let VERTEX_SHADER_SOURCE = `
uniform mat4 translation_matrix;
attribute vec3 attribute_model_position;
attribute vec4 attribute_color;
varying vec4 color;
void main() {
  gl_Position = translation_matrix * vec4(attribute_model_position, 1.0);
  color = attribute_color;
}`;

let FRAGMENT_SHADER_SOURCE = `
precision mediump float;
varying vec4 color;
void main() {
  gl_FragColor = color;
}`;

function set_matrix(scale, transpose) {
  gl.uniformMatrix4fv(u_Matrix, false, [
    scale[0],
    0.0,
    0.0,
    0.0,
    0.0,
    scale[1],
    0.0,
    0.0,
    0.0,
    0.0,
    scale[2],
    0.0,
    transpose[0],
    transpose[1],
    transpose[2],
    1.0,
  ]);
}

function set_matrix_rotate(scale, transpose, theta) {
  gl.uniformMatrix4fv(u_Matrix, false, [
    scale[0] * Math.cos(theta),
    scale[0] * Math.sin(theta),
    0.0,
    0.0,
    scale[1] * -Math.sin(theta),
    scale[1] * Math.cos(theta),
    0.0,
    0.0,
    0.0,
    0.0,
    scale[2],
    0.0,
    transpose[0],
    transpose[1],
    transpose[2],
    1.0,
  ]);
}

function generate_cirlce_points() {
  const TAU = 2 * Math.PI;
  let center = [0.0, 0.0, 0.0];
  let angle_per_segment = TAU / NUM_CIRCLE_SEGMENTS;

  let verts = center;

  for (let seg_num = 0; seg_num <= NUM_CIRCLE_SEGMENTS; seg_num++) {
    let angle = seg_num * angle_per_segment;
    let vert = [Math.cos(angle), Math.sin(angle), 0.0];
    verts = verts.concat(vert);
  }

  CIRCLE_VERTS = new Float32Array(verts);
}

function draw_deco() {
  //乒乓球
  let yellow = [1.0, 0.9, 0.1, 1.0];
  let black = [0.1, 0.1, 0.1, 1.0];

  //border
  set_matrix([2, 0.5, 1], [-1, 0.5, 1]);
  draw_rect(yellow);
  set_matrix([0.03, 2, 1], [-1, -1, 1]);
  draw_rect(yellow);
  set_matrix([0.03, 2, 1], [0.97, -1, 1]);
  draw_rect(yellow);

  //乒
  set_matrix([0.4, 0.03, 1], [-0.9, 0.9, 1]);
  draw_rect(black);
  set_matrix([0.03, 0.2, 1], [-0.9, 0.7, 1]);
  draw_rect(black);
  set_matrix([0.4, 0.03, 1], [-0.9, 0.8, 1]);
  draw_rect(black);
  set_matrix([0.03, 0.1, 1], [-0.7, 0.7, 0]);
  draw_rect(black);
  set_matrix([0.45, 0.03, 1], [-0.95, 0.7, 1]);
  draw_rect(black);
  set_matrix_rotate([0.2, 0.03, 1], [-0.7, 0.7, 1], -0.5);
  draw_rect(black);

  //乓
  set_matrix([0.4, 0.03, 1], [-0.2, 0.9, 1]);
  draw_rect(black);
  set_matrix([0.03, 0.2, 1], [-0.2, 0.7, 1]);
  draw_rect(black);
  set_matrix([0.4, 0.03, 1], [-0.2, 0.8, 1]);
  draw_rect(black);
  set_matrix([0.03, 0.1, 1], [0.0, 0.7, 0]);
  draw_rect(black);
  set_matrix([0.45, 0.03, 1], [-0.25, 0.7, 1]);
  draw_rect(black);
  set_matrix_rotate([0.2, 0.03, 1], [0.0, 0.722, 1], Math.PI + 0.5);
  draw_rect(black);

  //球
  set_matrix([0.15, 0.03, 1], [0.4, 0.9, 1]);
  draw_rect(black);
  set_matrix([0.15, 0.03, 1], [0.4, 0.8, 1]);
  draw_rect(black);
  set_matrix_rotate([0.15, 0.03, 1], [0.4, 0.69, 1], 0.1);
  draw_rect(black);
  set_matrix([0.03, 0.2, 1], [0.46, 0.7, 1]);
  draw_rect(black);
  set_matrix([0.2, 0.03, 1], [0.6, 0.85, 1]);
  draw_rect(black);
  set_matrix([0.03, 0.35, 1], [0.685, 0.6, 1]);
  draw_rect(black);
  set_matrix_rotate([0.1, 0.03, 1], [0.715, 0.63, 1], Math.PI - 0.2);
  draw_rect(black);
  set_matrix_rotate([0.13, 0.03, 1], [0.675, 0.75, 1], Math.PI + 0.7);
  draw_rect(black);
  set_matrix_rotate([0.09, 0.03, 1], [0.675, 0.75, 1], Math.PI / 2 + 0.7);
  draw_rect(black);
  set_matrix_rotate([-0.09, 0.03, 1], [0.725, 0.75, 1], Math.PI + 0.7);
  draw_rect(black);
  set_matrix_rotate([-0.13, 0.03, 1], [0.725, 0.75, 1], Math.PI / 2 + 0.7);
  draw_rect(black);
  set_matrix_rotate([0.03, 0.05, 1], [0.77, 0.875, 1], Math.PI / 4);
  draw_rect(black);
}
