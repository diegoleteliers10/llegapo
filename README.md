<div align="center">
  <img src="public/iconLlega.png" alt="Llega Po' Logo" width="200" height="auto">
  
  # 🚌 Llega Po'
  
  **La forma más fácil de saber cuándo llega tu micro en Santiago** 🇨🇱
  
  ![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
  
  [🚀 Demo en Vivo](#) • [📖 Documentación](#instalación) • [🐛 Reportar Bug](../../issues)
  
  <img src="https://via.placeholder.com/800x400/1a1a1a/ffffff?text=Screenshot+Coming+Soon" alt="App Screenshot" width="100%" style="border-radius: 10px; margin: 20px 0;">
</div>

---

## ✨ Características

🚌 **Búsqueda en tiempo real** - Consulta cuándo llega tu micro por paradero y servicio  
🚇 **Estado del Metro** - Revisa alteraciones de todas las líneas al instante  
⚠️ **Desvíos actualizados** - Mantente informado de los cambios de recorrido  
🌤️ **Clima de Santiago** - Sabe si necesitas paraguas antes de salir  
📍 **Mapas de recorridos** - Visualiza todas las paradas de tu línea favorita  
💾 **Búsquedas recientes** - Acceso rápido a tus paraderos más consultados  

---

## 🚀 Demo Rápida

```bash
# Clona el repositorio
git clone https://github.com/tu-usuario/llegapo.git

# Instala dependencias
cd llegapo && npm install

# Inicia el servidor de desarrollo
npm run dev

# ¡Abre http://localhost:3000 y listo! 🎉
```

---

## 🛠️ Tecnologías

| Frontend | Backend | Herramientas |
|----------|---------|--------------|
| ⚛️ **React 18** | 🔧 **Next.js API Routes** | 🎨 **Tailwind CSS** |
| 📘 **TypeScript** | 🤖 **Puppeteer (Scraping)** | 🗺️ **MapLibre GL** |
| ⚡ **TanStack Query** | 🌐 **Open-Meteo API** | 📦 **Vercel Deploy** |
| 📱 **Mobile First** | 🔄 **ISR & SSR** | 🔍 **ESLint & Prettier** |

---

## 📱 Capturas de Pantalla

<details>
<summary>📱 Móvil (Click para expandir)</summary>

| Inicio | Búsqueda | Estado Metro |
|--------|----------|--------------|
| <img src="https://via.placeholder.com/300x600/1a1a1a/ffffff?text=Home+Mobile" width="200"> | <img src="https://via.placeholder.com/300x600/1a1a1a/ffffff?text=Search+Mobile" width="200"> | <img src="https://via.placeholder.com/300x600/1a1a1a/ffffff?text=Metro+Mobile" width="200"> |

</details>

<details>
<summary>💻 Desktop (Click para expandir)</summary>

| Dashboard | Mapa de Recorridos |
|-----------|-------------------|
| <img src="https://via.placeholder.com/600x400/1a1a1a/ffffff?text=Dashboard+Desktop" width="400"> | <img src="https://via.placeholder.com/600x400/1a1a1a/ffffff?text=Route+Map+Desktop" width="400"> |

</details>

---

## ⚙️ Instalación

### Requisitos Previos
- 📦 **Node.js 18+**
- 🧶 **npm, yarn o pnpm**

### 🔧 Configuración

1. **Clona y configura el proyecto:**
```bash
git clone https://github.com/tu-usuario/llegapo.git
cd llegapo
npm install
```

2. **Crea tu archivo de configuración:**
```bash
cp .env.example .env.local
```

3. **¡Inicia el servidor!**
```bash
npm run dev
```

---

## 📖 Guía de Uso

### 🚌 Búsqueda de Micros

```typescript
// Busca por paradero
/busqueda?stop=PC205

// Busca servicio específico
/busqueda?stop=PC205&busId=502
```

### 🎯 Estados de la App

| Situación | Comportamiento |
|-----------|---------------|
| ❌ **Error de API** | Panel rojo: "Error al obtener datos" |
| 📭 **Sin datos** | Estado neutro: "No hay buses en camino" |
| ✅ **Con datos** | Lista de servicios con tiempos estimados |

### 💡 Tips Pro

- 🔄 **Auto-actualización cada 30 segundos**
- 💾 **Historial guardado localmente**
- 📱 **Optimizado para móviles**
- ⚡ **Carga instantánea con cache inteligente**

---

## 🏗️ Arquitectura

```
🏠 app/
├── 📄 page.tsx                    # Inicio (clima, metro, desvíos)
├── 🔍 busqueda/page.tsx           # Búsqueda de servicios
├── 🚇 estado-metro/page.tsx       # Estado del metro
├── 🗺️ recorrido/[code]/page.tsx   # Mapas de rutas
└── 🔌 api/                        # APIs internas (scraping)

📚 lib/
├── 🌐 api.ts                      # Cliente de datos
├── 🌤️ api/weather.ts              # Servicio de clima
└── 🎣 hooks/                      # React Query hooks

🎨 public/                         # Assets estáticos
```

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! 🎉

### 🐛 ¿Encontraste un bug?
1. [Abre un issue](../../issues/new?template=bug_report.md)
2. Describe el problema con detalles
3. Incluye capturas si es posible

### ✨ ¿Tienes una idea genial?
1. [Abre un feature request](../../issues/new?template=feature_request.md)
2. Explica tu propuesta
3. Discutamos juntos la implementación

### 🔧 ¿Quieres enviar código?
```bash
# Forkea el repo, clona tu fork y crea una rama
git checkout -b feature/mi-nueva-funcionalidad

# Haz tus cambios y asegúrate que compile
npm run build
npm run lint

# Envía tu Pull Request con una descripción clara
```

## 📈 Métricas

<div align="center">

![GitHub issues](https://img.shields.io/github/issues/tu-usuario/llegapo?style=flat-square)
![GitHub stars](https://img.shields.io/github/stars/tu-usuario/llegapo?style=flat-square)
![GitHub forks](https://img.shields.io/github/forks/tu-usuario/llegapo?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/tu-usuario/llegapo?style=flat-square)

</div>

---

## 🙏 Datos

- 🚌 **Red Movilidad** - Datos de transporte público
- 🌤️ **Open-Meteo** - API gratuita de clima
- 🎨 **Lucide Icons** - Iconografía hermosa
- 🗺️ **MapLibre** - Mapas open source
- 💚 **Vercel** - Hosting increíble

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

<div align="center">
  
  **¿Te gusta el proyecto? ¡Dale una ⭐ y compártelo!**
  
  Hecho con ❤️ en Santiago, Chile 🇨🇱
  
  [⬆ Volver arriba](#-llega-po)
  
</div>