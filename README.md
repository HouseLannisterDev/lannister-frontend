# lannister-frontend
# 🚀 Proyecto

## 📌 Estructura de Ramas en Git

Para garantizar un desarrollo organizado y eficiente, utilizamos **Git Flow** como estrategia de control de versiones. Este flujo nos permite mantener la estabilidad del código en producción mientras facilitamos el desarrollo de nuevas funcionalidades.

---

## 🔹 Ramas Principales (Persistentes)
Estas ramas **nunca se eliminan** y representan los estados clave del proyecto.

### `main` (Producción)
✅ Contiene la versión estable y en producción del sistema.
✅ Solo se actualiza mediante **merge desde `develop`** cuando se lanza una versión final.
✅ No se realizan desarrollos directos en esta rama.

```sh
# Fusionar cambios de develop a main cuando una versión está lista
git checkout main
git merge develop
```

---

### `develop` (Desarrollo)
✅ Contiene el código en desarrollo y pruebas.
✅ Recibe los cambios de las ramas `feature/*`.
✅ Se mantiene siempre funcional para evitar bloqueos en el equipo.

```sh
# Crear una nueva rama de desarrollo desde develop
git checkout develop
```

---

## 🌱 Ramas Temporales (Se eliminan al finalizar)
Estas ramas son **temporales** y se crean según la necesidad.

### `feature/*` (Nuevas Funcionalidades)
📌 Se crean desde `develop` para desarrollar nuevas funcionalidades.
📌 Una vez terminadas, se fusionan en `develop` y se eliminan.

```sh
# Crear una nueva rama para una funcionalidad
git checkout develop
git checkout -b feature/nueva-funcionalidad
```

Después de finalizar el desarrollo:
```sh
git checkout develop
git merge feature/nueva-funcionalidad
git branch -d feature/nueva-funcionalidad
```

---

### `hotfix/*` (Correcciones Urgentes en Producción)
📌 Se crean desde `main` para corregir errores críticos.
📌 Se fusionan en `main` y `develop` y luego se eliminan.

```sh
# Crear una rama hotfix para corregir un error crítico
git checkout main
git checkout -b hotfix/fix-login
```

Después de aplicar el fix:
```sh
git checkout main
git merge hotfix/fix-login
git checkout develop
git merge hotfix/fix-login
git branch -d hotfix/fix-login
```

---

## 🎯 Resumen Visual del Flujo de Ramas
```plaintext
  main  <-- (Código estable y en producción)
   │
   ├── develop  <-- (Código en desarrollo)
   │      │
   │      ├── feature/nueva-funcionalidad  <-- (Rama para nuevas funcionalidades)
   │      │
   │      ├── feature/otra-funcionalidad
   │
   ├── release/v1.0.0  <-- (Preparación de versión para producción)
   │
   ├── hotfix/fix-crash  <-- (Corrección urgente en producción)
```

---

## 🔥 Beneficios de esta forma de trabajo:
✅ **Organización clara:** Cada tipo de cambio tiene su propia rama.
✅ **Menos errores en producción:** Se prueban los cambios antes de fusionarlos en `main`.
✅ **Trabajo en equipo optimizado:** Varios desarrolladores pueden trabajar simultáneamente.
✅ **Facilidad para revertir cambios:** Si un error se introduce, se puede volver a una versión estable fácilmente.

---

## 📝 Reglas Generales del Equipo
📌 **Nunca** hagas commits directamente en `main` o `develop`.
📌 Cada feature, fix o release debe estar en su propia rama.
📌 Usa nombres descriptivos para las ramas (`feature/login`, `hotfix/fix-email`).
📌 Antes de hacer un merge, asegúrate de actualizar tu rama con los últimos cambios de `develop`.

```sh
git pull origin develop
```

📌 Realiza **Pull Requests** en GitHub antes de fusionar cambios en `develop`.
📌 Usa `git tag` para marcar versiones en producción (`v1.0.0`).

---
