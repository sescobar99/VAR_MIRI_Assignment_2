export function printMatrix4(matrix, label="Matrix") {
    const fixed_n = 0
    const e = matrix.elements;
    console.log(`${label}:\n` +
        `${e[0].toFixed(fixed_n)} ${e[4].toFixed(fixed_n)} ${e[8].toFixed(fixed_n)} ${e[12].toFixed(fixed_n)}\n` +
        `${e[1].toFixed(fixed_n)} ${e[5].toFixed(fixed_n)} ${e[9].toFixed(fixed_n)} ${e[13].toFixed(fixed_n)}\n` +
        `${e[2].toFixed(fixed_n)} ${e[6].toFixed(fixed_n)} ${e[10].toFixed(fixed_n)} ${e[14].toFixed(fixed_n)}\n` +
        `${e[3].toFixed(fixed_n)} ${e[7].toFixed(fixed_n)} ${e[11].toFixed(fixed_n)} ${e[15].toFixed(fixed_n)}`
    );
}