window.onload = main;

let VSHADER_SOURCE =
    'attribute vec4 attribute_position;\n' +
	'attribute vec4 attribute_color;\n' +
	'varying vec4 color;\n' +
	'void main() {\n' +
	' gl_Position = attribute_position;\n' +
	' gl_PointSize = 10.0;\n' +
	'color = attribute_color;\n' +
	'}\n';

let FSHADER_SOURCE =
    'precision mediump float;\n' +
	'varying vec4 color;\n' +
	'void main() {\n' +
	' gl_FragColor = color;\n' +
	'}\n';

function main() {
    let canvas = document.getElementById('andy_canvas');

    let [gl, _program, position_buffer, color_buffer] = add_shaders_to_canvas(canvas, VSHADER_SOURCE, FSHADER_SOURCE);

    canvas.onmousedown = function(ev) {
	click(ev, gl, canvas, position_buffer, color_buffer);
    };
    gl.clear(gl.COLOR_BUFFER_BIT);
}

let g_points = []; // The array for a mouse press
let g_colors = []; // The array to store the color of a point
function click(ev, gl, canvas, position_buffer, color_buffer) {
    let x = ev.clientX; // x coordinate of a mouse pointer
    let y = ev.clientY; // y coordinate of a mouse pointer
    let rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    g_points.push([x, y]);

    if (x >= 0.0 && y >= 0.0) {
	g_colors.push([1.0, 0.0, 0.0, 1.0]);
    } else if (x < 0.0 && y < 0.0) {
	g_colors.push([0.0, 1.0, 0.0, 1.0]);
    } else {
	g_colors.push([1.0, 0.0, 1.0, 1.0]);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);

    console.log(g_points.length, g_colors.length);

    //use attrib arrays instead of looping for better performance (i think)
    //https://stackoverflow.com/questions/77568662/how-does-this-code-work-with-multiple-buffer-bound-to-same-target
    let color_buffer_data = new Float32Array(g_colors.map((x) => [x[0], x[1], x[2], 1.0]).flat());
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, color_buffer_data, gl.DYNAMIC_DRAW);

    let position_buffer_data = new Float32Array(g_points.map((x) => [x[0], x[1], 0.0, 1.0]).flat());
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, position_buffer_data, gl.DYNAMIC_DRAW);

    gl.drawArrays(gl.POINTS, 0, g_points.length);
}

function add_shaders_to_canvas(canvas, vertex_source, fragment_source) {
    let gl = canvas.getContext('webgl');

    //https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/By_example/Hello_GLSL
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertex_source);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragment_source);
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
	console.log(`Shader program did not link successfully. Error log: ${linkErrLog}`);
	return null;
    }

    let a_Position = gl.getAttribLocation(program, 'attribute_position');
    let a_FragColor = gl.getAttribLocation(program, 'attribute_color');

    //https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/By_example/Hello_vertex_attributes
    //https://stackoverflow.com/questions/77568662/how-does-this-code-work-with-multiple-buffer-bound-to-same-target
    gl.enableVertexAttribArray(a_Position);
    gl.enableVertexAttribArray(a_FragColor);

    let position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
    gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, 0, 0);



    let color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.vertexAttribPointer(a_FragColor, 4, gl.FLOAT, false, 0, 0);


    gl.useProgram(program);



    return [gl, program, position_buffer, color_buffer];
}
