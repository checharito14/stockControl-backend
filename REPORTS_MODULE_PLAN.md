# Plan de Implementación: Informes de Ventas con AWS S3

## 📋 Objetivo

Generar reportes automáticos de ventas (semanales y mensuales) y almacenarlos en AWS S3 para consulta y descarga.

---

## 🎯 Funcionalidades Requeridas

### **1. Generación de Reportes**
- ✅ Reporte semanal (lunes a domingo)
- ✅ Reporte mensual (primer día al último día del mes)
- ✅ Datos a incluir:
  - Total de ventas
  - Número de transacciones
  - Productos más vendidos
  - Ingresos brutos
  - Descuentos aplicados
  - Ticket promedio
  - Ventas por día

### **2. Almacenamiento en S3**
- ✅ Bucket dedicado para reportes
- ✅ Estructura de carpetas: `reports/{userId}/weekly/{year}/{week}.pdf`
- ✅ Estructura de carpetas: `reports/{userId}/monthly/{year}/{month}.pdf`
- ✅ Permisos privados (solo el usuario dueño puede acceder)

### **3. Generación de PDF**
- ✅ Formato profesional
- ✅ Logo/branding del negocio
- ✅ Gráficos (opcional)
- ✅ Tablas con datos

### **4. Programación Automática**
- ✅ Cron job para generar reportes automáticamente
- ✅ Semanal: Cada lunes a las 00:00
- ✅ Mensual: Primer día de cada mes a las 00:00

### **5. API Endpoints**
- ✅ `POST /reports/generate` - Generar reporte manual
- ✅ `GET /reports` - Listar reportes del usuario
- ✅ `GET /reports/:id/download` - Descargar reporte específico
- ✅ `GET /reports/weekly/:year/:week` - Obtener reporte semanal
- ✅ `GET /reports/monthly/:year/:month` - Obtener reporte mensual

---

## 🏗️ Arquitectura

### **Backend**
```
src/
  reports/
    reports.controller.ts
    reports.service.ts
    reports.module.ts
    dto/
      generate-report.dto.ts
    entities/
      report.entity.ts
    utils/
      pdf-generator.util.ts
      s3-uploader.util.ts
    cron/
      report-scheduler.cron.ts
```

### **Base de Datos**

#### **Report Entity**
```typescript
@Entity()
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 20 })
  type: 'weekly' | 'monthly'; // Tipo de reporte

  @Column({ type: 'int' })
  year: number; // 2025

  @Column({ type: 'int' })
  period: number; // Semana (1-52) o Mes (1-12)

  @Column({ type: 'date' })
  startDate: Date; // Fecha inicio del período

  @Column({ type: 'date' })
  endDate: Date; // Fecha fin del período

  @Column({ type: 'varchar', length: 500 })
  s3Key: string; // Ruta en S3: reports/1/weekly/2025/45.pdf

  @Column({ type: 'varchar', length: 1000, nullable: true })
  s3Url: string; // URL firmada (temporal)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalSales: number; // Total de ingresos

  @Column({ type: 'int' })
  transactionCount: number; // Número de ventas

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  averageTicket: number; // Ticket promedio

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  generatedAt: Date;

  // Relaciones
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
```

---

## 🔧 Tecnologías y Librerías

### **1. AWS S3**
```bash
npm install @aws-sdk/client-s3
npm install @aws-sdk/s3-request-presigner
```

### **2. Generación de PDF**
```bash
npm install pdfkit
npm install @types/pdfkit --save-dev
```

### **3. Cron Jobs**
```bash
npm install @nestjs/schedule
```

### **4. Date Utilities**
```bash
npm install date-fns
```

---

## 📊 Estructura del Reporte PDF

### **Cabecera**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         REPORTE DE VENTAS
     [Semanal/Mensual] - [Período]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### **Resumen Ejecutivo**
```
┌─────────────────────────────────────┐
│ Total de Ventas:      $12,345.67   │
│ Transacciones:        42            │
│ Ticket Promedio:      $294.18      │
│ Descuentos:           $1,234.56    │
│ Período:              01-07 Nov     │
└─────────────────────────────────────┘
```

### **Productos Más Vendidos**
```
┌─────────────────────────────────────────────┐
│ Top 5 Productos                             │
├─────────────────────────────────────────────┤
│ 1. Coca Cola 2L      50 uds    $1,250.00   │
│ 2. Papas Lays        35 uds    $875.00     │
│ 3. Pan Bimbo         30 uds    $600.00     │
│ 4. Leche Lala        25 uds    $625.00     │
│ 5. Agua Ciel         20 uds    $400.00     │
└─────────────────────────────────────────────┘
```

### **Ventas por Día**
```
┌─────────────────────────────────────────────┐
│ Desglose Diario                             │
├─────────────────────────────────────────────┤
│ Lunes    01/11    8 ventas     $2,450.00   │
│ Martes   02/11    6 ventas     $1,800.00   │
│ ...                                          │
└─────────────────────────────────────────────┘
```

---

## 🔐 Configuración AWS S3

### **Variables de Entorno**
```env
# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=stockcontrol-reports
```

### **Permisos IAM Necesarios**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::stockcontrol-reports/*"
    }
  ]
}
```

---

## 📅 Cron Jobs

### **Semanal (Cada Lunes 00:00)**
```typescript
@Cron('0 0 * * 1') // Lunes a medianoche
async generateWeeklyReports() {
  const users = await this.userRepository.find();
  
  for (const user of users) {
    await this.generateWeeklyReport(user.id);
  }
}
```

### **Mensual (Primer día del mes 00:00)**
```typescript
@Cron('0 0 1 * *') // Día 1 de cada mes
async generateMonthlyReports() {
  const users = await this.userRepository.find();
  
  for (const user of users) {
    await this.generateMonthlyReport(user.id);
  }
}
```

---

## 🔄 Flujo de Generación

```
1. Trigger (Cron o Manual)
   ↓
2. Obtener ventas del período
   ↓
3. Calcular estadísticas
   - Total ventas
   - Número transacciones
   - Productos top
   - Ticket promedio
   ↓
4. Generar PDF con datos
   ↓
5. Subir a S3
   ↓
6. Guardar registro en DB
   ↓
7. (Opcional) Enviar email al usuario
```

---

## 🎨 Frontend

### **Nueva Ruta**
`/dashboard/reports`

### **Componentes**
```
components/
  reports/
    ReportsTable.tsx       - Lista de reportes
    ReportFilters.tsx      - Filtros (tipo, período)
    GenerateReportButton.tsx - Botón manual
    DownloadReportButton.tsx - Descargar PDF
```

### **Funcionalidades UI**
- ✅ Ver lista de reportes generados
- ✅ Filtrar por tipo (semanal/mensual)
- ✅ Filtrar por año
- ✅ Descargar PDF
- ✅ Generar reporte manual
- ✅ Ver preview (opcional)

---

## 📝 Orden de Implementación

### **Fase 1: Backend Base** (Prioritario)
1. ✅ Crear entidad Report
2. ✅ Configurar AWS S3 SDK
3. ✅ Crear servicio de generación de PDF
4. ✅ Crear servicio de subida a S3
5. ✅ Implementar cálculo de estadísticas

### **Fase 2: Endpoints API**
6. ✅ POST /reports/generate
7. ✅ GET /reports
8. ✅ GET /reports/:id/download

### **Fase 3: Automatización**
9. ✅ Configurar @nestjs/schedule
10. ✅ Implementar cron jobs
11. ✅ Testing de generación automática

### **Fase 4: Frontend**
12. ✅ Crear página /dashboard/reports
13. ✅ Tabla de reportes
14. ✅ Botón de descarga
15. ✅ Filtros

---

## 🤔 Decisiones a Tomar

### **1. ¿Formato del Reporte?**
- **Opción A:** Solo PDF ✅ (Recomendado)
- **Opción B:** PDF + Excel
- **Opción C:** PDF + JSON

### **2. ¿Notificaciones?**
- **Opción A:** Email cuando se genera reporte ✅
- **Opción B:** Solo disponible en dashboard
- **Opción C:** Email + notificación in-app

### **3. ¿Retención de Reportes?**
- **Opción A:** Guardar todos (ilimitado)
- **Opción B:** Últimos 12 meses ✅ (Recomendado)
- **Opción C:** Últimos 6 meses

### **4. ¿Nivel de Detalle?**
- **Opción A:** Resumen ejecutivo (básico)
- **Opción B:** Detallado con gráficos ✅ (Recomendado)
- **Opción C:** Super detallado (cada venta)

### **5. ¿Generación Manual?**
- **Opción A:** Solo automático
- **Opción B:** Manual + automático ✅ (Recomendado)
- **Opción C:** Solo manual

---

## 💰 Costos Estimados AWS S3

### **Almacenamiento**
- Promedio 1 MB por reporte PDF
- 2 reportes/semana + 1 reporte/mes = ~9 reportes/mes
- 100 usuarios × 9 reportes/mes = 900 MB/mes
- **Costo:** ~$0.023/mes (casi gratis)

### **Transferencia**
- Descargas ocasionales
- **Costo:** Negligible (<$1/mes)

### **Total Estimado:** <$0.50/mes 💚

---

## 🚀 Próximos Pasos

¿Quieres que empecemos con:
1. **Backend completo** (Entity + Service + S3 + PDF)
2. **Solo la parte de S3** (configuración + subida)
3. **Solo generación de PDF** (sin S3, solo local)
4. **Todo junto** (implementación completa)

¿Qué prefieres? Y dime tus decisiones sobre las opciones marcadas arriba 😊
