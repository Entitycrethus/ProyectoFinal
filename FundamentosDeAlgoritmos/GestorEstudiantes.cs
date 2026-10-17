using System;
using System.Collections.Generic;
using System.Text;
using static FundamentosDeAlgoritmos.ValidadorEstudiante;
using static FundamentosDeAlgoritmos.ArchivoServicio;
namespace FundamentosDeAlgoritmos
{
    public class GestorEstudiantes
    {
        public static List<Estudiante> estudiantes = new List<Estudiante>();
        static Estudiante BuscarPorDNI(int DNI)
        {
            foreach (Estudiante e in estudiantes)
            {
                if (e.DNI == DNI.ToString())
                    return e;
            }
            return null;
        }
        // 1. Registrar
        public static void RegistrarEstudiante()
        {
            Console.Clear();
            Console.WriteLine("=========================================");
            Console.WriteLine("         REGISTRO DE ESTUDIANTES");
            Console.WriteLine("=========================================");
            int DNI;
            while (true)
            {
                DNI = int.Parse(LeerTexto("DNI del estudante (8 digitos): ", EsDNIValido,
                     "DNI inválido. Solo esta permitido 8 digitos númericos."));
                if (BuscarPorDNI(DNI) == null) break;
                Console.WriteLine("Ya existe un estudiante con ese DNI.");
            }
            Estudiante nuevo = new Estudiante
            {
                DNI = DNI.ToString(),
                Nombres = LeerTexto("Nombres: ", EsNombreValido, "Solo se permiten letras y espacios."),
                Apellidos = LeerTexto("Apellidos: ", EsNombreValido, "Solo se permiten letras y espacios."),
                Grado = LeerEntero("Grado (1 a 6): ", 1, 6),
                Seccion = LeerTexto("Sección (una letra A-Z): ", EsSeccionValida, "Ingrese una sola letra.").ToUpper(),
                Contacto = LeerTexto("Contacto (9 dígitos): ", EsContactoValido, "Debe tener exactamente 9 dígitos.")
            };
            estudiantes.Add(nuevo);
            GuardarEnArchivo();
            Console.WriteLine("Estudiante registrado correctamente.");
        }
        // 2. Buscar
        public static void BuscarEstudiante()
        {
            Console.Clear();
            Console.WriteLine("=========================================");
            Console.WriteLine("         BUSQUEDA DE ESTUDIANTE");
            Console.WriteLine("=========================================");
            Console.WriteLine("1. Por DNI");
            Console.WriteLine("2. Por nombre o apellido");
            Console.WriteLine("3. Por grado y sección");
            int criterio = LeerEntero("Buscar por: ", 1, 3);
            List<Estudiante> resultados = new List<Estudiante>();
            if (criterio == 1)
            {
                int DNI = int.Parse(LeerTexto("DNI: ", EsDNIValido, "Ingrese un DNI válido."));
                Estudiante e = BuscarPorDNI(DNI);
                if (e != null) resultados.Add(e);
            }
            else if (criterio == 2)
            {
                string texto = LeerTexto("Nombre o apellido: ", t => t.Length > 0, "Ingrese un texto.");
                foreach (Estudiante e in estudiantes)
                {
                    if (Contiene(e.Nombres, texto) || Contiene(e.Apellidos, texto))
                        resultados.Add(e);
                }
            }
            else
            {
                int grado = LeerEntero("Grado (1 a 6): ", 1, 6);
                string seccion = LeerTexto("Sección: ", EsSeccionValida, "Ingrese una sola letra.");
                foreach (Estudiante e in estudiantes)
                {
                    if (e.Grado == grado && e.Seccion.Equals(seccion, StringComparison.OrdinalIgnoreCase))
                        resultados.Add(e);
                }
            }
            Console.WriteLine();
            MostrarLista(resultados);
        }
        // 3. Modificar (dejar vacío = conservar el valor actual)
        public static void ModificarEstudiante()
        {
            Console.Clear();
            Console.WriteLine("=========================================");
            Console.WriteLine("         MODIFICAR ESTUDIANTE");
            Console.WriteLine("=========================================");
            int DNI = int.Parse(LeerTexto("DNI del estudiante: ", EsDNIValido, "Ingrese un DNI válido."));
            Estudiante e = BuscarPorDNI(DNI);
            if (e == null)
            {
                Console.WriteLine("No se encontró el estudiante.");
                return;
            }
            Console.WriteLine("\nDatos actuales:");
            Console.WriteLine(e);
            Console.WriteLine("\n(Deje vacío y presione Enter para conservar el valor actual)\n");
            string nombres = LeerOpcional($"Nombres [{e.Nombres}]: ", EsNombreValido);
            if (nombres != "") e.Nombres = nombres;
            string apellidos = LeerOpcional($"Apellidos [{e.Apellidos}]: ", EsNombreValido);
            if (apellidos != "") e.Apellidos = apellidos;
            string grado = LeerOpcional($"Grado [{e.Grado}]: ",
             t => int.TryParse(t, out int g) && g >= 1 && g <= 6);
            if (grado != "") e.Grado = int.Parse(grado);
            string seccion = LeerOpcional($"Sección [{e.Seccion}]: ", EsSeccionValida);
            if (seccion != "") e.Seccion = seccion.ToUpper();
            string contacto = LeerOpcional($"Contacto [{e.Contacto}]: ", EsContactoValido);
            if (contacto != "") e.Contacto = contacto;
            GuardarEnArchivo();
            Console.WriteLine("Datos actualizados correctamente.");
        }
        // 4. Ordenar y listar
        public static void OrdenarYListar()
        {
            Console.Clear();
            Console.WriteLine("=========================================");
            Console.WriteLine("         ORDENAR ESTUDIANTES");
            Console.WriteLine("=========================================");
            Console.WriteLine("1. Por DNI");
            Console.WriteLine("2. Por apellidos");
            Console.WriteLine("3. Por grado y sección");
            int criterio = LeerEntero("Ordenar por: ", 1, 3);
            Comparison<Estudiante> comparar;
            if (criterio == 1)
                comparar = (a, b) => string.Compare(a.DNI, b.DNI, StringComparison.OrdinalIgnoreCase);
            else if (criterio == 2)
                comparar = (a, b) => string.Compare(a.Apellidos, b.Apellidos, StringComparison.OrdinalIgnoreCase);
            else
                comparar = (a, b) =>
                {
                    int r = a.Grado.CompareTo(b.Grado);
                    return r != 0 ? r : string.Compare(a.Seccion, b.Seccion, StringComparison.OrdinalIgnoreCase);
                };
            OrdenarBurbuja(estudiantes, comparar);
            GuardarEnArchivo();
            Console.WriteLine();
            MostrarLista(estudiantes);
        }
        // ---------------------------------------------------------
        // Utilidades de consulta y visualización
        // ---------------------------------------------------------
        public static bool Contiene(string texto, string buscado)
        {
            return texto.IndexOf(buscado, StringComparison.OrdinalIgnoreCase) >= 0;
        }
        public static void MostrarLista(List<Estudiante> lista)
        {
            if (lista.Count == 0)
            {
                Console.WriteLine("No hay registros para mostrar.");
                return;
            }
            Console.WriteLine($"{"Código",-8} {"Apellidos",-18} {"Nombres",-18} {"Grado",-6} {"Sección",-8} Contacto");
            Console.WriteLine(new string('-', 75));
            foreach (Estudiante e in lista)
                Console.WriteLine(e);
            Console.WriteLine($"\nTotal: {lista.Count} registro(s)");
        }
        // Algoritmo de ordenamiento burbuja
        public static void OrdenarBurbuja(List<Estudiante> lista, Comparison<Estudiante> comparar)
        {
            for (int i = 0; i < lista.Count - 1; i++)
            {
                for (int j = 0; j < lista.Count - 1 - i; j++)
                {
                    if (comparar(lista[j], lista[j + 1]) > 0)
                    {
                        Estudiante temp = lista[j];
                        lista[j] = lista[j + 1];
                        lista[j + 1] = temp;
                    }
                }
            }
        }
    }
}
