# ============================================
# Voice Listener for Claude Code
# Push-to-Talk Mode (F12 key)
# Author: Claude Code Integration
# ============================================

Add-Type -AssemblyName System.Speech
Add-Type -AssemblyName System.Windows.Forms

# ========== CONFIGURATION ==========
$OUTPUT_FILE = "voice-input.txt"
$BEEP_START = 800
$BEEP_END = 600
$LANGUAGE = "it-IT"
$CONFIDENCE_THRESHOLD = 0.6

# Technical terms dictionary (English words to recognize)
$TECHNICAL_TERMS = @(
    "API", "endpoint", "deploy", "commit", "push", "pull",
    "backend", "frontend", "database", "query", "JSON",
    "worker", "namespace", "secret", "token", "webhook",
    "customer", "order", "product", "inventory", "pflegebox",
    "submission", "form", "modal", "button", "CSS", "JavaScript",
    "HTML", "Liquid", "Shopify", "Cloudflare", "KV", "storage",
    "git", "GitHub", "branch", "merge", "clone", "repository",
    "function", "variable", "array", "object", "string",
    "fetch", "async", "await", "promise", "callback",
    "debug", "log", "console", "error", "warning"
)

# ========== INITIALIZATION ==========
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  🎤 Voice Listener per Claude Code ATTIVO" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⌨️  MODALITÀ: Push-to-Talk (F12)" -ForegroundColor Yellow
Write-Host "🇮🇹 LINGUA: Italiano + Termini Tecnici" -ForegroundColor Yellow
Write-Host "📁 OUTPUT: $OUTPUT_FILE" -ForegroundColor Yellow
Write-Host ""
Write-Host "📌 ISTRUZIONI:" -ForegroundColor White
Write-Host "   1. Tieni premuto F12" -ForegroundColor Gray
Write-Host "   2. Parla il tuo comando in italiano" -ForegroundColor Gray
Write-Host "   3. Rilascia F12 quando hai finito" -ForegroundColor Gray
Write-Host "   4. Il testo verrà inviato automaticamente" -ForegroundColor Gray
Write-Host ""
Write-Host "🔴 Per uscire: Premi CTRL+C" -ForegroundColor Red
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Initialize Speech Recognition
$recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$recognizer.SetInputToDefaultAudioDevice()

# Load Italian grammar
try {
    $culture = New-Object System.Globalization.CultureInfo($LANGUAGE)
    $recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine($culture)
    $recognizer.SetInputToDefaultAudioDevice()
    Write-Host "✅ Riconoscimento vocale italiano caricato" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Impossibile caricare lingua italiana, uso default" -ForegroundColor Yellow
    $recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
    $recognizer.SetInputToDefaultAudioDevice()
}

# Build grammar with dictation + technical terms
$grammarBuilder = New-Object System.Speech.Recognition.GrammarBuilder
$grammarBuilder.Culture = $culture

# Add dictation grammar for free-form Italian speech
$dictationGrammar = New-Object System.Speech.Recognition.DictationGrammar
$recognizer.LoadGrammar($dictationGrammar)

# Load grammars
Write-Host "✅ Grammatica caricata" -ForegroundColor Green

# Configure recognition settings
$recognizer.InitialSilenceTimeout = [TimeSpan]::FromSeconds(10)
$recognizer.BabbleTimeout = [TimeSpan]::FromSeconds(3)
$recognizer.EndSilenceTimeout = [TimeSpan]::FromSeconds(1.5)
$recognizer.EndSilenceTimeoutAmbiguous = [TimeSpan]::FromSeconds(2)

Write-Host "✅ Microfono configurato" -ForegroundColor Green
Write-Host ""
Write-Host "🎙️  In attesa... Premi F12 per parlare!" -ForegroundColor Cyan
Write-Host ""

# ========== GLOBAL STATE ==========
$script:isRecording = $false
$script:recordedText = ""
$script:recognitionComplete = $false

# ========== EVENT HANDLERS ==========

# Speech recognized event
$recognizer.Add_SpeechRecognized({
    param($sender, $e)

    if ($script:isRecording -and $e.Result.Confidence -ge $CONFIDENCE_THRESHOLD) {
        $text = $e.Result.Text
        $confidence = [math]::Round($e.Result.Confidence * 100, 0)

        Write-Host "📝 Riconosciuto [$confidence%]: " -NoNewline -ForegroundColor Green
        Write-Host $text -ForegroundColor White

        # Append to recorded text
        if ($script:recordedText -ne "") {
            $script:recordedText += " "
        }
        $script:recordedText += $text
    }
})

# Speech hypothesis (real-time feedback)
$recognizer.Add_SpeechHypothesized({
    param($sender, $e)

    if ($script:isRecording) {
        Write-Host "`r💭 Ascolto: $($e.Result.Text)                    " -NoNewline -ForegroundColor DarkGray
    }
})

# Recognition rejected (low confidence)
$recognizer.Add_SpeechRecognitionRejected({
    param($sender, $e)

    if ($script:isRecording) {
        Write-Host "`r⚠️  Non capito chiaramente, ripeti...                    " -NoNewline -ForegroundColor Yellow
    }
})

# ========== MAIN LOOP ==========

# Start recognition in async mode
$recognizer.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)

Write-Host "🟢 Sistema pronto!" -ForegroundColor Green
Write-Host ""

# Keyboard monitoring loop
while ($true) {
    # Check if F12 is pressed
    $f12State = [System.Windows.Forms.Control]::IsKeyLocked([System.Windows.Forms.Keys]::F12)
    $f12Pressed = [System.Windows.Forms.Control]::ModifierKeys -eq [System.Windows.Forms.Keys]::None -and
                  [System.Console]::KeyAvailable -eq $false -and
                  [System.Windows.Input.Keyboard]::IsKeyDown([System.Windows.Input.Key]::F12)

    # Alternative method using Win32 API
    Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        public class KeyCheck {
            [DllImport("user32.dll")]
            public static extern short GetAsyncKeyState(int vKey);
        }
"@

    $F12_KEY = 0x7B  # Virtual key code for F12
    $isF12Down = [KeyCheck]::GetAsyncKeyState($F12_KEY) -band 0x8000

    # Start recording when F12 is pressed
    if ($isF12Down -and -not $script:isRecording) {
        $script:isRecording = $true
        $script:recordedText = ""

        # Beep to indicate start
        [Console]::Beep($BEEP_START, 150)

        Write-Host ""
        Write-Host "🔴 REGISTRAZIONE..." -ForegroundColor Red -BackgroundColor White
        Write-Host "   (Parla ora, rilascia F12 quando finisci)" -ForegroundColor Yellow
        Write-Host ""
    }

    # Stop recording when F12 is released
    if (-not $isF12Down -and $script:isRecording) {
        $script:isRecording = $false

        # Beep to indicate end
        [Console]::Beep($BEEP_END, 150)

        Write-Host ""
        Write-Host "⏸️  REGISTRAZIONE TERMINATA" -ForegroundColor Yellow

        # Wait a moment for final recognition
        Start-Sleep -Milliseconds 500

        if ($script:recordedText -ne "") {
            Write-Host ""
            Write-Host "✅ TESTO COMPLETO:" -ForegroundColor Green
            Write-Host "   $($script:recordedText)" -ForegroundColor Cyan
            Write-Host ""

            # Save to file
            $script:recordedText | Out-File -FilePath $OUTPUT_FILE -Encoding UTF8 -Force

            Write-Host "💾 Salvato in: $OUTPUT_FILE" -ForegroundColor Green
            Write-Host "📤 Invio automatico al bridge..." -ForegroundColor Cyan

            # Double beep for confirmation
            [Console]::Beep(1000, 100)
            Start-Sleep -Milliseconds 100
            [Console]::Beep(1200, 100)

            Write-Host ""
            Write-Host "🎙️  Pronto per il prossimo comando! (Premi F12)" -ForegroundColor Cyan
            Write-Host ""
        } else {
            Write-Host "⚠️  Nessun testo riconosciuto. Riprova!" -ForegroundColor Yellow
            Write-Host ""
        }
    }

    # Small delay to prevent CPU hogging
    Start-Sleep -Milliseconds 50
}

# Cleanup (never reached unless CTRL+C)
$recognizer.RecognizeAsyncStop()
$recognizer.Dispose()
