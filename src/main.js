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

const centroX = window.innerWidth / 2;
const centroY = window.innerHeight / 2;
const panzoom = Panzoom(panzoomWrapper, {
    maxZoom: 450000,
    minZoom: 0.0012,
    initialZoom: 20,
});
panzoom.moveTo(centroX, centroY);

canvas.parentElement.addEventListener('wheel', panzoom.zoomWithWheel);

const sistemaCoordenado = document.getElementById('sistema-coordenado');
const cuadricula = document.getElementById('grid-layer');

// Centrar el origen en medio de la pantalla y hacer que la 'Y' crezca hacia arriba
sistemaCoordenado.setAttribute('transform', `scale(1, -1)`);

function actualizarCuadricula() {
    const transform = panzoom.getTransform();
    const scale = transform.scale;
    const tx = transform.x;
    const ty = transform.y;

    // 80px de separación entre líneas aproximadamente
    const separacion = 80;

    const magnitud = Math.pow(10, Math.floor(Math.log10(separacion / scale)));
    const normalizado = separacion / scale / magnitud;

    let step;
    if (normalizado < 2) step = magnitud;
    else if (normalizado < 5) step = 2 * magnitud;
    else step = 5 * magnitud;

    const w = window.innerWidth;
    const h = window.innerHeight;

    const minX = -tx / scale;
    const maxX = (-tx + w) / scale;
    const minY = (ty - h) / scale;
    const maxY = ty / scale;

    const x0 = Math.floor(minX / step) * step - step;
    const xn = Math.ceil(maxX / step) * step + step;
    const y0 = Math.floor(minY / step) * step - step;
    const yn = Math.ceil(maxY / step) * step + step;

    let cuadriculaHtml = '';

    const fontSize = 12 / scale;

    for (let i = x0; i <= xn; i += step) {
        if (Math.abs(i) < 0.00001) continue;
        cuadriculaHtml += `
            <line x1="${i}" y1="${y0}" x2="${i}" y2="${yn}" stroke="#222" stroke-width="1" />
            <text x="${i}" y="0" transform="scale(1, -1)" font-size="${fontSize}" text-anchor="middle">${parseFloat(i.toPrecision(4))}</text>
        `;
    }

    for (let j = y0; j <= yn; j += step) {
        if (Math.abs(j) < 0.00001) continue;
        cuadriculaHtml += `
            <line x1="${x0}" y1="${j}" x2="${xn}" y2="${j}" stroke="#222" stroke-width="1" />
            <text x="0" y="${-j}" transform="scale(1, -1)" alignment-baseline="middle" text-anchor="end" font-size="${fontSize}">${parseFloat(j.toPrecision(4))}</text>
        `;
    }

    cuadriculaHtml += `
        <line x1="${x0}" y1="0" x2="${xn}" y2="0" stroke="#888" stroke-width="2" />
        <line x1="0" y1="${y0}" x2="0" y2="${yn}" stroke="#888" stroke-width="2" />
    `;

    cuadricula.innerHTML = cuadriculaHtml;
}

panzoom.on('transform', actualizarCuadricula);
actualizarCuadricula();

function dibujarPoligono(
    puntos,
    esInicial = false,
    descripcion = 'Polígono Inicial',
) {
    if (!esInicial) {
        const poligonosViejos = plano.querySelectorAll('polygon');
        poligonosViejos.forEach((p) => {
            p.setAttribute('opacity', '0.4');
        });
    }

    const puntosString = puntos.map((p) => `${p.x},${p.y}`).join(' ');
    const poligonoElement = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'polygon',
    );
    poligonoElement.setAttribute('points', puntosString);

    const hue = numTransformaciones * 40;
    const colorFondo = esInicial
        ? 'rgba(255, 255, 255, 0.2)'
        : `hsla(${hue}, 70%, 60%, 0.5)`;
    const colorBorde = esInicial ? 'white' : `hsl(${hue}, 70%, 50%)`;

    poligonoElement.setAttribute('fill', colorFondo);
    poligonoElement.setAttribute('stroke', colorBorde);
    poligonoElement.setAttribute('stroke-width', '2');

    poligonoElement.style.transition =
        'opacity 0.3s ease, stroke-width 0.3s ease';

    plano.appendChild(poligonoElement);

    agregarAlHistorial(puntos, colorBorde, descripcion);
}

function agregarAlHistorial(puntos, colorHexHsl, descripcion) {
    const li = document.createElement('li');

    li.style.borderLeft = `4px solid ${colorHexHsl}`;

    li.innerHTML =
        `<h3 style="margin: 0; padding-bottom: 5px; color: ${colorHexHsl};">${descripcion}</h3>` +
        `<div style="font-family: monospace; font-size: 0.9em; opacity: 0.8;">` +
        puntos
            .map((p) => `(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`)
            .join('<br>') +
        `</div>`;

    historialLista.prepend(li);
}

document.getElementById('btn-inicial').addEventListener('click', () => {
    plano.innerHTML = '';
    historialLista.innerHTML = '';
    numTransformaciones = 0;

    const tipo = document.getElementById('select-poligono').value;
    poligonoActual = [...poligonos[tipo]];

    const nombreFormateado = tipo.charAt(0).toUpperCase() + tipo.slice(1);
    dibujarPoligono(
        poligonoActual,
        true,
        `Polígono Inicial: ${nombreFormateado}`,
    );
});

document.getElementById('btn-transformar').addEventListener('click', () => {
    if (poligonoActual.length === 0) return alert('Dibuja un polígono primero');

    const tipo = document.getElementById('select-transformacion').value;
    let descripcion = '';

    let matriz;
    switch (tipo) {
        case 'traslacion':
            const X = Number(document.getElementById('input-x').value);
            const Y = Number(document.getElementById('input-y').value);
            matriz = matrizTraslacion(X, Y);
            descripcion = `Traslación (dx: ${X}, dy: ${Y})`;
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
            descripcion = `Rotación (${angulo}° en (${pivotX}, ${pivotY}))`;
            break;
        case 'escalamiento':
            const Sx = Number(document.getElementById('input-sx').value);
            const Sy = Number(document.getElementById('input-sy').value);
            matriz = matrizEscalamiento(Sx, Sy);
            descripcion = `Escalamiento (Sx: ${Sx}, Sy: ${Sy})`;
            break;
        default:
            console.error('Transformación no reconocida');
            break;
    }

    poligonoActual = transformarPoligono(poligonoActual, matriz);

    numTransformaciones++;
    dibujarPoligono(poligonoActual, false, descripcion);
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
