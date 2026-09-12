# Melao — "Día y noche" (segunda plantilla)

Sitio estático (HTML/CSS/JS, sin build). Abrir `index.html` con un servidor
estático cualquiera (por ejemplo `python -m http.server`) — no funciona bien
con `file://` porque el `<script type="module">` y las fuentes necesitan HTTP.

## Por qué existe esta segunda versión

Esta carpeta es una **plantilla alternativa para el mismo negocio real**
(Melao, Carballo), pensada como segundo ejemplo de la librería de plantillas
premium de WEBS NEGOCIOS — no sustituye a `webtest/` (la web ya entregada al
propietario), convive con ella. El contenido (carta, fotos, horario,
dirección, reseñas) es el mismo contenido real ya confirmado con el
propietario; lo que cambia por completo es la **estructura y el concepto de
motion**, para que ambas puedan mostrarse como ejemplos distintos.

## Dirección de arte

- **Idea visual:** en vez de "tres cocinas en una carta" (la versión ya
  entregada), esta plantilla explota otro hecho igual de real: Melao es un
  sitio de brunch tranquilo por la mañana (jueves–domingo) y una barra de
  pinsa/burgers/cócteles muy distinta por la noche (viernes–domingo). El
  concepto es literalmente **"un local, dos vidas"** — de día y de noche —
  y esa dualidad estructura toda la página, no solo el hero.
- **Logo y color:** mismo logo real (`logo-melao-cutout.png`) y misma paleta
  de marca (coral/sky/lime tomados del logo), pero con la emphasis invertida
  frente a la versión entregada: allí el crema domina y el color acentúa;
  aquí el ink oscuro domina de principio a fin (no solo en una sección) y el
  crema/coral quedan como acento — para que el tono "noche" sea el estado de
  reposo del sitio, no una excepción puntual.
- **Tipografía:** mismas Fraunces + Manrope reales de la marca (es el mismo
  negocio real; no había motivo para cambiar la tipografía elegida).
- **Fotografía:** las mismas cinco fotos y el resto de fotos de cocina ya
  facilitadas por el propietario (`assets/img/web/`, copiadas tal cual desde
  `webtest/`), repartidas ahora en dos "turnos" (de día / de noche) en vez de
  un único mosaico. Ninguna foto nueva ni de stock.
- **Motion — genuinamente distinto de la otra plantilla:**
  - **Hero:** en vez del shader de Three.js con manchas gooey (versión
    entregada), aquí el hero es una **transición de scroll fijada
    (pin + scrub)**: al bajar, la foto, el titular, el texto y un indicador
    ☀→☾ hacen crossfade de "de día" a "de noche" en tiempo real con el
    scroll — sin Three.js ni WebGL esta vez (decisión deliberada: la propia
    mecánica de scroll-scrubbing ya cuenta la historia, un shader habría sido
    redundante). El primer frame estático (sin JS) es la foto de día con el
    titular de día — un estado completo y correcto por sí solo.
  - **Carta:** en vez de una rejilla con 7 filtros por categoría, aquí es un
    **mazo de tarjetas en scroll horizontal** con un interruptor "De día / De
    noche" (Flip-free, CSS scroll-snap + flechas), agrupando los platos por
    turno real de servicio en vez de por categoría de carta.
  - **Galería ("De cocina"):** en vez de un mosaico con lightbox, es un
    **filmstrip de scroll horizontal** también separado por turno, con el
    mismo lightbox (reutilizado como utilidad, no como "look").
  - **Cifras:** una franja nueva de contadores animados (2023, 4,8★, 2 turnos,
    3 cocinas) que cuentan hacia arriba al entrar en pantalla — técnica de
    motion que no se usaba en la otra plantilla.
  - **Reseñas:** en vez de una rejilla de 3 tarjetas fijas, es un
    **carrusel de una tarjeta** con autoplay (pausa en hover/foco/reduced
    motion) y navegación por flechas/puntos.
  - **Encuéntranos:** en vez de dos columnas (info + mapa), es una **sección
    a sangre completa** con la foto de noche de fondo y una tarjeta de vidrio
    flotante con horario/dirección/mapa bajo demanda.
  - **Navegación:** en vez de una barra con enlaces visibles + menú móvil,
    aquí la cabecera es minimal (solo logo + botón "Menú") y el menú es una
    **superposición a pantalla completa** en cualquier tamaño de pantalla —
    un patrón de navegación distinto, no una variante responsive del mismo.
  - Motor de scroll suave: Lenis + GSAP ScrollTrigger (mismo stack que la
    otra plantilla — es infraestructura, no "look"; nunca se inicializan dos
    motores de scroll suave a la vez).
- **Icons:** Solar (Iconify) para interfaz; `mdi:instagram`, `mdi:paw`,
  `mdi:wheelchair-accessibility`, `mdi:moped` y `logos:google-icon` /
  `ri:whatsapp-fill` reutilizados de la otra plantilla donde ya encajaban.
- **Skill de diseño usada:** `build-awwwards-quality-sites`.

## Contenido real (idéntico a la plantilla ya entregada)

Nombre, logo, fotos, carta (platos y precios de referencia tomados de la
carta física fotografiada), dirección (Avenida Ponte da Pedra, 18, 15100
Carballo), teléfonos (604 057 796 / 697 11 44 70), correo
(`melaocarballo@gmail.com`), horario confirmado por el propietario
(jueves 9:00–13:30; viernes y sábado 9:00–13:30 y 20:00–00:00; domingo
10:00–14:00 y 20:00–23:30; lunes a miércoles cerrado), valoración de Google
(4,8★, confirmada por el propietario) y las tres reseñas reales citadas
textualmente. Ver `webtest/README.md` para el detalle completo de cómo se
verificó cada dato — aquí no se ha cambiado ni inventado ningún hecho, solo
la forma en que se presenta.

## Validación hecha

- Comprobación estática de que todas las rutas de imagen referenciadas en
  `index.html`/`404.html` (incluidos los `srcset`) existen en disco.
- `node --check` sobre `js/main.js` (sin errores de sintaxis).
- Servido en local (`python -m http.server`) y verificado que `index.html`,
  `css/style.css`, `js/main.js` y los assets responden 200.
- **Pendiente / limitación conocida:** no se ha podido abrir en un navegador
  real desde este entorno (sin herramienta de automatización de navegador
  disponible), así que el pin/scrub del hero, el carrusel de reseñas, el
  interruptor día/noche y el comportamiento con `prefers-reduced-motion` no
  se han verificado visualmente todavía — solo por lectura de código. Antes
  de entregar o publicar esta plantilla, ábrela en un navegador (desktop y
  ~390px), prueba el teclado, `prefers-reduced-motion: reduce` y JavaScript
  desactivado, igual que se hizo con `webtest/`.

## Pendiente

- Si esta plantilla llega a publicarse (GitHub Pages u otro dominio), hay
  que decidir su propia URL y actualizar `canonical`/`og:url`/`og:image` en
  `index.html` (ahora mismo usan una URL de ejemplo,
  `melao-carballo-web-v2`, no confirmada) y, si se sirve bajo un subpath de
  GitHub Pages, pasar `404.html` a rutas absolutas como hace `webtest/404.html`.
