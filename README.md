# NCP Tickets

Sistema de gestión y seguimiento de tickets para NCP Inversiones Oeding.

## Estructura del Proyecto

```
NCP_TICKETS/
├── backend/                  # API REST con FastAPI, SQLAlchemy y PostgreSQL
│   ├── alembic/              # Migraciones de base de datos
│   ├── app/                  # Código de la aplicación (endpoints, modelos, schemas, core)
│   ├── requirements.txt      # Dependencias de Python
│   └── .env.example          # Plantilla de variables de entorno backend
├── frontend/                 # Aplicación web SPA con React, TypeScript y Vite
│   ├── src/                  # Componentes, vistas, servicios y estado
│   ├── package.json          # Dependencias y scripts de Node.js
│   └── .env.example          # Plantilla de variables de entorno frontend
├── Documentacion_Backend_NCP_Tickets.pdf # Documentación detallada del backend
└── README.md
```

## Requisitos Previos

- **Node.js**: v18 o superior
- **Python**: v3.10 o superior
- **PostgreSQL**: Base de datos relacional (o servicio como Neon)

---

## Configuración y Ejecución

### 1. Backend

1. Entra en la carpeta del backend:
   ```bash
   cd backend
   ```

2. Crea y activa un entorno virtual:
   ```bash
   python -m venv venv
   # En Windows:
   venv\Scripts\activate
   # En Linux / macOS:
   source venv/bin/activate
   ```

3. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```

4. Configura el archivo `.env`:
   ```bash
   cp .env.example .env
   ```
   Ajusta las credenciales de base de datos y llaves secretas en `.env`.

5. Ejecuta las migraciones de base de datos:
   ```bash
   alembic upgrade head
   ```

6. Inicia el servidor de desarrollo:
   ```bash
   uvicorn app.main:app --reload
   ```
   La documentación interactiva estará disponible en `http://localhost:8000/docs`.

---

### 2. Frontend

1. Entra en la carpeta del frontend:
   ```bash
   cd frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura el archivo `.env`:
   ```bash
   cp .env.example .env
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   La aplicación web estará disponible en `http://localhost:5173`.
