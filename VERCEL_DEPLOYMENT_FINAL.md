# 🚀 Vercel Deployment Guide - LlegaPO (Final)

## ✅ Configuración Optimizada Final

Esta guía cubre el deployment de LlegaPO en Vercel usando **playwright-core + @sparticuz/chromium-min + Remote Chromium Binary**.

### 🎯 **Solución Implementada:**
- **playwright-core**: Runtime ligero de Playwright
- **@sparticuz/chromium-min**: Chromium optimizado para serverless
- **Remote Binary**: Ejecutable remoto para evitar problemas de bundle

## 🔧 Variables de Entorno en Vercel

Ve a tu **Dashboard de Vercel** → **Settings** → **Environment Variables**

### **Variables Obligatorias:**

| Variable | Value | Scope | Descripción |
|----------|-------|-------|-------------|
| `NODE_ENV` | `production` | Production | Modo de producción |
| `PLAYWRIGHT_HEADLESS` | `true` | Production, Preview, Development | Browser sin interfaz |
| `CHROMIUM_REMOTE_EXEC_PATH` | `https://github.com/Sparticuz/chromium/releases/download/v141.0.0/chromium-v141.0.0-pack.tar.br` | Production, Preview | **Ejecutable remoto de Chromium** |

### **Variables Opcionales:**

| Variable | Value | Scope | Descripción |
|----------|-------|-------|-------------|
| `PLAYWRIGHT_TIMEOUT` | `25000` | Production, Preview, Development | Timeout optimizado |
| `PLAYWRIGHT_FORCE_TTY` | `1` | Production, Preview | Optimización para CI |

## 🏗️ **Arquitectura de la Solución**

```
Vercel Serverless Function
├── playwright-core (Motor de automatización)
├── @sparticuz/chromium-min (Configuración optimizada)
└── Remote Chromium Binary (Ejecutable desde GitHub)
    ├── URL: github.com/Sparticuz/chromium/releases/
    ├── Versión: v141.0.0
    ├── Formato: chromium-v141.0.0-pack.tar.br
    └── Beneficio: No requiere binarios locales
```

## 🚀 **Proceso de Deployment**

### **1. Preparación del Código**

```bash
# Verificar dependencias están correctas
cat package.json | grep -E "(playwright-core|@sparticuz/chromium-min)"
# Debería mostrar:
# "playwright-core": "^1.57.0"
# "@sparticuz/chromium-min": "^143.0.0"

# Build local para verificar
bun run build
```

### **2. Configurar Variables de Entorno**

En el Dashboard de Vercel:
1. Ve a tu proyecto → **Settings** → **Environment Variables**
2. Agrega las variables obligatorias para **Production**, **Preview** y **Development**
3. **IMPORTANTE**: La variable `CHROMIUM_REMOTE_EXEC_PATH` es clave

### **3. Deploy desde GitHub (Recomendado)**

```bash
# Commit final
git add .
git commit -m "Final setup: playwright-core + remote Chromium for Vercel"
git push origin main

# Vercel detectará automáticamente los cambios y hará deploy
```

### **4. Deploy desde CLI (Alternativo)**

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Deploy
vercel --prod
```

## 🧪 **Testing Post-Deploy**

### **Test Manual de APIs:**

```bash
# Reemplaza con tu URL de Vercel
export VERCEL_URL="https://tu-app.vercel.app"

# Test Desvíos
curl "$VERCEL_URL/api/deviations" | head -c 100

# Test Metro Status  
curl "$VERCEL_URL/api/metro-status" | head -c 100

# Test Tarifas
curl "$VERCEL_URL/api/tarifas" | head -c 100
```

### **Respuesta Esperada:**
```json
{"success":true,"data":[...]}
```

### **En caso de error:**
```json
{"success":false,"error":"..."}
```

## ⚡ **Optimizaciones Implementadas**

### **1. Remote Binary Benefits:**
- ✅ **No bundle issues**: Evita problemas de `/var/task/` en Vercel
- ✅ **Lighter deployment**: No incluye binarios en el bundle
- ✅ **Better cold start**: Descarga bajo demanda
- ✅ **Version control**: Versión específica y estable

### **2. Chromium-min Benefits:**
- ✅ **Optimized for serverless**: Específico para environments como Vercel
- ✅ **Smaller footprint**: Menos memoria y CPU
- ✅ **Better compatibility**: Maneja paths serverless correctamente

### **3. Playwright-core Benefits:**
- ✅ **No browser bundling**: Solo el runtime, no navegadores
- ✅ **Better performance**: Más rápido que Playwright completo
- ✅ **Smaller bundle**: Reduce tamaño del deployment

## 📊 **Configuración de vercel.json**

El archivo `vercel.json` ya está optimizado:

```json
{
  "functions": {
    "app/api/deviations/route.ts": { "maxDuration": 30 },
    "app/api/metro-status/route.ts": { "maxDuration": 30 },
    "app/api/tarifas/route.ts": { "maxDuration": 30 }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, s-maxage=300, stale-while-revalidate=600" },
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

## 🚨 **Troubleshooting Común**

### **Error: "Executable doesn't exist"**
**Causa**: Remote binary no se descarga correctamente
**Solución**: 
1. Verificar variable `CHROMIUM_REMOTE_EXEC_PATH` en Vercel
2. Asegurar conexión a GitHub desde Vercel
3. Probar con versión diferente del binary

### **Error: "Function timeout"**
**Causa**: Cold start + descarga de binary toma mucho tiempo
**Solución**: 
1. Upgrade a Vercel Pro (60s timeout)
2. Implementar cache más agresivo
3. Usar binary local en development

### **Error: "Memory limit exceeded"**
**Causa**: Chromium usa mucha memoria
**Solución**: 
1. Upgrade a Vercel Pro (3GB memory)
2. Ya optimizado con `--single-process`
3. Usar `chromium-min` (ya implementado)

### **Error: "Network timeout downloading binary"**
**Causa**: Vercel no puede descargar el binary remoto
**Solución**: 
1. Verificar URL del binary está accesible
2. Probar con mirror alternativo
3. Contactar soporte de Vercel si persiste

## 📈 **Monitoreo y Performance**

### **En Vercel Dashboard:**
- **Functions**: Ver logs de cada API call
- **Analytics**: Métricas de performance
- **Speed Insights**: Tiempos de respuesta

### **Métricas Esperadas:**
- **Cold Start**: 3-8 segundos (primera request)
- **Warm Requests**: 1-3 segundos
- **Memory Usage**: ~200-500MB por función
- **Success Rate**: >95%

### **Health Check Script:**
```bash
#!/bin/bash
VERCEL_URL="https://tu-app.vercel.app"

echo "🧪 Testing LlegaPO APIs..."

for endpoint in deviations metro-status tarifas; do
  echo "Testing /api/$endpoint..."
  response=$(curl -s "$VERCEL_URL/api/$endpoint")
  if echo "$response" | grep -q '"success":true'; then
    echo "✅ $endpoint OK"
  else
    echo "❌ $endpoint FAILED"
    echo "$response" | head -c 200
  fi
done
```

## 🎯 **Checklist Final de Deployment**

- [ ] **Dependencies actualizadas**: playwright-core + @sparticuz/chromium-min
- [ ] **Variables de entorno configuradas** en Vercel Dashboard
- [ ] **Remote binary URL configurada** correctamente
- [ ] **Build local exitoso** sin errores
- [ ] **vercel.json optimizado** para timeouts y cache
- [ ] **APIs probadas localmente** antes del deploy
- [ ] **Repositorio conectado** a Vercel
- [ ] **Deploy completado** exitosamente
- [ ] **APIs probadas en producción** post-deploy
- [ ] **Monitoreo configurado** en dashboard
- [ ] **Health checks implementados**

## 📱 **URLs Finales**

Después del deployment exitoso:

- 🏠 **Frontend**: `https://tu-app.vercel.app`
- 🚌 **Desvíos**: `https://tu-app.vercel.app/api/deviations`
- 🚇 **Metro**: `https://tu-app.vercel.app/api/metro-status`
- 💰 **Tarifas**: `https://tu-app.vercel.app/api/tarifas`

## 🔗 **Referencias Útiles**

- [Sparticuz Chromium Releases](https://github.com/Sparticuz/chromium/releases)
- [Playwright Core Docs](https://playwright.dev/docs/library)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Environment Variables Vercel](https://vercel.com/docs/projects/environment-variables)

---

## 🎉 **¡Deployment Exitoso!**

Tu aplicación está configurada con la **mejor solución posible** para scraping en Vercel:
- ✅ **Sin problemas de binarios locales**
- ✅ **Optimizada para serverless**
- ✅ **Cache inteligente implementado**
- ✅ **Monitoreo y error handling**

**¡Happy scraping! 🚀**