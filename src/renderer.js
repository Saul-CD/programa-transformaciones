import Panzoom from 'panzoom';

const canvas = document.getElementById('canvas');
const panzoomWrapper = document.getElementById('panzoom-wrapper');

const centroX = window.innerWidth / 2;
const centroY = window.innerHeight / 2;

const sistemaCoordenado = document.getElementById('sistema-coordenado');
const cuadricula = document.getElementById('grid-layer');

const panzoom = Panzoom(panzoomWrapper, {
    maxZoom: 450000,
    minZoom: 0.0012,
    initialZoom: 20,
});

function actualizarCuadricula() {
    const transform = panzoom.getTransform();
    const scale = transform.scale;
    const tx = transform.x;
    const ty = transform.y;

    // ~80px de separación entre líneas visiualmente
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

function initCanvas() {
    sistemaCoordenado.setAttribute('transform', `scale(1, -1)`);
    panzoom.moveTo(centroX, centroY);
    canvas.parentElement.addEventListener('wheel', panzoom.zoomWithWheel);
    panzoom.on('transform', actualizarCuadricula);
    actualizarCuadricula();
}

export function dibujarPoligono(puntos, n) {
    const esInicial = n === 0;
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

    const hue = n * 40;
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

initCanvas();
