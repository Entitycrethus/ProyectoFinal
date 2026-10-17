using System;
using System.Collections.Generic;
using static FundamentosDeAlgoritmos.GestorEstudiantes;
using System.Text;

namespace FundamentosDeAlgoritmos
{
    public class ArchivoServicio
    {
        const string ArchivoCsv = "estudiantes.csv";

        // Archivos CSV
        public static void CargarDesdeArchivo()
        {
            if (!File.Exists(ArchivoCsv)) return;
            string[] lineas = File.ReadAllLines(ArchivoCsv, Encoding.UTF8);
            for (int i = 1; i < lineas.Length; i++) // la línea 0 es el encabezado
            {
                if (string.IsNullOrWhiteSpace(lineas[i])) continue;
                Estudiante e = Estudiante.DesdeCsv(lineas[i]);
                if (e != null) estudiantes.Add(e);
            }
        }
        public static void GuardarEnArchivo()
        {
            List<string> lineas = new List<string> { "Codigo,Nombres,Apellidos,Grado,Seccion,Contacto" };
            foreach (Estudiante e in estudiantes)
                lineas.Add(e.ToCsv());
            File.WriteAllLines(ArchivoCsv, lineas, Encoding.UTF8);
        }


    }
}
