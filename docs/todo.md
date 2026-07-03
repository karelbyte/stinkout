# Stinkout — TODO (Completado)

## ✅ 1. Moderación (Admin Panel)
- Panel protegido para admin en `/admin/reviews`
- Endpoint: `PATCH /api/admin/reviews/[id]` (aprobar/rechazar)
- Endpoint: `DELETE /api/admin/evidence/[id]` (eliminar evidencia)
- Primer usuario registrado es admin automáticamente
- Enlace "Admin" en Header para usuarios admin

## ✅ 2. Perfil de Company
- Página `/companies/[id]` con info, rating, reviews y evidencia
- Endpoint: `GET /api/companies/[id]`
- Companies enlazadas desde search y recruiter profile

## ✅ 3. Mejoras UI/UX
- `DELETE /api/reviews/[id]` — borrar review propio
- `PATCH /api/reviews/[id]` — editar review propio
- Previsualización inline de imágenes con lightbox (click para fullscreen)
- Paginación y sorting en API de reviews (`?sort=`, `?limit=`, `?offset=`)
- Botón "Delete" en reviews del usuario autenticado

## ✅ 4. Perfil de Usuario
- Página `/profile` con historial de reviews del usuario
- Enlace al perfil desde Header (nombre de usuario clickeable)
- Endpoint: `?userId=` en GET /api/reviews

## ✅ 5. Seguridad
- Límite de 10MB por archivo en uploads
- Validación de tipos: solo imágenes, PDF, TXT, EML
- Backend validation en POST /api/reviews y POST /api/evidence

## ✅ 6. Build Final
- `npm run lint` — 0 errores, 0 warnings
- `npm run build` — exitoso, 19 rutas
- README actualizado
