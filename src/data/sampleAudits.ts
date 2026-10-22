import { AuditConfig } from '../types/audit';

export const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  currency: 'USD',
  currencySymbol: '$',
  dateFormat: 'DD/MM/YYYY',
  balanceTolerance: 0.0,
  enableDoubleEntryCheck: true,
  enableDuplicatesCheck: true,
  enableMissingFieldsCheck: true,
  enableInvalidDatesCheck: true,
  enableOutlierCheck: true,
  enableRoundNumbersCheck: true,
  enableBenfordCheck: true,
  outlierSensitivity: 'media',
  roundNumberThreshold: 50000,
};

export interface SampleDataset {
  id: string;
  name: string;
  description: string;
  company: string;
  period: string;
  fileName: string;
  headers: string[];
  rows: any[];
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'sample-libro-diario',
    name: 'Libro Diario General - Empresa Modelo S.A.S.',
    description: 'Asientos contables de compras, ventas, nómina y bancos con descuadre en asiento #104 y factura duplicada.',
    company: 'Empresa Modelo S.A.S.',
    period: 'Julio 2026',
    fileName: 'Libro_Diario_Empresa_Modelo_Jul2026.xlsx',
    headers: ['Asiento', 'Fecha', 'Cuenta', 'Concepto', 'Debito', 'Credito', 'Tercero'],
    rows: [
      { Asiento: '101', Fecha: '01/07/2026', Cuenta: '111005', Concepto: 'Aporte de capital inicial socios en Banco', Debito: 50000.0, Credito: 0.0, Tercero: 'Banco Nacional' },
      { Asiento: '101', Fecha: '01/07/2026', Cuenta: '311505', Concepto: 'Capital suscrito y pagado cuotas de interés', Debito: 0.0, Credito: 50000.0, Tercero: 'Socios Fundadores' },
      { Asiento: '102', Fecha: '03/07/2026', Cuenta: '152405', Concepto: 'Compra de equipo de cómputo y servidores', Debito: 8500.0, Credito: 0.0, Tercero: 'Tech Soluciones SAS' },
      { Asiento: '102', Fecha: '03/07/2026', Cuenta: '240801', Concepto: 'IVA descontable 19% en equipos', Debito: 1615.0, Credito: 0.0, Tercero: 'DIAN' },
      { Asiento: '102', Fecha: '03/07/2026', Cuenta: '236540', Concepto: 'Retención en la fuente por compras 2.5%', Debito: 0.0, Credito: 212.5, Tercero: 'Tech Soluciones SAS' },
      { Asiento: '102', Fecha: '03/07/2026', Cuenta: '111005', Concepto: 'Pago transferencia bancaria compra equipos', Debito: 0.0, Credito: 9902.5, Tercero: 'Banco Nacional' },
      { Asiento: '103', Fecha: '05/07/2026', Cuenta: '130505', Concepto: 'Factura de venta #FV-401 servicios de software', Debito: 17850.0, Credito: 0.0, Tercero: 'Inversiones Alfa SA' },
      { Asiento: '103', Fecha: '05/07/2026', Cuenta: '413595', Concepto: 'Ingresos operacionales por licenciamiento', Debito: 0.0, Credito: 15000.0, Tercero: 'Inversiones Alfa SA' },
      { Asiento: '103', Fecha: '05/07/2026', Cuenta: '240802', Concepto: 'IVA generado 19% en venta software', Debito: 0.0, Credito: 2850.0, Tercero: 'DIAN' },
      // Asiento 104: Descuadrado intencionalmente para auditoría (Debito 4200, Credito 3900 => dif 300)
      { Asiento: '104', Fecha: '08/07/2026', Cuenta: '513525', Concepto: 'Gasto por servicio de acueducto y energía', Debito: 4200.0, Credito: 0.0, Tercero: 'Empresas Públicas' },
      { Asiento: '104', Fecha: '08/07/2026', Cuenta: '111005', Concepto: 'Pago débito automático servicios públicos', Debito: 0.0, Credito: 3900.0, Tercero: 'Banco Nacional' },
      // Asiento 105: Registro con cuenta en blanco
      { Asiento: '105', Fecha: '10/07/2026', Cuenta: '', Concepto: 'Anticipo no identificado recibido en caja', Debito: 2500.0, Credito: 0.0, Tercero: 'Cliente Varios' },
      { Asiento: '105', Fecha: '10/07/2026', Cuenta: '280505', Concepto: 'Anticipos recibidos de clientes pendientes', Debito: 0.0, Credito: 2500.0, Tercero: 'Cliente Varios' },
      // Asiento 106 y 107: Duplicados intencionales
      { Asiento: '106', Fecha: '14/07/2026', Cuenta: '510506', Concepto: 'Pago honorarios asesoría contable tributaria', Debito: 3200.0, Credito: 0.0, Tercero: 'Consultores Díaz & Cia' },
      { Asiento: '106', Fecha: '14/07/2026', Cuenta: '111005', Concepto: 'Transferencia electrónica bancaria', Debito: 0.0, Credito: 3200.0, Tercero: 'Banco Nacional' },
      { Asiento: '106', Fecha: '14/07/2026', Cuenta: '510506', Concepto: 'Pago honorarios asesoría contable tributaria', Debito: 3200.0, Credito: 0.0, Tercero: 'Consultores Díaz & Cia' },
      { Asiento: '106', Fecha: '14/07/2026', Cuenta: '111005', Concepto: 'Transferencia electrónica bancaria', Debito: 0.0, Credito: 3200.0, Tercero: 'Banco Nacional' },
      // Asiento 108: Monto redondo anómalo
      { Asiento: '108', Fecha: '18/07/2026', Cuenta: '133015', Concepto: 'Préstamo extraordinario a casa matriz', Debito: 100000.0, Credito: 0.0, Tercero: 'Holding Corporativa' },
      { Asiento: '108', Fecha: '18/07/2026', Cuenta: '111005', Concepto: 'Transferencia giro internacional Banco', Debito: 0.0, Credito: 100000.0, Tercero: 'Holding Corporativa' },
      // Asiento 109: Registro regular de nómina
      { Asiento: '109', Fecha: '30/07/2026', Cuenta: '510506', Concepto: 'Sueldo básico personal administrativo', Debito: 14200.0, Credito: 0.0, Tercero: 'Nómina General' },
      { Asiento: '109', Fecha: '30/07/2026', Cuenta: '237005', Concepto: 'Aportes EPS y Pensión por pagar', Debito: 0.0, Credito: 1136.0, Tercero: 'Seguridad Social' },
      { Asiento: '109', Fecha: '30/07/2026', Cuenta: '111005', Concepto: 'Dispersión de nómina quincenal Banco', Debito: 0.0, Credito: 13064.0, Tercero: 'Banco Nacional' },
      // Asiento 110: Fecha futura anómala para detección
      { Asiento: '110', Fecha: '15/12/2028', Cuenta: '170505', Concepto: 'Póliza de seguro multirriesgo anual diferido', Debito: 4800.0, Credito: 0.0, Tercero: 'Seguros del Estado' },
      { Asiento: '110', Fecha: '15/12/2028', Cuenta: '111005', Concepto: 'Pago prima seguro cheque gerencia', Debito: 0.0, Credito: 4800.0, Tercero: 'Banco Nacional' },
    ],
  },
  {
    id: 'sample-balance-comprobacion',
    name: 'Balance de Comprobación - Distribuidora Andina Ltda.',
    description: 'Catálogo de cuentas con saldos anteriores, movimientos débito, crédito y saldos finales.',
    company: 'Distribuidora Andina Ltda.',
    period: 'Trimestre II 2026',
    fileName: 'Balance_Comprobacion_Andina_T2.xlsx',
    headers: ['Codigo', 'Cuenta', 'Debito', 'Credito', 'Saldo'],
    rows: [
      { Codigo: '110505', Cuenta: 'Caja General Efectivo', Debito: 12500.0, Credito: 8200.0, Saldo: 4300.0 },
      { Codigo: '111005', Cuenta: 'Bancos Cuenta Corriente 012', Debito: 245000.0, Credito: 210000.0, Saldo: 35000.0 },
      { Codigo: '130505', Cuenta: 'Clientes Nacionales Cartera', Debito: 89000.0, Credito: 62000.0, Saldo: 27000.0 },
      { Codigo: '143505', Cuenta: 'Mercancías no Fabricadas por Empresa', Debito: 154000.0, Credito: 98000.0, Saldo: 56000.0 },
      { Codigo: '152405', Cuenta: 'Muebles y Enseres de Oficina', Debito: 32000.0, Credito: 0.0, Saldo: 32000.0 },
      { Codigo: '159215', Cuenta: 'Depreciación Acumulada Equipos', Debito: 0.0, Credito: 12400.0, Saldo: -12400.0 },
      { Codigo: '220505', Cuenta: 'Proveedores Nacionales Comerciales', Debito: 95000.0, Credito: 128000.0, Saldo: -33000.0 },
      { Codigo: '233525', Cuenta: 'Costos y Gastos por Pagar Servicios', Debito: 18200.0, Credito: 21500.0, Saldo: -3300.0 },
      { Codigo: '240801', Cuenta: 'Impuesto a las Ventas IVA por Pagar', Debito: 24300.0, Credito: 38700.0, Saldo: -14400.0 },
      { Codigo: '311505', Cuenta: 'Capital Social Cuotas o Partes', Debito: 0.0, Credito: 60000.0, Saldo: -60000.0 },
      { Codigo: '413505', Cuenta: 'Ingresos por Venta al por Mayor', Debito: 0.0, Credito: 220000.0, Saldo: -220000.0 },
      { Codigo: '510506', Cuenta: 'Gastos de Personal y Sueldos', Debito: 64000.0, Credito: 0.0, Saldo: 64000.0 },
      { Codigo: '513525', Cuenta: 'Gastos de Servicios Públicos y Arriendo', Debito: 16500.0, Credito: 0.0, Saldo: 16500.0 },
      { Codigo: '613505', Cuenta: 'Costo de Ventas Mercancías', Debito: 98000.0, Credito: 0.0, Saldo: 98000.0 },
    ],
  },
];
