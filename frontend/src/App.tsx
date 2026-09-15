import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { LivePerceptionView } from './components/LivePerceptionView';
import { SpatialRadar } from './components/SpatialRadar';
import { RiskPanel } from './components/RiskPanel';
import { SituationCard } from './components/SituationCard';
import { HapticSimulator } from './components/HapticSimulator';
import { EventTimeline } from './components/EventTimeline';
import { SystemStatusPanel } from './components/SystemStatusPanel';
import { ControlsPanel } from './components/ControlsPanel';
import { CalibrationModal } from './components/CalibrationModal';

import { usePerceptionWebSocket } from './hooks/usePerceptionWebSocket';
import { useCameraStream } from './hooks/useCameraStream';
import { audioAlertService } from './services/audioService';
import { hapticService } from './services/hapticService';
import type {
  UserMode,
  FramePerceptionResult,
  CalibrationSettings,
} from './types/perception';
import {
  createScenario1Frame,
  createScenario2Frame,
  createScenario3Frame,
} from './utils/demoData';

export const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<UserMode>('driver');
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState<boolean>(false);
  const [calibration, setCalibration] = useState<CalibrationSettings>({
    detection_confidence: 0.35,
    camera_height_m: 1.3,
    alert_sensitivity: 1.0,
    corridor_width: 0.40,
    alert_cooldown_sec: 2.5,
    audio_enabled: true,
    haptic_simulation_enabled: true,
  });

  const [perceptionResult, setPerceptionResult] = useState<FramePerceptionResult | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<Array<{
    id: string;
    time: string;
    title: string;
    detail: string;
    type: 'alert' | 'detection' | 'motion' | 'path';
    severity?: string;
  }>>([]);

  const lastAlertIdRef = useRef<string | null>(null);
  const demoAnimationRef = useRef<number | null>(null);

  // WebSocket Connection to Python Backend
  const { isConnected, sendFrame, sendMode, sendCalibration } = usePerceptionWebSocket({
    onResult: (result) => {
      if (sourceMode === 'webcam') {
        handlePerceptionUpdate(result);
      }
    },
  });

  // Camera & Stream Hook
  const {
    videoRef,
    sourceMode,
    setSourceMode,
    isStreaming,
    cameraError,
    startWebcam,
    stopStream,
  } = useCameraStream({
    targetFps: 12,
    onFrameCaptured: (base64) => {
      if (isConnected && sourceMode === 'webcam') {
        sendFrame(base64, activeMode);
      }
    },
  });

  // Central Perception Event & Alert Dispatcher
  const handlePerceptionUpdate = useCallback((result: FramePerceptionResult) => {
    setPerceptionResult(result);

    // Process Active Alerts
    if (result.active_alerts && result.active_alerts.length > 0) {
      const topAlert = result.active_alerts[0];
      
      if (topAlert.alert_id !== lastAlertIdRef.current) {
        lastAlertIdRef.current = topAlert.alert_id;

        // 1. Voice Guidance TTS
        if (isAudioEnabled) {
          audioAlertService.speak(topAlert.message);
          if (topAlert.severity === 'CRITICAL') {
            audioAlertService.playWarningBeep(880, 200);
          }
        }

        // 2. Haptic Simulator Pulse
        hapticService.triggerPattern(topAlert.haptic_pattern);

        // 3. Add to Timeline Log
        const nowStr = new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        setTimelineEvents((prev) => [
          {
            id: topAlert.alert_id + '-' + Date.now(),
            time: nowStr,
            title: `ALERT: ${topAlert.message}`,
            detail: `Direction: ${topAlert.direction} • Severity: ${topAlert.severity} • Risk: ${topAlert.risk_score}`,
            type: 'alert',
            severity: topAlert.severity,
          },
          ...prev.slice(0, 40),
        ]);
      }
    }
  }, [isAudioEnabled]);

  // Demo Scenario Animation Loop
  useEffect(() => {
    if (sourceMode === 'webcam') {
      if (demoAnimationRef.current) {
        cancelAnimationFrame(demoAnimationRef.current);
        demoAnimationRef.current = null;
      }
      return;
    }

    let progress = 0;
    let forward = true;
    let lastTime = performance.now();

    const renderLoop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (sourceMode === 'scenario1') {
        if (forward) {
          progress += dt * 0.35;
          if (progress >= 1.0) {
            progress = 1.0;
            forward = false;
          }
        } else {
          progress -= dt * 0.45;
          if (progress <= 0.0) {
            progress = 0.0;
            forward = true;
          }
        }
        const frameRes = createScenario1Frame(progress, activeMode);
        handlePerceptionUpdate(frameRes);
      } else if (sourceMode === 'scenario2') {
        const frameRes = createScenario2Frame(activeMode);
        handlePerceptionUpdate(frameRes);
      } else if (sourceMode === 'scenario3') {
        const frameRes = createScenario3Frame(activeMode);
        handlePerceptionUpdate(frameRes);
      }

      demoAnimationRef.current = requestAnimationFrame(renderLoop);
    };

    demoAnimationRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (demoAnimationRef.current) {
        cancelAnimationFrame(demoAnimationRef.current);
        demoAnimationRef.current = null;
      }
    };
  }, [sourceMode, activeMode, handlePerceptionUpdate]);

  // Handle Mode Change
  const handleSelectMode = (mode: UserMode) => {
    setActiveMode(mode);
    sendMode(mode);
    audioAlertService.speak(`Switched to ${mode.replace('_', ' ')} mode.`, true);
  };

  // Handle Calibration Change
  const handleSaveCalibration = (newCalib: CalibrationSettings) => {
    setCalibration(newCalib);
    sendCalibration(newCalib);
    audioAlertService.setEnabled(newCalib.audio_enabled);
    hapticService.setSimulationEnabled(newCalib.haptic_simulation_enabled);
  };

  // Audio Toggles
  const handleToggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    audioAlertService.setEnabled(newState);
  };

  const handleTestAudio = () => {
    audioAlertService.testSpeech();
  };

  const handleToggleStreaming = () => {
    if (isStreaming) {
      stopStream();
    } else {
      if (sourceMode === 'webcam') {
        startWebcam();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30">
      
      {/* Top Header */}
      <Header
        activeMode={activeMode}
        isConnected={isConnected}
        onOpenCalibration={() => setIsCalibrationOpen(true)}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-5">
        
        {/* User Mode Selector */}
        <ModeSelector
          currentMode={activeMode}
          onSelectMode={handleSelectMode}
        />

        {/* Current Situation Context Banner */}
        <SituationCard perceptionResult={perceptionResult} />

        {/* Core Vision & Spatial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left 7 Cols: Live Camera HUD View + Controls */}
          <div className="lg:col-span-7 space-y-4">
            <LivePerceptionView
              videoRef={videoRef}
              perceptionResult={perceptionResult}
              isStreaming={isStreaming}
              cameraError={cameraError}
              sourceMode={sourceMode}
            />

            <ControlsPanel
              sourceMode={sourceMode}
              onSelectSource={setSourceMode}
              isStreaming={isStreaming}
              onToggleStreaming={handleToggleStreaming}
              isAudioEnabled={isAudioEnabled}
              onToggleAudio={handleToggleAudio}
              onTestAudio={handleTestAudio}
              onOpenCalibration={() => setIsCalibrationOpen(true)}
            />
          </div>

          {/* Right 5 Cols: Spatial Radar + Risk Panel + Haptic Simulator */}
          <div className="lg:col-span-5 space-y-4">
            <SpatialRadar perceptionResult={perceptionResult} />
            <RiskPanel perceptionResult={perceptionResult} />
            <HapticSimulator />
          </div>
        </div>

        {/* Bottom Row: Event Timeline & System Telemetry Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <SystemStatusPanel
              perceptionResult={perceptionResult}
              isAudioEnabled={isAudioEnabled}
              isConnected={isConnected}
              isStreaming={isStreaming}
            />
          </div>

          <div className="lg:col-span-5">
            <EventTimeline
              events={timelineEvents}
              onClear={() => setTimelineEvents([])}
            />
          </div>
        </div>

        {/* Disclaimer */}
        <footer className="pt-4 pb-6 text-center text-xs text-slate-500 font-mono">
          <p>BlindSpot — Hackathon Research Prototype for RMK Innovate. Not a certified safety system.</p>
          <p className="text-[11px] text-slate-600 mt-1">All camera frames are processed locally in real-time. Privacy-by-design.</p>
        </footer>
      </main>

      {/* Calibration Modal */}
      <CalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        calibration={calibration}
        onChangeCalibration={handleSaveCalibration}
      />
    </div>
  );
};

export default App;
