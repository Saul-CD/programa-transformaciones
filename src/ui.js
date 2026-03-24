import { poligonos } from './poligonos.js';

const plano = document.getElementById('plano');

let tipoPoligonoSeleccionado = 'triangulo';

const inputs = document.getElementById('entradas');
const transformSelect = document.getElementById('select-transformacion');

const accionesPrincipales = document.getElementById('acciones-principales');
const estadoConfirmacion = document.getElementById('estado-confirmacion');

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

const vistaConfiguracion = document.getElementById('vista-configuracion');
const vistaTransformacion = document.getElementById('vista-transformacion');

const botonesPoly = document.querySelectorAll('.btn-poly');
const entradasCoordenadas = document.getElementById('entradas-coordenadas');

botonesPoly.forEach((boton) => {
    boton.addEventListener('click', () => {
        botonesPoly.forEach((b) => b.classList.remove('active'));
        boton.classList.add('active');
        tipoPoligonoSeleccionado = boton.dataset.poly;
        actualizarInputsCoordenadas();
    });
});

function actualizarInputsCoordenadas() {
    const vertices = poligonos[tipoPoligonoSeleccionado];

    entradasCoordenadas.innerHTML = '';
    const abecedario = [
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
    ];
    vertices.forEach((vertice, index) => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.gap = '5px';
        div.style.marginBottom = '5px';
        div.style.alignItems = 'center';

        div.innerHTML = `
            <span style="min-width: 25px; font-size: 0.8em; color: #888;">${abecedario[index]}</span>
            <input type="number" id="v${index}-x" value="${vertice.x}" placeholder="X">
            <input type="number" id="v${index}-y" value="${vertice.y}" placeholder="Y">
        `;
        entradasCoordenadas.appendChild(div);
    });
}
actualizarInputsCoordenadas();

// --- Movil ---
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

// --- Exports ---
export function limpiarPlano() {
    plano.innerHTML = '';
}

export function getPoligono() {
    return {
        tipo: tipoPoligonoSeleccionado,
        vertices: poligonos[tipoPoligonoSeleccionado],
    };
}

export function mostrarVistaTransformacion() {
    vistaConfiguracion.style.display = 'none';
    vistaTransformacion.style.display = 'block';
}

export function mostrarVistaConfiguracion() {
    vistaTransformacion.style.display = 'none';
    vistaConfiguracion.style.display = 'block';
}

export function mostrarAccionesPrincipales() {
    accionesPrincipales.style.display = 'block';
    estadoConfirmacion.style.display = 'none';

    transformSelect.disabled = false;

    const inputsNodos = document.querySelectorAll('#entradas input');
    inputsNodos.forEach((input) => {
        input.disabled = false;
    });
}

export function getTransformacion() {
    return transformSelect.value;
}

export function getInputs() {
    switch (transformSelect.value) {
        case 'traslacion':
            return {
                dx: Number(document.getElementById('input-x').value),
                dy: Number(document.getElementById('input-y').value),
            };
        case 'rotacion':
            return {
                angulo: Number(document.getElementById('input-angulo').value),
                pivoteX: Number(
                    document.getElementById('input-pivote-x').value,
                ),
                pivoteY: Number(
                    document.getElementById('input-pivote-y').value,
                ),
            };
        case 'escalamiento':
            return {
                Sx: Number(document.getElementById('input-sx').value),
                Sy: Number(document.getElementById('input-sy').value),
            };
        default:
            console.error('Transformación no reconocida');
            break;
    }
}

export function mostrarConfirmacion() {
    accionesPrincipales.style.display = 'none';
    estadoConfirmacion.style.display = 'block';
    transformSelect.disabled = true;
    const inputsNodos = document.querySelectorAll('#entradas input');
    inputsNodos.forEach((input) => (input.disabled = true));
}
