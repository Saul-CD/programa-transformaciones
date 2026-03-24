import Panzoom from 'panzoom';
import {
    matrizTraslacion,
    transformarPoligono,
    matrizRotacion,
    matrizEscalamiento,
} from './math.js';
import './style.css';

const poligonos = {
    triangulo: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 },
    ],
    cuadrado: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
    ],
};

let poligonoActual = [];
let numTransformaciones = 0;

const plano = document.getElementById('plano');
const historialLista = document.getElementById('historial');

const inputs = document.getElementById('entradas');
const transformSelect = document.getElementById('select-transformacion');

function actualizarInputs() {
    inputs.innerHTML = '';

    if (transformSelect.value === 'rotacion') {
        inputs.innerHTML = `
            <input type="number" id="input-angulo" placeholder="Angulo">
            <input type="number" id="input-pivote-x" placeholder="Pivote X">
            <input type="number" id="input-pivote-y" placeholder="Pivote Y">
        `;
    } else if (transformSelect.value === 'traslacion') {
        inputs.innerHTML = `
            <input type="number" id="input-x" placeholder="dx">
            <input type="number" id="input-y" placeholder="dy">
        `;
    } else {
        inputs.innerHTML = `
            <input type="number" id="input-sx" placeholder="Sx">
            <input type="number" id="input-sy" placeholder="Sy">
        `;
    }
}
transformSelect.addEventListener('change', actualizarInputs);
actualizarInputs();

const canvas = document.getElementById('canvas');
const panzoomWrapper = document.getElementById('panzoom-wrapper');

const centerX = window.innerWidth / 2;
const centerY = window.innerHeight / 2;
const panzoom = Panzoom(panzoomWrapper, {
    maxZoom: 450000,
    minZoom: 0.0012,
    initialZoom: 20,
});
panzoom.moveTo(centerX, centerY);

// Habilitar el zoom usando la rueda del ratón
canvas.parentElement.addEventListener('wheel', panzoom.zoomWithWheel);

// --- NUEVA LÓGICA DEL GRID DINÁMICO ---
const sistemaCoordenado = document.getElementById('sistema-coordenado');
const gridLayer = document.getElementById('grid-layer');

// Centrar el origen en medio de la pantalla y hacer que la 'Y' crezca hacia arriba
sistemaCoordenado.setAttribute(
    'transform',
    // `translate(${centerX}, ${centerY}) scale(1, -1)`,
    `scale(1, -1)`,
);

function actualizarCuadricula() {
    // 1. Obtener estado actual de la cámara
    const transform = panzoom.getTransform();
    const scale = transform.scale;
    const tx = transform.x;
    const ty = transform.y;
    console.log(tx);

    // 2. Calcular el LOD (Level of Detail)
    // Buscamos que visualmente haya unos 80px de separación entre líneas
    const visualSpacing = 80;
    const worldStepRaw = visualSpacing / scale;

    // Magia algebraica para redondear el paso a magnitudes agradables (1, 2, 5, 10, 20...)
    const magnitud = Math.pow(10, Math.floor(Math.log10(worldStepRaw)));
    const normalizado = worldStepRaw / magnitud;

    let step;
    if (normalizado < 2) step = magnitud;
    else if (normalizado < 5) step = 2 * magnitud;
    else step = 5 * magnitud;

    // 3. Calcular la "Caja Delimitadora" visible (Viewport to World mapping)
    // Para no dibujar un millón de líneas, calculamos qué coordenadas existen dentro del monitor
    const w = window.innerWidth;
    const h = window.innerHeight;

    // (Math.abs para evitar signos negativos raros por el flip de Y)
    const minX = -tx / scale;
    const maxX = (-tx + w) / scale;
    const minY = (ty - h) / scale; // La traslación en Y se comporta distinto por el parent
    const maxY = ty / scale;

    // Expandir un poco el margen para que no se corten las líneas al mover rápido
    const startX = Math.floor(minX / step) * step - step;
    const endX = Math.ceil(maxX / step) * step + step;
    const startY = Math.floor(minY / step) * step - step;
    const endY = Math.ceil(maxY / step) * step + step;

    // 4. Construir el SVG
    let htmlGrid = '';

    // Como el texto también sufre por el transform global, contrarrestamos su escala individualmente
    const fontFix = `transform="scale(1, -1)"`;
    const textSize = 12 / scale; // Ajuste para el tamaño de fuente relativo

    // Generar Ejes y Cuadrícula X
    for (let i = startX; i <= endX; i += step) {
        if (Math.abs(i) < 0.00001) continue;
        htmlGrid += `
            <line x1="${i}" y1="${startY}" x2="${i}" y2="${endY}" stroke="#222" stroke-width="1" />
            <text x="${i}" y="0" ${fontFix} font-size="${textSize}" text-anchor="middle">${parseFloat(i.toPrecision(4))}</text>
        `;
    }

    // Generar Ejes y Cuadrícula Y
    for (let j = startY; j <= endY; j += step) {
        if (Math.abs(j) < 0.00001) continue;
        htmlGrid += `
            <line x1="${startX}" y1="${j}" x2="${endX}" y2="${j}" stroke="#222" stroke-width="1" />
            <text x="0" y="${-j}" ${fontFix} alignment-baseline="middle" text-anchor="end" font-size="${textSize}">${parseFloat(j.toPrecision(4))}</text>
        `;
    }

    // Dibujar los Ejes Principales (X e Y) más gruesos y por encima
    htmlGrid += `
        <line x1="${startX}" y1="0" x2="${endX}" y2="0" stroke="#888" stroke-width="2" />
        <line x1="0" y1="${startY}" x2="0" y2="${endY}" stroke="#888" stroke-width="2" />
    `;

    gridLayer.innerHTML = htmlGrid;
}

// Escuchar el evento de Panzoom que descubriste
panzoom.on('transform', actualizarCuadricula);
// Dibujar la cuadrícula en la primera carga
actualizarCuadricula();

// Función que toma un arreglo de {x, y} y lo dibuja en el SVG
function dibujarPoligono(puntos, esInicial = false) {
    const puntosString = puntos.map((p) => `${p.x},${p.y}`).join(' ');

    const poligonoElement = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'polygon',
    );
    poligonoElement.setAttribute('points', puntosString);

    // Colores dinámicos para ver la superposición (Requisito 4)
    const color = numTransformaciones * 40;
    poligonoElement.setAttribute(
        'fill',
        esInicial
            ? 'rgba(255, 255, 255, 0.2)'
            : `hsla(${color}, 70%, 50%, 0.5)`,
    );
    poligonoElement.setAttribute(
        'stroke',
        esInicial ? 'white' : `hsl(${color}, 70%, 50%)`,
    );
    poligonoElement.setAttribute('stroke-width', '2');

    plano.appendChild(poligonoElement);
    agregarAlHistorial(puntos);
}

function agregarAlHistorial(puntos) {
    const li = document.createElement('li');
    li.innerHTML =
        `<h3>Paso ${numTransformaciones}</h3><br>` +
        puntos
            .map((p) => `(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`)
            .join('<br>');
    historialLista.prepend(li); // Requisito 5: Agregar al tope
}

document.getElementById('btn-inicial').addEventListener('click', () => {
    plano.innerHTML = '';
    historialLista.innerHTML = '';
    numTransformaciones = 0;

    const tipo = document.getElementById('select-poligono').value;
    poligonoActual = [...poligonos[tipo]];

    dibujarPoligono(poligonoActual, true);
});

document.getElementById('btn-transformar').addEventListener('click', () => {
    if (poligonoActual.length === 0) return alert('Dibuja un polígono primero');

    const tipo = document.getElementById('select-transformacion').value;

    let matriz;
    switch (tipo) {
        case 'traslacion':
            const X = Number(document.getElementById('input-x').value);
            const Y = Number(document.getElementById('input-y').value);
            matriz = matrizTraslacion(X, Y);
            break;
        case 'rotacion':
            const angulo = Number(
                document.getElementById('input-angulo').value,
            );
            const pivotX = Number(
                document.getElementById('input-pivote-x').value,
            );
            const pivotY = Number(
                document.getElementById('input-pivote-y').value,
            );
            matriz = matrizRotacion(angulo * (Math.PI / 180), pivotX, pivotY);
            break;
        case 'escalamiento':
            const Sx = Number(document.getElementById('input-sx').value);
            const Sy = Number(document.getElementById('input-sy').value);
            matriz = matrizEscalamiento(Sx, Sy);
            break;
        default:
            console.error('Transformación no reconocida');
            break;
    }

    poligonoActual = transformarPoligono(poligonoActual, matriz);

    numTransformaciones++;
    dibujarPoligono(poligonoActual);
});

// --- LÓGICA UI MÓVIL ---
const panelControls = document.querySelector('.panel.controles');
const panelHistory = document.querySelector('.panel.historial');
const fabControls = document.getElementById('fab-controls');
const fabHistory = document.getElementById('fab-history');

function alternarPaneles(mostar, esconder) {
    if (mostar.classList.contains('active')) {
        mostar.classList.remove('active');
    } else {
        mostar.classList.add('active');
        esconder.classList.remove('active');
    }
}

fabControls.addEventListener('click', () =>
    alternarPaneles(panelControls, panelHistory),
);
fabHistory.addEventListener('click', () =>
    alternarPaneles(panelHistory, panelControls),
);

canvas.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
        panelControls.classList.remove('active');
        panelHistory.classList.remove('active');
    }
});
