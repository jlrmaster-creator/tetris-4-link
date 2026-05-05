# Tetris-4-Link

Un juego híbrido entre Tetris y Conecta 4 creado íntegramente con HTML5, CSS y JavaScript Vanilla (sin frameworks ni dependencias de servidor).

¡Totalmente jugable desde PC, Tablets y Móviles!

## Características
* **Mecánicas Clásicas de Tetris**: Limpia líneas para ganar puntos.
* **Mecánica Conecta 4**: Junta 4 o más bloques del mismo color (Horizontal, Vertical o Diagonal) para explotarlos.
* **Efecto Gravedad Cascada**: Si un bloque pierde su apoyo inferior, cae hasta el suelo encadenando posibles combos.
* **Power-Ups (10%)**: 
  * `[B] Bomba`: Destruye bloques 3x3 al tocar el suelo.
  * `[M] Martillo`: Destruye toda su fila y columna.
  * `[A] Arcoíris`: Comodín para unir colores.
* **Responsivo**: El juego detecta dispositivos móviles y muestra controles táctiles en pantalla adaptados.

## Cómo desplegar en GitHub Pages

Dado que esta es una aplicación web pura (archivos estáticos `index.html`, `style.css` y `script.js`), puedes desplegarlo en internet en menos de 2 minutos sin coste.

1. **Sube tus archivos a un repositorio de GitHub**:
   - Crea un nuevo repositorio en tu cuenta de GitHub (ej. `tetris-4-link`).
   - Sube los archivos `index.html`, `style.css`, `script.js` y `README.md` a la rama `main` (o `master`).

2. **Activa GitHub Pages**:
   - Dentro de tu repositorio en GitHub, ve a la pestaña **Settings** (Configuración).
   - En el menú lateral izquierdo, haz clic en **Pages**.
   - En la sección "Build and deployment", selecciona **Deploy from a branch**.
   - Bajo "Branch", selecciona tu rama (`main` o `master`) y la carpeta `/ (root)`.
   - Haz clic en **Save**.

3. **¡Juega!**
   - En unos minutos, verás un enlace en la parte superior de esa misma sección indicando que tu sitio está en vivo (normalmente algo como `https://tu-usuario.github.io/tetris-4-link`).
   - Puedes compartir ese enlace con cualquier persona para que jueguen en sus móviles u ordenadores.
