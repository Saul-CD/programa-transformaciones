// point es un arreglo [x, y, 1]
function multiplyMatrixAndPoint(matrix, point) {
    return [
        matrix[0][0] * point[0] +
            matrix[0][1] * point[1] +
            matrix[0][2] * point[2],
        matrix[1][0] * point[0] +
            matrix[1][1] * point[1] +
            matrix[1][2] * point[2],
        matrix[2][0] * point[0] +
            matrix[2][1] * point[1] +
            matrix[2][2] * point[2],
    ];
}

// 1. Matriz de Traslación
export function matrizTraslacion(tx, ty) {
    return [
        [1, 0, tx],
        [0, 1, ty],
        [0, 0, 1],
    ];
}

// 2. Matriz de Escalamiento
export function matrizEscalamiento(sx, sy) {
    return [
        [sx, 0, 0],
        [0, sy, 0],
        [0, 0, 1],
    ];
}

// 3. Matriz de Rotación (El ángulo debe llegar en radianes)
export function matrizRotacion(anguloRad, pivotX, pivotY) {
    const sin = Math.sin(anguloRad);
    const cos = Math.cos(anguloRad);
    return [
        [cos, -sin, pivotX * (1 - cos) + pivotY * sin],
        [sin, cos, pivotY * (1 - cos) - pivotX * sin],
        [0, 0, 1],
    ];
}

// Función maestra que tu equipo debe usar para aplicar CUALQUIER matriz a un polígono
export function transformarPoligono(polygon, matrix) {
    return polygon
        .map((point) => multiplyMatrixAndPoint(matrix, [point.x, point.y, 1]))
        .map((res) => ({ x: res[0], y: res[1] })); // Lo regresamos a formato normal
}
