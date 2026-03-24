import Panzoom from 'panzoom';
import { trasladarPoligono, escalarPoligono, rotarPoligono } from './math.js';
import './style.css';

const poligonos = {
    triangulo: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 },
    ],
    rectangulo: [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
        { x: 0, y: 10 },
    ],
    pentagono: [
        { x: 10, y: 0 },
        { x: 30, y: 0 },
        { x: 40, y: 15 },
        { x: 20, y: 30 },
        { x: 0, y: 15 },
    ],
    hexagono: [
        { x: 10, y: 0 },
        { x: 30, y: 0 },
        { x: 40, y: 20 },
        { x: 30, y: 40 },
        { x: 10, y: 40 },
        { x: 0, y: 20 },
    ],
};

let poligonoActual = [];
let numTransformaciones = 0;
let tipoPoligonoSeleccionado = 'triangulo';

const plano = document.getElementById('plano');
const historialLista = document.getElementById('historial');

const inputs = document.getElementById('entradas');
const transformSelect = document.getElementById('select-transformacion');

const accionesPrincipales = document.getElementById('acciones-principales');
const estadoConfirmacion = document.getElementById('estado-confirmacion');
const btnSiOtra = document.getElementById('btn-si-otra');
const btnNoTerminar = document.getElementById('btn-no-terminar');

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

const vistaConfiguracion = document.getElementById('vista-configuracion');
const vistaTransformacion = document.getElementById('vista-transformacion');

const botonesPoly = document.querySelectorAll('.btn-poly');
const entradasCoordenadas = document.getElementById('entradas-coordenadas');

// --- Nueva lógica para la selección visual de polígonos ---
botonesPoly.forEach((boton) => {
    boton.addEventListener('click', () => {
        // 1. Quitar la clase 'active' de todos los botones
        botonesPoly.forEach((b) => b.classList.remove('active'));
        // 2. Agregar 'active' al botón clickeado
        boton.classList.add('active');
        // 3. Actualizar la variable de estado usando el atributo data-poly
        tipoPoligonoSeleccionado = boton.dataset.poly;
        // 4. Actualizar las cajas de texto con los vértices
        actualizarInputsCoordenadas();
    });
});

function actualizarInputsCoordenadas() {
    const vertices = poligonos[tipoPoligonoSeleccionado];

    entradasCoordenadas.innerHTML = '';

    vertices.forEach((vertice, index) => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.gap = '5px';
        div.style.marginBottom = '5px';
        div.style.alignItems = 'center';

        div.innerHTML = `
            <span style="min-width: 25px; font-size: 0.8em; color: #888;">P${index}</span>
            <input type="number" id="v${index}-x" value="${vertice.x}" placeholder="X">
            <input type="number" id="v${index}-y" value="${vertice.y}" placeholder="Y">
        `;
        entradasCoordenadas.appendChild(div);
    });
}

actualizarInputsCoordenadas();

function dibujarPoligono(puntos, esInicial = false) {
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

    return colorBorde;
}

// paresDescripcionPuntos es un diccionario con la clave la descripción/significado de la lista de puntos, y el valor una lista de puntos
function agregarAlHistorial(
    paresDescripcionPuntos,
    colorHexHsl,
    descripcionGeneral,
) {
    const li = document.createElement('li');

    li.style.borderLeft = `4px solid ${colorHexHsl}`;

    li.innerHTML = `
            <h3 style="margin: 0; padding-bottom: 5px; color: ${colorHexHsl};">${descripcionGeneral}</h3>`;

    for (const [descripcion, puntos] of Object.entries(
        paresDescripcionPuntos,
    )) {
        //  li.innerHTML =
        //      `<h3 style="margin: 0; padding-bottom: 5px; color: ${colorHexHsl};">${descripcion}</h3>` +
        //      `<div style="font-family: monospace; font-size: 0.9em; opacity: 0.8;">` +
        //      puntos
        //          .map((p) => `(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`)
        //          .join('<br>') +
        //      `</div>`;
        li.innerHTML += `
            <div style="margin-top: 10px;">
                <strong style="font-size: 0.85em; color: #aaa; display: block; margin-bottom: 4px;">${descripcion}</strong>
                <div style="font-family: monospace; font-size: 0.9em; opacity: 0.9; padding-left: 8px; border-left: 2px solid rgba(255,255,255,0.1);">
                    ${puntos.map((p) => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`).join('<br>')}
                </div>
            </div>`;
    }
    historialLista.prepend(li);
}

document.getElementById('btn-inicial').addEventListener('click', () => {
    plano.innerHTML = '';
    historialLista.innerHTML = '';
    numTransformaciones = 0;

    const tipo = tipoPoligonoSeleccionado;
    const numVertices = poligonos[tipo].length;
    poligonoActual = [];

    for (let i = 0; i < numVertices; i++) {
        const x = Number(document.getElementById(`v${i}-x`).value);
        const y = Number(document.getElementById(`v${i}-y`).value);
        poligonoActual.push({ x, y });
    }

    const nombreFormateado = tipo.charAt(0).toUpperCase() + tipo.slice(1);
    const color = dibujarPoligono(poligonoActual, true);
    agregarAlHistorial(
        { Coordenadas: poligonoActual },
        color,
        `Polígono Inicial: ${nombreFormateado}`,
    );

    vistaConfiguracion.style.display = 'none';
    vistaTransformacion.style.display = 'block';
});

btnSiOtra.addEventListener('click', () => {
    estadoConfirmacion.style.display = 'none';
    accionesPrincipales.style.display = 'block';

    transformSelect.disabled = false;
    const inputsNodos = document.querySelectorAll('#entradas input');
    inputsNodos.forEach((input) => {
        input.disabled = false;
    });
});

btnNoTerminar.addEventListener('click', () => {
    estadoConfirmacion.style.display = 'none';
    accionesPrincipales.style.display = 'block';
    transformSelect.disabled = false;

    plano.innerHTML = '';
    historialLista.innerHTML = '';
    numTransformaciones = 0;

    vistaTransformacion.style.display = 'none';
    vistaConfiguracion.style.display = 'block';
});

document.getElementById('btn-transformar').addEventListener('click', () => {
    if (poligonoActual.length === 0) return alert('Dibuja un polígono primero');

    const tipo = document.getElementById('select-transformacion').value;
    let descripcion = '';
    let datosHistorial = {};

    switch (tipo) {
        case 'traslacion':
            const dx = Number(document.getElementById('input-x').value);
            const dy = Number(document.getElementById('input-y').value);
            descripcion = `Traslación (dx: ${dx}, dy: ${dy})`;
            poligonoActual = trasladarPoligono(poligonoActual, dx, dy);
            datosHistorial = { Resultado: poligonoActual };
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
            const anguloRad = angulo * (Math.PI / 180);

            descripcion = `Rotación (${angulo}° en P(${pivotX}, ${pivotY}))`;

            // Algoritmo visto en clase
            // 1. Restar el pivote
            const paso1 = trasladarPoligono(poligonoActual, -pivotX, -pivotY);

            // 2. Rotar sobre el origen
            const paso2 = rotarPoligono(paso1, anguloRad);

            // 3. Sumar el pivote de nuevo
            const paso3 = trasladarPoligono(paso2, pivotX, pivotY);

            poligonoActual = paso3;

            datosHistorial = {
                '1. Restar el pivote': paso1,
                '2. Rotar sobre el origen': paso2,
                '3. Sumar el pivote': paso3,
            };
            break;
        case 'escalamiento':
            const Sx = Number(document.getElementById('input-sx').value);
            const Sy = Number(document.getElementById('input-sy').value);
            descripcion = `Escalamiento (Sx: ${Sx}, Sy: ${Sy})`;
            poligonoActual = escalarPoligono(poligonoActual, Sx, Sy);
            datosHistorial = { Resultado: poligonoActual };
            break;
        default:
            console.error('Transformación no reconocida');
            break;
    }
    numTransformaciones++;
    const color = dibujarPoligono(poligonoActual);
    agregarAlHistorial(datosHistorial, color, descripcion);

    accionesPrincipales.style.display = 'none';
    estadoConfirmacion.style.display = 'block';
    transformSelect.disabled = true;
    const inputsNodos = document.querySelectorAll('#entradas input');
    inputsNodos.forEach((input) => (input.disabled = true));
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
