export function printMatrix4(matrix, label = "Matrix", decimal_digits = 0) {

    const e = matrix.elements;
    console.log(`${label}:\n` +
        `${e[0].toFixed(decimal_digits)} ${e[4].toFixed(decimal_digits)} ${e[8].toFixed(decimal_digits)} ${e[12].toFixed(decimal_digits)}\n` +
        `${e[1].toFixed(decimal_digits)} ${e[5].toFixed(decimal_digits)} ${e[9].toFixed(decimal_digits)} ${e[13].toFixed(decimal_digits)}\n` +
        `${e[2].toFixed(decimal_digits)} ${e[6].toFixed(decimal_digits)} ${e[10].toFixed(decimal_digits)} ${e[14].toFixed(decimal_digits)}\n` +
        `${e[3].toFixed(decimal_digits)} ${e[7].toFixed(decimal_digits)} ${e[11].toFixed(decimal_digits)} ${e[15].toFixed(decimal_digits)}`
    );
}