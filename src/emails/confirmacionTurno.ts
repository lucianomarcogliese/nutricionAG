interface Props {
  nombre: string
  fecha: string         // "Lunes 23 de junio de 2025"
  hora: string          // "10:30"
  nutricionista: string
  tipo: string          // "Consulta nutricional"
  baseUrl?: string
}

export const confirmacionTurnoSubject = "Turno confirmado"

export function confirmacionTurnoHtml({ nombre, fecha, hora, nutricionista, tipo, baseUrl }: Props): string {
  const url = baseUrl ?? process.env.NEXTAUTH_URL ?? "https://nutricionag.com"
  const turnosUrl = `${url}/dashboard/turnos`

  const rows: [string, string][] = [
    ["Fecha", fecha],
    ["Hora", hora],
    ["Profesional", nutricionista],
    ["Tipo de consulta", tipo],
  ]

  const tableRows = rows.map(([label, value]) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;width:40%">${escapeHtml(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;font-weight:500">${escapeHtml(value)}</td>
    </tr>`).join("")

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">

        <!-- Header -->
        <tr>
          <td style="background:#059669;padding:32px 40px;text-align:center">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px">NutriciónAG</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px">
            <h1 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700">¡Hola, ${escapeHtml(nombre)}!</h1>
            <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.6">Tu turno fue confirmado. Aquí están los detalles:</p>

            <!-- Details table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
              ${tableRows}
            </table>

            <table cellpadding="0" cellspacing="0"><tr><td>
              <a href="${turnosUrl}" style="display:inline-block;background:#059669;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px">
                Ver mis turnos →
              </a>
            </td></tr></table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center">
            <p style="margin:0;color:#9ca3af;font-size:12px">NutriciónAG · Todos los derechos reservados</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
