-- Purga de suscripciones Web Push creadas con el par VAPID anterior (VapidPkHashMismatch).
-- Ejecutar en Neon SQL Editor DESPUÉS de desplegar las nuevas claves en Render.

-- 1) Revisar qué se va a borrar
SELECT id, usuario_id, LEFT(endpoint, 60) AS endpoint, user_agent
FROM push_subscriptions
WHERE usuario_id = 13;

-- 2a) Opción A: solo el usuario de pruebas
BEGIN;
DELETE FROM push_subscriptions WHERE usuario_id = 13;
COMMIT;

-- 2b) Opción B (recomendada tras rotar claves): todas las suscripciones quedan inválidas
-- BEGIN;
-- TRUNCATE TABLE push_subscriptions RESTART IDENTITY;
-- COMMIT;
