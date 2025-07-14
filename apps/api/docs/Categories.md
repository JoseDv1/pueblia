# Módulo de Categorías de Negocios (Categories)

## Descripción General

El módulo de categorías de Pueblia es un sistema de gestión de categorías para clasificar negocios en la plataforma. Permite crear, leer, actualizar y eliminar categorías que luego serán utilizadas por los negocios para identificar su sector o tipo de actividad comercial.

## Arquitectura del Módulo

```
src/modules/categories/
├── routes.ts     # Definición de rutas HTTP
├── schema.ts     # Validaciones con Zod
└── services.ts   # Lógica de negocio
```

## Archivos del Módulo

### `routes.ts`

Define todas las rutas HTTP del módulo de categorías y maneja las peticiones/respuestas.

### `schema.ts`

Contiene los esquemas de validación usando Zod para validar datos de entrada.

### `services.ts`

Implementa la lógica de negocio, incluyendo operaciones CRUD con la base de datos para las categorías.

---

## Rutas Disponibles

### 📋 **GET** `/categories`

Obtiene todas las categorías disponibles en el sistema.

**Autenticación:** No requerida (pública)

**Respuesta (200):**

```json
[
	{
		"id": "clxxxxx",
		"name": "Restaurantes",
		"description": "Establecimientos de comida y bebida",
		"createdAt": "2025-07-10T10:00:00.000Z",
		"updatedAt": "2025-07-10T10:00:00.000Z"
	},
	{
		"id": "clyyyyyy",
		"name": "Tiendas de Ropa",
		"description": "Boutiques y tiendas de vestimenta",
		"createdAt": "2025-07-10T10:30:00.000Z",
		"updatedAt": "2025-07-10T10:30:00.000Z"
	}
]
```

---

### 🔍 **GET** `/categories/:id`

Obtiene una categoría específica por su ID.

**Autenticación:** No requerida (pública)

**Parameters:**

- `id`: ID de la categoría (CUID2)

**Respuesta (200):**

```json
{
	"id": "clxxxxx",
	"name": "Restaurantes",
	"description": "Establecimientos de comida y bebida",
	"createdAt": "2025-07-10T10:00:00.000Z",
	"updatedAt": "2025-07-10T10:00:00.000Z"
}
```

**Errores:**

- **404**: Categoría no encontrada

---

### ➕ **POST** `/categories` _(Protegida - ADMIN)_

Crea una nueva categoría en el sistema.

**Autenticación:** Requerida (Rol: ADMIN)
**Middleware:** `JWTGuard(UserRole.ADMIN)`

**Body:**

```json
{
	"name": "Farmacias",
	"description": "Establecimientos de productos farmacéuticos y de salud"
}
```

**Validaciones:**

- `name`: Requerido, mínimo 1 carácter, máximo 100 caracteres
- `description`: Opcional, tipo string

**Respuesta (201):**

```json
{
	"id": "clzzzzzz",
	"name": "Farmacias",
	"description": "Establecimientos de productos farmacéuticos y de salud",
	"createdAt": "2025-07-10T11:00:00.000Z",
	"updatedAt": "2025-07-10T11:00:00.000Z"
}
```

**Errores:**

- **400**: Datos de entrada inválidos
- **401**: Token de acceso no válido o no proporcionado
- **403**: Permisos insuficientes (no es ADMIN)

---

### ✏️ **PATCH** `/categories/:id` _(Protegida - ADMIN)_

Actualiza una categoría existente.

**Autenticación:** Requerida (Rol: ADMIN)
**Middleware:** `JWTGuard(UserRole.ADMIN)`

**Parameters:**

- `id`: ID de la categoría (CUID2)

**Body (todos los campos son opcionales):**

```json
{
	"name": "Restaurantes y Bares",
	"description": "Establecimientos de comida, bebida y entretenimiento gastronómico"
}
```

**Validaciones:**

- `name`: Opcional, mínimo 1 carácter, máximo 100 caracteres
- `description`: Opcional, tipo string

**Respuesta (200):**

```json
{
	"id": "clxxxxx",
	"name": "Restaurantes y Bares",
	"description": "Establecimientos de comida, bebida y entretenimiento gastronómico",
	"createdAt": "2025-07-10T10:00:00.000Z",
	"updatedAt": "2025-07-10T11:30:00.000Z"
}
```

**Errores:**

- **400**: Datos de entrada inválidos
- **401**: Token de acceso no válido o no proporcionado
- **403**: Permisos insuficientes (no es ADMIN)
- **404**: Categoría no encontrada

---

### 🗑️ **DELETE** `/categories/:id` _(Protegida - ADMIN)_

Elimina una categoría del sistema.

**Autenticación:** Requerida (Rol: ADMIN)
**Middleware:** `JWTGuard(UserRole.ADMIN)`

**Parameters:**

- `id`: ID de la categoría (CUID2)

**Respuesta (200):**

```json
{
	"id": "clxxxxx",
	"name": "Categoría Eliminada",
	"description": "Descripción de la categoría eliminada",
	"createdAt": "2025-07-10T10:00:00.000Z",
	"updatedAt": "2025-07-10T10:00:00.000Z"
}
```

**Errores:**

- **400**: ID de categoría inválido
- **401**: Token de acceso no válido o no proporcionado
- **403**: Permisos insuficientes (no es ADMIN)
- **404**: Categoría no encontrada

**⚠️ Nota:** Al eliminar una categoría, se debe verificar que no esté siendo utilizada por negocios existentes para mantener la integridad referencial.

---

## Esquemas de Validación

### `categoriesIdSchema`

Valida el parámetro de ID de categoría en las rutas.

```typescript
{
  id: string (CUID2 válido)
}
```

### `createCategorySchema`

Valida los datos para crear una nueva categoría.

```typescript
{
  name: string (requerido, min: 1, max: 100),
  description?: string (opcional)
}
```

**Validaciones específicas:**

- `name`: Campo obligatorio, entre 1 y 100 caracteres
- `description`: Campo opcional, sin restricciones de longitud

### `updateCategorySchema`

Valida los datos para actualizar una categoría existente.

```typescript
{
  name?: string (opcional, min: 1, max: 100),
  description?: string (opcional)
}
```

**Características:**

- Todos los campos son opcionales (usando `.partial()`)
- Permite actualizaciones parciales
- Mantiene las mismas validaciones que `createCategorySchema`

---

## Servicios Implementados

### `getCategories()`

Obtiene todas las categorías del sistema.

**Funcionalidad:**

- ✅ Consulta todas las categorías en la base de datos
- ✅ Retorna array completo de categorías
- ✅ Incluye todos los campos: id, name, description, createdAt, updatedAt

**Retorno:**

```typescript
Promise<BusinessCategory[]>;
```

---

### `getCategoryById(id: string)`

Busca una categoría específica por su ID.

**Parámetros:**

- `id`: ID único de la categoría (CUID2)

**Funcionalidad:**

- ✅ Busca categoría por ID único
- ✅ Lanza excepción si no encuentra la categoría
- ✅ Utiliza `findUniqueOrThrow` para manejo automático de errores

**Retorno:**

```typescript
Promise<BusinessCategory>;
```

**Errores:**

- Lanza excepción si la categoría no existe

---

### `createCategory(data: CreateCategoryData)`

Crea una nueva categoría en el sistema.

**Parámetros:**

- `data`: Objeto con name y description (opcional)

**Tipo de dato:**

```typescript
type CreateCategoryData = {
	name: string;
	description?: string;
};
```

**Funcionalidad:**

- ✅ Valida datos de entrada con schema Zod
- ✅ Crea registro en tabla `business_category`
- ✅ Genera ID único automáticamente (CUID2)
- ✅ Establece timestamps automáticos

**Retorno:**

```typescript
Promise<BusinessCategory>;
```

---

### `updateCategory(id: string, data: UpdateCategoryData)`

Actualiza una categoría existente.

**Parámetros:**

- `id`: ID único de la categoría (CUID2)
- `data`: Objeto con campos a actualizar (parcial)

**Tipo de dato:**

```typescript
type UpdateCategoryData = {
	name?: string;
	description?: string;
};
```

**Funcionalidad:**

- ✅ Busca categoría por ID
- ✅ Actualiza solo los campos proporcionados
- ✅ Actualiza timestamp `updatedAt` automáticamente
- ✅ Retorna categoría actualizada completa

**Retorno:**

```typescript
Promise<BusinessCategory>;
```

**Errores:**

- Lanza excepción si la categoría no existe

---

### `deleteCategory(id: string)`

Elimina una categoría del sistema.

**Parámetros:**

- `id`: ID único de la categoría (CUID2)

**Funcionalidad:**

- ✅ Busca y elimina categoría por ID
- ✅ Retorna datos de la categoría eliminada
- ✅ Operación irreversible

**Retorno:**

```typescript
Promise<BusinessCategory>;
```

**Errores:**

- Lanza excepción si la categoría no existe

**⚠️ Consideraciones:**

- Verificar relaciones con negocios antes de eliminar
- Considerar implementar eliminación lógica en lugar de física

---

## Modelo de Base de Datos

### Tabla: `business_category`

```sql
- id: string (CUID2, Primary Key)
- name: string (NOT NULL, VARCHAR(100))
- description: string (NULLABLE, TEXT)
- created_at: timestamp (DEFAULT NOW())
- updated_at: timestamp (DEFAULT NOW(), ON UPDATE NOW())
```

**Índices:**

- Primary Key: `id`
- Unique: `name` (recomendado para evitar duplicados)

**Relaciones:**

- `businesses.category_id` → `business_category.id` (Uno a muchos)

---

## Middleware de Seguridad

### `JWTGuard(UserRole.ADMIN)`

Aplicado a rutas de escritura (POST, PATCH, DELETE).

**Funcionalidad:**

- ✅ Verifica token JWT válido
- ✅ Valida que el usuario tenga rol ADMIN
- ✅ Bloquea acceso a usuarios no autorizados
- ✅ Permite lectura pública para rutas GET

**Rutas protegidas:**

- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

**Rutas públicas:**

- `GET /categories`
- `GET /categories/:id`

---

## Manejo de Errores

### **400 - Bad Request**

- `"Validation error"` - Datos de entrada inválidos
- `"Name is required"` - Campo name no proporcionado
- `"Name must be less than 100 characters"` - Nombre demasiado largo
- `"Invalid category ID format"` - ID no es CUID2 válido

### **401 - Unauthorized**

- `"Access token not provided"` - Token JWT no encontrado
- `"Invalid or expired access token"` - Token inválido

### **403 - Forbidden**

- `"Insufficient permissions"` - Usuario no tiene rol ADMIN
- `"Admin access required"` - Operación requiere permisos de administrador

### **404 - Not Found**

- `"Category not found"` - Categoría con ID especificado no existe

### **500 - Internal Server Error**

- `"Database connection error"` - Error de conexión a base de datos
- `"Internal server error"` - Error no controlado del servidor

---

## Casos de Uso

### **1. Listar Categorías (Público)**

```javascript
// Frontend - Obtener todas las categorías
const response = await fetch("/categories");
const categories = await response.json();

// Mostrar en select/dropdown
categories.forEach((category) => {
	console.log(`${category.name}: ${category.description}`);
});
```

### **2. Obtener Categoría Específica**

```javascript
// Frontend - Obtener categoría por ID
const categoryId = "clxxxxx";
const response = await fetch(`/categories/${categoryId}`);
const category = await response.json();

console.log(category.name); // "Restaurantes"
```

### **3. Crear Nueva Categoría (Admin)**

```javascript
// Frontend - Crear categoría (requiere autenticación ADMIN)
const response = await fetch("/categories", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
	},
	body: JSON.stringify({
		name: "Tecnología",
		description: "Tiendas de productos tecnológicos y electrónicos",
	}),
});

const newCategory = await response.json();
```

### **4. Actualizar Categoría (Admin)**

```javascript
// Frontend - Actualizar categoría existente
const categoryId = "clxxxxx";
const response = await fetch(`/categories/${categoryId}`, {
	method: "PATCH",
	headers: {
		"Content-Type": "application/json",
	},
	body: JSON.stringify({
		description: "Nueva descripción actualizada",
	}),
});

const updatedCategory = await response.json();
```

### **5. Eliminar Categoría (Admin)**

```javascript
// Frontend - Eliminar categoría
const categoryId = "clxxxxx";
const response = await fetch(`/categories/${categoryId}`, {
	method: "DELETE",
});

const deletedCategory = await response.json();
console.log("Categoría eliminada:", deletedCategory.name);
```

---

## Integración con Negocios

Las categorías están diseñadas para ser utilizadas por el módulo de negocios:

### **Relación en Base de Datos**

```sql
-- Tabla businesses
business {
  id: string
  name: string
  category_id: string  -- FK to business_category.id
  // otros campos...
}
```

### **Uso en Negocios**

```javascript
// Al crear un negocio
const newBusiness = {
	name: "Restaurante El Buen Sabor",
	categoryId: "clxxxxx", // ID de categoría "Restaurantes"
	// otros datos...
};
```

### **Consultas con Relaciones**

```typescript
// Service para obtener negocios con categoría
const businessesWithCategory = await prisma.business.findMany({
	include: {
		category: true, // Incluye datos de la categoría
	},
});
```

---

## Recomendaciones de Implementación

### **1. Validación de Integridad**

```typescript
// Antes de eliminar una categoría, verificar uso
async function safeCategoryDelete(categoryId: string) {
	const businessCount = await prisma.business.count({
		where: { categoryId },
	});

	if (businessCount > 0) {
		throw new Error("Cannot delete category: still in use by businesses");
	}

	return deleteCategory(categoryId);
}
```

### **2. Caché de Categorías**

```typescript
// Implementar caché para categorías (pocas y estables)
let categoriesCache: BusinessCategory[] | null = null;

async function getCachedCategories() {
	if (!categoriesCache) {
		categoriesCache = await getCategories();
	}
	return categoriesCache;
}
```

### **3. Filtrado y Búsqueda**

```typescript
// Extensión futura: búsqueda de categorías
async function searchCategories(query: string) {
	return prisma.businessCategory.findMany({
		where: {
			OR: [
				{ name: { contains: query, mode: "insensitive" } },
				{ description: { contains: query, mode: "insensitive" } },
			],
		},
	});
}
```

### **4. Categorías Predeterminadas**

```typescript
// Seed data para categorías comunes
const defaultCategories = [
	{ name: "Restaurantes", description: "Establecimientos de comida y bebida" },
	{ name: "Tiendas de Ropa", description: "Boutiques y tiendas de vestimenta" },
	{ name: "Tecnología", description: "Tiendas de productos tecnológicos" },
	{ name: "Salud", description: "Farmacias, clínicas y centros de salud" },
	{
		name: "Educación",
		description: "Institutos, academias y centros educativos",
	},
];
```

---

## Testing

### **Tests Unitarios Recomendados**

```typescript
describe("Categories Service", () => {
	test("should get all categories", async () => {
		const categories = await getCategories();
		expect(Array.isArray(categories)).toBe(true);
	});

	test("should create category with valid data", async () => {
		const categoryData = {
			name: "Test Category",
			description: "Test description",
		};

		const category = await createCategory(categoryData);
		expect(category.name).toBe(categoryData.name);
		expect(category.id).toBeDefined();
	});

	test("should throw error for invalid category ID", async () => {
		await expect(getCategoryById("invalid-id")).rejects.toThrow(
			"Category not found"
		);
	});
});
```

### **Tests de Integración**

```typescript
describe("Categories Routes", () => {
	test("GET /categories should return all categories", async () => {
		const response = await request(app).get("/categories");
		expect(response.status).toBe(200);
		expect(Array.isArray(response.body)).toBe(true);
	});

	test("POST /categories should require admin auth", async () => {
		const response = await request(app)
			.post("/categories")
			.send({ name: "Test" });

		expect(response.status).toBe(401);
	});
});
```

---

## Configuración y Despliegue

### **Variables de Entorno**

No requiere variables específicas adicionales, utiliza la configuración de base de datos existente.

### **Migraciones**

```sql
-- Migración inicial para tabla business_category
CREATE TABLE business_category (
  id VARCHAR(25) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Índice para búsquedas por nombre
CREATE INDEX idx_business_category_name ON business_category(name);
```

### **Seed Data**

```typescript
// Script de seed para categorías iniciales
async function seedCategories() {
	const categories = [
		{
			name: "Restaurantes",
			description: "Establecimientos de comida y bebida",
		},
		{ name: "Retail", description: "Tiendas y comercios al por menor" },
		{ name: "Servicios", description: "Empresas de servicios profesionales" },
	];

	for (const category of categories) {
		await prisma.businessCategory.upsert({
			where: { name: category.name },
			update: {},
			create: category,
		});
	}
}
```

---

Este módulo proporciona una base sólida para la gestión de categorías de negocios, con una API REST completa, validaciones robustas y consideraciones de seguridad apropiadas para un sistema de producción.
