"""
Servicio de envío de correos electrónicos transaccionales y notificaciones.
Utiliza aiosmtplib para envío asíncrono y plantillas HTML responsivas.
"""

import logging
from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.core.config import get_settings
from app.models.ticket import Ticket
from app.models.usuario import Usuario

logger = logging.getLogger("ncp_tickets.email")
settings = get_settings()


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str | None = None,
) -> bool:
    """
    Envía un correo electrónico transaccional de forma asíncrona.
    Retorna True si el envío fue exitoso, o False si falló o está deshabilitado.
    No lanza excepciones para no interrumpir el flujo principal de la aplicación.
    """
    if not settings.EMAIL_NOTIFICATIONS_ENABLED:
        logger.info(
            f"[EMAIL SIMULADO] Notificaciones desactivadas. Para: {to_email} | Asunto: {subject}"
        )
        return True

    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            f"[EMAIL OMITIDO] Credenciales SMTP incompletas. Para: {to_email} | Asunto: {subject}"
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = Header(subject, "utf-8")
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        # Texto plano de respaldo
        plain_text = text_content or "Por favor visualice este mensaje en un cliente de correo compatible con HTML."
        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=settings.SMTP_TLS,
            timeout=15,
        )
        logger.info(f"[EMAIL ENVIADO] Exitosamente a {to_email} con asunto: {subject}")
        return True
    except Exception as exc:
        logger.error(f"[EMAIL ERROR] Error enviando correo a {to_email}: {exc}", exc_info=True)
        return False


def _get_base_html(header_title: str, content_html: str, action_url: str, action_text: str = "Ver Ticket en la Plataforma") -> str:
    """Genera la plantilla HTML base con estética oscura y corporativa."""
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{header_title}</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b1329;
      color: #cbd5e1;
      margin: 0;
      padding: 24px 12px;
    }}
    .container {{
      max-width: 600px;
      margin: 0 auto;
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    }}
    .header {{
      background: linear-gradient(135deg, #1e3a8a 0%, #0369a1 100%);
      padding: 28px 24px;
      text-align: center;
      color: #ffffff;
    }}
    .header h1 {{
      margin: 0 0 6px 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }}
    .header p {{
      margin: 0;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.85;
      color: #93c5fd;
    }}
    .body {{
      padding: 28px 24px;
    }}
    .info-card {{
      background-color: #1e293b;
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
    }}
    .info-row {{
      margin-bottom: 8px;
      font-size: 14px;
    }}
    .info-row:last-child {{
      margin-bottom: 0;
    }}
    .info-label {{
      color: #94a3b8;
      font-weight: 600;
      display: inline-block;
      min-width: 110px;
    }}
    .info-val {{
      color: #f8fafc;
      font-weight: 500;
    }}
    .badge {{
      display: inline-block;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }}
    .badge-creado {{ background-color: #1e3a8a; color: #93c5fd; }}
    .badge-ejecucion {{ background-color: #854d0e; color: #fef08a; }}
    .badge-solucionado {{ background-color: #065f46; color: #a7f3d0; }}
    .btn-container {{
      text-align: center;
      margin: 32px 0 16px 0;
    }}
    .btn {{
      display: inline-block;
      background: linear-gradient(135deg, #2563eb 0%, #0284c7 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }}
    .footer {{
      background-color: #090d16;
      border-top: 1px solid #1e293b;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NCP Tickets</h1>
      <p>Inversiones Oeding • Sistema de Soporte</p>
    </div>
    <div class="body">
      {content_html}
      <div class="btn-container">
        <a href="{action_url}" class="btn">{action_text}</a>
      </div>
    </div>
    <div class="footer">
      Este es un mensaje automático generado por NCP Tickets.<br>
      Por favor no responda directamente a este correo.
    </div>
  </div>
</body>
</html>"""


def build_ticket_assigned_email(
    ticket: Ticket, support_user: Usuario, requester_user: Usuario
) -> tuple[str, str]:
    """Retorna (asunto, html) para el correo de nuevo caso asignado al soporte."""
    subject = f"[NCP Tickets] Nuevo caso asignado: #{ticket.id} - {ticket.titulo}"
    action_url = f"{settings.FRONTEND_URL}/tickets/{ticket.id}"

    content = f"""
      <h2 style="color: #f1f5f9; font-size: 18px; margin-top: 0;">Hola, {support_user.nombre}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
        Se te ha asignado un nuevo ticket de soporte en la plataforma. A continuación los detalles del caso:
      </p>
      <div class="info-card">
        <div class="info-row"><span class="info-label">Ticket ID:</span> <span class="info-val">#{ticket.id}</span></div>
        <div class="info-row"><span class="info-label">Título:</span> <span class="info-val">{ticket.titulo}</span></div>
        <div class="info-row"><span class="info-label">Solicitante:</span> <span class="info-val">{requester_user.nombre} ({requester_user.email})</span></div>
        <div class="info-row"><span class="info-label">Ubicación:</span> <span class="info-val">{ticket.ubicacion}</span></div>
        <div class="info-row"><span class="info-label">Tipo de Caso:</span> <span class="info-val">{ticket.tipo_caso}</span></div>
        <div class="info-row"><span class="info-label">Estado:</span> <span class="badge badge-creado">{ticket.estado}</span></div>
      </div>
      <p style="font-size: 13px; color: #94a3b8; font-weight: 600; margin-bottom: 4px;">Descripción del problema:</p>
      <div style="background-color: #0b1120; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; font-size: 13px; color: #e2e8f0; white-space: pre-wrap; margin-bottom: 20px;">{ticket.descripcion}</div>
    """
    html = _get_base_html("Nuevo Caso Asignado", content, action_url, "Atender Ticket Ahora")
    return subject, html


def build_ticket_status_email(
    ticket: Ticket, requester_user: Usuario, old_status: str, new_status: str
) -> tuple[str, str]:
    """Retorna (asunto, html) para notificar al solicitante que cambió el estado de su caso."""
    subject = f"[NCP Tickets] Actualización en su caso #{ticket.id}: {new_status}"
    action_url = f"{settings.FRONTEND_URL}/tickets/{ticket.id}"

    badge_class = (
        "badge-solucionado"
        if new_status == "Solucionado"
        else "badge-ejecucion"
        if new_status == "En Ejecución"
        else "badge-creado"
    )

    mensaje_adicional = ""
    if new_status == "Solucionado":
        mensaje_adicional = """
        <div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 14px; margin: 16px 0; color: #a7f3d0; font-size: 13px;">
          🎉 <strong>¡Tu caso ha sido marcado como Solucionado!</strong><br>
          Puedes ingresar al enlace para revisar la solución y dejar tu calificación de satisfacción (1 a 5 estrellas).
        </div>
        """
    elif new_status == "En Ejecución":
        mensaje_adicional = """
        <div style="background-color: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 8px; padding: 14px; margin: 16px 0; color: #fef08a; font-size: 13px;">
          ⚙️ <strong>Tu caso está en proceso de atención.</strong> Nuestro equipo de soporte técnico se encuentra trabajando en la solución.
        </div>
        """

    content = f"""
      <h2 style="color: #f1f5f9; font-size: 18px; margin-top: 0;">Hola, {requester_user.nombre}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
        Te informamos que tu ticket de soporte ha recibido una actualización de estado:
      </p>
      <div class="info-card">
        <div class="info-row"><span class="info-label">Ticket ID:</span> <span class="info-val">#{ticket.id}</span></div>
        <div class="info-row"><span class="info-label">Título:</span> <span class="info-val">{ticket.titulo}</span></div>
        <div class="info-row"><span class="info-label">Estado Anterior:</span> <span class="info-val">{old_status}</span></div>
        <div class="info-row"><span class="info-label">Nuevo Estado:</span> <span class="badge {badge_class}">{new_status}</span></div>
        <div class="info-row"><span class="info-label">Asignado a:</span> <span class="info-val">{ticket.asignado.nombre if ticket.asignado else "Equipo de Soporte"}</span></div>
      </div>
      {mensaje_adicional}
    """
    html = _get_base_html("Actualización de Estado", content, action_url, "Ver Detalles del Caso")
    return subject, html


def build_comment_email(
    ticket: Ticket, recipient_user: Usuario, author_user: Usuario, comment_text: str
) -> tuple[str, str]:
    """Retorna (asunto, html) para notificar sobre un nuevo comentario agregado al ticket."""
    subject = f"[NCP Tickets] Nuevo mensaje en caso #{ticket.id} ({author_user.nombre})"
    action_url = f"{settings.FRONTEND_URL}/tickets/{ticket.id}"

    content = f"""
      <h2 style="color: #f1f5f9; font-size: 18px; margin-top: 0;">Hola, {recipient_user.nombre}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
        <strong>{author_user.nombre}</strong> ({author_user.rol}) ha agregado un comentario en el caso <strong>#{ticket.id} - {ticket.titulo}</strong>:
      </p>
      <div style="background-color: #1e293b; border-left: 4px solid #0284c7; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 14px; color: #f1f5f9; white-space: pre-wrap;">
        "{comment_text}"
      </div>
      <p style="font-size: 13px; color: #94a3b8;">
        Puedes ingresar a la plataforma para responder o continuar el seguimiento del ticket.
      </p>
    """
    html = _get_base_html("Nuevo Mensaje de Seguimiento", content, action_url, "Responder en la Plataforma")
    return subject, html
