export type RolUsuario = 'Usuario' | 'Soporte' | 'Administrador';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  cargo: string | null;
  area: string | null;
}

export interface UsuarioUpdate {
  nombre?: string;
  rol?: RolUsuario;
  cargo?: string;
  area?: string;
}
