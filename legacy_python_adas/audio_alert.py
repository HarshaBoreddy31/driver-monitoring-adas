"""
Real-Time Automotive Audio Alarm System.
Synthesizes high-fidelity automotive warning chimes in-memory and plays them
directly through the Windows audio device / speakers using winsound.PlaySound.
Runs on a non-blocking background thread.
"""

import threading
import time
import io
import math
import struct
import platform

class AudioAlarmSystem:
    def __init__(self):
        self.is_windows = platform.system() == "Windows"
        self.is_muted = False
        self._alarm_level = 0  # 0: Off, 1: Caution Chime, 2: Critical Siren
        self._stop_event = threading.Event()
        self._thread = None
        self.last_played_time = 0

        # Pre-synthesize high-quality automotive alert WAV audio buffers
        self.caution_wav = self._synthesize_chime([(900, 0.15), (1350, 0.25)], volume=0.85)
        self.critical_wav = self._synthesize_siren([(2400, 0.08), (1800, 0.08), (2800, 0.12)], volume=0.95)
        self.brake_wav = self._synthesize_chime([(750, 0.12), (600, 0.18)], volume=0.80)

        # Start the background audio playback thread
        self._start_worker()

    def _synthesize_chime(self, tone_list, volume=0.85, sample_rate=44100):
        """
        Synthesize multi-tone chime (e.g. 2-tone pleasant seatbelt/lane chime).
        tone_list: list of (freq_hz, duration_sec)
        """
        buf = io.BytesIO()
        import wave
        with wave.open(buf, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)

            for freq, dur in tone_list:
                n_samples = int(sample_rate * dur)
                for i in range(n_samples):
                    # Apply smooth envelope (attack and decay) to prevent clicks
                    decay = 1.0 - (i / n_samples) * 0.4
                    val = int(volume * decay * 32767.0 * math.sin(2.0 * math.pi * freq * i / sample_rate))
                    val = max(-32767, min(32767, val))
                    wf.writeframes(struct.pack('<h', val))

                # Tiny gap between tones
                gap_samples = int(sample_rate * 0.02)
                for _ in range(gap_samples):
                    wf.writeframes(struct.pack('<h', 0))

        return buf.getvalue()

    def _synthesize_siren(self, tone_list, volume=0.95, sample_rate=44100):
        """
        Synthesize urgent high-frequency pulsating emergency alarm siren.
        """
        buf = io.BytesIO()
        import wave
        with wave.open(buf, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)

            for freq, dur in tone_list:
                n_samples = int(sample_rate * dur)
                for i in range(n_samples):
                    val = int(volume * 32767.0 * math.sin(2.0 * math.pi * freq * i / sample_rate))
                    val = max(-32767, min(32767, val))
                    wf.writeframes(struct.pack('<h', val))

        return buf.getvalue()

    def set_muted(self, muted: bool):
        self.is_muted = muted

    def toggle_mute(self):
        self.is_muted = not self.is_muted
        return self.is_muted

    def trigger_alarm(self, level: int):
        """
        Set alarm level:
        0: None
        1: Caution Chime (Lane / Early Drowsiness)
        2: Critical Microsleep Siren
        3: Emergency Braking Alert
        """
        self._alarm_level = level

    def stop_alarm(self):
        self._alarm_level = 0

    def _start_worker(self):
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._audio_loop, daemon=True)
        self._thread.start()

    def _audio_loop(self):
        while not self._stop_event.is_set():
            if self.is_muted or self._alarm_level == 0:
                time.sleep(0.04)
                continue

            try:
                if self.is_windows:
                    import winsound
                    now = time.time()
                    if self._alarm_level == 1:
                        # Caution Chime every 1.5 seconds
                        if now - self.last_played_time > 1.2:
                            winsound.PlaySound(self.caution_wav, winsound.SND_MEMORY)
                            self.last_played_time = time.time()
                        time.sleep(0.1)

                    elif self._alarm_level == 2:
                        # Critical Microsleep Pulsing Siren (Fast urgent repetition)
                        winsound.PlaySound(self.critical_wav, winsound.SND_MEMORY)
                        time.sleep(0.12)

                    elif self._alarm_level == 3:
                        # Emergency Braking Chime
                        winsound.PlaySound(self.brake_wav, winsound.SND_MEMORY)
                        time.sleep(0.4)
                else:
                    print("\a", end="", flush=True)
                    time.sleep(0.3)
            except Exception:
                time.sleep(0.1)

    def shutdown(self):
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=0.5)
