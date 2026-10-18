using System;
using System.Collections.Generic;
using System.Text;

namespace FundamentosDeAlgoritmos
{
    public class Estudiante
    {
        public string DNI { get; set; }
        public string Nombres { get; set; }
        public string Apellidos { get; set; }

        public string Nivel { get; set; }
        public int Grado { get; set; }

      
        public string Seccion { get; set; }
        public string Contacto { get; set; }
        // Convierte el estudiante a una línea CSV
        public string ToCsv()
        {
            return $"{DNI},{Nombres},{Apellidos},{Nivel},{Grado},{Seccion},{Contacto}";
        }
        // Crea un estudiante a partir de una línea CSV (null si el formato es inválido)
        public static Estudiante DesdeCsv(string linea)
        {
            string[] partes = linea.Split(',');
            if (partes.Length != 7 || !int.TryParse(partes[4], out int grado))
                return null;

            return new Estudiante
            {
                DNI = partes[0],
                Nombres = partes[1],
                Apellidos = partes[2],
                Nivel = partes[3],
                Grado = grado,
                Seccion = partes[5],
                Contacto = partes[6]
            };
        }
        public override string ToString()
        {
            string aula = $"{Grado}° {Seccion}";
            return $"{DNI,-10} {Apellidos,-18} {Nombres,-18} {Nivel,-12} {aula,-8} {Contacto}";
        }
    }
}
