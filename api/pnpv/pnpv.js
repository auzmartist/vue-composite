/* eslint-disable no-console*/
/* eslint-disable no-undef*/
/* eslint-disable no-var*/
var PNPV = (function() {
	'use strict';

	let receiveMessage = function(event) {
		var origin = event.origin || event.originalEvent.origin;
		// TODO: replace with list of known origins
		if(origin !== 'http://localhost:8080') {
			console.warn('[PNPV] message received from unknown origin. Disregarding.');
			return;
		}
		if(!event.data || !event.data.type || !event.data.payload) {
			console.error('[PNPV] No data or data.type sent with message.');
		}
		switch(event.data.type) {
			case 'updateYaw': updateYaw(event.data.payload); break;
			case 'updatePitch': updatePitch(event.data.payload); break;
			case 'updateRoll': updateRoll(event.data.payload); break;
			default:
				console.warn('[PNPV] Message type did not match any supported functions. ');
				break;
		}
	};
	window.addEventListener('message', receiveMessage, false);

	var yaw = 0.00200;
	var pitch = 0.00100;
	var roll = 0.00050;
	let updateYaw = function(val) {
		yaw = val;
	};

	let updatePitch = function(val) {
		pitch = val;
	};

	let updateRoll = function(val) {
		roll = val;
	};

	utilityInit();
	var canvas = document.createElement('canvas');
	canvas.width = Math.min(window.innerWidth, window.innerHeight);
	canvas.height = canvas.width;
	let mount = document.getElementById('container');
	mount.appendChild(canvas);
	var gl = canvas.getContext( 'webgl2', {antialias: false});
	var isWebGL2 = !!gl;
	if(!isWebGL2) {
		document.getElementById('info').innerHTML = 'WebGL 2 is not available. :(';
	}

	// Init program
	var program = createProgram(gl, getShaderSource('vs'), getShaderSource('fs'));
	var mvMatrixLocation = gl.getUniformLocation(program, 'mvMatrix');
	var pMatrixLocation = gl.getUniformLocation(program, 'pMatrix');
	var diffuseLocation = gl.getUniformLocation(program, 'diffuse');

	var positions = new Float32Array([
		// Front face
		-1.0, -1.0, 1.0,
		1.0, -1.0, 1.0,
		1.0, 1.0, 1.0,
		-1.0, 1.0, 1.0,
		// Back face
		-1.0, -1.0, -1.0,
		-1.0, 1.0, -1.0,
		1.0, 1.0, -1.0,
		1.0, -1.0, -1.0,
		// Top face
		-1.0, 1.0, -1.0,
		-1.0, 1.0, 1.0,
		1.0, 1.0, 1.0,
		1.0, 1.0, -1.0,
		// Bottom face
		-1.0, -1.0, -1.0,
		1.0, -1.0, -1.0,
		1.0, -1.0, 1.0,
		-1.0, -1.0, 1.0,
		// Right face
		1.0, -1.0, -1.0,
		1.0, 1.0, -1.0,
		1.0, 1.0, 1.0,
		1.0, -1.0, 1.0,
		// Left face
		-1.0, -1.0, -1.0,
		-1.0, -1.0, 1.0,
		-1.0, 1.0, 1.0,
		-1.0, 1.0, -1.0,
	]);
	var vertexPosBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	var texCoords = new Float32Array([
		// Front face
		0.0, 0.0,
		0.0, 1.0,
		1.0, 1.0,
		1.0, 0.0,
		// Back face
		1.0, 1.0,
		1.0, 0.0,
		0.0, 0.0,
		0.0, 1.0,
		// Top face
		1.0, 0.0,
		0.0, 0.0,
		0.0, 1.0,
		1.0, 1.0,
		// Bottom face
		0.0, 0.0,
		0.0, 1.0,
		1.0, 1.0,
		1.0, 0.0,
		// Right face
		0.0, 0.0,
		0.0, 1.0,
		1.0, 1.0,
		1.0, 0.0,
		// Left face
		0.0, 0.0,
		0.0, 1.0,
		1.0, 1.0,
		1.0, 0.0,
	]);
	var vertexTexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	// Element buffer
	var indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	var cubeVertexIndices = [
		0, 1, 2, 0, 2, 3, // front
		4, 5, 6, 4, 6, 7, // back
		8, 9, 10, 8, 10, 11, // top
		12, 13, 14, 12, 14, 15, // bottom
		16, 17, 18, 16, 18, 19, // right
		20, 21, 22, 20, 22, 23, // left
	];
	// Now send the element array to GL
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
	// Init VertexArray
	var vertexArray = gl.createVertexArray();
	gl.bindVertexArray(vertexArray);
	var vertexPosLocation = 0; // set with GLSL layout qualifier
	gl.enableVertexAttribArray(vertexPosLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
	gl.vertexAttribPointer(vertexPosLocation, 3, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	var vertexTexLocation = 4; // set with GLSL layout qualifier
	gl.enableVertexAttribArray(vertexTexLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexBuffer);
	gl.vertexAttribPointer(vertexTexLocation, 2, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bindVertexArray(null);
	// Init Texture
	var imageUrl = 'proto_labs.png';
	var texture;
	loadImage(imageUrl, function(image) {
		// Init 2D Texture
		texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		// Allocate storage for the texture
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGB8, 256, 256);
		gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGB, gl.UNSIGNED_BYTE, image);
		gl.generateMipmap(gl.TEXTURE_2D);
		requestAnimationFrame(render);
	});
	// Initialize render variables
	var orientation = [0.0, 0.0, 0.0];
	var modelMatrix = mat4.create();
	var mvMatrix = mat4.create();
	var translate = vec3.create();
	vec3.set(translate, 0, 0, -10);
	mat4.translate(mvMatrix, modelMatrix, translate);
	var perspectiveMatrix = mat4.create();
	mat4.perspective(perspectiveMatrix, 0.785, 1, 1, 1000);
	// Mouse Behaviour
	var mouseDown = false;
	var lastMouseX = 0;
	var lastMouseY = 0;
	canvas.onmousedown = function(event) {
			mouseDown = true;
			lastMouseX = event.clientX;
			lastMouseY = event.clientY;
	};
	canvas.onmouseup = function(event) {
			mouseDown = false;
			emit('pnpv_mouseUp', {mouseX: lastMouseX, mouseY: lastMouseY});
	};
	canvas.onmousemove = function(event) {
		var newX = event.clientX;
		var newY = event.clientY;
		var deltaX = newX - lastMouseX;
		var deltaY = newY - lastMouseY;
		var m = mat4.create();

		mat4.rotateX(m, m, deltaX / 100.0);
		mat4.rotateY(m, m, deltaY / 100.0);

		var scale = vec3.create();
		vec3.set(scale, (1 + deltaX / 1000.0), (1 + deltaX / 1000.0), (1 + deltaX / 1000.0));
		mat4.scale(m, m, scale);
		mat4.multiply(mvMatrix, mvMatrix, m);

		lastMouseX = newX;
		lastMouseY = newY;
	};

	function render() {
		// Render
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		orientation[0] = yaw;
		orientation[1] = pitch;
		orientation[2] = roll;

		mat4.rotateX(mvMatrix, mvMatrix, orientation[0] * Math.PI);
		mat4.rotateY(mvMatrix, mvMatrix, orientation[1] * Math.PI);
		mat4.rotateZ(mvMatrix, mvMatrix, orientation[2] * Math.PI);
		gl.bindVertexArray(vertexArray);
		gl.useProgram(program);
		gl.uniformMatrix4fv(mvMatrixLocation, false, mvMatrix);
		gl.uniformMatrix4fv(pMatrixLocation, false, perspectiveMatrix);
		gl.uniform1i(diffuseLocation, 0);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.drawElementsInstanced(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, 1);
		requestAnimationFrame(render);
	}

	function utilityInit() {
		window.getShaderSource = function(id) {
			return document.getElementById(id).textContent.replace(/^\s+|\s+$/g, '');
		};

		function createShader(gl, source, type) {
			var shader = gl.createShader(type);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			return shader;
		}

		window.createProgram = function(gl, vertexShaderSource, fragmentShaderSource) {
			var program = gl.createProgram();
			var vshader = createShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
			var fshader = createShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
			gl.attachShader(program, vshader);
			gl.deleteShader(vshader);
			gl.attachShader(program, fshader);
			gl.deleteShader(fshader);
			gl.linkProgram(program);

			var log = gl.getProgramInfoLog(program);
			if (log) {
				console.log(log);
			}

			log = gl.getShaderInfoLog(vshader);
			if (log) {
				console.log(log);
			}

			log = gl.getShaderInfoLog(fshader);
			if (log) {
				console.log(log);
			}

			return program;
		};

		window.loadImage = function(url, onload) {
			var img = new Image();
			img.src = url;
			img.onload = function() {
				onload(img);
			};
			return img;
		};

		window.loadImages = function(urls, onload) {
			var imgs = [];
			var imgsToLoad = urls.length;

			function onImgLoad() {
				if (--imgsToLoad <= 0) {
					onload(imgs);
				}
			}

			for (var i = 0; i < imgsToLoad; ++i) {
				imgs.push(loadImage(urls[i], onImgLoad));
			}
		};

		window.loadObj = function(url, onload) {
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.responseType = 'text';
			xhr.onload = function(e) {
					var mesh = new OBJ.Mesh(this.response);
					onload(mesh);
			};
			xhr.send();
		};
	}

	/**
	 * Emits the event from the pnpv mount point
	 * @param {string} type the custom event type
	 * @param {Object} message any object to use as message
	 */
	function emit(type, message) {
		var event = new CustomEvent(type, message);
		mount.dispatchEvent(event);
		window.postMessage(message, 'http://localhost:8081');
		window.parent.document.dispatchEvent(event);
	}

	return {
		updateYaw: updateYaw,
		updatePitch: updatePitch,
		updateRoll: updateRoll,
	};
})();