using System;
using System.Collections.Generic;
using System.Text;
using static FundamentosDeAlgoritmos.ValidadorEstudiante;
using static FundamentosDeAlgoritmos.ConsolaUI;
namespace FundamentosDeAlgoritmos
{
    public class GestorEstudiantes
    {

        private readonly List<Estudiante> _estudiantes;
        private readonly ArchivoServicio _archivoServicio;


        public GestorEstudiantes(ArchivoServicio archivoServicio)
        {
            _archivoServicio = archivoServicio;
            _estudiantes = archivoServicio.CargarDesdeArchivo();
        }

        public int CantidadEstudiantes => _estudiantes.Count;

        public Estudiante BuscarPorDNI(string DNI)
        {
            foreach (Estudiante e in _estudiantes)
            {
                if (e.DNI == DNI.ToString())
                    return e;
            }
            return null;
        }
        // 1. Registrar
        public void RegistrarEstudiante()
        {
            Console.Clear();
            Console.WriteLine("=========================================");
            Console.WriteLine("         REGISTRO DE ESTUDIANTES");
            Console.WriteLine("=========================================");
            string DNI;
            while (true)
            {
                DNI = LeerTexto("DNI del estudante (8 digitos): ", EsDNIValido,
                     "DNI inválido. Solo esta permitido 8 digitos númericos.");

                if (BuscarPorDNI(DNI) == null) break;

                Console.WriteLine("Ya existe un estudiante con ese DNI.");
            }

            int opNivel = LeerEntero("Nivel (1: Primaria | 2: Secundaria): ", 1, 2);
            string nivelElegido = (opNivel == 1) ? "Primaria" : "Secundaria";
            int maxGrado = (opNivel == 1) ? 6 : 5;
            char maxSeccion = (opNivel == 1) ? 'C' : 'D';

            Estudiante nuevo = new Estudiante
            {
                DNI = DNI.ToString(),
                Nombres = LeerTexto("Nombres: ", EsNombreValido, "Solo se permiten letras y espacios."),
                Apellidos = LeerTexto("Apellidos: ", EsNombreValido, "Solo se permiten letras y espacios."),
                Grado = LeerEntero($"Grado (1 a {maxGrado}): ", 1, maxGrado),
                Nivel = nivelElegido,
                Seccion = LeerTexto($"Sección (A a {maxSeccion}): ",t => EsSeccionValida(t, maxSeccion),
        $"Sección inválida. En {nivelElegido} solo existen secciones de la A a la {maxSeccion}.").ToUpper(),
                Contacto = LeerTexto("Contacto (9 dígitos): ", EsContactoValido, "Debe tener exactamente 9 dígitos.")
            };
            _estudiantes.Add(nuevo);
            _archivoServicio.GuardarEnArchivo(_estudiantes);
            Console.WriteLine("\nEstudiante registrado correctamente.");
        }
        // 2. Buscar
        public void BuscarEstudiante()
        {
            Console.Clear();
            Console.WriteLine("=========================================");
            Console.WriteLine("         BÚSQUEDA DE ESTUDIANTE");
            Console.WriteLine("=========================================");
            Console.WriteLine("1. Por DNI");
            Console.WriteLine("2. Por nombre o apellido");
            Console.WriteLine("3. Por nivel, grado y sección");
            int criterio = LeerEntero("Buscar por: ", 1, 3);
            List<Estudiante> resultados = new List<Estudiante>();

            if (criterio == 1)
            {
                string DNI = LeerTexto("DNI: ", EsDNIValido, "Ingrese un DNI válido.");
                Estudiante e = BuscarPorDNI(DNI);
                if (e != null) resultados.Add(e);
            }
            else if (criterio == 2)
            {
                string texto = LeerTexto("Nombre o apellido: ", t => t.Length > 0, "Ingrese un texto.");
                foreach (Estudiante e in _estudiantes)
                {
                    if (Contiene(e.Nombres, texto) || Contiene(e.Apellidos, texto))
                        resultados.Add(e);
                }
            }
            else
            {
                int opNivel = LeerEntero("Nivel (1: Primaria | 2: Secundaria): ", 1, 2);
                string nivel = (opNivel == 1) ? "Primaria" : "Secundaria";
                int maxGrado = (opNivel == 1) ? 6 : 5;
                char maxSeccion = (opNivel == 1) ? 'C' : 'D';

                int grado = LeerEntero($"Grado (1 a {maxGrado}): ", 1, maxGrado);
                string seccion = LeerTexto($"Sección (A a {maxSeccion}): ",
                    t => EsSeccionValida(t, maxSeccion),
                    $"Ingrese una sección válida (A a {maxSeccion}).");

                foreach (Estudiante e in _estudiantes)
                {
                    if (e.Nivel.Equals(nivel, StringComparison.OrdinalIgnoreCase) &&
                        e.Grado == grado &&
                        e.Seccion.Equals(seccion, StringComparison.OrdinalIgnoreCase))
                    {
                        resultados.Add(e);
                    }
                }
            }
            Console.WriteLine();
            MostrarLista(resultados);
        }

        // 3. Modificar (dejar vacío = conservar el valor actual)
        public void ModificarEstudiante()
        {
            Console.Clear();
            Console.WriteLine("=========================================");
            Console.WriteLine("         MODIFICAR ESTUDIANTE");
            Console.WriteLine("=========================================");
            string DNI = LeerTexto("DNI del estudiante: ", EsDNIValido, "Ingrese un DNI válido.");
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

            string opNivel = LeerOpcional($"Nivel [{e.Nivel}] (1: Primaria | 2: Secundaria): ",
                t => t == "1" || t == "2");
            if (opNivel != "") e.Nivel = (opNivel == "1") ? "Primaria" : "Secundaria";

            // Ajustamos el máximo grado permitido según el nivel que tenga ahora
            int maxGrado = (e.Nivel == "Primaria") ? 6 : 5;
            if (e.Grado > maxGrado) e.Grado = maxGrado; // Por si era de 6° Primaria y pasó a Secundaria

            string grado = LeerOpcional($"Grado [{e.Grado}] (1 a {maxGrado}): ",
                t => int.TryParse(t, out int g) && g >= 1 && g <= maxGrado);
            if (grado != "") e.Grado = int.Parse(grado);

            char maxSeccion = (e.Nivel == "Primaria") ? 'C' : 'D';
            string seccion = LeerOpcional($"Sección [{e.Seccion}] (A a {maxSeccion}): ",t => EsSeccionValida(t, maxSeccion));
            if (seccion != "") e.Seccion = seccion.ToUpper();

            string contacto = LeerOpcional($"Contacto [{e.Contacto}]: ", EsContactoValido);
            if (contacto != "") e.Contacto = contacto;

            _archivoServicio.GuardarEnArchivo(_estudiantes);
            Console.WriteLine("Datos actualizados correctamente.");
        }
        // 4. Ordenar y listar
        public void OrdenarYListar()
        {
            Console.Clear();
            Console.WriteLine("=========================================");
            Console.WriteLine("         ORDENAR ESTUDIANTES");
            Console.WriteLine("=========================================");
            Console.WriteLine("1. Por DNI");
            Console.WriteLine("2. Por apellidos");
            Console.WriteLine("3. Por nivel, grado y sección");
            int criterio = LeerEntero("Ordenar por: ", 1, 3);
            Comparison<Estudiante> comparar;

            if (criterio == 1)
                comparar = (a, b) => string.Compare(a.DNI, b.DNI, StringComparison.OrdinalIgnoreCase);
            else if (criterio == 2)
                comparar = (a, b) => string.Compare(a.Apellidos, b.Apellidos, StringComparison.OrdinalIgnoreCase);
            else
                comparar = (a, b) =>
                {
                    // Primero ordena por Nivel ("Primaria" va antes que "Secundaria" alfabéticamente)
                    int rNivel = string.Compare(a.Nivel, b.Nivel, StringComparison.OrdinalIgnoreCase);
                    if (rNivel != 0) return rNivel;

                    // Si son del mismo nivel, ordena por Grado
                    int rGrado = a.Grado.CompareTo(b.Grado);
                    if (rGrado != 0) return rGrado;

                    // Si son del mismo grado, ordena por Sección
                    return string.Compare(a.Seccion, b.Seccion, StringComparison.OrdinalIgnoreCase);
                };

            OrdenarBurbuja(_estudiantes, comparar);
            _archivoServicio.GuardarEnArchivo(_estudiantes);
            Console.WriteLine();
            MostrarLista(_estudiantes);
        }
        // 5. Listar todos
        public void ListarTodos()
        {
            MostrarLista(_estudiantes);
        }


        // ---------------------------------------------------------
        // Utilidades de consulta y visualización
        // ---------------------------------------------------------
        public static bool Contiene(string texto, string buscado)
        {
            return texto.IndexOf(buscado, StringComparison.OrdinalIgnoreCase) >= 0;
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
