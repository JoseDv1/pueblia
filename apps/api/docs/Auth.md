# Módulo de Autenticación (Auth)

## Descripción General

El módulo de autenticación de Pueblia es un sistema completo de gestión de usuarios que incluye autenticación tradicional con email/contraseña, OAuth 2.0 de Google, manejo de JWT con refresh tokens, y un sistema de blacklist para la invalidación segura de tokens.

## Arquitectura del Módulo

```
src/modules/auth/
├── routes.ts     # Definición de rutas HTTP
├── schema.ts     # Validaciones con Zod
└── services.ts   # Lógica de negocio
```

## Archivos del Módulo

### `routes.ts`

Define todas las rutas HTTP del módulo de autenticación y maneja las peticiones/respuestas.

### `schema.ts`

Contiene los esquemas de validación usando Zod para validar datos de entrada.

### `services.ts`

Implementa la lógica de negocio, incluyendo operaciones con la base de datos y manejo de tokens.

---

## Rutas Disponibles

### 🔐 **POST** `/auth/register`

Registra un nuevo usuario en el sistema.

**Body:**

```json
{
	"name": "Juan Pérez",
	"email": "juan@ejemplo.com",
	"password": "miPassword123",
	"confirmPassword": "miPassword123",
	"displayName": "Juan" // opcional
}
```

**Respuesta (201):**

```json
{
	"user": {
		"id": "clxxxxx",
		"email": "juan@ejemplo.com",
		"name": "Juan Pérez",
		"displayName": "Juan",
		"role": "USER",
		"isActive": true,
		"emailVerified": false,
		"createdAt": "2025-07-05T...",
		"updatedAt": "2025-07-05T..."
	}
}
```

**Cookies establecidas:**

- `access_token` (15 minutos)
- `refresh_token` (7 días)

---

### 🔑 **POST** `/auth/login`

Inicia sesión con email y contraseña.

**Body:**

```json
{
	"email": "juan@ejemplo.com",
	"password": "miPassword123"
}
```

**Respuesta (200):**

```json
{
	"user": {
		"id": "clxxxxx",
		"email": "juan@ejemplo.com",
		"name": "Juan Pérez",
		"displayName": "Juan",
		"role": "USER",
		"isActive": true,
		"emailVerified": false,
		"lastLoginAt": "2025-07-05T...",
		"createdAt": "2025-07-05T...",
		"updatedAt": "2025-07-05T..."
	}
}
```

**Cookies establecidas:**

- `access_token` (15 minutos)
- `refresh_token` (7 días)

---

### 🔄 **POST** `/auth/refresh`

Renueva los tokens de acceso usando el refresh token.

**Requisitos:**

- Cookie `refresh_token` válida

**Respuesta (200):**

```json
{
	"message": "Tokens refreshed successfully",
	"user": {
		"id": "clxxxxx",
		"email": "juan@ejemplo.com",
		"name": "Juan Pérez",
		"displayName": "Juan",
		"role": "USER",
		"isActive": true,
		"emailVerified": false
	}
}
```

**Proceso interno:**

1. ✅ Verifica que el refresh token no esté en la blacklist
2. ✅ Valida el JWT del refresh token
3. ✅ Verifica que el token existe en la base de datos
4. ✅ Verifica que el token no haya expirado
5. ✅ Verifica que el usuario esté activo
6. ✅ Genera nuevos tokens
7. ✅ Invalida el refresh token anterior
8. ✅ Actualiza el `lastLoginAt` del usuario

---

### 🔗 **GET** `/auth/google`

Inicia el flujo de autenticación con Google OAuth 2.0.

**Proceso:**

1. Genera un estado único (`state`) para protección CSRF
2. Establece cookie `oauth_state` temporal (10 minutos)
3. Redirige a Google para autorización

**Parámetros de redirección a Google:**

- `client_id`: ID del cliente OAuth
- `redirect_uri`: URL de callback
- `response_type`: "code"
- `scope`: "openid email profile"
- `state`: Token CSRF

---

### 🔙 **GET** `/auth/google/callback`

Maneja la respuesta de Google OAuth y completa la autenticación.

**Parámetros de query esperados:**

- `code`: Código de autorización de Google
- `state`: Token CSRF para verificación
- `error`: Error si la autorización falló

**Proceso interno:**

1. ✅ Verifica parámetros de entrada
2. ✅ Valida el parámetro `state` contra la cookie
3. ✅ Intercambia el código por un access token con Google
4. ✅ Obtiene información del usuario de Google
5. ✅ Busca o crea el usuario en la base de datos
6. ✅ Crea cuenta OAuth si no existe
7. ✅ Genera tokens JWT
8. ✅ Establece cookies de autenticación

**Respuesta (200):**

```json
{
	"message": "Google authentication successful",
	"user": {
		"id": "clxxxxx",
		"email": "juan@gmail.com",
		"name": "Juan Pérez",
		"displayName": "Juan Pérez",
		"image": "https://lh3.googleusercontent.com/...",
		"emailVerified": true,
		"role": "USER",
		"isActive": true,
		"lastLoginAt": "2025-07-05T...",
		"createdAt": "2025-07-05T...",
		"updatedAt": "2025-07-05T..."
	}
}
```

---

### 🚪 **GET** `/auth/logout`

Cierra la sesión del usuario y añade el refresh token a la blacklist.

**Proceso interno:**

1. ✅ Obtiene el refresh token de las cookies
2. ✅ Decodifica el token para obtener el `userId`
3. ✅ Elimina el token de la tabla de sesiones activas
4. ✅ Limpia las cookies

**Respuesta (200):**

```json
{
	"message": "Logged out successfully"
}
```

---

### 👤 **GET** `/auth/me` _(Protegida)_

Obtiene información del usuario actual autenticado.

**Requisitos:**

- Middleware `authMiddleware` aplicado
- Cookie `access_token` válida

**Respuesta (200):**

```json
{
	"user": {
		"id": "clxxxxx",
		"email": "juan@ejemplo.com",
		"name": "Juan Pérez",
		"displayName": "Juan",
		"role": "USER",
		"isActive": true,
		"emailVerified": false
	}
}
```

---

## Esquemas de Validación

### `authLoginSchema`

```typescript
{
  email: string (email válido),
  password: string (mínimo 6 caracteres)
}
```

### `authRegisterSchema`

```typescript
{
  name: string (requerido, mínimo 1 carácter),
  email: string (email válido),
  password: string (mínimo 6 caracteres),
  confirmPassword: string (debe coincidir con password),
  displayName?: string (opcional)
}
```

### `authGoogleCallbackSchema`

```typescript
{
  code: string (código de autorización),
  state: string (token CSRF),
  error?: string (opcional, si hay error)
}
```

---

## Servicios Implementados

### `login(email, password)`

- Autentica usuario con credenciales
- Verifica contraseña hasheada
- Actualiza `lastLoginAt`
- Retorna usuario sin contraseña

### `register(email, password, confirmPassword, name?, displayName?)`

- Crea nuevo usuario
- Hashea contraseña con Argon2id
- Valida confirmación de contraseña
- Retorna usuario sin contraseña

### `createTokens(userId, role)`

- Genera access token JWT (15 min)
- Genera refresh token JWT (7 días)
- Almacena refresh token en base de datos
- Retorna ambos tokens

### `refreshToken(refreshTokenValue)`

- Verifica token contra blacklist
- Valida JWT y payload
- Verifica existencia en base de datos
- Verifica expiración
- Verifica usuario activo
- Genera nuevos tokens
- Invalida token anterior

### `blacklistToken(refreshTokenValue, userId)`

- Añade token a la blacklist
- Elimina token de sesiones activas
- Previene reutilización del token

### `findOrCreateGoogleUser(googleProfile)`

- Busca cuenta OAuth existente
- Crea usuario si no existe
- Asocia cuenta OAuth
- Marca email como verificado
- Actualiza `lastLoginAt`

---

## Sistema de Tokens

### **Access Token (JWT)**

- **Duración**: 15 minutos
- **Propósito**: Autorizar peticiones a la API
- **Almacenamiento**: Cookie HTTPOnly
- **Payload**: `{ sub: userId, role: userRole, iat: timestamp, exp: expiration }`

### **Refresh Token (JWT)**

- **Duración**: 7 días
- **Propósito**: Renovar access tokens
- **Almacenamiento**: Cookie HTTPOnly + Base de datos
- **Verificaciones**: Blacklist, expiración, usuario activo

### **State Token (OAuth)**

- **Duración**: 10 minutos
- **Propósito**: Protección CSRF en OAuth
- **Almacenamiento**: Cookie HTTPOnly temporal

---

## Sistema de Blacklist

### **Funcionamiento**

1. Los refresh tokens se añaden a la blacklist al hacer logout
2. Cada operación de refresh verifica contra la blacklist
3. Los tokens blacklisteados no pueden ser reutilizados
4. Limpieza automática de tokens antiguos (>30 días)

### **Tabla: `token_blacklist`**

```sql
- id: string (CUID)
- session_token: string (refresh token)
- user_id: string (ID del usuario)
- created_at: timestamp
```

---

## Middleware de Autenticación

### `authMiddleware`

```typescript
// Protege rutas que requieren autenticación
app.get("/protected", authMiddleware, handler);
```

**Funcionalidad:**

- ✅ Verifica access token en cookies
- ✅ Valida JWT y payload
- ✅ Verifica usuario activo en base de datos
- ✅ Añade información del usuario al contexto

### `requireRole(roles)`

```typescript
// Protege rutas por rol
app.get("/admin", authMiddleware, requireRole(["ADMIN"]), handler);
```

### `optionalAuthMiddleware`

```typescript
// Autenticación opcional (no lanza error)
app.get("/public", optionalAuthMiddleware, handler);
```

---

## Manejo de Errores

### **401 - Unauthorized**

- `"Access token not provided"`
- `"Invalid token payload"`
- `"User not found"`
- `"User account is inactive"`
- `"Invalid or expired access token"`
- `"Refresh token not provided"`
- `"Token is blacklisted"`
- `"Refresh token not found"`
- `"Refresh token expired"`

### **400 - Bad Request**

- `"User does not have a password set"`
- `"Invalid email or password"`
- `"OAuth error: ..."`
- `"Missing authorization code or state"`
- `"Invalid state parameter"`

### **403 - Forbidden**

- `"Insufficient permissions"`

### **500 - Internal Server Error**

- `"Google OAuth not configured"`
- `"Failed to refresh token"`
- `"Internal server error during authentication"`

---

## Configuración Requerida

### **Variables de Entorno**

```bash
# JWT
JWT_SECRET=tu_clave_secreta_muy_segura_aqui

# Google OAuth
GOOGLE_CLIENT_ID=tu_google_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_google_client_secret_aqui
OAUTH_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### **Base de Datos**

El módulo utiliza las siguientes tablas:

- `users` - Información de usuarios
- `accounts` - Cuentas OAuth asociadas
- `session_tokens` - Refresh tokens activos
- `token_blacklist` - Tokens invalidados

---

## Seguridad Implementada

### **Protecciones CSRF**

- ✅ Parámetro `state` en OAuth 2.0
- ✅ Verificación de estado en callback

### **Gestión Segura de Tokens**

- ✅ Cookies HTTPOnly (no accesibles desde JS)
- ✅ Tokens con expiración corta (access: 15min)
- ✅ Sistema de blacklist para invalidación inmediata
- ✅ Verificación de usuario activo en cada request

### **Hashing de Contraseñas**

- ✅ Argon2id con configuración segura
- ✅ Memory cost: 64MB, Time cost: 4 iteraciones

### **Validación de Entrada**

- ✅ Esquemas Zod para validación
- ✅ Sanitización automática de datos
- ✅ Validación de email y contraseñas fuertes

---

## Limpieza Automática

El sistema incluye utilidades de limpieza automática (`utils/cleanup.ts`):

- 🧹 **Tokens de sesión expirados**
- 🧹 **Tokens de blacklist antiguos** (>30 días)
- 🧹 **Tokens de reseteo de contraseña expirados**
- 🧹 **Tokens de verificación de email expirados**

**Frecuencia**: Cada hora automáticamente

---

## Uso en el Frontend

### **Inicio de Sesión**

```javascript
// Login tradicional
const response = await fetch("/auth/login", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({
		email: "usuario@ejemplo.com",
		password: "miPassword123",
	}),
});

// Login con Google (redirección)
window.location.href = "/auth/google";
```

### **Refresh Automático**

```javascript
// Interceptor para refresh automático
fetch("/api/protected-endpoint").then((response) => {
	if (response.status === 401) {
		return fetch("/auth/refresh", { method: "POST" }).then(() =>
			fetch("/api/protected-endpoint")
		);
	}
	return response;
});
```

### **Logout**

```javascript
await fetch("/auth/logout");
// Redirigir a página pública
```

---
