using System;
using System.Collections.Generic;
using System.Text;

namespace FundamentosDeAlgoritmos
{
    public class ValidadorEstudiante
    {

        // Validaciones
        public static bool EsCodigoValido(string t)
        {
            if (t.Length > 8 || t.Length < 8) return false;
            foreach (char c in t)
                if (!char.IsLetterOrDigit(c)) return false;
            return true;
        }
        public static bool EsNombreValido(string t)
        {
            if (t.Length < 2) return false;
            foreach (char c in t)
                if (!char.IsLetter(c) && c != ' ') return false;
            return true;
        }
        public static bool EsSeccionValida(string t)
        {
            return t.Length == 1 && char.IsLetter(t[0]);
        }
        public static bool EsContactoValido(string t)
        {
            if (t.Length != 9) return false;
            foreach (char c in t)
                if (!char.IsDigit(c)) return false;
            return true;
        }

        // Lectura de datos con validación
        public static string LeerTexto(string mensaje, Func<string, bool> validar, string error)
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
        public static string LeerOpcional(string mensaje, Func<string, bool> validar)
        {
            while (true)
            {
                Console.Write(mensaje);
                string entrada = (Console.ReadLine() ?? "").Trim();
                if (entrada == "" || validar(entrada)) return entrada;
                Console.WriteLine("Dato inválido, intente nuevamente.");
            }
        }
        public static int LeerEntero(string mensaje, int min, int max)
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
