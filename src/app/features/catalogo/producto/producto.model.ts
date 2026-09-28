import { CategoriaResumen } from '../categoria/categoria.model';

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  categoria: CategoriaResumen;
}

export interface ProductoRequest {
  nombre: string;
  precio: number;
  stock: number;
  categoriaId: number;
}