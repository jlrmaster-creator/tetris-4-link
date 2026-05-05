Contexto y Rol
Actúa como un Senior Game Developer con maestría en Python y la librería Pygame. Tu objetivo es desarrollar un prototipo funcional y altamente adictivo de un juego híbrido llamado "Tetris-4-Link". El juego debe combinar la gestión espacial del Tetris con la estrategia de combinación de colores de Conecta 4.

Arquitectura Técnica

Lenguaje: Python 3.x.

Librería: Pygame.

Paradigma: Programación Orientada a Objetos (Clases para Piece, Board y GameManager).

Resolución: Definir un tamaño de celda de 30px en un tablero de 10x20.

Mecánicas de Juego (Core)

Tetrominos Multicolores: Genera las 7 piezas clásicas. Cada bloque individual de la pieza debe tener un color aleatorio de un set de 5 colores vibrantes.

Sistema de Gravedad Dual:

Líneas Tetris: Si una fila se completa, se elimina y suma puntos.

Conecta 4+: Si 4 o más bloques del mismo color se alinean (Horizontal, Vertical, Diagonal), se eliminan.

Efecto Cascada: Tras cualquier eliminación, los bloques superiores que queden "en el aire" deben caer por gravedad hasta tocar otro bloque o el suelo.

Controles: Flechas para movimiento y rotación. Espacio para Hard Drop.

Sistema de Power-ups (Novedad)
Añade una probabilidad del 10% de que un bloque dentro de una pieza sea un "Bloque Especial":

Bomba (B): Al aterrizar, destruye un área de 3x3 a su alrededor.

Arcoíris (A): Comodín que completa cualquier combinación de 4 colores adyacentes.

Martillo (M): Elimina toda la fila y columna en la que aterriza.

Criterios de Calidad del Código

Detección de Patrones: Implementa un algoritmo eficiente para revisar diagonales (comprobando pendientes +1 y -1).

Game Loop: Control estricto de FPS (60) y una variable fall_speed que aumente cada 500 puntos.

Feedback Visual: El código debe incluir funciones para dibujar la "Siguiente Pieza" y la "Puntuación" en un panel lateral.

Código Limpio: Comentarios en español explicando la lógica de la "Gravedad Cascada".

Instrucciones de Entrega

Proporciona el código completo en un único bloque de código.

Explica cómo instalar las dependencias (pip install pygame).

Incluye una breve guía de usuario sobre cómo funcionan los Power-ups.

¿Por qué este prompt es superior?
Precisión Algorítmica: Pedir la lógica de "Gravedad Cascada" (tipo Puyo Puyo) cambia totalmente el juego, haciéndolo más dinámico que un simple Tetris.

Modularidad: Al pedir Clases (Piece, Board), el código será mucho más fácil de leer y modificar si quieres añadir más funciones después.

Efecto "Juice": Los Power-ups y el aumento de velocidad progresivo transforman un experimento básico en un juego real.

Claridad de Colisiones: Especificar el tamaño de celda y la resolución ayuda a la IA a no calcular mal las coordenadas en pantalla.