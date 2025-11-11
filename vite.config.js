export default {
    build: {
        outDir: 'docs' // Normalmente el build se llevaria al directorio dist/ pero github pages solo permite servir contenido desde la raiz o desde docs/ ()
    },
    base: '/VAR_MIRI_Assignment_2/', // Sirve para que githubpages pueda resolver correctamente los imports
}
