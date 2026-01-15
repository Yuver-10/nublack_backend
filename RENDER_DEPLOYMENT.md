# Guía de Deploy en Render

## Pasos para desplegar en Render:

### 1. Crear cuenta en Render
- Ve a https://render.com
- Crea una cuenta con GitHub
- Conecta tu repositorio de GitHub

### 2. Crear nuevo Web Service
- Click en "New" → "Web Service"
- Conecta tu repositorio `nublack_backend`
- Elige:
  - **Name**: `nublack-api`
  - **Runtime**: Node
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Plan**: Free (o Starter según necesites)

### 3. Configurar Variables de Entorno
En el dashboard de Render, ve a **Environment**:

```
NODE_ENV=production
DB_HOST=nublack12.com
DB_USER=u335522532_nublack12
DB_PASS=1005568473Oscar@
DB_NAME=u335522532_nublack
DB_PORT=3306
JWT_SECRET=genera_un_valor_seguro_aqui
CORS_ORIGIN=https://tu-frontend.onrender.com
EMAIL_USER=antoniodjromana@gmail.com
EMAIL_PASS=nnbx gfzs kjwo kfdj
EMAIL_FROM="NUBLACK Store" <antoniodjromana@gmail.com>
```

### 4. Permisos de Hostinger
**IMPORTANTE**: Hostinger bloquea conexiones remotas. Debes:
1. Ir a cPanel de Hostinger
2. Buscar "MySQL Remote" o "Remote Database Access"
3. Agregar la IP de Render o permitir todas: `%`

Para obtener la IP de Render:
- Después de crear el servicio, ve a **Settings**
- Busca "Outbound IP Address"
- Agrégala en Hostinger

### 5. Deploy
- Render detectará cambios en GitHub automáticamente
- O click en "Deploy" en el dashboard

## URLs de tu API
```
Producción: https://nublack-api.onrender.com
```

## Monitoreo
- Ve a **Logs** en Render para ver errores
- Render reinicia la app si falla

## Troubleshooting

**Error: ETIMEDOUT**
- Verifica que Hostinger permita conexiones remotas
- Confirma que las credenciales sean correctas

**Error: Database not found**
- Asegúrate de que la DB existe en Hostinger
- Ejecuta el script SQL en Hostinger cPanel

**Error: CORS bloqueado**
- Actualiza CORS_ORIGIN con tu dominio frontend real
- Formato: `https://tu-dominio.com` (sin trailing slash)
