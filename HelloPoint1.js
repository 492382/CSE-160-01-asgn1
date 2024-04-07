window.onload = main;

let gl;
let program;
let u_Matrix;
let color_buffer;
let position_buffer;
let point_size_buffer;
let g_shapes = [];
let g_selected_color = [1.0, 1.0, 1.0, 1.0];
let g_selected_size = 10.0;
let g_selected_shape = "point";

class Shape {
  constructor(type, position, color, size) {
    this.type = type;
    this.position = position;
    this.color = color;
    this.size = size;
  }
}

function main() {
  let canvas = document.getElementById("andy_canvas");

  setupWebGL(canvas);
  connectVariablesToGLSL();
  addUiCallbacks();
  handleClicks(canvas);
  renderAllShapes();
}

function setupWebGL(canvas) {
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  //https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/By_example/Hello_GLSL
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, ANDY_VERTEX_SHADER_SOURCE);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, ANDY_FRAGMENT_SHADER_SOURCE);
  gl.compileShader(fragmentShader);

  program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const linkErrLog = gl.getProgramInfoLog(program);
    console.log(
      `Shader program did not link successfully. Error log: ${linkErrLog}`,
    );
    return null;
  }

  let a_Position = gl.getAttribLocation(program, "attribute_model_position");
  let a_FragColor = gl.getAttribLocation(program, "attribute_color");
  let a_PointSize = gl.getAttribLocation(program, "attribute_point_size");

  //https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/By_example/Hello_vertex_attributes
  //https://stackoverflow.com/questions/77568662/how-does-this-code-work-with-multiple-buffer-bound-to-same-target
  gl.enableVertexAttribArray(a_Position);
  gl.enableVertexAttribArray(a_FragColor);
  gl.enableVertexAttribArray(a_PointSize);

  position_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

  color_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
  gl.vertexAttribPointer(a_FragColor, 4, gl.FLOAT, false, 0, 0);

  point_size_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, point_size_buffer);
  gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, 0, 0);

  gl.useProgram(program);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
}

function connectVariablesToGLSL() {
  u_Matrix = gl.getUniformLocation(program, "translation_matrix");
}

function addUiCallbacks() {
  document
    .getElementById("red_slider")
    .addEventListener("mouseup", function () {
      g_selected_color[0] = this.value / 100.0;
    });
  document
    .getElementById("green_slider")
    .addEventListener("mouseup", function () {
      g_selected_color[1] = this.value / 100.0;
    });
  document
    .getElementById("blue_slider")
    .addEventListener("mouseup", function () {
      g_selected_color[2] = this.value / 100.0;
    });
  document
    .getElementById("size_slider")
    .addEventListener("mouseup", function () {
      g_selected_size = this.value;
    });
  document
    .getElementById("button_clear")
    .addEventListener("mouseup", function () {
      g_shapes = [];
      renderAllShapes();
    });
  document
    .getElementById("button_shape_point")
    .addEventListener("mouseup", function () {
      g_selected_shape = "point";
    });
  document
    .getElementById("button_shape_triangle")
    .addEventListener("mouseup", function () {
      g_selected_shape = "triangle";
    });
}

function handleClicks(canvas) {
  canvas.onmousedown = function (ev) {
    click(ev, canvas);
  };
  canvas.onmousemove = function (ev) {
    if (ev.buttons == 1) {
      click(ev, canvas);
    }
  };
}

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  drawPoints();
  drawTriangles();
}

function drawPoints() {
  set_matrix(1, [0.0, 0.0, 0.0]);

  let points = g_shapes.filter((x) => x.type == "point");
  let color_buffer_data = new Float32Array(
    points
      .map((x) => x.color)
      .map((x) => [x[0], x[1], x[2], 1.0])
      .flat(),
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, color_buffer_data, gl.DYNAMIC_DRAW);

  let position_buffer_data = new Float32Array(
    points
      .map((x) => x.position)
      .map((x) => [x[0], x[1], 0.0])
      .flat(),
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, position_buffer_data, gl.DYNAMIC_DRAW);

  let point_size_buffer_data = new Float32Array(points.map((x) => x.size));
  gl.bindBuffer(gl.ARRAY_BUFFER, point_size_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, point_size_buffer_data, gl.DYNAMIC_DRAW);

  gl.drawArrays(gl.POINTS, 0, points.length);
}

function drawTriangles() {
  const NUM_TRIANGLE_VERTS = 3;

  gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, TRIANGLE_VERTS, gl.DYNAMIC_DRAW);

  //unused outside of "Point" shape but should be filled with junk idk
  gl.bindBuffer(gl.ARRAY_BUFFER, point_size_buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(NUM_TRIANGLE_VERTS).fill(0),
    gl.DYNAMIC_DRAW,
  );

  g_shapes
    .filter((x) => x.type == "triangle")
    .forEach((triangle) => {
      let color = [
        triangle.color[0],
        triangle.color[1],
        triangle.color[2],
        1.0,
      ];
      let colors = new Array(NUM_TRIANGLE_VERTS * 2).fill(color).flat();
      let color_buffer_data = new Float32Array(colors);
      gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
      gl.bufferData(gl.ARRAY_BUFFER, color_buffer_data, gl.DYNAMIC_DRAW);

      set_matrix(1, [triangle.position[0], triangle.position[1], 0.0]);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
}

function set_matrix(scale, transpose) {
  gl.uniformMatrix4fv(u_Matrix, false, [
    scale,
    0.0,
    0.0,
    0.0,
    0.0,
    scale,
    0.0,
    0.0,
    0.0,
    0.0,
    scale,
    0.0,
    transpose[0],
    transpose[1],
    transpose[2],
    1.0,
  ]);
}

function click(ev, canvas) {
  let x = ev.clientX;
  let y = ev.clientY;
  let rect = ev.target.getBoundingClientRect();

  x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  if (g_selected_shape == "point") {
    g_shapes.push(
      new Shape("point", [x, y], g_selected_color.slice(), g_selected_size),
    );
  } else if (g_selected_shape == "triangle") {
    g_shapes.push(
      new Shape("triangle", [x, y], g_selected_color.slice(), g_selected_size),
    );
  } else {
    console.error("invalid shape", g_selected_shape);
  }
  renderAllShapes();
}

let ANDY_VERTEX_SHADER_SOURCE = `
uniform mat4 translation_matrix;
attribute vec3 attribute_model_position;
attribute vec4 attribute_color;
attribute float attribute_point_size;
varying vec4 color;
void main() {
  gl_Position = translation_matrix * vec4(attribute_model_position, 1.0);
  gl_PointSize = attribute_point_size;
  color = attribute_color;
}`;

let ANDY_FRAGMENT_SHADER_SOURCE = `
precision mediump float;
varying vec4 color;
void main() {
  gl_FragColor = color;
}`;

const TRIANGLE_VERTS = new Float32Array([
  0.2, 0.2, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0,
]);
