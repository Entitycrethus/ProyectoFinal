using System;
using System.Collections.Generic;
using System.Text;

namespace FundamentosDeAlgoritmos
{
    public class ArchivoServicio
    {

        private readonly string _rutaArchivo;

        public ArchivoServicio(string rutaArchivo = "estudiantes.csv")
        {
            _rutaArchivo= rutaArchivo;

        }

        // Archivos CSV
        public List<Estudiante> CargarDesdeArchivo()
        {
            List<Estudiante> lista = new List<Estudiante>();

            if (!File.Exists(_rutaArchivo)) return lista;

            string[] lineas = File.ReadAllLines(_rutaArchivo, Encoding.UTF8);
            for (int i = 1; i < lineas.Length; i++) // la línea 0 es el encabezado
            {
                if (string.IsNullOrWhiteSpace(lineas[i])) continue;
                Estudiante e = Estudiante.DesdeCsv(lineas[i]);
                if (e != null) lista.Add(e);
            }

            return lista;
        }

        public void GuardarEnArchivo(List<Estudiante> estudiantes) 
        {
            List<string> lineas = new List<string> { "Codigo,Nombres,Apellidos,Grado,Seccion,Contacto" };
            foreach (Estudiante e in estudiantes)
                lineas.Add(e.ToCsv());
            File.WriteAllLines(_rutaArchivo, lineas, Encoding.UTF8);
        }


    }
}
