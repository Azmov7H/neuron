// components/simulation-runner/sim-controls.tsx
interface ControlsProps {
  learningRate: number;
  setLearningRate: (val: number) => void;
  layers: number;
  setLayers: (val: number) => void;
  epochs: number;
  setEpochs: (val: number) => void;
}

export function SimControls({ learningRate, setLearningRate, layers, setLayers, epochs, setEpochs }: ControlsProps) {
  return (
    <div className="absolute bottom-2 left-2 right-2 sm:top-1/2 sm:right-2 sm:left-auto sm:bottom-auto sm:-translate-y-1/2 sm:w-64 lg:right-6 lg:w-72 glass rounded-2xl p-4 sm:p-6 z-20 shadow-[0_0_40px_rgba(0,0,0,0.5)] border-primary/10 max-h-[60vh] sm:max-h-none overflow-y-auto">
      <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-4 sm:mb-6 uppercase tracking-widest">Variables</h3>
      
      <div className="space-y-6">
        {/* Learning Rate Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-muted-foreground">Learning Rate</label>
            <span className="text-xs font-mono text-primary">{learningRate.toFixed(2)}</span>
          </div>
          <input 
            type="range" min="0.01" max="1" step="0.01" value={learningRate} 
            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          />
        </div>

        {/* Layers Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-muted-foreground">Hidden Layers</label>
            <span className="text-xs font-mono text-primary">{layers}</span>
          </div>
          <input 
            type="range" min="1" max="6" step="1" value={layers} 
            onChange={(e) => setLayers(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          />
        </div>

        {/* Epochs Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-muted-foreground">Training Epochs</label>
            <span className="text-xs font-mono text-primary">{epochs}</span>
          </div>
          <input 
            type="range" min="10" max="500" step="10" value={epochs} 
            onChange={(e) => setEpochs(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          />
        </div>
      </div>

      <button className="w-full mt-6 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
        Reset Defaults
      </button>
    </div>
  );
}