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

### 🚪 **POST** `/auth/logout` _(Protegida)_

Cierra la sesión del usuario en el dispositivo actual.

**Requisitos:**

- Middleware `JWTGuard` aplicado
- Cookie `access_token` válida
- Cookie `refresh_token` válida

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

### 🚪 **POST** `/auth/logout/all` _(Protegida)_

Cierra la sesión del usuario en todos los dispositivos.

**Requisitos:**

- Middleware `JWTGuard` aplicado
- Cookie `access_token` válida
- Cookie `refresh_token` válida

**Proceso interno:**

1. ✅ Obtiene el refresh token de las cookies
2. ✅ Decodifica el token para obtener el `userId`
3. ✅ Elimina TODAS las sesiones activas del usuario
4. ✅ Limpia las cookies del dispositivo actual

**Respuesta (200):**

```json
{
	"message": "Logged out from all devices successfully"
}
```

---

### ✉️ **GET** `/auth/email/verify`

Verifica el email del usuario usando un token JWT.

**Query Parameters:**

- `token`: JWT token de verificación

**Proceso interno:**

1. ✅ Valida el JWT token de verificación
2. ✅ Marca el email como verificado
3. ✅ Actualiza el estado del usuario

**Respuesta (200):**

```json
{
	"message": "Email verified successfully"
}
```

---

### ✉️ **POST** `/auth/email/resend`

Reenvía el email de verificación al usuario.

**Body:**

```json
{
	"email": "usuario@ejemplo.com"
}
```

**Proceso interno:**

1. ✅ Valida que el email existe en el sistema
2. ✅ Genera nuevo token de verificación
3. ✅ Envía email con enlace de verificación

**Respuesta (200):**

```json
{
	"message": "Verification email resent successfully"
}
```

---

### 🔑 **POST** `/auth/password/forgot`

Inicia el proceso de recuperación de contraseña.

**Body:**

```json
{
	"email": "usuario@ejemplo.com"
}
```

**Proceso interno:**

1. ✅ Busca el usuario por email
2. ✅ Genera token de reseteo de contraseña
3. ✅ Almacena token en base de datos con expiración
4. ✅ Envía email con enlace de reseteo

**Respuesta (200):**

```json
{
	"message": "Password reset link sent to your email"
}
```

**Nota:** La respuesta es siempre exitosa por razones de seguridad, incluso si el email no existe.

---

### 🔑 **POST** `/auth/password/reset`

Resetea la contraseña del usuario usando un token de recuperación.

**Body:**

```json
{
	"token": "eyJhbGciOiJIUzI1NiIs...",
	"newPassword": "nuevaPassword123",
	"confirmPassword": "nuevaPassword123"
}
```

**Validaciones:**

- Token válido y no expirado
- Nueva contraseña mínimo 8 caracteres
- Confirmación de contraseña debe coincidir

**Proceso interno:**

1. ✅ Verifica el token de reseteo
2. ✅ Valida que no haya expirado
3. ✅ Hashea la nueva contraseña
4. ✅ Actualiza la contraseña del usuario
5. ✅ Invalida el token de reseteo

**Respuesta (200):**

```json
{
	"message": "Password reset successfully"
}
```

---

### 🔑 **POST** `/auth/password/change` _(Protegida)_

Cambia la contraseña del usuario autenticado.

**Requisitos:**

- Middleware `JWTGuard` aplicado
- Cookie `access_token` válida

**Body:**

```json
{
	"currentPassword": "passwordActual123",
	"newPassword": "nuevaPassword123",
	"confirmPassword": "nuevaPassword123"
}
```

**Validaciones:**

- Contraseña actual correcta
- Nueva contraseña mínimo 8 caracteres
- Nueva contraseña diferente a la actual
- Confirmación de contraseña debe coincidir

**Proceso interno:**

1. ✅ Verifica la contraseña actual
2. ✅ Valida que la nueva contraseña sea diferente
3. ✅ Hashea la nueva contraseña
4. ✅ Actualiza la contraseña del usuario
5. ✅ Invalida todas las sesiones activas excepto la actual

**Respuesta (200):**

```json
{
	"message": "Password changed successfully"
}
```

---

### 📱 **GET** `/auth/sessions` _(Protegida)_

Obtiene todas las sesiones activas del usuario autenticado.

**Requisitos:**

- Middleware `JWTGuard` aplicado
- Cookie `access_token` válida

**Respuesta (200):**

```json
{
	"user": {
		"id": "clxxxxx",
		"email": "usuario@ejemplo.com",
		"name": "Usuario",
		"displayName": "Usuario"
	},
	"sessions": [
		{
			"id": "clxxxxx",
			"userId": "clxxxxx",
			"token": "eyJhbGciOiJIUzI1NiIs...",
			"expiresAt": "2025-07-17T...",
			"createdAt": "2025-07-10T...",
			"lastUsedAt": "2025-07-10T..."
		}
	]
}
```

---

### 📱 **DELETE** `/auth/sessions/:sessionId` _(Protegida)_

Elimina una sesión específica del usuario autenticado.

**Requisitos:**

- Middleware `JWTGuard` aplicado
- Cookie `access_token` válida

**Parameters:**

- `sessionId`: ID de la sesión a eliminar (CUID2)

**Validaciones:**

- La sesión debe pertenecer al usuario autenticado
- El sessionId debe ser un CUID2 válido

**Proceso interno:**

1. ✅ Verifica que la sesión pertenece al usuario
2. ✅ Elimina la sesión de la base de datos
3. ✅ Añade el token a la blacklist

**Respuesta (200):**

```json
{
	"message": "Session deleted successfully"
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

### `emailResendSchema`

```typescript
{
  email: string (email válido)
}
```

### `passwordForgotSchema`

```typescript
{
  email: string (email válido)
}
```

### `passwordResetSchema`

```typescript
{
  token: string (token de reseteo),
  newPassword: string (mínimo 8 caracteres),
  confirmPassword: string (debe coincidir con newPassword)
}
```

### `passwordChangeSchema`

```typescript
{
  currentPassword: string (mínimo 8 caracteres),
  newPassword: string (mínimo 8 caracteres),
  confirmPassword: string (debe coincidir con newPassword)
}
```

### `sessionIdParamSchema`

```typescript
{
  sessionId: string (CUID2 válido)
}
```

### `emailVerifySchema`

```typescript
{
  token: string (JWT válido)
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

### `logout(userId, token, logoutAll?)`

- Añade token a la blacklist
- Elimina token de sesiones activas
- Si `logoutAll` es true, elimina todas las sesiones del usuario
- Previene reutilización del token

### `findOrCreateGoogleUser(googleProfile)`

- Busca cuenta OAuth existente
- Crea usuario si no existe
- Asocia cuenta OAuth
- Marca email como verificado
- Actualiza `lastLoginAt`

### `createPasswordResetToken(email)`

- Busca usuario por email
- Genera token de reseteo con expiración
- Almacena token en base de datos
- Retorna el token para envío por email

### `resetPassword(token, newPassword)`

- Verifica validez del token de reseteo
- Valida que no haya expirado
- Hashea nueva contraseña
- Actualiza contraseña del usuario
- Invalida token de reseteo usado

### `changePassword(userId, currentPassword, newPassword)`

- Verifica contraseña actual del usuario
- Valida que nueva contraseña sea diferente
- Hashea nueva contraseña
- Actualiza contraseña en base de datos
- Invalida todas las sesiones activas excepto la actual

### `revokeSession(sessionId, userId)`

- Verifica que la sesión pertenece al usuario
- Elimina sesión de la base de datos
- Añade token de la sesión a la blacklist
- Previene uso futuro del token

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
app.get("/admin", authMiddleware, requireRole([UserRole.ADMIN]), handler);
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
- `"Missing refresh token"`
- `"Invalid or expired reset token"`
- `"Password reset token expired"`
- `"Current password is incorrect"`
- `"Passwords do not match"`
- `"New password must be different from current password"`

### **403 - Forbidden**

- `"Insufficient permissions"`

### **404 - Not Found**

- `"User not found"`
- `"Session not found"`
- `"Reset token not found"`

### **500 - Internal Server Error**

- `"Google OAuth not configured"`
- `"Failed to refresh token"`
- `"Internal server error during authentication"`
- `"Failed to send email"`
- `"Failed to create reset token"`

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

### **Gestión de Contraseñas**

```javascript
// Solicitar reseteo de contraseña
await fetch("/auth/password/forgot", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({
		email: "usuario@ejemplo.com",
	}),
});

// Resetear contraseña con token
await fetch("/auth/password/reset", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({
		token: "eyJhbGciOiJIUzI1NiIs...",
		newPassword: "nuevaPassword123",
		confirmPassword: "nuevaPassword123",
	}),
});

// Cambiar contraseña (usuario autenticado)
await fetch("/auth/password/change", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({
		currentPassword: "passwordActual123",
		newPassword: "nuevaPassword123",
		confirmPassword: "nuevaPassword123",
	}),
});
```

### **Gestión de Email**

```javascript
// Reenviar email de verificación
await fetch("/auth/email/resend", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({
		email: "usuario@ejemplo.com",
	}),
});

// Verificar email (desde enlace en email)
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");
await fetch(`/auth/email/verify?token=${token}`);
```

### **Gestión de Sesiones**

```javascript
// Obtener sesiones activas
const response = await fetch("/auth/sessions");
const { user, sessions } = await response.json();

// Eliminar una sesión específica
await fetch(`/auth/sessions/${sessionId}`, {
	method: "DELETE",
});

// Cerrar sesión en dispositivo actual
await fetch("/auth/logout", { method: "POST" });

// Cerrar sesión en todos los dispositivos
await fetch("/auth/logout/all", { method: "POST" });
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
await fetch("/auth/logout", { method: "POST" });
// Redirigir a página pública
```

---
