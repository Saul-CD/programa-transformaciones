import './style.css';

import { trasladarPoligono, escalarPoligono, rotarPoligono } from './math.js';
import { agregarAlHistorial, limpiarHistorial } from './historial.js';
import { dibujarPoligono } from './renderer.js';
import {
    limpiarPlano,
    getPoligono,
    mostrarVistaTransformacion,
    mostrarVistaConfiguracion,
    mostrarAccionesPrincipales,
    getTransformacion,
    getInputs,
    mostrarConfirmacion,
} from './ui.js';

let poligonoActual = [];
let numTransformaciones = 0;

document.getElementById('btn-inicial').addEventListener('click', () => {
    limpiarPlano();
    limpiarHistorial();

    numTransformaciones = 0;

    const { tipo, vertices } = getPoligono();
    const numVertices = vertices.length;

    poligonoActual = [];
    for (let i = 0; i < numVertices; i++) {
        const x = Number(document.getElementById(`v${i}-x`).value);
        const y = Number(document.getElementById(`v${i}-y`).value);
        poligonoActual.push({ x, y });
    }

    const nombreFormateado = tipo.charAt(0).toUpperCase() + tipo.slice(1);
    const color = dibujarPoligono(poligonoActual, numTransformaciones);
    agregarAlHistorial(
        { Coordenadas: poligonoActual },
        color,
        `Polígono Inicial: ${nombreFormateado}`,
    );

    mostrarVistaTransformacion();
});

document.getElementById('btn-si-otra').addEventListener('click', () => {
    mostrarAccionesPrincipales();
});

document.getElementById('btn-no-terminar').addEventListener('click', () => {
    mostrarAccionesPrincipales();

    limpiarPlano();
    limpiarHistorial();

    mostrarVistaConfiguracion();

    numTransformaciones = 0;
});

document.getElementById('btn-transformar').addEventListener('click', () => {
    if (poligonoActual.length === 0) return alert('Dibuja un polígono primero');

    const tipo = getTransformacion();
    let descripcion = '';
    let datosHistorial = {};

    switch (tipo) {
        case 'traslacion':
            const { dx, dy } = getInputs();
            descripcion = `Traslación (dx: ${dx}, dy: ${dy})`;
            poligonoActual = trasladarPoligono(poligonoActual, dx, dy);
            datosHistorial = { Resultado: poligonoActual };
            break;
        case 'rotacion':
            const { angulo, pivoteX, pivoteY } = getInputs();
            const anguloRad = (angulo * Math.PI) / 180;

            descripcion = `Rotación (${angulo}° en P(${pivoteX}, ${pivoteY}))`;

            // Algoritmo visto en clase
            // 1. Restar el pivote
            const paso1 = trasladarPoligono(poligonoActual, -pivoteX, -pivoteY);

            // 2. Rotar sobre el origen
            const paso2 = rotarPoligono(paso1, anguloRad);

            // 3. Sumar el pivote de nuevo
            const paso3 = trasladarPoligono(paso2, pivoteX, pivoteY);

            poligonoActual = paso3;

            datosHistorial = {
                '1. Restar el pivote': paso1,
                '2. Rotar sobre el origen': paso2,
                '3. Sumar el pivote': paso3,
            };
            break;
        case 'escalamiento':
            const { Sx, Sy } = getInputs();
            descripcion = `Escalamiento (Sx: ${Sx}, Sy: ${Sy})`;
            poligonoActual = escalarPoligono(poligonoActual, Sx, Sy);
            datosHistorial = { Resultado: poligonoActual };
            break;
        default:
            console.error('Transformación no reconocida');
            break;
    }
    numTransformaciones++;
    const color = dibujarPoligono(poligonoActual, numTransformaciones);
    agregarAlHistorial(datosHistorial, color, descripcion);

    mostrarConfirmacion();
});
