# Business Module Documentation

## Descripción General

El módulo Business gestiona todas las operaciones relacionadas con los negocios en la plataforma Pueblia. Permite crear, leer, actualizar y eliminar negocios, así como gestionar la autorización basada en roles para propietarios, administradores y usuarios administrativos.

## Estructura del Módulo

```
apps/api/src/modules/bussines/
├── routes.ts     # Definición de rutas HTTP
├── schema.ts     # Esquemas de validación Zod
└── services.ts   # Lógica de negocio y operaciones de base de datos
```

## Modelo de Datos

### Business Schema (Prisma)

```prisma
model Business {
  id                 String    @id @default(cuid())
  name              String
  description       String?
  ownerId           String
  owner             User      @relation(fields: [ownerId], references: [id], name: "BusinessOwner")
  AdminsUsers       User[]    @relation("BusinessAdmins")
  logo              String?   @map("logo_url")
  cover             String?   @map("cover_url")
  location          String?   @map("location_url")
  website           String?   @map("website_url")
  phone             String?
  loyaltyPoints     Int       @default(0)
  isVerified        Boolean   @default(false)
  isActive          Boolean   @default(true)
  openingHours      Json?
  isOpen            Boolean   @default(false)
  tags              String[]
  businessCategoryId String?
  addressId         String?   @unique
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
}
```

## Esquemas de Validación

### createBussinesSchema

```typescript
{
	name: string; // Requerido
}
```

### updateBussinesSchema (Parcial)

```typescript
{
  name?: string
  description?: string
  logo?: string (URL)
  cover?: string (URL)
  location?: string (URL)
  website?: string (URL)
  phone?: string
  loyaltyPoints?: number (≥0)
  isVerified?: boolean
  isActive?: boolean
  openingHours?: any
  isOpen?: boolean
  tags?: string[]
  businessCategoryId?: string
}
```

### bussinesIdSchema

```typescript
{
	id: string(cuid2); // Parámetro de ruta
}
```

## Endpoints de la API

### POST `/api/business`

**Descripción:** Crear un nuevo negocio

**Autenticación:** Requerida (JWT)

**Body:**

```json
{
	"name": "Mi Negocio"
}
```

**Respuesta:** `201 Created`

```json
{
  "id": "clxx...",
  "name": "Mi Negocio",
  "ownerId": "clxx...",
  "createdAt": "2025-07-09T...",
  ...
}
```

**Errores:**

- `400` - Datos de entrada inválidos
- `401` - Token JWT faltante o inválido

---

### GET `/api/business`

**Descripción:** Obtener lista de todos los negocios

**Autenticación:** No requerida

**Respuesta:** `200 OK`

```json
[
  {
    "id": "clxx...",
    "name": "Negocio 1",
    "description": "Descripción...",
    ...
  }
]
```

---

### GET `/api/business/:id`

**Descripción:** Obtener un negocio específico por ID

**Autenticación:** No requerida

**Parámetros:**

- `id` (string, cuid2): ID del negocio

**Respuesta:** `200 OK`

```json
{
  "id": "clxx...",
  "name": "Mi Negocio",
  "AdminsUsers": [
    {
      "id": "clxx...",
      "name": "Usuario Admin"
    }
  ],
  ...
}
```

**Errores:**

- `400` - ID inválido
- `404` - Negocio no encontrado

---

### PATCH `/api/business/:id`

**Descripción:** Actualizar parcialmente un negocio

**Autenticación:** Requerida (JWT)

**Autorización:**

- Propietario del negocio
- Usuario con rol `admin`
- Usuario administrativo del negocio

**Parámetros:**

- `id` (string, cuid2): ID del negocio

**Body:** (Campos opcionales del `updateBussinesSchema`)

```json
{
	"name": "Nuevo Nombre",
	"description": "Nueva descripción",
	"logo": "https://example.com/logo.png"
}
```

**Respuesta:** `200 OK`

```json
{
  "id": "clxx...",
  "name": "Nuevo Nombre",
  "description": "Nueva descripción",
  ...
}
```

**Errores:**

- `400` - Datos de entrada inválidos
- `401` - Token JWT faltante o inválido
- `403` - Sin permisos para actualizar el negocio
- `404` - Negocio no encontrado

---

### PUT `/api/business/:id`

**Descripción:** Actualizar completamente un negocio (reemplazo completo)

**Autenticación:** Requerida (JWT)

**Autorización:**

- Propietario del negocio
- Usuario con rol `admin`

**Parámetros:**

- `id` (string, cuid2): ID del negocio

**Body:** (Campos del `updateBussinesSchema`)

**Respuesta:** `200 OK`

**Errores:**

- `400` - Datos de entrada inválidos
- `401` - Token JWT faltante o inválido
- `403` - Sin permisos para actualizar el negocio
- `404` - Negocio no encontrado

---

### DELETE `/api/business/:id`

**Descripción:** Eliminar un negocio

**Autenticación:** Requerida (JWT)

**Autorización:**

- Propietario del negocio
- Usuario con rol `admin`

**Parámetros:**

- `id` (string, cuid2): ID del negocio

**Respuesta:** `204 No Content`

**Errores:**

- `400` - ID inválido
- `401` - Token JWT faltante o inválido
- `403` - Sin permisos para eliminar el negocio
- `404` - Negocio no encontrado

## Servicios

### createBussines(data: CreateBussinesData)

Crea un nuevo negocio en la base de datos.

**Parámetros:**

- `data.name` (string): Nombre del negocio
- `data.ownerId` (string): ID del propietario

**Retorna:** Business creado

---

### getBussines()

Obtiene todos los negocios.

**Retorna:** Array de Business

---

### getBussinesById(id: string)

Obtiene un negocio específico por ID, incluyendo usuarios administrativos.

**Parámetros:**

- `id` (string): ID del negocio

**Retorna:** Business con AdminsUsers incluidos

**Throws:** Error si no se encuentra

---

### updateBussines(id: string, data: UpdateBussinesSchema)

Actualiza un negocio existente.

**Parámetros:**

- `id` (string): ID del negocio
- `data` (UpdateBussinesSchema): Datos a actualizar

**Retorna:** Business actualizado

---

### deleteBussines(id: string)

Elimina un negocio.

**Parámetros:**

- `id` (string): ID del negocio

**Retorna:** Business eliminado

## Sistema de Autorización

### Niveles de Acceso

1. **Propietario (Owner)**

   - Creador del negocio
   - Acceso completo: crear, leer, actualizar, eliminar

2. **Admin (Global)**

   - Usuario con rol `admin`
   - Acceso completo a todos los negocios

3. **Usuario Administrativo del Negocio**

   - Usuario en la relación `AdminsUsers` del negocio
   - Puede actualizar el negocio (solo PATCH, no PUT ni DELETE)

4. **Usuario Público**
   - Solo puede leer información de negocios

### Diferencias entre PATCH y PUT

- **PATCH**: Permite actualización por propietario, admin global y usuarios administrativos
- **PUT**: Solo permite actualización por propietario y admin global

Esta diferencia permite que los usuarios administrativos del negocio puedan hacer cambios menores, pero solo el propietario o admin global pueden hacer cambios completos o destructivos.

## Middleware Utilizado

- **JWTGuard()**: Validación de token JWT
- **zValidator()**: Validación de esquemas con Zod
  - `"json"`: Validación del body de la request
  - `"param"`: Validación de parámetros de ruta

## Notas de Implementación

1. **IDs**: Se utilizan cuid2 para los identificadores
2. **Soft Delete**: El modelo incluye `deletedAt` para eliminación suave (aunque no implementado en los servicios actuales)
3. **Timestamps**: Incluye `createdAt` y `updatedAt` automáticos
4. **Índices**: El modelo tiene índices optimizados para consultas comunes
5. **Relaciones**: Incluye relaciones con User, Address, BusinessCategory y otros modelos

## Ejemplos de Uso

### Crear un negocio

```bash
curl -X POST http://localhost:3000/api/business \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Mi Restaurante"}'
```

### Actualizar un negocio

```bash
curl -X PATCH http://localhost:3000/api/business/clxx... \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"description": "El mejor restaurante de la ciudad", "phone": "+1234567890"}'
```

### Obtener todos los negocios

```bash
curl http://localhost:3000/api/business
```
