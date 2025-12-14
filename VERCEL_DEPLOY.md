# 🚀 Vercel Deployment Guide - LlegaPO

## ✅ Pre-requisitos Cumplidos
- ✅ `playwright-chromium` instalado
- ✅ APIs optimizadas para serverless
- ✅ Error handling implementado
- ✅ TypeScript build funcionando
- ✅ Configuración de Vercel lista

## 🔧 1. Variables de Entorno en Vercel

Ve a tu **Dashboard de Vercel** → **Settings** → **Environment Variables**

Agrega estas variables para **Production**, **Preview** y **Development**:

| Variable | Value | Descripción |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Modo de producción |
| `PLAYWRIGHT_HEADLESS` | `true` | Browser sin interfaz |
| `PLAYWRIGHT_TIMEOUT` | `25000` | Timeout optimizado para Vercel |
| `PLAYWRIGHT_FORCE_TTY` | `1` | Optimización para CI |

## 🚀 2. Deploy desde GitHub (Recomendado)

### Paso 1: Push tu código
```bash
git add .
git commit -m "Ready for Vercel deployment with Playwright"
git push origin main
```

### Paso 2: Conectar en Vercel
1. Ve a https://vercel.com/dashboard
2. Click **"New Project"**
3. **Import** tu repositorio de GitHub
4. Agrega las **variables de entorno** (paso 1)
5. Click **"Deploy"**

## 🚀 3. Deploy desde CLI (Alternativo)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🧪 4. Testing Después del Deploy

```bash
# Reemplaza con tu URL de Vercel
export VERCEL_URL="https://tu-app.vercel.app"

# Test APIs
curl "$VERCEL_URL/api/deviations"
curl "$VERCEL_URL/api/metro-status"  
curl "$VERCEL_URL/api/tarifas"
```

**Respuesta esperada:**
```json
{"success":true,"data":[...]}
```

## ⚡ 5. Configuración de Vercel (vercel.json)

El archivo `vercel.json` ya está creado con:
- ⏰ **Timeouts**: 30 segundos para APIs de scraping
- 🏎️ **Cache**: 5 minutos con revalidación
- 🌐 **CORS**: Configurado para APIs públicas

## 🚨 6. Troubleshooting

### Error: Function Timeout
**Síntoma**: APIs fallan después de 10 segundos
**Solución**: 
- Upgrade a **Vercel Pro** ($20/mes) para 60s timeout
- O implementar cache más agresivo

### Error: Memory Limit
**Síntoma**: "Function exceeded memory limit"
**Solución**:
- Upgrade a **Vercel Pro** (3GB memory)
- Ya optimizado con `--single-process`

### Error: Cold Start Lento
**Síntoma**: Primera request muy lenta (5-10s)
**Solución**: Normal en serverless, requests siguientes serán rápidas

## 📊 7. Monitoreo

### En Vercel Dashboard:
- **Functions** → Ver logs de ejecución
- **Analytics** → Performance metrics
- **Speed Insights** → Tiempos de respuesta

### Health Check Manual:
```bash
curl -w "@-" -o /dev/null -s "$VERCEL_URL/api/deviations" <<'EOF'
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF
```

## 🎯 8. Checklist de Deployment

- [ ] **Variables de entorno** configuradas en Vercel
- [ ] **Repositorio** conectado a Vercel  
- [ ] **Build** exitoso (sin errores de TypeScript)
- [ ] **Deploy** completado
- [ ] **APIs testeadas** en producción
- [ ] **Performance** verificado (<10s response time)
- [ ] **Monitoreo** configurado en dashboard

## 📈 9. Optimizaciones Post-Deploy

### Cache Headers (Ya implementado)
- APIs cachan respuestas por 5 minutos
- Reduce requests a sitios externos
- Mejora performance general

### Rate Limiting (Opcional)
Si tienes mucho tráfico, considera implementar:
```typescript
// En cada API route
const RATE_LIMIT = 100; // requests por minuto
// Implementar con Upstash Redis o similar
```

## 🔗 10. URLs Importantes

- **Dashboard**: https://vercel.com/dashboard
- **Analytics**: Tu proyecto → Analytics
- **Logs**: Tu proyecto → Functions → View Function Logs
- **Environment Variables**: Tu proyecto → Settings → Environment Variables

---

## 🎉 ¡Listo para Producción!

Tu aplicación está configurada correctamente para Vercel. Los endpoints de scraping con Playwright funcionarán sin problemas en el entorno serverless.

**URLs de tu aplicación:**
- 🏠 **Frontend**: `https://tu-app.vercel.app`
- 🚌 **Desvíos**: `https://tu-app.vercel.app/api/deviations`
- 🚇 **Metro**: `https://tu-app.vercel.app/api/metro-status`
- 💰 **Tarifas**: `https://tu-app.vercel.app/api/tarifas`

¡Happy deploying! 🚀