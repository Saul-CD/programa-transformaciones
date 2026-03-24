export function rotarPoligono(poligono, angulo) {
    return poligono.map((nodo) => {
        const x = nodo.x * Math.cos(angulo) - nodo.y * Math.sin(angulo);
        const y = nodo.x * Math.sin(angulo) + nodo.y * Math.cos(angulo);
        return { x, y };
    });
}

export function trasladarPoligono(poligono, dx, dy) {
    return poligono.map((nodo) => {
        return { x: nodo.x + dx, y: nodo.y + dy };
    });
}

export function escalarPoligono(poligono, Sx, Sy) {
    return poligono.map((nodo) => {
        return { x: nodo.x * Sx, y: nodo.y * Sy };
    });
}
