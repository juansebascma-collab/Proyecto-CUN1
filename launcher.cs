using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

class Program
{
    private static Process pnpmProcess = null;
    private static Process windowProcess = null;
    private static bool isCleaningUp = false;

    [STAThread]
    static void Main(string[] args)
    {
        AppDomain.CurrentDomain.ProcessExit += (s, e) => KillAllProcesses();

        string projectDir = @"C:\Users\juan.cardenas_netcom\Documents\GitHub\Proyecto-CUN1";
        if (!Directory.Exists(projectDir))
        {
            MessageBox.Show("No se encontró el directorio del proyecto en:\n" + projectDir,
                "HemoRed - Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
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

        // 1. Comprobar si los servicios ya están ejecutándose
        bool isAlreadyRunning = CheckUrl("http://127.0.0.1:5173");

        if (!isAlreadyRunning)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "cmd.exe";
                psi.Arguments = string.Format("/c \"\"{0}\" dev\"", pnpmCmd);
                psi.WorkingDirectory = projectDir;
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                psi.WindowStyle = ProcessWindowStyle.Hidden;

                pnpmProcess = Process.Start(psi);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error iniciando el servidor de HemoRed:\n" + ex.Message,
                    "HemoRed - Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            // Esperar hasta que el servidor web responda
            bool ready = false;
            for (int i = 0; i < 60; i++)
            {
                Thread.Sleep(500);
                if (CheckUrl("http://127.0.0.1:5173"))
                {
                    ready = true;
                    break;
                }
            }

            if (!ready)
            {
                MessageBox.Show("El servidor de HemoRed tardó demasiado en responder.\nIniciando ventana de todos modos...",
                    "HemoRed", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
        }

        // 2. Abrir la ventana de la aplicación nativa
        LaunchNativeApp(projectDir, wingetNode);
    }

    private static bool CheckUrl(string url)
    {
        try
        {
            HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
            req.Timeout = 800;
            req.Method = "GET";
            using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
            {
                return (int)res.StatusCode >= 200 && (int)res.StatusCode < 400;
            }
        }
        catch
        {
            return false;
        }
    }

    private static void LaunchNativeApp(string projectDir, string wingetNode)
    {
        try
        {
            // Prioridad 1: Electron (Aplicación de escritorio nativa)
            string electronCmd = Path.Combine(projectDir, @"node_modules\.bin\electron.cmd");
            string electronExe = null;

            string pnpmDir = Path.Combine(projectDir, @"node_modules\.pnpm");
            if (Directory.Exists(pnpmDir))
            {
                string[] match = Directory.GetFiles(pnpmDir, "electron.exe", SearchOption.AllDirectories);
                if (match != null && match.Length > 0)
                {
                    electronExe = match[0];
                }
            }

            if (!string.IsNullOrEmpty(electronExe) && File.Exists(electronExe))
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = electronExe;
                psi.Arguments = ".";
                psi.WorkingDirectory = projectDir;
                psi.UseShellExecute = false;

                windowProcess = Process.Start(psi);
                if (windowProcess != null)
                {
                    windowProcess.WaitForExit();
                    KillAllProcesses();
                    return;
                }
            }
            else if (File.Exists(electronCmd))
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "cmd.exe";
                psi.Arguments = string.Format("/c \"\"{0}\" .\"", electronCmd);
                psi.WorkingDirectory = projectDir;
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;

                windowProcess = Process.Start(psi);
                if (windowProcess != null)
                {
                    windowProcess.WaitForExit();
                    KillAllProcesses();
                    return;
                }
            }

            // Prioridad 2: Standalone Desktop Window vía Microsoft Edge App Mode
            string edgeExe = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
            if (!File.Exists(edgeExe))
            {
                edgeExe = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
            }

            string chromeExe = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
            if (!File.Exists(chromeExe))
            {
                chromeExe = @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";
            }

            string browserApp = File.Exists(edgeExe) ? edgeExe : (File.Exists(chromeExe) ? chromeExe : null);

            if (!string.IsNullOrEmpty(browserApp))
            {
                string userProfile = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    @"HemoRed\Profile"
                );

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = browserApp;
                psi.Arguments = string.Format(
                    "--app=\"http://localhost:5173\" --user-data-dir=\"{0}\" --window-size=1280,820 --app-id=HemoRed",
                    userProfile
                );
                psi.UseShellExecute = false;

                windowProcess = Process.Start(psi);
                if (windowProcess != null)
                {
                    windowProcess.WaitForExit();
                    KillAllProcesses();
                    return;
                }
            }

            // Prioridad 3: Respaldo estándar de navegación
            Process.Start(new ProcessStartInfo
            {
                FileName = "http://localhost:5173",
                UseShellExecute = true
            });
        }
        catch (Exception ex)
        {
            MessageBox.Show("Error abriendo la interfaz:\n" + ex.Message, "HemoRed", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        finally
        {
            KillAllProcesses();
        }
    }

    private static void KillAllProcesses()
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
}
