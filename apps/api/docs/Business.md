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

### bussinesListQuerySchema

Esquema para filtros, búsqueda y paginación en el listado de negocios.

```typescript
{
  // Búsqueda
  search?: string                    // Búsqueda en nombre y descripción

  // Filtros
  category?: string                  // ID de categoría
  tags?: string                     // Tags separados por comas
  near?: string                     // Coordenadas o dirección (TODO: implementar)
  isVerified?: boolean              // Solo negocios verificados
  isActive?: boolean                // Solo negocios activos
  isOpen?: boolean                  // Solo negocios abiertos

  // Paginación
  page?: number = 1                 // Número de página (mínimo 1)
  limit?: number = 10               // Elementos por página (1-100)

  // Ordenamiento
  sort?: 'name' | 'createdAt' | 'updatedAt' | 'loyaltyPoints' | 'rating' = 'createdAt'
  order?: 'asc' | 'desc' = 'desc'
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

**Descripción:** Obtener lista de negocios con soporte para filtros, búsqueda y paginación

**Autenticación:** No requerida

**Query Parameters:**

```
?search=restaurante          # Búsqueda en nombre y descripción
&category=clxx...           # Filtrar por ID de categoría
&tags=comida,italiana       # Filtrar por tags (separados por comas)
&near=lat,lng               # Filtrar por ubicación (TODO: implementar)
&isVerified=true            # Solo negocios verificados
&isActive=true              # Solo negocios activos
&isOpen=true                # Solo negocios abiertos
&page=1                     # Número de página
&limit=10                   # Elementos por página (máximo 100)
&sort=name                  # Ordenar por: name, createdAt, updatedAt, loyaltyPoints, rating
&order=asc                  # Orden: asc, desc
```

**Ejemplos de uso:**

```bash
# Buscar restaurantes verificados, página 2
GET /api/business?search=restaurante&isVerified=true&page=2&limit=5

# Filtrar por categoría y tags
GET /api/business?category=clxx...&tags=comida,italiana&sort=rating&order=desc

# Solo negocios abiertos y activos
GET /api/business?isActive=true&isOpen=true&sort=loyaltyPoints&order=desc
```

**Respuesta:** `200 OK`

```json
{
	"businesses": [
		{
			"id": "clxx...",
			"name": "Restaurante Italiano",
			"description": "Auténtica comida italiana...",
			"avgRating": 4.5,
			"BusinessCategory": {
				"id": "clxx...",
				"name": "Restaurantes"
			},
			"_count": {
				"Review": 45,
				"Favorite": 23
			},
			"isVerified": true,
			"isActive": true,
			"isOpen": true,
			"tags": ["comida", "italiana", "pizza"],
			"loyaltyPoints": 150,
			"createdAt": "2025-07-09T...",
			"updatedAt": "2025-07-09T..."
		}
	],
	"pagination": {
		"page": 1,
		"limit": 10,
		"total": 42,
		"totalPages": 5,
		"hasNextPage": true,
		"hasPrevPage": false
	}
}
```

**Notas importantes:**

- Si no se proporcionan query parameters, retorna todos los negocios sin paginación (comportamiento legacy)
- El campo `avgRating` se calcula dinámicamente desde las reviews
- El campo `_count` incluye el número de reviews y favoritos
- Los negocios incluyen información de su categoría
- El filtro `near` está preparado pero requiere implementación de geolocalización

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

### getBussines(filters?: BussinesListQuerySchema)

Obtiene negocios con soporte para filtros, búsqueda y paginación.

**Parámetros:**

- `filters` (opcional): Objeto con filtros y opciones de paginación

**Funcionalidad:**

- **Sin filtros**: Retorna todos los negocios (comportamiento legacy)
- **Con filtros**: Aplica filtros, búsqueda, paginación y ordenamiento

**Filtros soportados:**

- `search`: Búsqueda insensible a mayúsculas en nombre y descripción
- `category`: Filtrado por ID de categoría de negocio
- `tags`: Filtrado por tags (array que debe contener alguno de los tags especificados)
- `isVerified`, `isActive`, `isOpen`: Filtros booleanos
- `near`: Preparado para geolocalización (TODO: implementar)

**Paginación:**

- `page`: Número de página (mínimo 1, por defecto 1)
- `limit`: Elementos por página (1-100, por defecto 10)

**Ordenamiento:**

- `sort`: Campo para ordenar (name, createdAt, updatedAt, loyaltyPoints, rating)
- `order`: Dirección del ordenamiento (asc, desc)

**Retorna:**

- **Sin filtros**: `Business[]`
- **Con filtros**:
  ```typescript
  {
    businesses: Business[], // Con avgRating calculado y datos de categoría
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number,
      hasNextPage: boolean,
      hasPrevPage: boolean
    }
  }
  ```

**Características especiales:**

- Calcula `avgRating` dinámicamente desde las reviews
- Incluye contadores de reviews y favoritos (`_count`)
- Incluye información de la categoría del negocio
- Para ordenamiento por rating, usa agregación de reviews

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

### Obtener todos los negocios (sin filtros)

```bash
curl http://localhost:3000/api/business
```

### Búsqueda y filtros avanzados

#### Buscar restaurantes verificados

```bash
curl "http://localhost:3000/api/business?search=restaurante&isVerified=true&page=1&limit=5"
```

#### Filtrar por categoría y tags específicos

```bash
curl "http://localhost:3000/api/business?category=clxx...&tags=comida,italiana&sort=rating&order=desc"
```

#### Obtener negocios más populares (por favoritos y rating)

```bash
curl "http://localhost:3000/api/business?isActive=true&sort=rating&order=desc&limit=10"
```

#### Paginación con ordenamiento por puntos de lealtad

```bash
curl "http://localhost:3000/api/business?page=2&limit=20&sort=loyaltyPoints&order=desc"
```

#### Buscar negocios abiertos y activos con múltiples tags

```bash
curl "http://localhost:3000/api/business?isActive=true&isOpen=true&tags=comida,delivery,rapido"
```

### Respuesta de ejemplo con filtros

```json
{
	"businesses": [
		{
			"id": "clxx123",
			"name": "Pizzería Don Giuseppe",
			"description": "Auténtica pizza italiana con ingredientes frescos",
			"avgRating": 4.7,
			"BusinessCategory": {
				"id": "clyy456",
				"name": "Restaurantes"
			},
			"_count": {
				"Review": 89,
				"Favorite": 45
			},
			"isVerified": true,
			"isActive": true,
			"isOpen": true,
			"tags": ["pizza", "italiana", "delivery", "familiar"],
			"loyaltyPoints": 250,
			"phone": "+1234567890",
			"website": "https://pizzeriadongiuseppe.com",
			"createdAt": "2025-07-01T10:00:00.000Z",
			"updatedAt": "2025-07-09T15:30:00.000Z"
		}
	],
	"pagination": {
		"page": 1,
		"limit": 5,
		"total": 23,
		"totalPages": 5,
		"hasNextPage": true,
		"hasPrevPage": false
	}
}
```

### JavaScript/Frontend Examples

#### Función para obtener negocios con filtros

```javascript
async function getBusinesses(filters = {}) {
	const params = new URLSearchParams();

	// Agregar filtros si están presentes
	Object.entries(filters).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") {
			params.append(key, value);
		}
	});

	const response = await fetch(`/api/business?${params}`);
	const data = await response.json();

	return data;
}

// Ejemplos de uso
const allBusinesses = await getBusinesses();

const filteredBusinesses = await getBusinesses({
	search: "restaurante",
	isVerified: true,
	page: 1,
	limit: 10,
	sort: "rating",
	order: "desc",
});

const businessesByCategory = await getBusinesses({
	category: "clxx123",
	tags: "comida,italiana",
	isActive: true,
});
```

#### Componente React de ejemplo

```jsx
import { useState, useEffect } from "react";

function BusinessList() {
	const [businesses, setBusinesses] = useState([]);
	const [pagination, setPagination] = useState({});
	const [filters, setFilters] = useState({
		search: "",
		page: 1,
		limit: 10,
		sort: "createdAt",
		order: "desc",
	});

	useEffect(() => {
		async function fetchBusinesses() {
			const data = await getBusinesses(filters);

			if (data.businesses) {
				// Con filtros - respuesta paginada
				setBusinesses(data.businesses);
				setPagination(data.pagination);
			} else {
				// Sin filtros - respuesta simple
				setBusinesses(data);
				setPagination({});
			}
		}

		fetchBusinesses();
	}, [filters]);

	const handleSearch = (searchTerm) => {
		setFilters((prev) => ({
			...prev,
			search: searchTerm,
			page: 1, // Reset a la primera página
		}));
	};

	const handlePageChange = (newPage) => {
		setFilters((prev) => ({ ...prev, page: newPage }));
	};

	return (
		<div>
			<input
				placeholder="Buscar negocios..."
				onChange={(e) => handleSearch(e.target.value)}
			/>

			{businesses.map((business) => (
				<div key={business.id}>
					<h3>{business.name}</h3>
					<p>Rating: {business.avgRating || "Sin rating"}</p>
					<p>Reviews: {business._count?.Review || 0}</p>
					<p>Favoritos: {business._count?.Favorite || 0}</p>
				</div>
			))}

			{pagination.totalPages > 1 && (
				<div>
					<button
						disabled={!pagination.hasPrevPage}
						onClick={() => handlePageChange(pagination.page - 1)}
					>
						Anterior
					</button>
					<span>
						Página {pagination.page} de {pagination.totalPages}
					</span>
					<button
						disabled={!pagination.hasNextPage}
						onClick={() => handlePageChange(pagination.page + 1)}
					>
						Siguiente
					</button>
				</div>
			)}
		</div>
	);
}
```

### Consideraciones de Performance

1. **Índices recomendados:**

   ```sql
   -- Para búsqueda por texto
   CREATE INDEX idx_business_name_search ON business USING gin(to_tsvector('spanish', name));
   CREATE INDEX idx_business_description_search ON business USING gin(to_tsvector('spanish', description));

   -- Para filtros comunes
   CREATE INDEX idx_business_category ON business(business_category_id);
   CREATE INDEX idx_business_verified_active ON business(is_verified, is_active);
   CREATE INDEX idx_business_tags ON business USING gin(tags);

   -- Para ordenamiento
   CREATE INDEX idx_business_created_at ON business(created_at);
   CREATE INDEX idx_business_loyalty_points ON business(loyalty_points);
   ```

2. **Caché recomendado:**

   - Cachear respuestas de búsquedas comunes
   - Usar Redis para almacenar resultados de consultas populares
   - Invalidar caché cuando se actualicen negocios

3. **Límites:**
   - Máximo 100 elementos por página para evitar sobrecarga
   - Timeouts apropiados para consultas complejas
   - Considerar paginación cursor-based para datasets muy grandes
