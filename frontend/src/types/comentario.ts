import type { Usuario } from './usuario';

export interface Comentario {
  id: number;
  ticket_id: number;
  comentario: string;
  fecha_creacion: string;
  usuario: Usuario;
}

export interface ComentarioCreate {
  comentario: string;
}
