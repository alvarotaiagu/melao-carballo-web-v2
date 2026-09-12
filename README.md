# Melao — "Bento grid magazine" (plantilla variante)

Sitio estático (HTML/CSS/JS, sin build). Abrir `index.html` con un servidor
estático cualquiera (por ejemplo `python -m http.server`) — no funciona bien
con `file://` porque el `<script type="module">` y las fuentes necesitan HTTP.

## Por qué existe esta variante

Esta rama (`variant/bento-grid-magazine`) es una **plantilla estructural
alternativa** para el mismo negocio real (Melao, Carballo), pensada como un
ejemplo más en una librería creciente de plantillas para negocios de
restauración que luego se adaptan a otros clientes similares. No es un
reskin de color de la plantilla "día y noche" que vive en `main` — la
arquitectura de la información y el patrón de navegación son distintos de
raíz. El contenido (nombre, logo, fotos, carta, horario, dirección,
reseñas) es el mismo contenido real ya usado en las otras plantillas de
este repositorio; lo que cambia por completo es **cómo se organiza y se
recorre la página**.

## Idea estructural: todo es una rejilla bento

En vez de secciones apiladas a ancho completo (el patrón de `main`), casi
cada sección de esta variante es una **rejilla CSS asimétrica tipo
bento-box**: celdas de distintos tamaños conviviendo en la misma fila,
usando `grid-auto-flow: dense` para que no queden huecos.

- **Hero:** una rejilla de 4 columnas — una celda grande con la foto y el
  titular, y celdas más pequeñas para la valoración de Google, el estado
  "abierto ahora", una foto de la barra de noche y una franja de Instagram.
  No hay una única foto a sangre completa como en las otras plantillas.
- **Navegación:** la cabecera es mínima (logo + botón "Menú"). Al abrir, en
  vez de una lista vertical de enlaces, aparece un **drawer con una rejilla
  de fichas grandes y tocables** (mega-menú), cada una llevando a una
  sección — un patrón de navegación distinto, no una variante del mismo.
- **La carta:** en vez de un mazo de tarjetas en scroll horizontal separado
  por turno (día/noche), aquí es una **rejilla bento de tarjetas de
  precio**, con chips de filtro en JS plano (Desayuno, Pinsa & burgers,
  Para compartir, Postres & bebidas) que muestran/ocultan tarjetas por
  categoría — sin frameworks, solo `element.hidden` y `grid-auto-flow:
  dense` para que la rejilla se recomponga sin huecos al filtrar.
- **De cocina:** la galería usa la misma rejilla bento asimétrica (celdas
  grandes, anchas y altas mezcladas) con el mismo mecanismo de filtro que
  la carta, esta vez para día/noche. El lightbox se reutiliza como
  utilidad, no como "look".
- **Reseñas:** en vez de un carrusel de una tarjeta con autoplay, es una
  rejilla con una reseña grande destacada y las demás más pequeñas, más
  una celda de cierre enlazando a Google — todas visibles a la vez, sin
  rotación automática.
- **Encuéntranos:** en vez de una única tarjeta de vidrio flotando sobre
  una foto a sangre completa, es una rejilla de celdas — foto, horario,
  contacto, mapa bajo demanda y una celda ancha de WhatsApp.
- **Cifras:** en vez de una franja aparte, los contadores vienen integrados
  como celdas pequeñas dentro de la propia rejilla de "Dos turnos".

## Motion: deliberadamente más ligero

Esta variante **no usa GSAP, ScrollTrigger ni Lenis** (que sí usa la
plantilla de `main`). Todo el movimiento es:

- Transiciones CSS simples (`opacity`/`transform`) sobre celdas marcadas
  con `[data-reveal]`, activadas por un único `IntersectionObserver` en
  `js/main.js` (`initReveals`) que añade `.is-visible` la primera vez que
  cada celda entra en el viewport.
- Un contador de cifras con un `requestAnimationFrame` propio (sin GSAP).
- Scroll suave nativo (`window.scrollTo({ behavior: "smooth" })`) en vez de
  una librería de smooth-scroll.
- `prefers-reduced-motion: reduce` desactiva todo lo anterior y muestra el
  contenido ya revelado, igual que en las otras plantillas.

La decisión es deliberada: una plantilla pensada para reutilizarse en
clientes futuros no debería arrastrar una librería de animación pesada
como requisito — el `IntersectionObserver` + CSS es la pieza más ligera
que sigue leyéndose como "movimiento cuidado".

## Contenido real (idéntico a las otras plantillas de este repositorio)

Nombre, logo, fotos, carta (platos y precios tomados literalmente del
`index.html` de `main` — ningún plato ni precio inventado), dirección
(Avenida Ponte da Pedra, 18, 15100 Carballo), teléfonos (604 057 796 /
697 11 44 70), correo (`melaocarballo@gmail.com`), horario (jueves
9:00–13:30; viernes y sábado 9:00–13:30 y 20:00–00:00; domingo 10:00–14:00
y 20:00–23:30; lunes a miércoles cerrado), valoración de Google (4,8★) y
las tres reseñas reales citadas textualmente.

## Categorías de la carta en esta variante

La carta original agrupa los platos por turno de servicio (día/noche).
Esta variante los reagrupa por categoría de plato para que el filtro de
chips tenga sentido:

- **Desayuno:** tostadas, pancakes, huevos benedictinos, bowl de granola.
- **Pinsa & burgers:** hamburguesa Melao, pinsa bianca cabra, pinsa
  barbacoa, smash pulled pork.
- **Para compartir:** tequeños, nachos pulled pork.
- **Postres & bebidas:** cheesecake/red velvet/carrot cake, tarta del día,
  affogato, capuchino.

## Validación hecha

- Comprobación de que las 27 rutas de imagen referenciadas en `index.html`
  existen en disco.
- Comprobación automática de que los 14 platos y sus precios coinciden,
  carácter a carácter, con los del `index.html` de `main`.
- `node --check` sobre `js/main.js` (sin errores de sintaxis).
- Servido en local (`python -m http.server`) y probado con Playwright/
  Chromium en tres anchos (390px, 800px, 1440px): la rejilla bento
  colapsa a 1/2/4 columnas según el ancho, el drawer del mega-menú abre y
  cierra, los filtros de la carta y de la galería muestran/ocultan
  tarjetas correctamente, el lightbox abre y cierra, el horario "abierto/
  cerrado ahora" se calcula bien, los contadores de cifras animan al
  entrar en pantalla, y con `prefers-reduced-motion: reduce` todo el
  contenido aparece ya revelado sin animación.
- De paso se corrigió un bug heredado de la plantilla de `main`: `.lightbox`
  y `.cookie-banner` fijaban `display: flex` de forma incondicional, lo que
  anulaba el `display: none` del atributo `hidden` y dejaba ambos elementos
  interceptando clics en toda la página aunque estuvieran "ocultos". Se
  añadió una regla `[hidden] { display: none !important; }` en el reset.

## Pendiente

- Si esta plantilla llega a publicarse en su propio dominio, hay que
  decidir su URL y actualizar `canonical`/`og:url`/`og:image` en
  `index.html` (ahora mismo usan la URL de `main`, no confirmada para esta
  variante) y, si se sirve bajo un subpath de GitHub Pages, pasar
  `404.html` a rutas absolutas.
