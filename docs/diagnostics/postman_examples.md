# Colección de Pruebas Postman - NUBLACK API

URL Base: `http://localhost:3001/api`

---

## 📧 SECCIÓN: NOTIFICACIONES (NUEVO)
### 1. Confirmación de Compra
- **Automático**: Al crear una orden (`POST /orders`), el cliente recibirá un email detallado con su número de pedido y total.

---

## 🛒 SECCIÓN: CARRITO (NUEVO)

### 1. Ver mi Carrito
- **Método:** `GET`
- **URL:** `/cart`
- **Auth:** *Bearer Token de Cliente*

### 2. Añadir al Carrito
- **Método:** `POST`
- **URL:** `/cart`
- **Body:**
```json
{
  "producto_id": 1,
  "cantidad": 2,
  "talla": "L"
}
```

### 3. Eliminar del Carrito
- **Método:** `DELETE`
- **URL:** `/cart/:id_carrito`

---

## 🔒 SECCIÓN: ADMINISTRADOR
...
