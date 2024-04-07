window.onload = main;

let gl;
let color_buffer;
let position_buffer;
let point_size_buffer;
let g_shapes = [];
let g_selected_color = [1.0, 1.0, 1.0, 1.0]
let g_selected_size = 10.0

class Shape{
    constructor(position, color, size){
	this.type = "point";
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

function setupWebGL(canvas){
    gl = canvas.getContext("webgl");
    
    //https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/By_example/Hello_GLSL
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, ANDY_VERTEX_SHADER_SOURCE);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, ANDY_FRAGMENT_SHADER_SOURCE);
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
	console.log(
	    `Shader program did not link successfully. Error log: ${linkErrLog}`,
	);
	return null;
    }

    let a_Position = gl.getAttribLocation(program, "attribute_position");
    let a_FragColor = gl.getAttribLocation(program, "attribute_color");
    let a_PointSize = gl.getAttribLocation(program, "attribute_point_size");

    //https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/By_example/Hello_vertex_attributes
    //https://stackoverflow.com/questions/77568662/how-does-this-code-work-with-multiple-buffer-bound-to-same-target
    gl.enableVertexAttribArray(a_Position);
    gl.enableVertexAttribArray(a_FragColor);
    gl.enableVertexAttribArray(a_PointSize);

    position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
    gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, 0, 0);

    color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.vertexAttribPointer(a_FragColor, 4, gl.FLOAT, false, 0, 0);

    point_size_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, point_size_buffer);
    gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, 0, 0);
    
    gl.useProgram(program);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
}

function connectVariablesToGLSL(){
    
}

function addUiCallbacks(){
    document.getElementById("red_slider").addEventListener("mouseup", function(){
	g_selected_color[0] = this.value/100.0;
    });
    document.getElementById("green_slider").addEventListener("mouseup", function(){
	g_selected_color[1] = this.value/100.0;
    });
    document.getElementById("blue_slider").addEventListener("mouseup", function(){
	g_selected_color[2] = this.value/100.0;
    });
    document.getElementById("size_slider").addEventListener("mouseup", function(){
	g_selected_size = this.value;
    });
}

function handleClicks(canvas){
    canvas.onmousedown = function (ev) {
	click(ev, canvas);
    };
}

function renderAllShapes(){
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    //https://stackoverflow.com/questions/77568662/how-does-this-code-work-with-multiple-buffer-bound-to-same-target
    let color_buffer_data = new Float32Array(
	g_shapes.map((x) => x.color).map((x) => [x[0], x[1], x[2], 1.0]).flat(),
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, color_buffer_data, gl.DYNAMIC_DRAW);

    let position_buffer_data = new Float32Array(
	g_shapes.map((x) => x.position).map((x) => [x[0], x[1], 0.0, 1.0]).flat(),
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, position_buffer_data, gl.DYNAMIC_DRAW);

    let point_size_buffer_data = new Float32Array(
	g_shapes.map((x) => x.size)
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, point_size_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, point_size_buffer_data, gl.DYNAMIC_DRAW);

    
    gl.drawArrays(gl.POINTS, 0, g_shapes.length);
}

function click(ev, canvas) {
    let x = ev.clientX;
    let y = ev.clientY;
    let rect = ev.target.getBoundingClientRect();

    x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    g_shapes.push(new Shape([x, y], g_selected_color.slice(), g_selected_size));

    renderAllShapes();
}

let ANDY_VERTEX_SHADER_SOURCE = `
attribute vec4 attribute_position;
attribute vec4 attribute_color;
attribute float attribute_point_size;
varying vec4 color;
void main() {
  gl_Position = attribute_position;
  gl_PointSize = attribute_point_size;
  color = attribute_color;
}`;

let ANDY_FRAGMENT_SHADER_SOURCE = `
precision mediump float;
varying vec4 color;
void main() {
  gl_FragColor = color;
}`;
