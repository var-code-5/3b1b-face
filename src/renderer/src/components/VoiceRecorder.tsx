import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, RefreshCw } from 'lucide-react';
import { convertWebMToWav } from '../utils/audioConverter';

interface VoiceRecorderProps {
    onRecordingComplete: (blob: Blob) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            console.log("Requesting microphone access...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("Microphone access granted. Stream:", stream);

            // Check if tracks are active
            stream.getAudioTracks().forEach(track => {
                console.log(`Track: ${track.label}, Enabled: ${track.enabled}, Muted: ${track.muted}, ReadyState: ${track.readyState}`);
            });

            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const webmBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                console.log("Recording stopped. WebM Blob size:", webmBlob.size);
                
                // Convert WebM to WAV
                console.log("Converting WebM to WAV...");
                const wavBlob = await convertWebMToWav(webmBlob);
                console.log("Conversion complete. WAV Blob size:", wavBlob.size);
                
                setAudioBlob(wavBlob);
                onRecordingComplete(wavBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please check system permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const playRecording = () => {
        if (audioBlob) {
            try {
                const url = URL.createObjectURL(audioBlob);
                console.log("Playing audio from URL:", url);
                const audio = new Audio(url);
                audio.onended = () => {
                    console.log("Audio playback finished");
                    URL.revokeObjectURL(url); // Clean up
                };
                audio.onerror = (e) => {
                    console.error("Audio playback error:", e);
                    alert("Error playing audio. See console for details.");
                };
                audio.play().catch(e => {
                    console.error("Playback failed:", e);
                    alert("Playback failed: " + e.message);
                });
            } catch (err) {
                console.error("Error creating audio object:", err);
            }
        } else {
            console.warn("No audio blob to play");
        }
    };

    const resetRecording = () => {
        setAudioBlob(null);
        chunksRef.current = [];
        onRecordingComplete(new Blob([], { type: 'audio/webm' })); // Clear parent state if needed, though usually we just wait for new valid blob
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            {!audioBlob ? (
                <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "destructive" : "default"}
                    className={`w-full h-16 rounded-xl transition-all ${isRecording ? 'animate-pulse' : ''}`}
                    type="button"
                >
                    {isRecording ? <Square className="mr-2 h-6 w-6" /> : <Mic className="mr-2 h-6 w-6" />}
                    {isRecording ? "Stop Recording" : "Record Voice Sample"}
                </Button>
            ) : (
                <div className="flex flex-col gap-2 w-full">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center text-green-500 mb-2">
                        Voice sample recorded successfully!
                    </div>
                    <div className="flex gap-2 w-full">
                        <Button onClick={playRecording} variant="outline" className="flex-1" type="button">
                            <Play className="mr-2 h-4 w-4" /> Play
                        </Button>
                        <Button onClick={resetRecording} variant="outline" className="flex-1" type="button">
                            <RefreshCw className="mr-2 h-4 w-4" /> Retry
                        </Button>
                    </div>
                </div>
            )}
            {isRecording && <p className="text-sm text-red-500 animate-pulse">Recording... Speak clearly into the microphone.</p>}
        </div>
    );
};

export default VoiceRecorder;
