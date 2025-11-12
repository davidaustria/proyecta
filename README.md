# Sistema de Proyección de Ingresos - POC

Prueba de concepto para un sistema de proyección de ingresos construido con tecnologías modernas del ecosistema Laravel.

## Stack Técnico

### Backend
- **Laravel 12.x** - Framework PHP moderno
- **Inertia.js v2** - Adaptador para aplicaciones monolíticas con experiencia SPA
- **Laravel Fortify** - Sistema de autenticación headless
- **Laravel Wayfinder** - Generación de rutas type-safe para frontend
- **Pest** - Framework de testing expresivo

### Frontend
- **React 19** - Biblioteca de UI con React Compiler
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Framework de estilos utility-first
- **Radix UI** - Componentes primitivos accesibles
- **Lucide React** - Iconos modernos

### Base de Datos
- **SQLite** (desarrollo)
- **MySQL/SQL Server** (producción)

### Herramientas de Desarrollo
- **Vite** - Build tool y servidor de desarrollo
- **Laravel Pint** - Formateador de código PHP
- **ESLint + Prettier** - Linting y formateo de código JS/TS
- **Laravel Boost** - Herramientas de desarrollo avanzadas via MCP

## Instalación

### Requisitos Previos
- PHP 8.2 o superior
- Composer
- Node.js 18+ y npm
- Base de datos (SQLite para desarrollo, MySQL/SQL Server para producción)

### Configuración Rápida

```bash
# Clonar el repositorio
git clone <repository-url>
cd proyecta

# Configurar el proyecto (instala dependencias, genera claves, ejecuta migraciones)
composer setup

# O paso por paso:
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm install
npm run build
```

### Configuración del Entorno

1. Edita el archivo `.env` con tus credenciales de base de datos:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=proyecta
DB_USERNAME=root
DB_PASSWORD=
```

2. Configura las opciones de la aplicación:

```env
APP_NAME="Proyecta"
APP_URL=http://localhost:8000
```

## Uso

### Modo Desarrollo

Ejecuta el servidor de desarrollo con hot-reload:

```bash
# Inicia servidor PHP, cola de trabajos y Vite simultáneamente
composer run dev
```

Esto iniciará:
- Servidor Laravel en `http://localhost:8000`
- Cola de trabajos (queue listener)
- Vite dev server con hot-reload

### Comandos Útiles

```bash
# Testing
composer test                    # Ejecutar todos los tests
php artisan test --filter=name   # Ejecutar test específico

# Code Quality
vendor/bin/pint                  # Formatear código PHP
npm run lint                     # Linter para JS/TS
npm run format                   # Formatear código JS/TS

# Build
npm run build                    # Build de producción
npm run build:ssr               # Build con SSR (renderizado del lado del servidor)

# Database
php artisan migrate              # Ejecutar migraciones
php artisan migrate:fresh --seed # Reset database y poblar con datos
php artisan tinker              # REPL de Laravel
```

## Estructura del Proyecto

```
proyecta/
├── app/
│   ├── Actions/           # Lógica de negocio (Fortify actions)
│   ├── Http/
│   │   ├── Controllers/   # Controladores de la aplicación
│   │   └── Requests/      # Form Requests para validación
│   ├── Models/            # Modelos Eloquent
│   └── Providers/         # Service providers
├── bootstrap/
│   ├── app.php           # Configuración de la aplicación
│   └── providers.php     # Registro de providers
├── database/
│   ├── factories/        # Model factories
│   ├── migrations/       # Migraciones de base de datos
│   └── seeders/          # Seeders
├── resources/
│   ├── js/
│   │   ├── actions/      # Wayfinder actions (generado)
│   │   ├── components/   # Componentes React reutilizables
│   │   ├── Pages/        # Páginas Inertia (vistas)
│   │   └── routes/       # Wayfinder routes (generado)
│   └── css/              # Estilos globales
├── routes/
│   ├── web.php           # Rutas web
│   └── console.php       # Comandos de consola
└── tests/
    ├── Feature/          # Tests de integración
    └── Unit/             # Tests unitarios
```

## Modelos Principales

- **User** - Usuario del sistema

> **Nota**: Los modelos de negocio principales (Revenue/Ingreso, Projection/Proyección) serán definidos durante el desarrollo de la POC.

## Convenciones de Desarrollo

### Backend (Laravel)
- Usar **Form Requests** para toda validación de formularios
- Usar **Resources** (API Resources) para transformar datos en respuestas API
- Preferir **Eloquent relationships** sobre queries raw o joins manuales
- Prevenir problemas N+1 con **eager loading** (`with()`)
- Usar **named routes** para generación de URLs
- Nunca usar `env()` fuera de archivos de configuración
- Tests con **Pest** siguiendo sintaxis expresiva

### Frontend (React + TypeScript)
- Usar **Wayfinder** para todas las rutas (type-safe)
- Componentes funcionales con **TypeScript**
- Usar **Inertia Forms** (`<Form>` component) para formularios
- Estilos con **Tailwind CSS** (v4, configuración CSS-first)
- Usar **gap utilities** en lugar de margins para espaciado
- Componentes Radix UI para elementos interactivos accesibles
- Mantener dark mode consistente con `dark:` prefix

### Code Quality
- Ejecutar `vendor/bin/pint` antes de commits (PHP)
- Ejecutar `npm run format` antes de commits (JS/TS)
- Escribir tests para toda funcionalidad nueva
- Documentar código complejo con PHPDoc

## Testing

Este proyecto usa **Pest** para testing. Todos los tests están en el directorio `tests/`.

### Escribir Tests

```php
// tests/Feature/ExampleTest.php
it('creates a user successfully', function () {
    $response = $this->postJson('/api/users', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ]);

    $response->assertSuccessful();
    expect($response->json('data.name'))->toBe('John Doe');
});
```

### Ejecutar Tests

```bash
# Todos los tests
composer test

# Test específico
php artisan test tests/Feature/ExampleTest.php

# Con filtro
php artisan test --filter=creates_user
```

## Autenticación

El proyecto usa **Laravel Fortify** para autenticación headless. Características habilitadas:

- Registro de usuarios
- Login/Logout
- Reset de contraseña
- Verificación de email (opcional)
- Two-factor authentication (opcional)

Personaliza el comportamiento en [app/Providers/FortifyServiceProvider.php](app/Providers/FortifyServiceProvider.php).

## Deployment

### Build de Producción

```bash
# Instalar dependencias
composer install --optimize-autoloader --no-dev
npm ci

# Build assets
npm run build

# Optimizar Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Variables de Entorno Importantes

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tudominio.com

# Configurar base de datos de producción
DB_CONNECTION=mysql
DB_HOST=tu-host
DB_DATABASE=tu-database
DB_USERNAME=tu-usuario
DB_PASSWORD=tu-password-seguro

# Cache y sesiones
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
```

## Roadmap

- [ ] Definir modelos de negocio (Revenue, Projection)
- [ ] Implementar cálculo de proyecciones
- [ ] Dashboard de visualización
- [ ] API endpoints para integración
- [ ] Reportes y exportación de datos
- [ ] Sistema de permisos y roles (opcional)

## Soporte y Documentación

- [Documentación Laravel 12](https://laravel.com/docs/12.x)
- [Documentación Inertia.js](https://inertiajs.com)
- [Documentación React](https://react.dev)
- [Documentación Tailwind CSS](https://tailwindcss.com)

## Licencia

Este proyecto está bajo la licencia MIT.
