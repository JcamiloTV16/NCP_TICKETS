"""
Servicio de tickets.
Lógica de negocio para creación, consulta, actualización y dashboard.
"""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ticket import Ticket
from app.models.usuario import Usuario
from app.schemas.ticket import (
    TicketCreate,
    TicketUpdate,
    TicketCalificacionCreate,
    SupportAnalyticsResponse,
    CategoriaTiempo,
    TestimonioSatisfaccion,
)
from app.services.usuario_service import list_soporte_users


async def create_ticket(
    db: AsyncSession, data: TicketCreate, usuario_id: int
) -> Ticket:
    """
    Crea un ticket y lo asigna automáticamente al miembro de soporte
    con menos tickets activos (balanceo de carga simple), o al asignado especificado.
    """
    asignado_id = getattr(data, "asignado_a", None)
    if asignado_id is None:
        asignado_id = await _auto_assign_soporte(db)

    ticket = Ticket(
        titulo=data.titulo,
        descripcion=data.descripcion,
        ubicacion=data.ubicacion,
        tipo_caso=data.tipo_caso,
        usuario_id=usuario_id,
        asignado_a=asignado_id,
        # estado, fecha_creacion, fecha_modificacion → manejados por PostgreSQL
    )
    db.add(ticket)
    await db.flush()
    await db.refresh(ticket)
    return ticket


async def get_ticket_by_id(db: AsyncSession, ticket_id: int) -> Ticket | None:
    """Obtiene un ticket por ID con relaciones cargadas (selectin)."""
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    return result.scalar_one_or_none()


async def list_tickets_by_user(db: AsyncSession, usuario_id: int) -> list[Ticket]:
    """Lista los tickets creados por un usuario específico."""
    result = await db.execute(
        select(Ticket)
        .where(Ticket.usuario_id == usuario_id)
        .order_by(Ticket.fecha_creacion.desc())
    )
    return list(result.scalars().all())


async def list_all_tickets(
    db: AsyncSession,
    estado: str | None = None,
    tipo_caso: str | None = None,
) -> list[Ticket]:
    """
    Lista todos los tickets (dashboard de Soporte/Admin).
    Filtros opcionales por estado y tipo_caso.
    """
    query = select(Ticket)

    if estado:
        query = query.where(Ticket.estado == estado)
    if tipo_caso:
        query = query.where(Ticket.tipo_caso == tipo_caso)

    query = query.order_by(Ticket.fecha_creacion.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_ticket(
    db: AsyncSession, ticket_id: int, data: TicketUpdate
) -> Ticket:
    """
    Actualiza un ticket (estado, asignado, etc.).
    Si cambia a 'En Ejecución', registra fecha_primera_respuesta.
    Si cambia a 'Solucionado', registra fecha_solucion.
    """
    ticket = await get_ticket_by_id(db, ticket_id)
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket con ID {ticket_id} no encontrado",
        )

    update_data = data.model_dump(exclude_unset=True)
    new_estado = update_data.get("estado")
    now = datetime.now(timezone.utc)

    # Registrar tiempo de primera respuesta al pasar a En Ejecución o Solucionado
    if new_estado == "En Ejecución" and ticket.fecha_primera_respuesta is None:
        update_data["fecha_primera_respuesta"] = now
    elif new_estado == "Solucionado":
        if ticket.estado != "Solucionado":
            update_data["fecha_solucion"] = now
        if ticket.fecha_primera_respuesta is None:
            update_data["fecha_primera_respuesta"] = now

    # Aplicar cambios
    for field, value in update_data.items():
        setattr(ticket, field, value)

    await db.flush()
    await db.refresh(ticket)
    return ticket


async def calificar_ticket(
    db: AsyncSession,
    ticket_id: int,
    usuario_id: int,
    data: TicketCalificacionCreate,
) -> Ticket:
    """
    Permite al solicitante evaluar con 1-5 estrellas y comentario opcional
    un ticket que haya sido solucionado.
    """
    ticket = await get_ticket_by_id(db, ticket_id)
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket con ID {ticket_id} no encontrado",
        )

    # Validar que el usuario sea el creador o un Administrador
    if ticket.usuario_id != usuario_id:
        user_res = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
        user = user_res.scalar_one_or_none()
        if not user or user.rol != "Administrador":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo el usuario que solicitó el ticket puede calificar el servicio recibido.",
            )

    # Validar que el ticket esté marcado como Solucionado
    if ticket.estado != "Solucionado":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden calificar tickets que hayan sido marcados como 'Solucionado'.",
        )

    ticket.calificacion = data.calificacion
    ticket.comentario_calificacion = data.comentario.strip() if data.comentario else None
    ticket.fecha_calificacion = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(ticket)
    return ticket


async def get_support_analytics(db: AsyncSession) -> SupportAnalyticsResponse:
    """
    Calcula analíticas de soporte: tiempos de primera respuesta, resolución y satisfacción.
    """
    result = await db.execute(select(Ticket).order_by(Ticket.fecha_creacion.desc()))
    all_tickets = list(result.scalars().all())

    tiempos_respuesta: list[float] = []
    tiempos_solucion: list[float] = []
    por_categoria: dict[str, dict[str, list[float]]] = {}

    calificaciones: list[int] = []
    distribucion_estrellas = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    testimonios: list[TestimonioSatisfaccion] = []

    for t in all_tickets:
        resp_min = None
        if t.fecha_primera_respuesta and t.fecha_creacion:
            delta = (t.fecha_primera_respuesta - t.fecha_creacion).total_seconds() / 60.0
            if delta >= 0:
                resp_min = delta
                tiempos_respuesta.append(delta)

        sol_min = None
        if t.fecha_solucion and t.fecha_creacion:
            delta = (t.fecha_solucion - t.fecha_creacion).total_seconds() / 60.0
            if delta >= 0:
                sol_min = delta
                tiempos_solucion.append(delta)

        cat = t.tipo_caso
        if cat not in por_categoria:
            por_categoria[cat] = {"resp": [], "sol": [], "count": 0}
        por_categoria[cat]["count"] += 1
        if resp_min is not None:
            por_categoria[cat]["resp"].append(resp_min)
        if sol_min is not None:
            por_categoria[cat]["sol"].append(sol_min)

        if t.calificacion is not None and 1 <= t.calificacion <= 5:
            calificaciones.append(t.calificacion)
            distribucion_estrellas[str(t.calificacion)] += 1
            if t.comentario_calificacion or len(testimonios) < 5:
                testimonios.append(
                    TestimonioSatisfaccion(
                        ticket_id=t.id,
                        titulo_ticket=t.titulo,
                        usuario_nombre=t.usuario.nombre if t.usuario else "Usuario",
                        calificacion=t.calificacion,
                        comentario=t.comentario_calificacion,
                        fecha=t.fecha_calificacion or t.fecha_modificacion,
                    )
                )

    promedio_respuesta = round(sum(tiempos_respuesta) / len(tiempos_respuesta), 1) if tiempos_respuesta else 0.0
    promedio_solucion = round(sum(tiempos_solucion) / len(tiempos_solucion), 1) if tiempos_solucion else 0.0

    tiempos_cat_list: list[CategoriaTiempo] = []
    for cat, data in por_categoria.items():
        avg_s = round(sum(data["sol"]) / len(data["sol"]), 1) if data["sol"] else 0.0
        avg_r = round(sum(data["resp"]) / len(data["resp"]), 1) if data["resp"] else 0.0
        tiempos_cat_list.append(
            CategoriaTiempo(
                tipo_caso=cat,
                promedio_solucion_minutos=avg_s,
                promedio_respuesta_minutos=avg_r,
                total_tickets=data["count"],
            )
        )

    tiempos_cat_list.sort(key=lambda x: x.total_tickets, reverse=True)

    total_enc = len(calificaciones)
    prom_sat = round(sum(calificaciones) / total_enc, 1) if total_enc > 0 else 0.0
    sat_positiva = sum(1 for c in calificaciones if c >= 4)
    pct_sat = round((sat_positiva / total_enc) * 100.0, 1) if total_enc > 0 else 0.0

    return SupportAnalyticsResponse(
        tiempo_promedio_primera_respuesta_minutos=promedio_respuesta,
        tiempo_promedio_solucion_minutos=promedio_solucion,
        tiempos_por_categoria=tiempos_cat_list,
        promedio_satisfaccion=prom_sat,
        total_encuestas=total_enc,
        distribucion_estrellas=distribucion_estrellas,
        porcentaje_satisfaccion=pct_sat,
        ultimos_testimonios=testimonios[:10],
    )


async def _auto_assign_soporte(db: AsyncSession) -> int | None:
    """
    Asigna automáticamente al miembro de Soporte con menos tickets activos.
    Retorna el ID del usuario de soporte, o None si no hay ninguno.
    """
    soporte_users = await list_soporte_users(db)
    if not soporte_users:
        return None

    # Contar tickets activos (no solucionados) por cada soporte
    min_count = float("inf")
    best_user_id = soporte_users[0].id

    for user in soporte_users:
        result = await db.execute(
            select(func.count(Ticket.id)).where(
                Ticket.asignado_a == user.id,
                Ticket.estado != "Solucionado",
            )
        )
        count = result.scalar() or 0
        if count < min_count:
            min_count = count
            best_user_id = user.id

    return best_user_id
