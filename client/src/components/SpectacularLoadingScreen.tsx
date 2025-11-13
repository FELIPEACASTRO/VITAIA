import { motion, AnimatePresence } from "framer-motion";
import { Brain, Heart, Zap, Activity } from "lucide-react";
import { useEffect, useState } from "react";

interface SpectacularLoadingScreenProps {
  isLoading: boolean;
  loadingText?: string;
}

const loadingStages = [
  { icon: Brain, text: "Inicializando IA Médica...", color: "text-purple-500" },
  { icon: Activity, text: "Carregando Protocolos Clínicos...", color: "text-green-500" },
  { icon: Heart, text: "Sincronizando Dados do Paciente...", color: "text-red-500" },
  { icon: Zap, text: "Otimizando Performance...", color: "text-yellow-500" },
];

export default function SpectacularLoadingScreen({
  isLoading,
  loadingText = "Carregando VITAIA..."
}: SpectacularLoadingScreenProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % loadingStages.length);
    }, 1500);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center"
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-cyan-400/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 text-center">
            {/* Main Logo Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="mb-8"
            >
              <div className="relative">
                {/* Pulsing Ring */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-cyan-400 blur-xl"
                />

                {/* Main Circle */}
                <div className="relative w-32 h-32 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="text-white text-4xl font-bold"
                  >
                    V
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* VITAIA Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 mb-4"
            >
              VITAIA
            </motion.h1>

            {/* Loading Stage */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center gap-3 mb-8"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  {loadingStages[currentStage] && (() => {
                    const IconComponent = loadingStages[currentStage].icon;
                    return (
                      <IconComponent
                        className={`h-6 w-6 ${loadingStages[currentStage].color}`}
                      />
                    );
                  })()}
                </motion.div>
                <span className="text-white text-lg">
                  {loadingStages[currentStage]?.text || loadingText}
                </span>
              </motion.div>
            </AnimatePresence>

            {/* Progress Bar */}
            <div className="w-80 mx-auto mb-8">
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-cyan-400 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="text-center mt-2 text-white/70 text-sm">
                {Math.round(Math.min(progress, 100))}%
              </div>
            </div>

            {/* Loading Dots */}
            <div className="flex justify-center gap-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-cyan-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-white/60 text-sm mt-6"
            >
              A IA da Vida - Inteligência Artificial Médica
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
