using System;
using System.Collections.Generic;
using System.Text;

namespace FundamentosDeAlgoritmos
{
    public class Estudiante
    {
        public string Codigo { get; set; }
        public string Nombres { get; set; }
        public string Apellidos { get; set; }
        public int Grado { get; set; }
        public string Seccion { get; set; }
        public string Contacto { get; set; }
        // Convierte el estudiante a una línea CSV
        public string ToCsv()
        {
            return $"{Codigo},{Nombres},{Apellidos},{Grado},{Seccion},{Contacto}";
        }
        // Crea un estudiante a partir de una línea CSV (null si el formato es inválido)
        public static Estudiante DesdeCsv(string linea)
        {
            string[] partes = linea.Split(',');
            if (partes.Length != 6 || !int.TryParse(partes[3], out int grado))
                return null;
            return new Estudiante
            {
                Codigo = partes[0],
                Nombres = partes[1],
                Apellidos = partes[2],
                Grado = grado,
                Seccion = partes[4],
                Contacto = partes[5]
            };
        }
        public override string ToString()
        {
            return $"{Codigo,-8} {Apellidos,-18} {Nombres,-18} {Grado,-6} {Seccion,-8} {Contacto}";
        }
    }
}
