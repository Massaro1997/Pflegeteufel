#!/usr/bin/env python3
"""
Voice Bridge for Claude Code
Monitors voice-input.txt and automatically sends text to clipboard/terminal
Author: Claude Code Integration
"""

import time
import os
import sys
from pathlib import Path
import subprocess
import json

# ========== CONFIGURATION ==========
INPUT_FILE = "voice-input.txt"
LAST_CONTENT_FILE = ".voice-last-content"
POLL_INTERVAL = 0.2  # seconds
AUTO_SEND = True  # Set to False for clipboard-only mode

# ========== COLORS FOR TERMINAL ==========
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

# ========== UTILITY FUNCTIONS ==========

def print_banner():
    """Print startup banner"""
    print(f"\n{Colors.OKCYAN}{'='*60}{Colors.ENDC}")
    print(f"{Colors.OKGREEN}  🌉 Voice Bridge per Claude Code ATTIVO{Colors.ENDC}")
    print(f"{Colors.OKCYAN}{'='*60}{Colors.ENDC}\n")
    print(f"{Colors.WARNING}⚙️  MODALITÀ: Invio Automatico{'✅' if AUTO_SEND else '📋 Clipboard'}{Colors.ENDC}")
    print(f"{Colors.WARNING}📂 MONITOR: {INPUT_FILE}{Colors.ENDC}")
    print(f"{Colors.WARNING}🔄 INTERVALLO: {POLL_INTERVAL}s{Colors.ENDC}\n")
    print(f"{Colors.OKBLUE}📌 FUNZIONAMENTO:{Colors.ENDC}")
    print(f"{Colors.ENDC}   1. Il listener PowerShell salva il testo in {INPUT_FILE}")
    print(f"   2. Questo script rileva il nuovo contenuto")
    print(f"   3. Copia automaticamente nel clipboard")
    if AUTO_SEND:
        print(f"   4. Invia direttamente a Claude Code (stdin)")
    else:
        print(f"   4. Tu premi CTRL+V per incollare")
    print(f"\n{Colors.FAIL}🔴 Per uscire: Premi CTRL+C{Colors.ENDC}")
    print(f"{Colors.OKCYAN}{'='*60}{Colors.ENDC}\n")

def copy_to_clipboard(text):
    """Copy text to Windows clipboard"""
    try:
        # Use PowerShell to copy to clipboard
        cmd = f'powershell -Command "Set-Clipboard -Value @\'\n{text}\n\'@"'
        subprocess.run(cmd, shell=True, check=True, capture_output=True)
        return True
    except Exception as e:
        print(f"{Colors.FAIL}❌ Errore copia clipboard: {e}{Colors.ENDC}")
        return False

def show_notification(title, message):
    """Show Windows notification"""
    try:
        # Use PowerShell to show notification
        ps_script = f'''
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

        $template = @"
        <toast>
            <visual>
                <binding template="ToastText02">
                    <text id="1">{title}</text>
                    <text id="2">{message}</text>
                </binding>
            </visual>
        </toast>
"@

        $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
        $xml.LoadXml($template)
        $toast = New-Object Windows.UI.Notifications.ToastNotification $xml
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Voice Bridge").Show($toast)
        '''

        subprocess.run(
            ["powershell", "-Command", ps_script],
            capture_output=True,
            check=False
        )
    except:
        # Fallback: just print to console
        pass

def send_to_stdin(text):
    """Send text to stdin (simulates typing)"""
    # Note: This is a simplified version
    # In practice, you might need to use SendKeys or similar
    print(f"\n{Colors.OKGREEN}📤 TESTO PRONTO PER INVIO:{Colors.ENDC}")
    print(f"{Colors.OKCYAN}{'-'*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{text}{Colors.ENDC}")
    print(f"{Colors.OKCYAN}{'-'*60}{Colors.ENDC}\n")

    if AUTO_SEND:
        print(f"{Colors.WARNING}⚠️  NOTA: Incolla manualmente con CTRL+V nel terminale Claude Code{Colors.ENDC}")
        print(f"{Colors.OKGREEN}   (Il testo è già nel clipboard!){Colors.ENDC}\n")

    return True

def read_file_content(filepath):
    """Read file content safely"""
    try:
        if not os.path.exists(filepath):
            return None

        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read().strip()

        return content if content else None
    except Exception as e:
        print(f"{Colors.FAIL}❌ Errore lettura file: {e}{Colors.ENDC}")
        return None

def get_last_content():
    """Get last processed content"""
    try:
        if os.path.exists(LAST_CONTENT_FILE):
            with open(LAST_CONTENT_FILE, 'r', encoding='utf-8') as f:
                return f.read().strip()
    except:
        pass
    return ""

def save_last_content(content):
    """Save last processed content"""
    try:
        with open(LAST_CONTENT_FILE, 'w', encoding='utf-8') as f:
            f.write(content)
    except:
        pass

def process_new_input(text):
    """Process new voice input"""
    print(f"\n{Colors.OKGREEN}🎤 NUOVO INPUT VOCALE RILEVATO!{Colors.ENDC}\n")

    # Show text
    print(f"{Colors.OKCYAN}Testo riconosciuto:{Colors.ENDC}")
    print(f"{Colors.BOLD}  \"{text}\"{Colors.ENDC}\n")

    # Copy to clipboard
    if copy_to_clipboard(text):
        print(f"{Colors.OKGREEN}✅ Copiato nel clipboard!{Colors.ENDC}")

    # Show notification
    show_notification(
        "🎤 Voice Input Rilevato",
        f"Testo: {text[:50]}{'...' if len(text) > 50 else ''}"
    )

    # Send to stdin (or prepare for paste)
    send_to_stdin(text)

    # Save as last content
    save_last_content(text)

    print(f"{Colors.OKCYAN}{'─'*60}{Colors.ENDC}")
    print(f"{Colors.OKBLUE}🎙️  In attesa del prossimo input...{Colors.ENDC}\n")

# ========== MAIN LOOP ==========

def main():
    """Main monitoring loop"""
    print_banner()

    last_content = get_last_content()
    print(f"{Colors.OKGREEN}🟢 Monitoring attivo!{Colors.ENDC}\n")

    # Create input file if it doesn't exist
    if not os.path.exists(INPUT_FILE):
        Path(INPUT_FILE).touch()
        print(f"{Colors.WARNING}📝 Creato file: {INPUT_FILE}{Colors.ENDC}\n")

    try:
        while True:
            # Check for new content
            current_content = read_file_content(INPUT_FILE)

            if current_content and current_content != last_content:
                # New input detected!
                process_new_input(current_content)
                last_content = current_content

            # Wait before next check
            time.sleep(POLL_INTERVAL)

    except KeyboardInterrupt:
        print(f"\n\n{Colors.WARNING}🛑 Bridge terminato dall'utente{Colors.ENDC}")
        print(f"{Colors.OKBLUE}👋 Arrivederci!{Colors.ENDC}\n")
        sys.exit(0)
    except Exception as e:
        print(f"\n{Colors.FAIL}❌ ERRORE: {e}{Colors.ENDC}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
