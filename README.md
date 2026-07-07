# UserHub — TP Programación IV

Aplicación web hecha con **Angular** que funciona como un "salón de juegos" (Gameroom): los usuarios se registran, inician sesión y pueden jugar a 4 juegos distintos, chatear en vivo, completar una encuesta de satisfacción y (si son administradores) ver los resultados de esa encuesta.

Repositorio: [Frannky06/TP_ProgramacionIV_Coceres](https://github.com/Frannky06/TP_ProgramacionIV_Coceres)

---

## 1. Stack tecnológico

| Parte | Tecnología |
|---|---|
| Framework | Angular 21 (standalone components, sin NgModules) |
| Estilos | CSS puro por componente |
| Animaciones | `@angular/animations` + View Transitions del Router |
| Backend / DB | [Supabase](https://supabase.com) (Postgres + Auth + Realtime), usado directamente desde el frontend con `@supabase/supabase-js` |
| SSR | Angular Universal (`@angular/ssr`) con servidor Express (`src/server.ts`) |
| APIs externas | [Deck of Cards API](https://deckofcardsapi.com) (Mayor o Menor), [Open Trivia DB](https://opentdb.com) (Preguntados), GitHub API (sección "Quién soy") |

No hay un backend propio: todo el CRUD (usuarios, roles, puntajes, encuestas, chat) se hace directamente contra Supabase desde los servicios de Angular, protegido por las reglas de Row Level Security (RLS) que se configuran del lado de Supabase.

---

## 2. Cómo correrlo

```bash
cd userhub
npm install
npm start          # ng serve -> http://localhost:4200
```

Build de producción:

```bash
npm run build
```

Servidor SSR ya compilado:

```bash
npm run serve:ssr:userhub
```

La configuración de Supabase (URL + api key pública "anon") está en [`src/environments/environment.ts`](src/environments/environment.ts). La `anon key` es segura de exponer en el cliente: el control de acceso real depende de las políticas RLS configuradas en Supabase, no de que la key sea secreta.

---

## 3. Estructura del proyecto

```
src/app/
├── components/
│   ├── login/, registro/        → autenticación
│   ├── home/, navbar/           → layout general
│   ├── quien-soy/               → perfil del autor + consumo de GitHub API
│   ├── chat/                    → chat global en tiempo real
│   ├── encuesta/                → formulario de encuesta (Sprint 5)
│   ├── resultados/              → rankings de los 4 juegos (todo usuario logueado)
│   ├── resultados-encuestas/    → respuestas de la encuesta (solo admins)
│   ├── game/
│   │   ├── ahorcado/            → juego del ahorcado
│   │   ├── mayor-menor/         → mayor o menor con cartas (API externa)
│   │   ├── preguntados/         → trivia (API externa)
│   │   └── truco/               → truco argentino 1 vs máquina
│   ├── user-card/, user-list/   → utilitarios de listado de usuarios
├── guards/
│   ├── auth.guard.ts            → exige sesión iniciada
│   ├── public.guard.ts          → exige NO estar logueado (login/registro)
│   └── admin.guard.ts           → exige sesión + rol admin
├── service/
│   ├── auth.service.ts          → sesión, registro, login, logout, chequeo de rol
│   ├── game.service.ts          → guardar/leer puntajes
│   ├── chat.service.ts          → mensajes de chat (realtime + polling)
│   ├── survey.service.ts        → guardar/leer encuestas (ver nota abajo)
│   └── github.service.ts        → consumo de la API pública de GitHub
├── app.routes.ts                → definición de rutas y guards aplicados
└── app.config.ts                → providers globales (router, animations, SSR, http)
```

> **Nota:** `survey.service.ts` quedó como capa de servicio para la encuesta, pero el componente `encuesta.ts` actualmente llama a Supabase directamente en vez de usar este servicio. No afecta el funcionamiento, es una inconsistencia menor de organización de código.

---

## 4. Autenticación y roles

Todo pasa por [`AuthService`](src/app/service/auth.service.ts), que envuelve el cliente de Supabase:

- **`register()`**: crea el usuario en Supabase Auth, guarda su perfil en la tabla `users`, y le asigna un rol (`usuario` por defecto) en la tabla `roles` y en los metadatos del usuario (`user_metadata.role`). No hay forma de auto-registrarse como admin desde la UI — el rol admin se asigna manualmente en la base de datos.
- **`login()` / `logout()`**: wrappers de `supabase.auth.signInWithPassword` / `signOut`.
- **`currentUser` / `currentUserProfile`**: signals que se actualizan solas al iniciar la app y en cada cambio de sesión (`onAuthStateChange`).
- **`checkIsAdmin(user?)`**: determina si un usuario es administrador. Primero mira el rol en sus metadatos (`app_metadata`/`user_metadata`), y si no lo encuentra, consulta la tabla `roles` en Supabase. Acepta opcionalmente un `user` de Supabase para no depender de que la signal `currentUser` ya se haya poblado (evita una condición de carrera al usarla desde un guard).

### Guards (`src/app/guards/`)

| Guard | Qué exige | Dónde se usa |
|---|---|---|
| `publicGuard` | Que **no** haya sesión iniciada | `/login`, `/registro` |
| `authGuard` | Que haya sesión iniciada | juegos, `/encuesta`, `/resultados` |
| `adminGuard` | Sesión iniciada **y** rol admin (vía `checkIsAdmin`) | `/resultados/encuestas` |

Los guards son funciones (`CanActivateFn`) registradas en [`app.routes.ts`](src/app/app.routes.ts) con `canActivate: [...]`. Si la condición no se cumple, redirigen (`router.parseUrl`) a `/login` o `/home` en vez de dejar pasar la navegación.

---

## 5. Encuesta (Sprint 5)

Componente: [`encuesta.ts`](src/app/components/encuesta/encuesta.ts) / [`encuesta.html`](src/app/components/encuesta/encuesta.html), ruta `/encuesta` (requiere login).

Usa `ReactiveFormsModule` con un `FormGroup` que junta:

- **Datos personales** (todos requeridos): nombre, apellido, edad (`Validators.min(18)`, `max(99)`), teléfono (`Validators.pattern('^[0-9]{1,10}$')` → solo dígitos, máx. 10 caracteres).
- **5 preguntas con controles distintos**, ninguno repetido:
  1. Juego favorito → radio buttons
  2. Frecuencia de juego → `<select>`
  3. Características valoradas → checkboxes múltiples (validador custom `atLeastOneCheckbox`: exige al menos uno marcado)
  4. Sugerencia → `<textarea>` (mínimo 10 caracteres)
  5. ¿Recomendarías la app? → checkbox único, obligatorio (`Validators.requiredTrue`)

Cada campo muestra su error específico debajo cuando fue tocado e es inválido (`f['campo'].touched && f['campo'].errors`). Al enviar, si el usuario está logueado, inserta una fila en la tabla `encuestas` de Supabase con `user_id: user.id` — así cada respuesta queda asociada al usuario que la completó.

---

## 6. Resultados

Se dividió en **dos rutas separadas** justamente para poder aplicar el guard de admin sin bloquear el ranking de juegos a los usuarios comunes:

- **`/resultados`** ([`resultados.ts`](src/app/components/resultados/resultados.ts)) — protegido con `authGuard`. Muestra el top 10 de puntajes de los 4 juegos (`GameService.getScoresByGame`), ordenados de mayor a menor, con medallas para el podio. Si el usuario es admin, muestra además un botón "Ver resultados de encuestas".
- **`/resultados/encuestas`** ([`resultados-encuestas.ts`](src/app/components/resultados-encuestas/resultados-encuestas.ts)) — protegido con `authGuard` **y** `adminGuard`. Trae todas las filas de la tabla `encuestas`, muestra estadísticas (total de encuestas, % que recomienda, juego más popular) y el detalle en tabla. Un usuario no-admin que intente entrar por URL es redirigido a `/home` por el guard antes de que el componente cargue datos.

El navbar ([`navbar.ts`](src/app/components/navbar/navbar.ts)) calcula `isAdmin` con un signal + `effect()` que reacciona a los cambios de sesión, y solo muestra el link "Encuestas (Admin)" cuando corresponde — aunque eso es solo cosmético, la protección real está en el guard de la ruta.

---

## 7. Los 4 juegos

Todos están bajo `/game/*`, protegidos por `authGuard`, y al terminar guardan el resultado con `GameService.saveScore(userId, nombreJuego, detalle)` en la tabla `game_scores`.

- **Ahorcado** ([`ahorcado.ts`](src/app/components/game/ahorcado/ahorcado.ts)): palabras fijas en un array, 6 intentos, cuenta aciertos y errores.
- **Mayor o Menor** ([`mayor-menor.ts`](src/app/components/game/mayor-menor/mayor-menor.ts)): consume la API pública [Deck of Cards](https://deckofcardsapi.com) para robar cartas reales, 3 vidas.
- **Preguntados** ([`preguntados.ts`](src/app/components/game/preguntados/preguntados.ts)): 10 preguntas de trivia random desde [Open Trivia DB](https://opentdb.com), con las opciones mezcladas.
- **Truco** ([`truco.ts`](src/app/components/game/truco/truco.ts)): versión simplificada 1 vs. máquina — mazo español de 40 cartas, jerarquía de poder real del truco, envido básico, se juega a 15 puntos.

---

## 8. Chat en vivo

[`ChatService`](src/app/service/chat.service.ts) mantiene un signal `messages` sincronizado de dos formas a la vez: se suscribe a los cambios en tiempo real de la tabla `chat_messages` vía Supabase Realtime (`postgres_changes`), y además hace polling cada 5 segundos como respaldo por si el websocket se cae. El componente [`chat.ts`](src/app/components/chat/chat.ts) se muestra flotante en toda la app (montado una sola vez en `app.html`, junto al `<router-outlet>`).

---

## 9. Animaciones de transición

Requisito del Sprint 5, resuelto en dos niveles:

1. **Global**: `provideRouter(routes, withViewTransitions())` en [`app.config.ts`](src/app/app.config.ts) activa las View Transitions nativas del Router de Angular para todas las navegaciones entre páginas.
2. **Por componente**: `encuesta` y `resultados`/`resultados-encuestas` definen sus propios `trigger()` de `@angular/animations` (`fadeSlideIn`, `staggerList`, `tableRowsAnim`) para animar la entrada de secciones, filas de tabla y mensajes de éxito/error.

---

## 10. Base de datos (Supabase) — tablas usadas

| Tabla | Para qué |
|---|---|
| `users` | Perfil (nombre, apellido, edad, correo) vinculado al `id` de Supabase Auth |
| `roles` | Rol (`usuario` / `admin`) por `user_id` |
| `game_scores` | Un registro por partida jugada, con `user_id`, `game_name` y un string de detalle |
| `encuestas` | Una fila por encuesta enviada, con `user_id` y todas las respuestas |
| `chat_messages` | Mensajes del chat global |

No hay migraciones SQL versionadas en este repo — el esquema y las políticas RLS se administran directamente en el dashboard de Supabase.
