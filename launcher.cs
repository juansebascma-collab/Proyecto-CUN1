using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Threading;

class Program
{
    private static Process pnpmProcess = null;
    private static bool isCleaningUp = false;

    [DllImport("Kernel32")]
    private static extern bool SetConsoleCtrlHandler(EventHandler handler, bool add);
    private delegate bool EventHandler(CtrlType sig);
    private static EventHandler handler;

    private enum CtrlType
    {
        CTRL_C_EVENT = 0,
        CTRL_BREAK_EVENT = 1,
        CTRL_CLOSE_EVENT = 2,
        CTRL_LOGOFF_EVENT = 5,
        CTRL_SHUTDOWN_EVENT = 6
    }

    private static bool ConsoleCtrlCheck(CtrlType sig)
    {
        KillProcessTree();
        return false;
    }

    static void Main(string[] args)
    {
        try { Console.Title = "HemoRed - Red Vital Hospitalaria & Banco de Sangre"; } catch {}
        try { Console.OutputEncoding = System.Text.Encoding.UTF8; } catch {}

        try
        {
            handler = new EventHandler(ConsoleCtrlCheck);
            SetConsoleCtrlHandler(handler, true);
        }
        catch {}

        Console.CancelKeyPress += (s, e) => {
            e.Cancel = true;
            KillProcessTree();
            Environment.Exit(0);
        };

        AppDomain.CurrentDomain.ProcessExit += (s, e) => KillProcessTree();

        PrintBanner();

        string projectDir = @"C:\Users\juan.cardenas_netcom\Documents\GitHub\Proyecto-CUN1";
        if (!Directory.Exists(projectDir))
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("[Error] No se encontró el proyecto en: " + projectDir);
            Console.ResetColor();
            Console.WriteLine("Presiona cualquier tecla para salir...");
            try { Console.ReadKey(); } catch {}
            return;
        }

        string wingetNode = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            @"Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.20.0-win-x64"
        );

        string currentPath = Environment.GetEnvironmentVariable("PATH") ?? "";
        if (Directory.Exists(wingetNode) && !currentPath.Contains(wingetNode))
        {
            Environment.SetEnvironmentVariable("PATH", wingetNode + ";" + currentPath);
        }

        string pnpmCmd = "pnpm";
        if (File.Exists(Path.Combine(wingetNode, "pnpm.cmd")))
        {
            pnpmCmd = Path.Combine(wingetNode, "pnpm.cmd");
        }

        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("-> Iniciando servicios de HemoRed...");
        Console.WriteLine("   • Servidor API:    http://localhost:4000");
        Console.WriteLine("   • Portal Web:      http://localhost:5173");
        Console.WriteLine("   • Base de datos:   MongoDB Atlas (con fallback automático)");
        Console.WriteLine();
        Console.ForegroundColor = ConsoleColor.DarkGray;
        Console.WriteLine("   (El navegador se abrirá automáticamente en cuanto los servicios estén listos)");
        Console.WriteLine("   (Para detener la aplicación, cierra esta ventana o presiona Ctrl+C)");
        Console.WriteLine("   -----------------------------------------------------------------");
        Console.ResetColor();

        // Lanzar hilo en segundo plano que espere a que el puerto 5173 esté listo para abrir el navegador
        Thread browserThread = new Thread(() =>
        {
            bool ready = false;
            for (int i = 0; i < 60; i++)
            {
                Thread.Sleep(500);
                if (pnpmProcess == null || pnpmProcess.HasExited) return;

                try
                {
                    HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://localhost:5173");
                    req.Timeout = 1000;
                    req.Method = "GET";
                    using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                    {
                        if (res.StatusCode == HttpStatusCode.OK)
                        {
                            ready = true;
                            break;
                        }
                    }
                }
                catch {}
            }

            if (ready)
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("\n[✔] ¡HemoRed listo! Abriendo http://localhost:5173 en tu navegador...");
                Console.ResetColor();
                OpenBrowser("http://localhost:5173");
            }
        });
        browserThread.IsBackground = true;
        browserThread.Start();

        try
        {
            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = "cmd.exe";
            psi.Arguments = string.Format("/c \"\"{0}\" dev\"", pnpmCmd);
            psi.WorkingDirectory = projectDir;
            psi.UseShellExecute = false;

            pnpmProcess = Process.Start(psi);
            if (pnpmProcess != null)
            {
                pnpmProcess.WaitForExit();
            }
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("[Error] Error al ejecutar el proceso: " + ex.Message);
            Console.ResetColor();
        }
        finally
        {
            KillProcessTree();
        }
    }

    private static void OpenBrowser(string url)
    {
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = url,
                UseShellExecute = true
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine("No se pudo abrir el navegador automáticamente: " + ex.Message);
        }
    }

    private static void KillProcessTree()
    {
        if (isCleaningUp) return;
        isCleaningUp = true;

        if (pnpmProcess != null && !pnpmProcess.HasExited)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo("taskkill", string.Format("/PID {0} /T /F", pnpmProcess.Id))
                {
                    CreateNoWindow = true,
                    UseShellExecute = false
                };
                Process p = Process.Start(psi);
                if (p != null) p.WaitForExit(3000);
            }
            catch {}
        }
    }

    private static void PrintBanner()
    {
        try { Console.Clear(); } catch {}
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine(@"
    ██╗  ██╗███████╗███╗   ███╗ ██████╗ ██████╗ ███████╗██████╗ 
    ██║  ██║██╔════╝████╗ ████║██╔═══██╗██╔══██╗██╔════╝██╔══██╗
    ███████║█████╗  ██╔████╔██║██║   ██║██████╔╝█████╗  ██║  ██║
    ██╔══██║██╔══╝  ██║╚██╔╝██║██║   ██║██╔══██╗██╔══╝  ██║  ██║
    ██║  ██║███████╗██║ ╚═╝ ██║╚██████╔╝██║  ██║███████╗██████╔╝
    ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═════╝ 
        ");
        Console.ForegroundColor = ConsoleColor.DarkRed;
        Console.WriteLine("   ✚ Red Vital Hospitalaria & Sistema Operativo de Banco de Sangre");
        Console.ResetColor();
        Console.WriteLine("   -----------------------------------------------------------------");
        Console.WriteLine();
    }
}
