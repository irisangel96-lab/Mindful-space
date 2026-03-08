import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Upload, X, Music, Mic, MicOff } from 'lucide-react';
import { ambientAudio } from './utils/audio';

const SCRIPTS = [
  { progress: 0.0, text: "找一个舒服的坐姿，然后闭上眼睛..." },
  { progress: 0.05, text: "想象自己是一片随风飞舞的树叶..." },
  { progress: 0.1, text: "想象自己的身体变得轻盈起来..." },
  { progress: 0.15, text: "飞过一条街，又一条街..." },
  { progress: 0.2, text: "不要昏沉下去... 我们要放松肌肉，但不能失去对肌肉的控制..." },
  { progress: 0.25, text: "做三次深呼吸，用鼻子吸气，然后缓缓用嘴吐气..." },
  { progress: 0.3, text: "重复练习，直到你习惯这种呼吸方式，不会为了呼吸而分神..." },
  { progress: 0.35, text: "习惯后，在脑海中勾勒出你的坐姿，想象你正在观察着自己的身体..." },
  { progress: 0.4, text: "把注意力放在脚趾，放松它们；然后把注意力放在双脚，放松脚部肌肉..." },
  { progress: 0.45, text: "想象这些肌肉正随着你的呼吸慢慢融化。如果思维飘散，只要重新把注意力集中回来就好..." },
  { progress: 0.5, text: "成功放松了脚趾和双脚之后，将这项练习向上延伸，来放松你的小腿和大腿..." },
  { progress: 0.55, text: "然后，放松腹部和胸部的肌肉..." },
  { progress: 0.6, text: "接下来观想你的脊椎，沿着脊椎放松两侧的肌肉，继续放松肩部和颈部的肌肉..." },
  { progress: 0.65, text: "最后，放松面部和头皮的肌肉..." },
  { progress: 0.7, text: "当全身肌肉都得到放松，体会一下这种充满平静的感觉。你会感到很舒服..." },
  { progress: 0.75, text: "如果感到困倦甚至入睡都很正常。多点耐心，善待自己..." },
  { progress: 0.8, text: "现在将注意力集中在你的心脏上，一边缓慢呼吸，一边放松心脏的肌肉..." },
  { progress: 0.85, text: "你会发现随着身体的放松和呼吸的放缓，你的心率也会下降..." },
  { progress: 0.9, text: "想象身体已经完全放松，感受当下这种单纯的存在感，感受这种温暖和内外的平静..." },
  { progress: 0.94, text: "继续慢慢地吸气，缓缓地吐气。刻意记住这种放松、平静而温暖的感觉..." },
  { progress: 0.97, text: "现在慢慢睁开双眼..." },
  { progress: 0.99, text: "坐上几分钟，让大脑中没有任何想法或企图。" }
];

const DURATIONS = [
  { label: '3 分钟', value: 3 * 60 },
  { label: '5 分钟', value: 5 * 60 },
  { label: '10 分钟', value: 10 * 60 },
];

export default function App() {
  const [duration, setDuration] = useState(DURATIONS[1].value);
  const [timeLeft, setTimeLeft] = useState(DURATIONS[1].value);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentScript, setCurrentScript] = useState(SCRIPTS[0].text);
  
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [customBgmUrl, setCustomBgmUrl] = useState<string | null>(null);
  const [customBgmName, setCustomBgmName] = useState<string | null>(null);
  
  const bgmRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Play TTS when script changes using browser's native SpeechSynthesis
  useEffect(() => {
    if (isActive && isTtsEnabled && !isMuted) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentScript);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85; // Slower for meditation
      utterance.pitch = 0.95; // Slightly lower pitch
      window.speechSynthesis.speak(utterance);
    }
  }, [currentScript, isActive, isTtsEnabled, isMuted]);

  useEffect(() => {
    let interval: number | undefined;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      ambientAudio.stop();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  useEffect(() => {
    const progress = 1 - timeLeft / duration;
    const script = [...SCRIPTS].reverse().find(s => progress >= s.progress);
    if (script && script.text !== currentScript) {
      setCurrentScript(script.text);
    }
  }, [timeLeft, duration, currentScript]);

  const toggleTimer = () => {
    if (!isActive) {
      if (!isMuted) {
        if (customBgmUrl) bgmRef.current?.play();
        else ambientAudio.play();
      }
    } else {
      if (customBgmUrl) bgmRef.current?.pause();
      else ambientAudio.stop();
      window.speechSynthesis.cancel();
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(duration);
    setCurrentScript(SCRIPTS[0].text);
    if (customBgmUrl) {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.currentTime = 0;
      }
    } else {
      ambientAudio.stop();
    }
    window.speechSynthesis.cancel();
  };

  const changeDuration = (newDuration: number) => {
    setIsActive(false);
    setDuration(newDuration);
    setTimeLeft(newDuration);
    setCurrentScript(SCRIPTS[0].text);
    if (customBgmUrl) {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.currentTime = 0;
      }
    } else {
      ambientAudio.stop();
    }
    window.speechSynthesis.cancel();
  };

  const toggleMute = () => {
    if (isMuted && isActive) {
      if (customBgmUrl) bgmRef.current?.play();
      else ambientAudio.play();
    } else {
      if (customBgmUrl) bgmRef.current?.pause();
      else ambientAudio.stop();
      window.speechSynthesis.cancel();
    }
    setIsMuted(!isMuted);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomBgmUrl(url);
      setCustomBgmName(file.name);
      if (isActive && !isMuted) {
        ambientAudio.stop();
        setTimeout(() => {
          bgmRef.current?.play();
        }, 100);
      }
    }
  };

  const clearCustomBgm = () => {
    if (customBgmUrl) URL.revokeObjectURL(customBgmUrl);
    setCustomBgmUrl(null);
    setCustomBgmName(null);
    if (isActive && !isMuted) {
      bgmRef.current?.pause();
      ambientAudio.play();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center relative py-6">
      <div className="atmosphere" />
      <audio ref={bgmRef} src={customBgmUrl || undefined} loop />

      <main className="z-10 flex flex-col items-center w-full max-w-2xl px-4 sm:px-6 flex-1 justify-center">
        
        {/* Breathing Circle Visualization */}
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 mb-8 sm:mb-12 flex items-center justify-center shrink-0">
          <motion.div
            className="absolute inset-0 rounded-full border border-white/10 bg-white/5"
            animate={isActive ? {
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.6, 0.3]
            } : {
              scale: 1,
              opacity: 0.3
            }}
            transition={{
              duration: 8, // 4s inhale, 4s exhale
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <div className="text-4xl sm:text-5xl font-light tracking-widest text-white/90 font-mono">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Guided Script */}
        <div className="h-24 sm:h-32 flex items-center justify-center w-full text-center mb-8 sm:mb-12 px-2">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentScript}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="lyric-content"
            >
              {currentScript}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="glass-panel p-4 sm:p-6 flex flex-col items-center gap-4 sm:gap-6 w-full mt-auto sm:mt-0">
          <div className="flex items-center gap-6 sm:gap-8">
            <button
              onClick={toggleMute}
              className="p-3 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              title={isMuted ? "开启声音" : "静音"}
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>

            <button
              onClick={toggleTimer}
              className="w-16 h-16 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white"
            >
              {isActive ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
            </button>

            <button
              onClick={resetTimer}
              className="p-3 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              title="重置"
            >
              <RotateCcw size={24} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-4 border-t border-white/10 pt-4 sm:pt-6 w-full justify-center">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => changeDuration(d.value)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm transition-colors ${
                  duration === d.value
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Extra Controls: TTS & Custom BGM */}
          <div className="flex flex-col gap-4 border-t border-white/10 pt-4 sm:pt-6 w-full">
            <div className="flex flex-row justify-between items-center w-full px-1 sm:px-2 gap-2">
              <button 
                onClick={() => {
                  setIsTtsEnabled(!isTtsEnabled);
                  if (isTtsEnabled) window.speechSynthesis.cancel();
                }}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm transition-colors flex-1 sm:flex-none ${isTtsEnabled ? 'bg-white/20 text-white border border-white/20' : 'text-white/50 hover:bg-white/10 border border-transparent'}`}
              >
                {isTtsEnabled ? <Mic size={14} className="sm:w-4 sm:h-4" /> : <MicOff size={14} className="sm:w-4 sm:h-4" />}
                <span className="whitespace-nowrap">语音引导</span>
              </button>
              
              <div className="flex items-center justify-center flex-1 sm:flex-none">
                {customBgmName ? (
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm text-white/80 border border-white/20 w-full sm:w-auto justify-center">
                    <Music size={14} className="sm:w-4 sm:h-4 shrink-0" />
                    <span className="max-w-[80px] sm:max-w-[120px] truncate">{customBgmName}</span>
                    <button onClick={clearCustomBgm} className="hover:text-white ml-1 shrink-0"><X size={14} /></button>
                  </div>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm text-white/50 hover:bg-white/10 hover:text-white transition-colors border border-transparent w-full sm:w-auto"
                  >
                    <Upload size={14} className="sm:w-4 sm:h-4 shrink-0" />
                    <span className="whitespace-nowrap">自定义音乐</span>
                  </button>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="audio/*" 
                  className="hidden" 
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
