
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../components/GameEngine';
import { VoiceController } from '../components/VoiceController';
import { AudioManager } from '../components/AudioManager';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, Mic, MicOff, Play, Pause, RotateCcw, Info, User, Target, AlertTriangle, Trees, Home, Mountain } from 'lucide-react';

const Index = () => {
  const [gameState, setGameState] = useState({
    isPlaying: false,
    mode: 'practice', // 'practice' or 'adventure'
    score: 0,
    lives: 3,
    currentLevel: 1,
    isListening: false,
    gameStarted: false
  });

  const [visualState, setVisualState] = useState({
    playerPosition: { x: 0, z: 0 },
    environment: null,
    objectives: [],
    hazards: []
  });

  const [logs, setLogs] = useState<string[]>([]);
  const gameEngineRef = useRef<any>(null);
  const voiceControllerRef = useRef<any>(null);
  const audioManagerRef = useRef<any>(null);

  useEffect(() => {
    // Initialize game components
    audioManagerRef.current = new AudioManager();
    voiceControllerRef.current = new VoiceController({
      onCommand: handleVoiceCommand,
      onListeningChange: (listening: boolean) => {
        setGameState(prev => ({ ...prev, isListening: listening }));
      }
    });
    
    gameEngineRef.current = new GameEngine({
      audioManager: audioManagerRef.current,
      voiceController: voiceControllerRef.current,
      onStateChange: handleGameStateChange,
      onLog: addLog,
      onVisualUpdate: handleVisualUpdate
    });

    // Welcome message
    setTimeout(() => {
      addLog("Welcome to EchoVerse! Use voice commands or keyboard shortcuts to navigate.");
      audioManagerRef.current?.speak("Welcome to EchoVerse, an immersive audio adventure. Press Start Game or say 'start game' to begin your journey.");
    }, 1000);

    return () => {
      gameEngineRef.current?.cleanup();
      voiceControllerRef.current?.cleanup();
      audioManagerRef.current?.cleanup();
    };
  }, []);

  const handleVoiceCommand = (command: string) => {
    addLog(`Voice command: ${command}`);
    gameEngineRef.current?.processCommand(command);
  };

  const handleGameStateChange = (newState: any) => {
    setGameState(prev => ({ ...prev, ...newState }));
  };

  const handleVisualUpdate = (visualData: any) => {
    setVisualState(visualData);
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const startGame = () => {
    gameEngineRef.current?.startGame(gameState.mode);
    setGameState(prev => ({ ...prev, gameStarted: true, isPlaying: true }));
  };

  const toggleMode = () => {
    const newMode = gameState.mode === 'practice' ? 'adventure' : 'practice';
    setGameState(prev => ({ ...prev, mode: newMode }));
    audioManagerRef.current?.speak(`Switched to ${newMode} mode`);
  };

  const resetGame = () => {
    gameEngineRef.current?.resetGame();
    setGameState(prev => ({ 
      ...prev, 
      gameStarted: false, 
      isPlaying: false, 
      score: 0, 
      lives: 3, 
      currentLevel: 1 
    }));
    setVisualState({
      playerPosition: { x: 0, z: 0 },
      environment: null,
      objectives: [],
      hazards: []
    });
  };

  const toggleListening = () => {
    if (gameState.isListening) {
      voiceControllerRef.current?.stopListening();
    } else {
      voiceControllerRef.current?.startListening();
    }
  };

  const renderGameMap = () => {
    const mapSize = 600; // Much larger visual map size
    const gridSize = visualState.environment?.size || { x: 10, z: 10 };
    const scale = mapSize / Math.max(gridSize.x, gridSize.z);
    
    const getVisualPosition = (gamePos: { x: number, z: number }) => ({
      x: (gamePos.x + gridSize.x / 2) * scale,
      y: (gamePos.z + gridSize.z / 2) * scale
    });

    // Environment-specific styling and graphics
    const getEnvironmentStyle = () => {
      if (!visualState.environment) return 'bg-gray-800';
      
      switch (visualState.environment.soundscape) {
        case 'forest':
          return 'bg-gradient-to-br from-green-900 via-green-800 to-green-700';
        case 'cave':
          return 'bg-gradient-to-br from-gray-900 via-stone-800 to-stone-900';
        default:
          return 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700';
      }
    };

    const renderEnvironmentGraphics = () => {
      if (!visualState.environment) return null;
      
      const graphics = [];
      const environmentType = visualState.environment.soundscape;
      
      // Generate environmental elements based on type
      if (environmentType === 'forest') {
        // Add trees scattered around
        for (let i = 0; i < 15; i++) {
          const x = Math.random() * (mapSize - 40) + 20;
          const y = Math.random() * (mapSize - 40) + 20;
          graphics.push(
            <div
              key={`tree-${i}`}
              className="absolute w-6 h-6 text-green-400 opacity-60"
              style={{ left: x, top: y }}
            >
              <Trees size={24} />
            </div>
          );
        }
        
        // Add some darker forest patches
        for (let i = 0; i < 8; i++) {
          const x = Math.random() * (mapSize - 80) + 40;
          const y = Math.random() * (mapSize - 80) + 40;
          const size = 30 + Math.random() * 40;
          graphics.push(
            <div
              key={`patch-${i}`}
              className="absolute bg-green-900/40 rounded-full"
              style={{ 
                left: x, 
                top: y, 
                width: size, 
                height: size 
              }}
            />
          );
        }
      } else if (environmentType === 'cave') {
        // Add rock formations
        for (let i = 0; i < 12; i++) {
          const x = Math.random() * (mapSize - 30) + 15;
          const y = Math.random() * (mapSize - 30) + 15;
          const size = 20 + Math.random() * 30;
          graphics.push(
            <div
              key={`rock-${i}`}
              className="absolute bg-stone-600/50 rounded-lg border border-stone-500/30"
              style={{ 
                left: x, 
                top: y, 
                width: size, 
                height: size 
              }}
            />
          );
        }
        
        // Add stalactites/stalagmites
        for (let i = 0; i < 6; i++) {
          const x = Math.random() * (mapSize - 20) + 10;
          const y = Math.random() * (mapSize - 20) + 10;
          graphics.push(
            <div
              key={`stalactite-${i}`}
              className="absolute w-4 h-4 text-stone-400 opacity-70"
              style={{ left: x, top: y }}
            >
              <Mountain size={16} />
            </div>
          );
        }
      } else {
        // Practice room - add room elements
        const roomPadding = 40;
        // Room walls
        graphics.push(
          <div
            key="room-outline"
            className="absolute border-2 border-blue-400/50 rounded-lg"
            style={{
              left: roomPadding,
              top: roomPadding,
              width: mapSize - roomPadding * 2,
              height: mapSize - roomPadding * 2
            }}
          />
        );
        
        // Add furniture/room elements
        const furniture = [
          { icon: Home, x: roomPadding + 20, y: roomPadding + 20, color: 'text-blue-300' },
          { icon: Home, x: mapSize - roomPadding - 40, y: roomPadding + 20, color: 'text-blue-300' },
          { icon: Home, x: roomPadding + 20, y: mapSize - roomPadding - 40, color: 'text-blue-300' },
          { icon: Home, x: mapSize - roomPadding - 40, y: mapSize - roomPadding - 40, color: 'text-blue-300' }
        ];
        
        furniture.forEach((item, index) => {
          graphics.push(
            <div
              key={`furniture-${index}`}
              className={`absolute w-6 h-6 ${item.color} opacity-50`}
              style={{ left: item.x, top: item.y }}
            >
              <item.icon size={24} />
            </div>
          );
        });
      }
      
      return graphics;
    };

    return (
      <div className="relative rounded-lg border-2 border-gray-600 overflow-hidden shadow-2xl" 
           style={{ width: mapSize + 40, height: mapSize + 40 }}>
        {/* Environment background */}
        <div className={`absolute inset-2 rounded ${getEnvironmentStyle()}`} 
             style={{ 
               backgroundImage: `
                 linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
               `,
               backgroundSize: `${scale * 2}px ${scale * 2}px`
             }}>
          
          {/* Environment graphics */}
          {renderEnvironmentGraphics()}
          
          {/* Player position with larger, more visible design */}
          <div 
            className="absolute w-8 h-8 bg-cyan-400 rounded-full border-3 border-white shadow-lg transform -translate-x-4 -translate-y-4 z-20 animate-pulse"
            style={{ 
              left: getVisualPosition(visualState.playerPosition).x,
              top: getVisualPosition(visualState.playerPosition).y
            }}
            title="Player Position"
          >
            <User size={20} className="absolute inset-1 text-gray-900" />
            {/* Player direction indicator */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-1 h-4 bg-cyan-300 rounded-full opacity-80"></div>
          </div>

          {/* Player trail - show last few positions */}
          <div 
            className="absolute w-4 h-4 bg-cyan-300/60 rounded-full transform -translate-x-2 -translate-y-2 z-10"
            style={{ 
              left: getVisualPosition(visualState.playerPosition).x - 10,
              top: getVisualPosition(visualState.playerPosition).y
            }}
          />
          <div 
            className="absolute w-3 h-3 bg-cyan-300/40 rounded-full transform -translate-x-1.5 -translate-y-1.5 z-10"
            style={{ 
              left: getVisualPosition(visualState.playerPosition).x - 20,
              top: getVisualPosition(visualState.playerPosition).y
            }}
          />

          {/* Objectives with enhanced visibility */}
          {visualState.objectives.map((objective: any, index: number) => {
            const pos = getVisualPosition(objective.position);
            return (
              <div key={index} className="relative">
                {/* Objective glow effect */}
                <div
                  className="absolute w-12 h-12 bg-green-400/20 rounded-full animate-pulse transform -translate-x-6 -translate-y-6"
                  style={{ left: pos.x, top: pos.y }}
                />
                <div
                  className="absolute w-6 h-6 bg-green-400 rounded-full border-2 border-white shadow-lg transform -translate-x-3 -translate-y-3 z-15"
                  style={{ left: pos.x, top: pos.y }}
                  title={objective.description}
                >
                  <Target size={16} className="absolute inset-1 text-gray-900" />
                </div>
              </div>
            );
          })}

          {/* Hazards with enhanced visibility */}
          {visualState.hazards?.map((hazard: any, index: number) => {
            const pos = getVisualPosition(hazard.position);
            return (
              <div key={index} className="relative">
                {/* Hazard warning effect */}
                <div
                  className="absolute w-12 h-12 bg-red-500/20 rounded-full animate-pulse transform -translate-x-6 -translate-y-6"
                  style={{ left: pos.x, top: pos.y }}
                />
                <div
                  className="absolute w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg transform -translate-x-3 -translate-y-3 z-15"
                  style={{ left: pos.x, top: pos.y }}
                  title={hazard.description}
                >
                  <AlertTriangle size={16} className="absolute inset-1 text-white" />
                </div>
              </div>
            );
          })}

          {/* Starting position marker */}
          <div 
            className="absolute w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-md transform -translate-x-2 -translate-y-2 z-10"
            style={{ 
              left: getVisualPosition({ x: 0, z: 0 }).x,
              top: getVisualPosition({ x: 0, z: 0 }).y
            }}
            title="Starting Position"
          >
            <div className="absolute inset-1 bg-yellow-600 rounded-full"></div>
          </div>

          {/* Compass rose */}
          <div className="absolute top-4 right-4 w-16 h-16 border-2 border-white/50 rounded-full bg-black/30 backdrop-blur-sm">
            <div className="absolute inset-2 text-white text-xs flex flex-col justify-between items-center">
              <div>N</div>
              <div className="flex justify-between w-full">
                <span>W</span>
                <span>E</span>
              </div>
              <div>S</div>
            </div>
          </div>

          {/* Environment name overlay */}
          {visualState.environment && (
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-2 rounded-lg border border-white/20">
              <div className="text-sm font-bold">{visualState.environment.name}</div>
              <div className="text-xs text-gray-300">
                Size: {gridSize.x} × {gridSize.z} units
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 font-mono">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold mb-4 text-cyan-400 tracking-wider">
          ECHOVERSE
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          AI-Powered Voice-Controlled Audio Adventure
        </p>
        
        {/* Game Description */}
        <Card className="bg-gray-800 border-gray-700 p-6 mb-6 max-w-4xl mx-auto">
          <div className="flex items-start gap-3 mb-4">
            <Info className="text-cyan-400 mt-1 flex-shrink-0" size={20} />
            <h2 className="text-2xl font-bold text-cyan-400 text-left">About EchoVerse</h2>
          </div>
          
          <div className="text-left space-y-4 text-gray-300">
            <p className="text-lg leading-relaxed">
              <strong className="text-white">EchoVerse</strong> is an immersive audio adventure game designed specifically for accessibility. 
              Navigate mysterious worlds using only your voice and spatial audio cues.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="text-lg font-bold text-yellow-400 mb-3">🎮 Game Modes</h3>
                <ul className="space-y-2 text-sm">
                  <li><strong className="text-cyan-300">Practice Mode:</strong> Learn controls in a safe environment</li>
                  <li><strong className="text-cyan-300">Adventure Mode:</strong> Explore challenging environments with objectives</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-yellow-400 mb-3">🔊 Key Features</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Voice-controlled navigation and interactions</li>
                  <li>• Spatial 3D audio for environmental awareness</li>
                  <li>• AI-powered narration and feedback</li>
                  <li>• Fully accessible interface design</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-900 p-4 rounded-lg mt-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-2">🎯 How to Play</h3>
              <p className="text-sm">
                Use voice commands like "go left", "go forward", or "look around" to navigate. 
                Listen carefully to audio cues to find objectives and avoid hazards. 
                Your spatial awareness and quick decision-making will be key to success!
              </p>
            </div>
          </div>
        </Card>
        
        <div className="flex justify-center gap-4 mb-6">
          <Badge variant="outline" className="text-lg p-2 border-cyan-400 text-cyan-400">
            Mode: {gameState.mode.toUpperCase()}
          </Badge>
          <Badge variant="outline" className="text-lg p-2 border-green-400 text-green-400">
            Score: {gameState.score}
          </Badge>
          <Badge variant="outline" className="text-lg p-2 border-red-400 text-red-400">
            Lives: {gameState.lives}
          </Badge>
          <Badge variant="outline" className="text-lg p-2 border-yellow-400 text-yellow-400">
            Level: {gameState.currentLevel}
          </Badge>
        </div>
      </div>

      {/* Main Control Panel */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Game Controls */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <h2 className="text-2xl font-bold mb-6 text-cyan-400">Game Controls</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button
              onClick={startGame}
              disabled={gameState.isPlaying}
              className="h-16 text-lg bg-green-600 hover:bg-green-700 text-white"
              aria-label="Start Game (Shortcut: S)"
            >
              <Play className="mr-2" />
              Start Game
            </Button>
            
            <Button
              onClick={toggleMode}
              disabled={gameState.isPlaying}
              className="h-16 text-lg bg-blue-600 hover:bg-blue-700 text-white"
              aria-label="Toggle Mode (Shortcut: M)"
            >
              <RotateCcw className="mr-2" />
              Toggle Mode
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button
              onClick={toggleListening}
              className={`h-16 text-lg ${gameState.isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'} text-white`}
              aria-label="Toggle Voice Commands (Shortcut: V)"
            >
              {gameState.isListening ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
              {gameState.isListening ? 'Stop Listening' : 'Start Listening'}
            </Button>

            <Button
              onClick={resetGame}
              className="h-16 text-lg bg-gray-600 hover:bg-gray-700 text-white"
              aria-label="Reset Game (Shortcut: R)"
            >
              <RotateCcw className="mr-2" />
              Reset
            </Button>
          </div>

          {/* Voice Commands Help */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-3 text-yellow-400">Voice Commands:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-white">
              <div>"start game" - Begin adventure</div>
              <div>"go left" - Move left</div>
              <div>"go right" - Move right</div>
              <div>"go forward" - Move forward</div>
              <div>"go back" - Move backward</div>
              <div>"look around" - Examine area</div>
              <div>"help" - Get assistance</div>
              <div>"repeat" - Repeat last message</div>
            </div>
          </div>
        </Card>

        {/* Visual Game Map - Now spans two columns on xl screens */}
        <Card className="bg-gray-800 border-gray-700 p-6 xl:col-span-2">
          <h2 className="text-2xl font-bold mb-6 text-cyan-400">World Visualization</h2>
          
          {gameState.gameStarted && visualState.environment ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-bold text-yellow-400 mb-2">
                  {visualState.environment.name}
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  Player position: ({Math.round(visualState.playerPosition.x)}, {Math.round(visualState.playerPosition.z)})
                </p>
              </div>
              
              <div className="flex justify-center">
                {renderGameMap()}
              </div>
              
              <div className="bg-gray-900 p-4 rounded-lg">
                <h4 className="text-sm font-bold text-yellow-400 mb-3">Map Legend:</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-cyan-400 rounded-full"></div>
                    <span>Player</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                    <span>Objective</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span>Hazard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span>Start Point</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <User size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Start a game to explore the world</p>
              <p className="text-sm mt-2">The visualization will show your journey through different environments</p>
            </div>
          )}
        </Card>

        {/* Status & Logs - Back to single column */}
        <Card className="bg-gray-800 border-gray-700 p-6 xl:col-span-1">
          <h2 className="text-2xl font-bold mb-6 text-cyan-400">Game Status</h2>
          
          {/* Current Status */}
          <div className="mb-6 p-4 bg-gray-900 rounded-lg">
            <div className="flex items-center mb-2">
              <Volume2 className="mr-2 text-green-400" />
              <span className={`text-lg ${gameState.isListening ? 'text-green-400' : 'text-gray-400'}`}>
                {gameState.isListening ? 'Listening for commands...' : 'Voice commands inactive'}
              </span>
            </div>
            <div className="text-lg text-gray-300">
              {gameState.isPlaying ? 'Game in progress' : 'Game ready to start'}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-gray-900 p-4 rounded-lg max-h-80 overflow-y-auto">
            <h3 className="text-lg font-bold mb-3 text-yellow-400">Activity Log:</h3>
            <div className="space-y-1 text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">No activity yet...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-gray-300 font-mono">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="max-w-7xl mx-auto mt-8">
        <Card className="bg-gray-800 border-gray-700 p-4">
          <h3 className="text-lg font-bold mb-3 text-yellow-400">Keyboard Shortcuts:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">S</kbd> Start Game</div>
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">M</kbd> Toggle Mode</div>
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">V</kbd> Toggle Voice</div>
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">R</kbd> Reset Game</div>
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">←</kbd> Move Left</div>
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">→</kbd> Move Right</div>
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">↑</kbd> Move Forward</div>
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">↓</kbd> Move Back</div>
          </div>
        </Card>
      </div>

      {/* Hidden elements for screen readers */}
      <div className="sr-only" aria-live="polite" role="status">
        {logs[logs.length - 1]}
      </div>
    </div>
  );
};

export default Index;
