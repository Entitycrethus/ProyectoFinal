// Prototipo académico: Registro y control de estudiantes
// I.E. N.º 80892 "Los Pinos" - Secretaría / Área administrativa
using FundamentosDeAlgoritmos;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using static FundamentosDeAlgoritmos.ConsolaUI;
using static FundamentosDeAlgoritmos.ArchivoServicio;
using static FundamentosDeAlgoritmos.GestorEstudiantes;
using static FundamentosDeAlgoritmos.ValidadorEstudiante;
namespace FundamentosDeAlgoritmos
{
    class Program
    {
        // Programa principal y menú 
        static void Main()
        {
            Console.OutputEncoding = Encoding.UTF8;
            ArchivoServicio archivoServicio = new ArchivoServicio();
            GestorEstudiantes gestor = new GestorEstudiantes(archivoServicio);


            int opcion;
            do
            {
                MostrarMenu(gestor.CantidadEstudiantes);
                opcion = LeerEntero("Seleccione una opción: ", 0, 5);
                Console.WriteLine();
                switch (opcion)
                {
                    case 1: gestor.RegistrarEstudiante(); break;
                    case 2: gestor.BuscarEstudiante(); break;
                    case 3: gestor.ModificarEstudiante(); break;
                    case 4: gestor.OrdenarYListar(); break;
                    case 5: gestor.ListarTodos(); break;
                    case 0: Console.WriteLine("Datos guardados. ¡Hasta pronto!"); break;
                }
                if (opcion != 0)
                {
                    Console.WriteLine("Presione una tecla para continuar...");
                    Console.ReadKey(true);
                }
            }
            while (opcion != 0);
        }
    }
}