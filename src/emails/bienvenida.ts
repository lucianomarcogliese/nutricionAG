interface Props {
  nombre: string
  baseUrl?: string
}

export const bienvenidaSubject = "¡Bienvenido/a a NutriciónAG!"

export function bienvenidaHtml({ nombre, baseUrl }: Props): string {
  const url = baseUrl ?? process.env.NEXTAUTH_URL ?? "https://nutricionag.com"
  const loginUrl = `${url}/auth/login`

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
            <h1 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:700">¡Hola, ${escapeHtml(nombre)}!</h1>
            <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6">Tu cuenta en NutriciónAG está lista.</p>
            <p style="margin:0 0 32px;color:#374151;font-size:15px;line-height:1.6">Ya podés iniciar sesión y completar tu perfil para comenzar tu camino hacia una alimentación más saludable.</p>
            <table cellpadding="0" cellspacing="0"><tr><td>
              <a href="${loginUrl}" style="display:inline-block;background:#059669;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px">
                Iniciar sesión →
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
