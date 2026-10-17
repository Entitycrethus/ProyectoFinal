using System;
using System.Collections.Generic;
using System.Text;
namespace FundamentosDeAlgoritmos
{
    public class ConsolaUI
    {

        public static void MostrarMenu(int totalEstudiantes)
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
            Console.WriteLine($"Estudiantes registrados: {totalEstudiantes}");
            Console.WriteLine();
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

    }
}
