using System;
using System.Collections.Generic;
using System.Text;
using static FundamentosDeAlgoritmos.GestorEstudiantes;
namespace FundamentosDeAlgoritmos
{
    public class ConsolaUI
    {

        public static void MostrarMenu()
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



    }
}
