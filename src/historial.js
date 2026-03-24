const historialLista = document.getElementById('historial');

export function agregarAlHistorial(
    paresDescripcionPuntos,
    colorHexHsl,
    descripcionGeneral,
) {
    const li = document.createElement('li');

    li.style.borderLeft = `4px solid ${colorHexHsl}`;

    li.innerHTML = `
        <h3 style="margin: 0; padding-bottom: 5px; color: ${colorHexHsl};">${descripcionGeneral}</h3>
    `;

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

    for (const [descripcion, puntos] of Object.entries(
        paresDescripcionPuntos,
    )) {
        li.innerHTML += `
            <div style="margin-top: 10px;">
                <strong style="font-size: 0.85em; color: #aaa; display: block; margin-bottom: 4px;">${descripcion}</strong>
                <div style="font-family: monospace; font-size: 0.9em; opacity: 0.9; padding-left: 8px; border-left: 2px solid rgba(255,255,255,0.1);">
                    ${puntos.map((p, index) => `${abecedario[index]}: (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`).join('<br>')}
                </div>
            </div>`;
    }
    historialLista.prepend(li);
}

export function limpiarHistorial() {
    historialLista.innerHTML = '';
}
