const videoElement = document.getElementById("video");
const canvasElement = document.getElementById("canvas");
const canvasCtx = canvasElement.getContext("2d");
const counterElement = document.getElementById("counter");

let contador = 0;
let lastState = null;

const pose = new Pose({
	locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
});

pose.setOptions({
	modelComplexity: 1,
	smoothLandmarks: true,
	minDetectionConfidence: 0.5,
	minTrackingConfidence: 0.5,
});

pose.onResults(onResults);

// Definir o tamanho do canvas para ser igual ao do vídeo quando o vídeo for carregado
videoElement.addEventListener("loadedmetadata", () => {
	canvasElement.width = videoElement.videoWidth;
	canvasElement.height = videoElement.videoHeight;
	console.log("Vídeo carregado e pronto. Dimensões ajustadas.");
});

// Função que será chamada a cada frame processado
function onResults(results) {
	if (!results.poseLandmarks) return;

	// Limpar e redesenhar o canvas
	canvasCtx.save();
	canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
	canvasCtx.drawImage(
		videoElement,
		0,
		0,
		canvasElement.width,
		canvasElement.height,
	);

	// Desenhar os landmarks no canvas
	drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
		color: "#00FF00",
		lineWidth: 4,
	});
	drawLandmarks(canvasCtx, results.poseLandmarks, {
		color: "#FF0000",
		lineWidth: 2,
	});

	// Pegar as posições das mãos e pés
	const leftFoot = results.poseLandmarks[POSE_LANDMARKS.LEFT_FOOT_INDEX];
	const rightFoot = results.poseLandmarks[POSE_LANDMARKS.RIGHT_FOOT_INDEX];
	const leftHand = results.poseLandmarks[POSE_LANDMARKS.LEFT_INDEX];
	const rightHand = results.poseLandmarks[POSE_LANDMARKS.RIGHT_INDEX];

	// Calcular distâncias entre as mãos e entre os pés
	const distHand = Math.hypot(
		leftHand.x - rightHand.x,
		leftHand.y - rightHand.y,
	);
	const distFoot = Math.hypot(
		leftFoot.x - rightFoot.x,
		leftFoot.y - rightFoot.y,
	);

	// Verificar a condição para contar o polichinelo
	if (distHand <= 0.15 && distFoot >= 0.08) {
		if (lastState !== "jumped") {
			contador += 1;
			lastState = "jumped";
			console.log(`Polichinelo contado: ${contador}`);
		}
	} else if (distHand > 0.15 && distFoot < 0.08) {
		lastState = "not_jumped";
	}

	// Atualizar o contador na tela
	counterElement.innerText = `QTD: ${contador}`;

	canvasCtx.restore();
}

// Processar o vídeo frame por frame
videoElement.addEventListener("play", async () => {
	async function processFrame() {
		if (videoElement.paused || videoElement.ended) {
			return; // Parar o processamento se o vídeo for pausado ou terminar
		}
		await pose.send({ image: videoElement });
		requestAnimationFrame(processFrame);
	}
	processFrame();
});

// Desenhar as conexões no esqueleto
function drawConnectors(ctx, landmarks, connections, style) {
	const defaultStyle = { color: "#00FF00", lineWidth: 4 };
	const drawingStyle = { ...defaultStyle, ...style };

	for (const [startIdx, endIdx] of connections) {
		const startPoint = landmarks[startIdx];
		const endPoint = landmarks[endIdx];

		ctx.beginPath();
		ctx.moveTo(
			startPoint.x * ctx.canvas.width,
			startPoint.y * ctx.canvas.height,
		);
		ctx.lineTo(endPoint.x * ctx.canvas.width, endPoint.y * ctx.canvas.height);
		ctx.strokeStyle = drawingStyle.color;
		ctx.lineWidth = drawingStyle.lineWidth;
		ctx.stroke();
	}
}

// Desenhar os landmarks
function drawLandmarks(ctx, landmarks, style) {
	const defaultStyle = { color: "#FF0000", lineWidth: 2 };
	const drawingStyle = { ...defaultStyle, ...style };

	for (const landmark of landmarks) {
		ctx.beginPath();
		ctx.arc(
			landmark.x * ctx.canvas.width,
			landmark.y * ctx.canvas.height,
			drawingStyle.lineWidth,
			0,
			2 * Math.PI,
		);
		ctx.fillStyle = drawingStyle.color;
		ctx.fill();
	}
}
