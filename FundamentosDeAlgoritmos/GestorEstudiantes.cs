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
            _estudiantes = new List<Estudiante>();
        }

        public int CantidadEstudiantes => _estudiantes.Count;

        public Estudiante BuscarPorCodigo(string codigo)
        {
            foreach (Estudiante e in _estudiantes)
            {
                if (e.Codigo.Equals(codigo, StringComparison.OrdinalIgnoreCase))
                    return e;
            }
            return null;
        }

        // 1. Registrar
        public void RegistrarEstudiante()
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
            _estudiantes.Add(nuevo);
            _archivoServicio.GuardarEnArchivo(_estudiantes);
            Console.WriteLine("\nEstudiante registrado correctamente.");
        }
        // 2. Buscar
        public void BuscarEstudiante()
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
                foreach (Estudiante e in _estudiantes)
                {
                    if (Contiene(e.Nombres, texto) || Contiene(e.Apellidos, texto))
                        resultados.Add(e);
                }
            }
            else
            {
                int grado = LeerEntero("Grado (1 a 6): ", 1, 6);
                string seccion = LeerTexto("Sección: ", EsSeccionValida, "Ingrese una sola letra.");
                foreach (Estudiante e in _estudiantes)
                {
                    if (e.Grado == grado && e.Seccion.Equals(seccion, StringComparison.OrdinalIgnoreCase))
                        resultados.Add(e);
                }
            }
            Console.WriteLine();

            MostrarLista(resultados);
        }
        // 3. Modificar (dejar vacío = conservar el valor actual)
        public void ModificarEstudiante()
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
            _archivoServicio.GuardarEnArchivo(_estudiantes);
            Console.WriteLine("Datos actualizados correctamente.");
        }
        // 4. Ordenar y listar
        public void OrdenarYListar()
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
