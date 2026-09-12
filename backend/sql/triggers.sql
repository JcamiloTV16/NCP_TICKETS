-- ============================================================
-- Triggers para control automático de fechas en PostgreSQL
-- Ejecutar este script directamente en Neon DB.
-- ============================================================

-- ─── Función genérica: actualiza fecha_modificacion ──────────

CREATE OR REPLACE FUNCTION fn_update_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_modificacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ─── Trigger: actualiza fecha_modificacion al modificar un ticket ─────

DROP TRIGGER IF EXISTS trg_tickets_update_fecha_modificacion ON tickets;

CREATE TRIGGER trg_tickets_update_fecha_modificacion
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_fecha_modificacion();


-- ─── Función: actualiza fecha_modificacion del ticket padre al agregar comentario ─────

CREATE OR REPLACE FUNCTION fn_comentario_update_ticket_fecha()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tickets
    SET fecha_modificacion = NOW()
    WHERE id = NEW.ticket_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ─── Trigger: cuando se inserta un comentario, actualiza el ticket ─────

DROP TRIGGER IF EXISTS trg_comentarios_update_ticket_fecha ON comentarios;

CREATE TRIGGER trg_comentarios_update_ticket_fecha
    AFTER INSERT ON comentarios
    FOR EACH ROW
    EXECUTE FUNCTION fn_comentario_update_ticket_fecha();
