// Prototipo académico: Registro y control de estudiantes
// I.E. N.º 80892 "Los Pinos" - Secretaría / Área administrativa
// Curso: Fundamentos de Programación
// Almacenamiento: archivo CSV (Alternativa 1 del informe)
// ============================================================
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
namespace RegistroEstudiantes
{
    // Datos del estudiante (sección 4.1 del informe)
    class Estudiante
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
    class Program
    {
        const string ArchivoCsv = "estudiantes.csv";
        static List<Estudiante> estudiantes = new List<Estudiante>();
        // ---------------------------------------------------------
        // Programa principal y menú (sección 4.2)
        // ---------------------------------------------------------
        static void Main()
        {
            Console.OutputEncoding = Encoding.UTF8;
            CargarDesdeArchivo();
            int opcion;
            do
            {
                MostrarMenu();
                opcion = LeerEntero("Seleccione una opción: ", 0, 5);
                Console.WriteLine();
                switch (opcion)
                {
                    case 1: RegistrarEstudiante(); break;
                    case 2: BuscarEstudiante(); break;
                    case 3: ModificarEstudiante(); break;
                    case 4: OrdenarYListar(); break;
                    case 5: MostrarLista(estudiantes); break;
                    case 0: Console.WriteLine("Datos guardados. ¡Hasta pronto!"); break;
                }
                if (opcion != 0)
                {
                    Console.WriteLine("\nPresione una tecla para continuar...");
                    Console.ReadKey(true);
                }
            } while (opcion != 0);
        }
        static void MostrarMenu()
        {
            Console.Clear();
            Console.WriteLine("====================================================");
            Console.WriteLine(" REGISTRO DE ESTUDIANTES - I.E.80892 - LOS PINOS");
            Console.WriteLine("====================================================");
            Console.WriteLine("1. Registrar estudiante");
            Console.WriteLine("2. Buscar estudiante");
            Console.WriteLine("3. Modificar datos de un estudiante");
            Console.WriteLine("4. Ordenar y listar estudiantes");
            Console.WriteLine("5. Listar todos los estudiantes");
            Console.WriteLine("0. Salir");
            Console.WriteLine("------------------------------------------");
            Console.WriteLine($"Estudiantes registrados: {estudiantes.Count}");
            Console.WriteLine();
        }
        // 1. Registrar
        static void RegistrarEstudiante()
        {
            Console.WriteLine("--- REGISTRAR ESTUDIANTE ---");
            string codigo;
            while (true)
            {
                codigo = LeerTexto("Codigo de estudante (8 digitos): ", EsCodigoValido,
                     "Código inválido. Solo esta permitido 8 digitos númericos.");
                if (BuscarPorCodigo(codigo) == null) break;
                Console.WriteLine("Ya existe un estudiante con ese código (registro duplicado).");
            }
            Estudiante nuevo = new Estudiante
            {
                Codigo = codigo.ToUpper(),
                Nombres = LeerTexto("Nombres: ", EsNombreValido, "Solo se permiten letras y espacios."),
                Apellidos = LeerTexto("Apellidos: ", EsNombreValido, "Solo se permiten letras y espacios."),
                Grado = LeerEntero("Grado (1 a 6): ", 1, 6),
                Seccion = LeerTexto("Sección (una letra A-Z): ", EsSeccionValida, "Ingrese una sola letra.").ToUpper(),
                Contacto = LeerTexto("Contacto (9 dígitos): ", EsContactoValido, "Debe tener exactamente 9 dígitos.")
            };
            estudiantes.Add(nuevo);
            GuardarEnArchivo();
            Console.WriteLine("\nEstudiante registrado correctamente.");
        }
        // 2. Buscar
        static void BuscarEstudiante()
        {
            Console.WriteLine("--- BUSCAR ESTUDIANTE ---");
            Console.WriteLine("1. Por código");
            Console.WriteLine("2. Por nombre o apellido");
            Console.WriteLine("3. Por grado y sección");
            int criterio = LeerEntero("Buscar por: ", 1, 3);
            List<Estudiante> resultados = new List<Estudiante>();
            if (criterio == 1)
            {
                string codigo = LeerTexto("Código: ", t => t.Length > 0, "Ingrese un código.");
                Estudiante e = BuscarPorCodigo(codigo);
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
        static void ModificarEstudiante()
        {
            Console.WriteLine("--- MODIFICAR ESTUDIANTE ---");
            string codigo = LeerTexto("Código del estudiante: ", t => t.Length > 0, "Ingrese un código.");
            Estudiante e = BuscarPorCodigo(codigo);
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
        static void OrdenarYListar()
        {
            Console.WriteLine("--- ORDENAR ESTUDIANTES ---");
            Console.WriteLine("1. Por código");
            Console.WriteLine("2. Por apellidos");
            Console.WriteLine("3. Por grado y sección");
            int criterio = LeerEntero("Ordenar por: ", 1, 3);
            Comparison<Estudiante> comparar;
            if (criterio == 1)
                comparar = (a, b) => string.Compare(a.Codigo, b.Codigo, StringComparison.OrdinalIgnoreCase);
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
        // Algoritmo de ordenamiento burbuja
        static void OrdenarBurbuja(List<Estudiante> lista, Comparison<Estudiante> comparar)
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
        // Archivos CSV
        static void CargarDesdeArchivo()
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
        static void GuardarEnArchivo()
        {
            List<string> lineas = new List<string> { "Codigo,Nombres,Apellidos,Grado,Seccion,Contacto" };
            foreach (Estudiante e in estudiantes)
                lineas.Add(e.ToCsv());
            File.WriteAllLines(ArchivoCsv, lineas, Encoding.UTF8);
        }
        // ---------------------------------------------------------
        // Utilidades de consulta y visualización
        // ---------------------------------------------------------
        static Estudiante BuscarPorCodigo(string codigo)
        {
            foreach (Estudiante e in estudiantes)
            {
                if (e.Codigo.Equals(codigo, StringComparison.OrdinalIgnoreCase))
                    return e;
            }
            return null;
        }
        static bool Contiene(string texto, string buscado)
        {
            return texto.IndexOf(buscado, StringComparison.OrdinalIgnoreCase) >= 0;
        }
        static void MostrarLista(List<Estudiante> lista)
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
        // Validaciones
        static bool EsCodigoValido(string t)
        {
            if (t.Length > 8 || t.Length < 8) return false;
            foreach (char c in t)
                if (!char.IsLetterOrDigit(c)) return false;
            return true;
        }
        static bool EsNombreValido(string t)
        {
            if (t.Length < 2) return false;
            foreach (char c in t)
                if (!char.IsLetter(c) && c != ' ') return false;
            return true;
        }
        static bool EsSeccionValida(string t)
        {
            return t.Length == 1 && char.IsLetter(t[0]);
        }
        static bool EsContactoValido(string t)
        {
            if (t.Length != 9) return false;
            foreach (char c in t)
                if (!char.IsDigit(c)) return false;
            return true;
        }
        // Lectura de datos con validación
        static string LeerTexto(string mensaje, Func<string, bool> validar, string error)
        {
            while (true)
            {
                Console.Write(mensaje);
                string entrada = (Console.ReadLine() ?? "").Trim();
                if (validar(entrada)) return entrada;
                Console.WriteLine(error);
            }
        }
        // Devuelve "" si el usuario no escribe nada; si escribe, debe ser válido
        static string LeerOpcional(string mensaje, Func<string, bool> validar)
        {
            while (true)
            {
                Console.Write(mensaje);
                string entrada = (Console.ReadLine() ?? "").Trim();
                if (entrada == "" || validar(entrada)) return entrada;
                Console.WriteLine("Dato inválido, intente nuevamente.");
            }
        }
        static int LeerEntero(string mensaje, int min, int max)
        {
            while (true)
            {
                Console.Write(mensaje);
                if (int.TryParse(Console.ReadLine(), out int valor) && valor >= min && valor <= max)
                    return valor;
                Console.WriteLine($"Ingrese un número entre {min} y {max}.");
            }
        }
    }
}